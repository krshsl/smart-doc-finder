import {
  CloudIcon,
  Cog6ToothIcon,
  ArrowLeftStartOnRectangleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import React, { useState, useEffect, useCallback } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import CloudLogo from "../Logo/CloudLogo";
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
      label: "My Cloud",
      icon: (props: any) => <CloudIcon {...props} />,
      show: true,
    },
    {
      to: "/users",
      label: "Manage Users",
      icon: (props: any) => <UsersIcon {...props} />,
      show: user.role === "admin",
    },
  ];

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? "bg-brand-50 text-brand-600"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
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

  const storagePercentage =
    storageQuota > 0 ? (storageUsed / storageQuota) * 100 : 0;

  return (
    <aside className="flex w-64 flex-col bg-white p-4 border-r border-slate-200">
      <div className="flex items-center gap-3 p-2 mb-4">
        <CloudLogo className="h-8 w-8" />
        <div className="bg-brand-500 rounded-lg p-2 text-black">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
            />
          </svg>
        </div>
        <span className="text-xl font-bold text-slate-800">CloudApp</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems
          .filter((item) => item.show)
          .map((item) => (
            <li key={item.to} className="list-none">
              <NavLink to={item.to} className={getLinkClass}>
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`h-5 w-5 ${isActive ? "text-brand-500" : "text-slate-400"}`}
                    />
                    <span className="ml-3">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
      </nav>

      <div className="space-y-4">
        <div className="px-3 py-4 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-sm font-semibold text-slate-800">Storage</span>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
              style={{
                width: `${storagePercentage > 100 ? 100 : storagePercentage}%`,
              }}
            ></div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>{formatBytes(storageUsed)}</span>
            <span>of {formatBytes(storageQuota)}</span>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-1">
          <NavLink to="/settings" className={getLinkClass}>
            {({ isActive }) => (
              <>
                <Cog6ToothIcon
                  className={`h-5 w-5 ${isActive ? "text-brand-500" : "text-slate-400"}`}
                />
                <span className="ml-3">Settings</span>
              </>
            )}
          </NavLink>
          <button
            onClick={async () => await logout()}
            className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <ArrowLeftStartOnRectangleIcon className="h-5 w-5 text-slate-400" />
            <span className="ml-3">Log out</span>
          </button>
        </div>

        <div className="flex items-center gap-3 p-2 border-t border-slate-200 pt-4">
          <img
            className="h-10 w-10 rounded-full"
            src={`https://ui-avatars.com/api/?name=${user.username}&background=0ea5e9&color=fff`}
            alt="User avatar"
          />
          <div>
            <span className="text-sm font-semibold text-slate-800">
              {user.username}
            </span>
            <span className="block text-xs text-slate-500 capitalize">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
