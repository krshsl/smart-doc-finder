import React from "react";
import { NavLink } from "react-router-dom";
import {
  CloudIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowLeftStartOnRectangleIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "../auth/AuthContext";
import { User } from "../types";

interface SidebarProps {
  user: User;
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const { logout } = useAuth();

  const navItems = [
    {
      to: "/my-cloud",
      label: "My cloud",
      icon: <CloudIcon className="h-6 w-6" />,
    },
    {
      to: "/upload-files",
      label: "Upload files",
      icon: <CloudArrowUpIcon className="h-6 w-6" />,
    },
  ];

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center rounded-lg px-4 py-3 font-medium transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-300 hover:bg-blue-800 hover:text-white"
    }`;

  return (
    <aside className="flex w-64 flex-col bg-[#2a457a] p-4 text-white">
      <div className="flex items-center p-4">
        <UserCircleIcon className="h-12 w-12 text-blue-300" />
        <div className="ml-4">
          <span className="text-lg font-semibold">{user.name}</span>
          <span className="block text-xs text-blue-200 capitalize">
            {user.role}
          </span>
        </div>
      </div>

      <nav className="mt-8 flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={getLinkClass}>
                {item.icon}
                <span className="ml-4">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div>
        <ul className="space-y-2">
          <li>
            <NavLink to="/settings" className={getLinkClass}>
              <Cog6ToothIcon className="h-6 w-6" />
              <span className="ml-4">Settings</span>
            </NavLink>
          </li>
          <li>
            <button
              onClick={logout}
              className="flex w-full items-center rounded-lg px-4 py-3 font-medium text-gray-300 transition-colors hover:bg-blue-800 hover:text-white"
            >
              <ArrowLeftStartOnRectangleIcon className="h-6 w-6" />
              <span className="ml-4">Log out</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
