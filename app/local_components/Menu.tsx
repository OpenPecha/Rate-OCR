import { Link, useLocation } from "@remix-run/react";
import React from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuLink,
} from "~/components/ui/navigation-menu";

type MenuProps = {
  user: { email: string };
};

function Menu({ user }: MenuProps) {
  const location = useLocation();
  const locationPath = location.pathname;
  const border = "border-b-2 border-blue-500 rounded-md";

  return (
    <NavigationMenu className="bg-gray-100 p-4 rounded-md shadow-md">
      <NavigationMenuList className="flex space-x-6">
        <Link
          to={`/admin/users?session=${user.email}`}
          className={`px-4 py-2 font-medium ${
            locationPath.includes("users")
              ? "border-b-2 border-blue-500 text-blue-700"
              : "text-gray-700 hover:text-blue-500 transition"
          }`}
        >
          <NavigationMenuLink>
            Users
          </NavigationMenuLink>
        </Link>
        <Link
          to={`/admin/texts?session=${user.email}`}
          className={`px-4 py-2 font-medium ${
            locationPath.includes("texts")
              ? "border-b-2 border-blue-500 text-blue-700"
              : "text-gray-700 hover:text-blue-500 transition"
          }`}
        >
          <NavigationMenuLink>
            Texts
          </NavigationMenuLink>
        </Link>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export default Menu;
