import { redirect, useFetcher, useLoaderData } from "@remix-run/react";
import ImageBox from "~/local_components/Imagebox";
import TranscriptTextArea from "~/local_components/transcripttextarea";
import Rating from "~/local_components/Rating";
import Buttons from "~/local_components/Buttons";
import toast, { Toaster } from "react-hot-toast";
import { LoaderFunction, ActionFunction } from "@remix-run/node";
import { db } from "~/services/db.server";
import Sidebar from "~/local_components/Sidebar";
import { FaBars } from "react-icons/fa";
import { useState, useEffect } from "react";  

type LoaderData = {
  user: { id: string; email: string; username: string; role: string };
  rate: { id: string; imageUrl: string; transcript: string; rating: number; status: string };
  message?: string;
  error?: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const session = url.searchParams.get("session");

  if (!session) {
    return redirect("/");
  }

  const user = await db.user.findUnique({ where: { email: session } });

  if (!user || user.role !== "REVIEWER") {
    return redirect("/");
  }

  const rate = await db.rate.findFirst({
    where: { 
      status: "PENDING",
      rating: { not: null } 
    },
    orderBy: {
      createdAt: 'asc'
    },
  });

  if (!rate) {
    return new Response(
      JSON.stringify({ 
        user, 
        rate: null, 
        message: "No more ratings to review at the moment" 
      }),
      { headers: { "Content-Type": "application/json" } }
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
  const { user, rate, message, error } = useLoaderData<LoaderData>();
  const fetcher = useFetcher<{ success?: boolean; error?: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<"APPROVED" | "REJECTED" | null>(null);

  useEffect(() => {
    if (toastVisible && fetcher.data?.success) {
      toast.success(`Rating ${currentAction?.toLowerCase()}!`);
      setToastVisible(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [fetcher.data, toastVisible, currentAction]);

  const handleAction = (status: "APPROVED" | "REJECTED") => {
    if (!rate) {
      toast.error("No rating available to process");
      return;
    }
    setCurrentAction(status);
    const formData = new FormData();
    formData.append("status", status);
    formData.append("rateId", rate.id);
    formData.append("reviewedById", user.id);

    fetcher.submit(formData, { method: "post" });
    setToastVisible(true);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  return (
    <div className="flex">
      <button
        onClick={toggleSidebar}
        title="Toggle Sidebar"
        className="absolute top-4 left-4 bg-blue-500 text-white p-3 rounded-full">
        <FaBars className="text-lg" />
      </button>

      <Sidebar 
        role={user.role} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />

      <div className="flex-1 p-6">
        <div className="flex flex-col mt-6">
          <h1 className="text-2xl font-bold text-green-500 mt-6">
            Reviewer: {user.username}
          </h1>
        </div>

        {message ? (
          <div className="flex flex-col items-center justify-center mt-20">
            <div className="bg-blue-50 p-8 rounded-lg shadow-md">
              <h2 className="text-xl text-blue-800 font-semibold mb-2">Status Update</h2>
              <p className="text-gray-600">{message}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center p-6 space-y-8 max-w-xl mx-auto">
            <ImageBox imageUrl={rate?.imageUrl || ""} />
            <TranscriptTextArea 
              value={rate?.transcript || ""} 
              onChange={() => {}} 
              disabled={true} 
            />
            <Rating 
              value={rate?.rating || 0} 
              onChange={() => {}} 
              disabled={true} 
            />

            <div className="flex justify-center mt-6 space-x-4">
              <Buttons label="Approve" onClick={() => handleAction("APPROVED")} />
              <Buttons label="Reject" onClick={() => handleAction("REJECTED")} />
            </div>

            {fetcher.state === "submitting" && (
              <p className="text-blue-500">Submitting review...</p>
            )}
            {fetcher.data?.error && (
              <p className="text-red-500">{fetcher.data.error}</p>
            )}
          </div>
        )}
      </div>

      <Toaster />
    </div>
  );
}