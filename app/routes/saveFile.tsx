import { redirect, type ActionFunction } from "@remix-run/node";
import { db } from "~/services/db.server";

export const action: ActionFunction = async ({ request }) => {
  try {
    const formData = await request.formData();
    const rating = formData.get("rating");
    const transcription = formData.get("transcription");

    const url = new URL(request.url);
    const session = url.searchParams.get("session");

    console.log("Received Form Data:", { rating, transcription });
    console.log("Received Session in saveFile.tsx:", session);

    if (!session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session },
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!rating || !transcription) {
      return new Response(
        JSON.stringify({ error: "Rating and transcription are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await db.rate.create({
      data: {
        rating: parseInt(rating.toString(), 10),
        transcript: transcription.toString(),
        status: "PENDING",
        modified_by: { connect: { id: user.id } },
      },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

    // return redirect(`/?session=${user.email}`);
  } catch (error) {
    console.error("Error saving data:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred while saving the data" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

