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
      <SheetContent side="left" className="w-72 bg-white text-black">
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold text-blue-800">History</SheetTitle>
        </SheetHeader>
        <div>
          <ul className="mt-4 space-y-2">
            {loading ? (
              <li>Loading...</li>
            ) : submissions.length > 0 ? (
              submissions.map((submission) => (
                <li key={submission.id}>
                  <span className="block font-medium truncate">{submission.transcript}</span>
                  <span className="block text-xs text-gray-500">
                    {new Date(submission.createdAt).toLocaleString()}
                  </span>
                </li>
              ))
            ) : (
              <li>No submissions available</li>
            )}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
