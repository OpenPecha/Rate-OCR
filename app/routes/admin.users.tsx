import { useLoaderData } from "@remix-run/react";
import { User } from "@prisma/client";
import Users from "~/local_components/Users"; 

export default function AdminUsers() {
  const { users }: { users: User[] } = useLoaderData();

  return (
    <div>
      <h2 className="text-2xl font-semibold">Users Management</h2>
      <Users users={users} />
    </div>
  );
}
