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

    const nextRate = await db.rate.findFirst({
      where: { 
        status: "PENDING",
        rating: { not: null } 
      },
      orderBy: {
        createdAt: 'asc'
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        nextRate: nextRate || null
      }),
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
  const { user, rate: initialRate, message, error } = useLoaderData<LoaderData>();
  const fetcher = useFetcher<{ success?: boolean; error?: string; nextRate?: typeof initialRate }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentRate, setCurrentRate] = useState(initialRate);
  const [currentAction, setCurrentAction] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialRate && !currentRate) {
      setCurrentRate(initialRate);
    }
  }, [initialRate]);

  useEffect(() => {
    if (fetcher.data?.success && currentAction) {
      setIsSubmitting(false);
      toast.success(`Rating ${currentAction.toLowerCase()}`);
      
      if (fetcher.data.nextRate) {
        setCurrentRate(fetcher.data.nextRate);
      } else {
        setCurrentRate(null);
      }
      setCurrentAction(null);
    }
    
    if (fetcher.data?.error) {
      setIsSubmitting(false);
      setCurrentAction(null);
    }
  }, [fetcher.data, currentAction]);

  const handleAction = (status: "APPROVED" | "REJECTED") => {
    if (!currentRate) {
      toast.error("No rating available to process");
      return;
    }
    if (isSubmitting) {
      return; 
    }

    setIsSubmitting(true);
    setCurrentAction(status);
    
    const formData = new FormData();
    formData.append("status", status);
    formData.append("rateId", currentRate.id);
    formData.append("reviewedById", user.id);

    fetcher.submit(formData, { method: "post" });
  };
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  return (
    <div className="flex flex-col md:flex-row">
      <button
        onClick={toggleSidebar}
        title="Toggle Sidebar"
        className="fixed top-4 left-4 bg-blue-500 text-white p-3 rounded-full z-50">
        <FaBars className="text-lg" />
      </button>

      <Sidebar 
        role={user.role} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />

      <div className="flex-1 p-4 md:p-6">
        <div className="flex flex-col mt-12 md:mt-8">
          <h1 className="text-xl md:text-2xl font-bold text-green-500">
            Reviewer: {user.username}
          </h1>
        </div>

        {message || !currentRate ? (
          <div className="flex flex-col items-center justify-center mt-16">
            <div className="bg-blue-50 p-6 sm:p-8 rounded-lg shadow-md">
              <h2 className="text-lg sm:text-xl text-blue-800 font-semibold mb-2">Status Update</h2>
              <p className="text-sm sm:text-base text-gray-600">{message}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center p-4 space-y-6 max-w-md md:max-w-xl mx-auto">
            <ImageBox imageUrl={currentRate.imageUrl || ""} />
            <TranscriptTextArea 
              value={currentRate.transcript || ""} 
              onChange={() => {}} 
              disabled={true} 
            />
            <Rating 
              value={currentRate.rating || 0} 
              onChange={() => {}} 
              disabled={true} 
            />

            <div className="flex flex-col sm:flex-row justify-center mt-6 space-y-2 sm:space-y-0 sm:space-x-4">
              <Buttons 
              label="Approve" 
              onClick={() => handleAction("APPROVED")}
              disabled={isSubmitting} 
              />
              <Buttons 
              label="Reject" 
              onClick={() => handleAction("REJECTED")}
              disabled={isSubmitting} 
              />
            </div>

            {isSubmitting && (
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