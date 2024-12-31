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
      message: "No data available. Please reach out to admin",
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
  const fetcher = useFetcher<{ error?: string; success?: boolean; nextContent?: typeof content }>();
  const [rating, setRating] = useState<number | null>(null);
  const [transcription, setTranscription] = useState(content?.transcript || "");
  const [currentContent, setCurrentContent] = useState(content);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (content) {
      setCurrentContent(content);
      setTranscription(content.transcript);
    }
  }, [content]);

  useEffect(() => {
    if (fetcher.data?.success) {
      toast.success("Rating submitted successfully!");
      
      setRating(null);
      
      if (fetcher.data.nextContent) {
        setCurrentContent(fetcher.data.nextContent);
        setTranscription(fetcher.data.nextContent.transcript || "");
      } else {
        setCurrentContent(null);
        setTranscription("");
      }
    }
  }, [fetcher.data]);

  const handleReset = () => {
    setRating(null);
  };

  const handleSubmit = async () => {
    if (!rating) {
      toast.error("Please provide a rating before submitting");
      return;
    }

    if (!currentContent) {
      toast.error("No content available to rate");
      return;
    }

    const formData = new FormData();
    formData.append("rating", rating.toString());
    formData.append("contentId", currentContent.id.toString());

    await fetcher.submit(formData, { 
      method: "post", 
      action: `/saveFile?session=${user.email}` 
    });
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
        <div className="bg-blue-50 p-6 sm:p-8 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl text-blue-800 font-semibold mb-2">Status Update</h2>
          <p className="text-sm sm:text-base text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 flex flex-col md:flex-row">
      {user.role === "ANNOTATOR" && (
        <>
          <button
            onClick={toggleSidebar}
            title="Toggle Sidebar"
            className="fixed top-4 left-4 bg-blue-500 text-white p-3 rounded-full z-50">
            <FaBars className="text-lg" />
          </button>

          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </>
      )}

      <div className="flex-1 mt-12 md:mt-8">
        <h1 className="text-xl md:text-2xl font-bold text-green-500">
          Welcome, {user.username}!
        </h1>
        

        {user.role === "ANNOTATOR" && currentContent && (
          <div className="flex flex-col items-center p-4 space-y-4 w-full max-w-2xl lg:max-w-4xl mx-auto">
            <ImageBox imageUrl={currentContent.imageUrl} />

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

            <div className="flex flex-col sm:flex-row justify-center mt-6 space-y-2 sm:space-y-0 sm:space-x-4">
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