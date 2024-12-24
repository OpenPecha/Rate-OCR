import { LoaderFunction, redirect, ActionFunction } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { db } from "~/services/db.server"; 
import { Role, User } from "@prisma/client";  
import { Button } from "~/components/ui/button";

export const loader: LoaderFunction = async () => {
  const users = await db.user.findMany();  
  return new Response(JSON.stringify({ users }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = new URLSearchParams(await request.text());
  const userId = formData.get("userId");
  const role = formData.get("role") as Role;  

  if (!userId || !role) {
    return new Response(
      JSON.stringify({ error: "Invalid data" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: { role },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Role updated successfully" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Role update failed:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update role" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export default function Admin() {
  const { users }: { users: User[] } = useLoaderData();
  
  return (
    <div className="p-8 bg-gray-50">
      <div className="flex justify-center mb-8">
        <h1 className="text-3xl font-semibold text-center text-gray-800 p-4 bg-blue-100 rounded-md shadow-md">
          Admin
        </h1>
      </div>
      
      <div id="statusMessage" className="mb-4 text-center text-red-500"></div>

      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden mx-auto">
        <thead className="bg-gray-200 text-black">
          <tr>
            <th className="px-6 py-3 text-left">Username</th>
            <th className="px-6 py-3 text-left">Email</th>
            <th className="px-6 py-3 text-left">Role</th>
            <th className="px-6 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-100">
              <td className="px-6 py-4 text-gray-800">{user.username}</td>
              <td className="px-6 py-4 text-gray-600">{user.email}</td>
              <td className="px-6 py-4 text-gray-600">{user.role}</td>
              <td className="px-6 py-4">
                <Form method="post" className="flex items-center space-x-4">
                  <input type="hidden" name="userId" value={user.id} />

                  <select
                    id={`role-${user.id}`}
                    name="role"
                    defaultValue={user.role}
                    className="block w-full max-w-[200px] rounded-md bg-white border-gray-300 p-2 text-gray-700"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="ANNOTATOR">Annotator</option>
                    <option value="REVIEWER">Reviewer</option>
                  </select>

                  <Button
                    type="submit"
                    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    Update
                  </Button>
                </Form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
