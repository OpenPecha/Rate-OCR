import { useFetcher } from "@remix-run/react";
import { User } from "@prisma/client";
import { Button } from "~/components/ui/button";

interface UsersProps {
  users: User[];
}

const Users = ({ users }: UsersProps) => {
  const fetcher = useFetcher();

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden mx-auto">
        <thead className="bg-gray-200 text-black">
          <tr>
            <th className="px-6 py-3 text-left text-sm md:text-base">Username</th>
            <th className="px-6 py-3 text-left text-sm md:text-base">Email</th>
            <th className="px-6 py-3 text-left text-sm md:text-base">Role</th>
            <th className="px-6 py-3 text-left text-sm md:text-base">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-100">
              <td className="px-6 py-4 text-gray-800 text-sm md:text-base">{user.username}</td>
              <td className="px-6 py-4 text-gray-600 text-sm md:text-base">{user.email}</td>
              <td className="px-6 py-4 text-gray-600 text-sm md:text-base">{user.role}</td>
              <td className="px-6 py-4">
                <fetcher.Form method="post" className="flex flex-col md:flex-row items-center md:space-x-4 space-y-2 md:space-y-0">
                  <input type="hidden" name="userId" value={user.id} />
                  <select
                    name="role"
                    defaultValue={user.role}
                    className="block w-full max-w-[200px] rounded-md bg-white border-gray-300 p-2 text-sm md:text-base text-gray-700"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="ANNOTATOR">Annotator</option>
                    <option value="REVIEWER">Reviewer</option>
                  </select>
                  <Button
                    type="submit"
                    className="w-full md:w-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    Update
                  </Button>
                </fetcher.Form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
};

export default Users;
