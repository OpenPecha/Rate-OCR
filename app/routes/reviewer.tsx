import { redirect, useFetcher, useLoaderData } from "@remix-run/react";
import ImageBox from "~/local_components/Imagebox";
import TranscriptTextArea from "~/local_components/transcripttextarea";
import Rating from "~/local_components/Rating";
import Buttons from "~/local_components/Buttons";
import toast from "react-hot-toast";
import { LoaderFunction, ActionFunction } from "@remix-run/node";
import { db } from "~/services/db.server";
import Sidebar from "~/local_components/Sidebar";
import { FaBars } from "react-icons/fa";
import { useState } from "react";  

type LoaderData = {
  user: { id: string; email: string; username: string; role: string };
  rate: { id: string; imageUrl: string; transcript: string; rating: number; status: string };
  error?: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const session = url.searchParams.get("session");

  if (!session) {
    return new Response(
      JSON.stringify({ error: "Session not found" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const user = await db.user.upsert({
    where: { email: session },
    update: {},
    create: { email: session, role: "REVIEWER", username: session.split("@")[0] },
  });

  if (!user) {
    return new Response(
      JSON.stringify({ error: "User not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  if (user.role !== "REVIEWER") {
    return redirect(`/`);
  }

  const rate = await db.rate.findFirst({
    where: { status: "PENDING" },
  });

  if (!rate) {
    return new Response(
      JSON.stringify({ error: "No pending ratings to review" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ user, rate }),
    { headers: { "Content-Type": "application/json" } }
  );
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const status = formData.get("status") as string;
  const rateId = formData.get("rateId") as string;
  const reviewedById = formData.get("reviewedById") as string;

  if (!status || !rateId || !reviewedById) {
    return new Response(
      JSON.stringify({ error: "Invalid form data" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await db.rate.update({
      where: { id: rateId },
      data: {
        status: status as "APPROVED" | "REJECTED",
        reviewed_by_id: reviewedById,
      },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to update rating" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export default function Reviewer() {
  const { user, rate, error } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleAction = (status: "APPROVED" | "REJECTED") => {
    const formData = new FormData();
    formData.append("status", status);
    formData.append("rateId", rate.id);
    formData.append("reviewedById", user.id);

    fetcher.submit(formData, { method: "post" });
    toast.success(`Rating ${status.toLowerCase()}!`);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex">
      {/* Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        title="Toggle Sidebar"
        className="absolute top-4 left-4 bg-blue-500 text-white p-3 rounded-full">
        <FaBars className="text-lg" />
      </button>

      {/* Sidebar */}
      {sidebarOpen && <Sidebar role={user.role} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex flex-col mt-6">
        <h1 className="text-2xl font-bold text-green-500 mt-6">Reviewer: {user.username}</h1>
        </div>
        <div className="flex flex-col items-center p-6 space-y-8 max-w-xl mx-auto">
          <ImageBox imageUrl={rate?.imageUrl || ""} />
          <TranscriptTextArea value={rate?.transcript || ""} onChange={() => {}} disabled={true} />
          <Rating value={rate?.rating || 0} onChange={() => {}} disabled={true} />

          <div className="flex justify-center mt-6 space-x-4">
            <Buttons label="Approve" onClick={() => handleAction("APPROVED")} />
            <Buttons label="Reject" onClick={() => handleAction("REJECTED")} />
          </div>
        </div>
      </div>
    </div>
  );
}
