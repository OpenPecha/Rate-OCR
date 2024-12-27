import { type ActionFunction } from "@remix-run/node";
import { db } from "~/services/db.server";

export const action: ActionFunction = async ({ request }) => {
  try {
    const formData = await request.formData();
    const rating = formData.get("rating");
    const contentId = formData.get("contentId");

    const url = new URL(request.url);
    const session = url.searchParams.get("session");

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

    if (!rating || !contentId) {
      return new Response(
        JSON.stringify({ error: "Rating and content ID are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await db.rate.update({
      where: {
        id: contentId.toString(),
      },
      data: {
        rating: parseInt(rating.toString(), 10),
        status: "PENDING",
        modified_by_id: user.id,
      },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error saving data:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred while saving the data" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};