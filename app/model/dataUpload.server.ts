import { db } from "~/services/db.server";

interface UploadRecord {
  imageUrl: string;
  transcript: string;
}

export const uploadData = async ({ name, data }: { name: string; data: UploadRecord[] }) => {
  try {
    if (!Array.isArray(data)) {
      throw new Error("Data must be an array");
    }

    data.forEach((record, index) => {
      if (!record.imageUrl || typeof record.imageUrl !== 'string') {
        throw new Error(`Invalid imageUrl in record ${index}`);
      }
      if (!record.transcript || typeof record.transcript !== 'string') {
        throw new Error(`Invalid transcript in record ${index}`);
      }
    });

    const timestamp = new Date().getTime();

    const result = await db.$transaction(async (tx) => {
      const createdRecords = await Promise.all(
        data.map((record, index) =>
          tx.rate.create({
            data: {
              fileName: `${name.split('.')[0]}_${timestamp}_${index + 1}`,
              imageUrl: record.imageUrl,
              transcript: record.transcript,
              status: "PENDING",
            },
          })
        )
      );
      return createdRecords;
    });

    return { 
      success: true, 
      count: result.length,
      message: `Successfully saved ${result.length} records`,
      batchId: timestamp
    };
  } catch (error) {
    console.error("Database error:", error);
    
    if (error instanceof Error) {
      throw new Error(`Database operation failed: ${error.message}`);
    }
    throw new Error("Failed to save data to the database.");
  }
};