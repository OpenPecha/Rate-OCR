import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet";

interface Submission {
  id: string;
  transcript: string;
  createdAt: string;
}

interface LoaderData {
  user: {
    email: string;
    username: string;
    role: string;
  };
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  role : string;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const { user } = useLoaderData<LoaderData>();
  const fetcher = useFetcher<{ ratings: Submission[] }>();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sidebarOpen && submissions.length === 0) {
      console.log("Submitting fetcher for history...");
      fetcher.submit(
        { session: user.email },
        { method: "get", action: "/history" }
      );
      setLoading(true);
    }
  }, [sidebarOpen, user.email, submissions.length, fetcher]);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      console.log("Fetcher data received:", fetcher.data);
      const { ratings } = fetcher.data;
      setSubmissions(ratings || []);
      setLoading(false);
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-72 bg-white text-black p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="text-xl font-semibold text-blue-800">History</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : submissions.length > 0 ? (
              <ul className="space-y-4">
                {submissions.map((submission) => (
                  <li 
                    key={submission.id} 
                    className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <p className="font-medium text-sm text-gray-800 break-words">
                      {submission.transcript}
                    </p>
                    <time className="block text-xs text-gray-500 mt-1">
                      {new Date(submission.createdAt).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No submissions available</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
