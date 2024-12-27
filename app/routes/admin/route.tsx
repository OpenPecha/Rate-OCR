import { LoaderFunction, ActionFunction } from "@remix-run/node";
import { useLoaderData, useLocation, Form, redirect } from "@remix-run/react";
import { db } from "~/services/db.server"; 
import { User, Role } from "@prisma/client";  
import { Toaster } from "react-hot-toast";
import Menu from "~/local_components/Menu";
import Users from "~/local_components/Users";
import Texts from "~/local_components/Texts";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const sessionEmail = url.searchParams.get("session");

  if (!sessionEmail) {
    return redirect("/"); 
  }

  const user = await db.user.findUnique({ where: { email: sessionEmail } });

  if (!user || user.role !== "ADMIN") {
    return redirect("/"); 
  }
  
  const users = await db.user.findMany();
  return { users };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  if (formData.has("userId") && formData.has("role")) {
    const userId = formData.get("userId") as string;
    const role = formData.get("role") as Role;

    if (!userId || !role) {
      return new Response(
        JSON.stringify({ error: "Invalid data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      await db.user.update({
        where: { id: userId },
        data: { role },
      });

      return new Response(
        JSON.stringify({ success: true, message: "Role updated successfully" }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Role update failed:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update role" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } else if (formData.has("data")) {
    const fileContent = formData.get("data") as string;
    const fileName = formData.get("name") as string;

    if (!fileContent || !fileName) {
      return new Response(
        JSON.stringify({ error: "File data or name is missing." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      let parsedData;
      if (fileName.endsWith('.json')) {
        parsedData = JSON.parse(fileContent);
      } else if (fileName.endsWith('.csv')) {
        const lines = fileContent.split('\n').filter(line => line.trim());
        const headers = lines[0].toLowerCase().split(',');
        const imageUrlIndex = headers.indexOf('imageurl');
        const transcriptIndex = headers.indexOf('transcript');
        
        if (imageUrlIndex === -1 || transcriptIndex === -1) {
          throw new Error('Invalid CSV format');
        }

        parsedData = lines.slice(1).map(line => {
          const values = line.split(',');
          return {
            imageUrl: values[imageUrlIndex].trim(),
            transcript: values[transcriptIndex].trim()
          };
        });
      }

      const result = await db.rate.createMany({
        data: parsedData.map((item: any) => ({
          fileName,
          imageUrl: item.imageUrl,
          transcript: item.transcript,
          status: "PENDING",
        })),
      });

      return new Response(
        JSON.stringify({ success: true, message: "File uploaded successfully", result }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("File upload failed:", error);
      return new Response(
        JSON.stringify({ error: "Failed to process file" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: "Invalid action" }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
};

export default function Admin() {
  const { users }: { users: User[] } = useLoaderData();
  const location = useLocation();
  const userEmail = new URLSearchParams(location.search).get("session") || "";

  return (
    <div className="p-8 flex flex-col items-center">
      <Toaster position="top-right" />
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-lg font-semibold text-center text-gray-800 p-4 bg-blue-100 rounded-md shadow-md inline-block">
            Admin
          </h1>
        </div>
        <div className="flex justify-center mb-8">
          <Menu user={{ email: userEmail }} />
        </div>
        <div className="mt-8">
          {location.pathname.includes("users") && <Users users={users} />}
          {location.pathname.includes("texts") && <Texts />}
        </div>
      </div>
    </div>
  );
}