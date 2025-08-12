import {
  ArrowLeftStartOnRectangleIcon,
  CloudArrowUpIcon,
  CloudIcon,
  Cog6ToothIcon,
  MoonIcon,
  SunIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import React, { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import CloudLogo from "../Logo/CloudLogo";
import * as cloudService from "../services/cloudService";
import eventBus from "../services/eventBus";
import { User } from "../types";

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

interface SidebarProps {
  user: User;
  isOpen: boolean;
  toggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, toggle }) => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const [storageQuota, setStorageQuota] = useState<number>(0);

  const navItems = [
    { to: "/my-cloud", label: "My Cloud", icon: CloudIcon, show: true },
    {
      to: "/upload-files",
      label: "Upload",
      icon: CloudArrowUpIcon,
      show: user.role !== "guest",
    },
    {
      to: "/users",
      label: "Manage Users",
      icon: UsersIcon,
      show: user.role === "admin",
    },
  ];

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 rounded-lg p-3 text-base font-semibold transition-colors ${
      isActive
        ? "bg-emerald-400/20 text-[hsl(var(--accent-foreground))]"
        : "text-[hsl(var(--muted-foreground))] hover:bg-emerald-400/20 dark:hover:bg-emerald-400/20 hover:text-[hsl(var(--accent-foreground))]"
    }`;

  const fetchStorage = useCallback(async () => {
    if (user?.id) {
      try {
        const usage = await cloudService.getStorageUsage(user.id);
        setStorageUsed(usage.storage_used);
        setStorageQuota(usage.storage_quota);
      } catch (error) {
        console.error("Failed to fetch storage usage:", error);
      }
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
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggle}
      ></div>

      <aside
        className={`fixed top-0 left-0 h-full w-72 flex flex-col bg-[hsl(var(--secondary))] p-4 border-r border-[hsl(var(--border))] z-40 transition-transform duration-300 ease-in-out lg:fixed ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between gap-3 p-2 mb-4">
          <div className="flex items-center gap-3">
            <CloudLogo className="h-10 w-10 text-[hsl(var(--primary))]" />
            <span className="text-3xl font-bold text-[hsl(var(--foreground))]">
              CloudApp
            </span>
          </div>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            {navItems
              .filter((item) => item.show)
              .map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={getLinkClass}
                    onClick={isOpen ? toggle : undefined}
                  >
                    <item.icon className="h-6 w-6" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
          </ul>
        </nav>

        <div>
          <div className="px-3 py-4 rounded-lg bg-[hsl(var(--background))]/50 border border-emerald-300/60 dark:border-emerald-500/30">
            <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Storage
            </span>
            <div className="mt-3 h-1.5 w-full rounded-full bg-emerald-300/20">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{
                  width: `${storagePercentage > 100 ? 100 : storagePercentage}%`,
                }}
              ></div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
              <span>{formatBytes(storageUsed)} used</span>
              <span>of {formatBytes(storageQuota)}</span>
            </div>
          </div>

          <div className="border-t border-[hsl(var(--border))] mt-4 pt-4 space-y-1">
            <NavLink
              to="/settings"
              className={getLinkClass}
              onClick={isOpen ? toggle : undefined}
            >
              <Cog6ToothIcon className="h-6 w-6" />
              <span>Settings</span>
            </NavLink>
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-4 rounded-lg p-3 text-base font-semibold text-[hsl(var(--muted-foreground))] transition-colors hover:bg-emerald-400/20 dark:hover:bg-emerald-400/20 hover:text-[hsl(var(--accent-foreground))]"
            >
              {theme === "light" ? (
                <MoonIcon className="h-6 w-6" />
              ) : (
                <SunIcon className="h-6 w-6" />
              )}
              <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 p-2 border-t border-[hsl(var(--border))] mt-4 pt-4">
            <img
              className="h-10 w-10 rounded-full"
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.username,
              )}&background=0D8ABC&color=fff&bold=true`}
              alt="User avatar"
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                {user.username}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize truncate">
                {user.role}
              </p>
            </div>
            <button
              onClick={() => logout()}
              className="p-2 rounded-md text-[hsl(var(--muted-foreground))] transition-colors hover:bg-emerald-400/20 dark:hover:bg-emerald-400/20 hover:text-[hsl(var(--accent-foreground))]"
              title="Log out"
            >
              <ArrowLeftStartOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
