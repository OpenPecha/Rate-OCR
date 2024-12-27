import { redirect, type LoaderFunction } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import ImageBox from "~/local_components/Imagebox";
import TranscriptTextArea from "~/local_components/transcripttextarea";
import Rating from "~/local_components/Rating";
import Buttons from "~/local_components/Buttons"; 
import { db } from "~/services/db.server";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "~/local_components/Sidebar";
import { FaBars } from "react-icons/fa";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const session = url.searchParams.get("session");

  if (!session) {
    return { message: "Please provide an email to continue." };
  }

  const user = await db.user.upsert({
    where: { email: session },
    update: {},
    create: { email: session, role: "USER", username: session.split("@")[0] },
  });

  if (!user) {
    return { message: "User not found" };
  }

  if (user.role === "REVIEWER") {
    return redirect(`/reviewer?session=${user.email}`);
  }

  if (user.role === "ADMIN") {
    return redirect(`/admin?session=${user.email}`);
  }

  if (user.role !== "ANNOTATOR") {
    return { message: "Unauthorized access. Please contact the admin." };
  }

  const pendingContent = await db.rate.findFirst({
    where: {
      rating: null,
      status: "PENDING",
    },
    orderBy: {
      createdAt: 'asc'
    },
  });

  if (!pendingContent) {
    return {
      user,
      message: "No more content to annotate.",
    };
  }

  return {
    user,
    content: pendingContent,
    message: "",
  };
};

export default function Index() {
  const { user, content, message } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ error?: string; success?: boolean }>();
  const [rating, setRating] = useState<number | null>(null);
  const [transcription, setTranscription] = useState(content?.transcript || "");
  const [toastVisible, setToastVisible] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (content?.transcript) {
      setTranscription(content.transcript);
    }
  }, [content?.transcript]);

  useEffect(() => {
    if (toastVisible && fetcher.data?.success) {
      toast.success("Rating submitted successfully!");
      setToastVisible(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [fetcher.data, toastVisible]);

  const handleReset = () => {
    setRating(null);
  };

  const handleSubmit = async () => {
    if (!rating) {
      toast.error("Please provide a rating before submitting");
      return;
    }

    if (!content) {
      toast.error("No content available to rate");
      return;
    }

    const formData = new FormData();
    formData.append("rating", rating.toString());
    formData.append("contentId", content.id.toString());

    await fetcher.submit(formData, { 
      method: "post", 
      action: `/saveFile?session=${user.email}` 
    });
    
    setToastVisible(true);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  if (!isHydrated) {
    return <div>Loading...</div>;
  }

  if (message) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl text-center">{message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 flex">
      {user.role === "ANNOTATOR" && (
        <>
          <button
            onClick={toggleSidebar}
            title="Toggle Sidebar"
            className="absolute top-4 left-4 bg-blue-500 text-white p-3 rounded-full">
            <FaBars className="text-lg" />
          </button>

          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </>
      )}

      <div className="flex-1 mt-12">
        <h1 className="text-2xl font-bold text-green-500">
          Welcome, {user.username}!
        </h1>

        {user.role === "ANNOTATOR" && content && (
          <div className="flex flex-col items-center p-6 space-y-8 max-w-xl mx-auto">
            <ImageBox imageUrl={content.imageUrl} />

            <div className="w-full">
              <TranscriptTextArea
                value={transcription}
                onChange={(value: string) => setTranscription(value)}
                placeholder="Enter transcription here..."
                disabled={true}
              />
            </div>

            <div className="w-full mt-4 flex justify-center">
              <Rating value={rating} onChange={(newRating) => setRating(newRating)} />
            </div>

            <div className="flex justify-center mt-6 space-x-4">
              <Buttons label="Reset" onClick={handleReset} />
              <Buttons label="Submit" onClick={handleSubmit} />
            </div>

            {fetcher.state === "submitting" && (
              <p className="text-blue-500">Submitting...</p>
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