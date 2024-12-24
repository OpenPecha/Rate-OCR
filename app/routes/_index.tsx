import { redirect, type LoaderFunction } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import ImageBox from "~/local_components/Imagebox";
import TranscriptTextArea from "~/local_components/transcripttextarea";
import Rating from "~/local_components/Rating";
import Buttons from "~/local_components/Buttons"; 
import { db } from "~/services/db.server";
import toast , { Toaster } from "react-hot-toast";
import Sidebar from "~/local_components/Sidebar";
import { FaBars } from "react-icons/fa";

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
    create: { email: session, role: "USER", username: session.split("@")[0] },
  });

  if (!user) {
    return new Response(
      JSON.stringify({ error: "User not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  if (user.role === "REVIEWER") {
    return redirect(`/reviewer?session=${user.email}`);
  }

  if (user.role === "ADMIN") {
    return redirect(`/admin?session=${user.email}`);
  }

  const rate = await db.rate.findFirst();
  return new Response(
    JSON.stringify({
      user,
      imageUrl: rate?.imageUrl || "",
      transcript: rate?.transcript || "",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};

export default function Index() {
  const { user, imageUrl, transcript, error } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ error?: string; success?: boolean }>();
  const [rating, setRating] = useState<number | null>(null);
  const [transcription, setTranscription] = useState(transcript || "");
  const [toastVisible, setToastVisible] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, [])

  useEffect(() => {
    if (user.role === "ANNOTATOR") {
      setTranscription(""); 
    }
  }, [user.role]);

  useEffect(() => {
    if (toastVisible && fetcher.data?.success) {
      toast.success("File saved successfully!");
      setToastVisible(false);
    }
  }, [fetcher.data, toastVisible]);
  const handleReset = () => {
    setRating(null);
    setTranscription("");
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("rating", rating?.toString() || "");
    formData.append("transcription", transcription);

    console.log("Form Data:", formData);
    await fetcher.submit(formData, { method: "post", action: `/saveFile?session=${user.email}` });

    setRating(null);
    setTranscription("");
    setToastVisible(true);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  if (!isHydrated) {
    return <div>Loading...</div>;
  }
  if (error) {
    toast.error(error);
    return <div className="text-red-500">{error}</div>;
  }

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="p-6 flex">
      {/* Sidebar and Toggle Button for Annotator Role */}
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

        {user.role === "ANNOTATOR" && (
          <div className="flex flex-col items-center p-6 space-y-8 max-w-xl mx-auto">
            {/* ImageBox component */}
            <ImageBox imageUrl={imageUrl || ""} />

            {/* TranscriptTextArea component */}
            <div className="w-full">
              <TranscriptTextArea
                value={transcription}
                onChange={(value: string) => setTranscription(value)}
                placeholder="Enter transcription here..."
              />
            </div>

            {/* Rating Component */}
            <div className="w-full mt-4 flex justify-center">
              <Rating value={rating} onChange={(newRating) => setRating(newRating)} />
            </div>

            {/* Buttons */}
            <div className="flex justify-center mt-6 space-x-4">
              <Buttons label="Reset" onClick={handleReset} />
              <Buttons label="Submit" onClick={handleSubmit} />
            </div>

            {/* Status messages */}
            {fetcher.state === "submitting" && (
              <p className="text-blue-500">Submitting...</p>
            )}
            {fetcher.data?.error && (
              <p className="text-red-500">{fetcher.data.error}</p>
            )}
          </div>
        )}

        {/* User Role Content */}
        {user.role === "USER" && (
          <div className="text-red-500">
            You are yet to assign a role. Please contact the admin.
          </div>
        )}
      </div>

      <Toaster />
    </div>
  );
}
