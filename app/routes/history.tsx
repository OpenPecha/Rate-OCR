import { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/services/db.server";

type Rating = {
  id: string;
  createdAt: Date;
  status: string;
  modified_by?: {
    username: string;
  };
  reviewed_by?: {
    username: string;
  };
};

type LoaderData = {
  ratings: Rating[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const userEmail = url.searchParams.get("session");

  if (!userEmail) {
    throw new Error("User email is missing");
  }

  const user = await db.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isReviewer = user.role === "REVIEWER";

  // Log user info for debugging
  console.log("User:", user);

  // Fetch ratings based on user role
  let ratings;
  try {
    ratings = await db.rate.findMany({
      where: isReviewer
        ? {
            reviewed_by_id: user.id,
            status: { in: ["APPROVED", "REJECTED"] },
          }
        : {
            OR: [
              { modified_by_id: user.id },
              { reviewed_by_id: user.id },
            ],
          },
      include: {
        modified_by: true,
        reviewed_by: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log("Ratings fetched:", ratings);
  } catch (error) {
    console.error("Error fetching ratings:", error);
  }

  if (!ratings || ratings.length === 0) {
    console.log("No ratings found for the user:", userEmail);
  }

  return { ratings };
};

export default function History() {
  const { ratings } = useLoaderData<LoaderData>();

  return (
    <div className="p-8 bg-gray-50">
      <div className="flex justify-center mb-8">
        <h1 className="text-3xl font-semibold text-center text-gray-800 p-4 bg-blue-100 rounded-md shadow-md">
          Rating History
        </h1>
      </div>

      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-blue-600 text-white">
          <tr>
            <th className="px-6 py-3 text-left">Username</th>
            <th className="px-6 py-3 text-left">Date</th>
            <th className="px-6 py-3 text-left">Modified By</th>
            <th className="px-6 py-3 text-left">Reviewed By</th>
            <th className="px-6 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {ratings.map((rating: Rating) => (
            <tr key={rating.id} className="border-b border-gray-200 hover:bg-gray-100">
              <td className="px-6 py-4 text-gray-800">{rating.modified_by?.username || "N/A"}</td>
              <td className="px-6 py-4 text-gray-600">
                {new Date(rating.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-gray-600">{rating.modified_by?.username || "N/A"}</td>
              <td className="px-6 py-4 text-gray-600">{rating.reviewed_by?.username || "N/A"}</td>
              <td className="px-6 py-4 text-gray-600">{rating.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
