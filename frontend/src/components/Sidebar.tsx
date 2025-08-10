import {
  CloudIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowLeftStartOnRectangleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import React, { useState, useEffect, useCallback } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import * as cloudService from "../services/cloudService";
import eventBus from "../services/eventBus";
import { User } from "../types";

interface SidebarProps {
  user: User;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const { logout } = useAuth();
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const [storageQuota, setStorageQuota] = useState<number>(0);

  const navItems = [
    {
      to: "/my-cloud",
      label: "My cloud",
      icon: <CloudIcon className="h-6 w-6" />,
      show: true,
    },
    {
      to: "/upload-files",
      label: "Upload files",
      icon: <CloudArrowUpIcon className="h-6 w-6" />,
      show: user.role !== "guest",
    },
    {
      to: "/users",
      label: "Manage Users",
      icon: <UsersIcon className="h-6 w-6" />,
      show: user.role === "admin",
    },
  ];

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center rounded-lg px-4 py-3 font-medium transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-300 hover:bg-blue-800 hover:text-white"
    }`;

  const fetchStorage = useCallback(async () => {
    if (user) {
      try {
        const usage = await cloudService.getStorageUsage(user.id!);
        setStorageUsed(usage.storage_used);
        setStorageQuota(usage.storage_quota);
      } catch (error) {
        console.error("Failed to fetch storage usage:", error);
      }
    } else {
      setStorageUsed(0);
    }
  }, [user]);

  useEffect(() => {
    fetchStorage();

    eventBus.on("apiSuccess", fetchStorage);

    return () => {
      eventBus.remove("apiSuccess", fetchStorage);
    };
  }, [fetchStorage]);

  const storagePercentage = (storageUsed / storageQuota) * 100;

  return (
    <aside className="flex w-64 flex-col bg-[#2a457a] p-4 text-white">
      <div className="flex items-center p-4">
        <UserCircleIcon className="h-12 w-12 text-blue-300" />
        <div className="ml-4">
          <span className="text-lg font-semibold">{user.username}</span>
          <span className="block text-xs text-blue-200 capitalize">
            {user.role}
          </span>
        </div>
      </div>
      <nav className="mt-8 flex-1">
        <ul className="space-y-2">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
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
        {/* Storage Usage Display */}
        <div className="px-4 py-2">
          <span className="text-xs font-semibold text-blue-200">Storage</span>
          <div className="mt-2 h-2 w-full rounded-full bg-blue-900">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
              style={{
                width: `${storagePercentage > 100 ? 100 : storagePercentage}%`,
              }}
            ></div>
          </div>
          <div className="mt-1 flex justify-between text-xs text-blue-200">
            <span>{formatBytes(storageUsed)}</span>
            <span>{formatBytes(storageQuota)}</span>
          </div>
        </div>
        <ul className="mt-2 space-y-2">
          <li>
            <NavLink to="/settings" className={getLinkClass}>
              <Cog6ToothIcon className="h-6 w-6" />
              <span className="ml-4">Settings</span>
            </NavLink>
          </li>
          <li>
            <button
              onClick={async () => {
                await logout();
              }}
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
