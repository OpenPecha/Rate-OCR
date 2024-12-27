import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";
import { uploadData } from "~/model/dataUpload.server";
import { db } from "~/services/db.server";

export const loader: LoaderFunction = async () => {
  return new Response(
    JSON.stringify({ success: true }),
    { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
};
export const action: ActionFunction = async ({ request }) => {

  const formData = await request.formData();
  const data = formData.get("data");
  const name = formData.get("name");

  if (!data || !name || typeof data !== "string" || typeof name !== "string") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid form data",
      }),
      { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }

  try {
    let parsedData: Array<{ imageUrl: string; transcript: string }> = [];

    if (name.endsWith(".csv")) {
      const lines = data.split(/\r?\n/).filter((line) => line.trim());
      if (lines.length < 2) {
        throw new Error("CSV must have a header and at least one data row");
      }

      const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());
      const imageUrlIndex = headers.indexOf("imageurl");
      const transcriptIndex = headers.indexOf("transcript");

      if (imageUrlIndex === -1 || transcriptIndex === -1) {
        throw new Error("CSV must contain 'imageUrl' and 'transcript' columns");
      }

      parsedData = lines.slice(1).map((line, index) => {
        const values = line.split(",").map((v) => v.trim());
        if (values.length !== headers.length) {
          throw new Error(`Invalid CSV row at line ${index + 2}`);
        }
        return {
          imageUrl: values[imageUrlIndex],
          transcript: values[transcriptIndex]
        };
      });
    } else if (name.endsWith(".json")) {
      const jsonData = JSON.parse(data);
      if (!Array.isArray(jsonData)) {
        throw new Error("JSON data must be an array");
      }
      parsedData = jsonData.map((record, index) => {
        if (!record.imageUrl || !record.transcript) {
          throw new Error(`Missing required fields at index ${index}`);
        }
        return {
          imageUrl: String(record.imageUrl).trim(),
          transcript: String(record.transcript).trim()
        };
      });
    } else {
      throw new Error("Unsupported file format");
    }

    if (parsedData.length === 0) {
      throw new Error("No valid data records found");
    }

    const result = await uploadData({ name, data: parsedData });
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${parsedData.length} records`,
        data: result,
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error processing upload:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to process uploaded data",
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
};