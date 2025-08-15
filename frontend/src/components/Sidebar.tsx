import {
  ArrowLeftStartOnRectangleIcon,
  CloudArrowUpIcon,
  CloudIcon,
  Cog6ToothIcon,
  MoonIcon,
  SunIcon,
  UsersIcon
} from "@heroicons/react/24/outline";
import React, { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import CloudLogo from "../assets/CloudLogo";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
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
      show: user.role !== "guest"
    },
    {
      to: "/users",
      label: "Manage Users",
      icon: UsersIcon,
      show: user.role === "admin"
    }
  ];

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg p-2.5 text-sm font-semibold transition-colors lg:gap-4 lg:p-3 lg:text-base ${
      isActive
        ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]"
    }`;

  const fetchStorage = useCallback(async() => {
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
        className={`fixed top-0 left-0 h-full w-64 flex flex-col bg-[hsl(var(--secondary))] p-3 border-r border-[hsl(var(--border))] z-40 transition-transform duration-300 ease-in-out lg:w-74 lg:p-4 lg:fixed ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-1 p-2 mb-4 flex-shrink-0">
          <CloudLogo className="h-14 w-14" />
          <span className="text-base font-extralight text-center tracking-tighter text-[hsl(var(--foreground))] lg:text-xl">
            Smart Doc Finder
          </span>
        </div>

        <div className="flex-1 overflow-y-auto lg:flex lg:flex-col lg:overflow-y-hidden">
          <nav className="lg:flex-1 lg:overflow-y-auto">
            <ul className="space-y-1.5 p-1">
              {navItems
                .filter((item) => item.show)
                .map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={getLinkClass}
                      onClick={isOpen ? toggle : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 lg:h-6 lg:w-6" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
            </ul>
          </nav>

          <div className="mt-4 flex flex-col gap-4 lg:flex-shrink-0">
            <div className="px-3 py-4 rounded-lg bg-[hsl(var(--background))]/50 border border-[hsl(var(--primary))]">
              <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Storage
              </span>
              <div className="mt-3 h-1.5 w-full rounded-full bg-[hsl(var(--primary))]/15">
                <div
                  className="h-1.5 rounded-full bg-ai-luminous opacity-90 bg-no-repeat"
                  style={{
                    width: `${
                      storagePercentage > 100 ? 100 : storagePercentage
                    }%`,
                    backgroundSize: `${200 - storagePercentage}% 100%`
                  }}
                ></div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                <span>{formatBytes(storageUsed)} used</span>
                <span>of {formatBytes(storageQuota)}</span>
              </div>
            </div>

            <div className="border-t border-[hsl(var(--border))] pt-4 space-y-1">
              <NavLink
                to="/settings"
                className={getLinkClass}
                onClick={isOpen ? toggle : undefined}
              >
                <Cog6ToothIcon className="h-5 w-5 flex-shrink-0 lg:h-6 lg:w-6" />
                <span>Settings</span>
              </NavLink>
              <button
                onClick={toggleTheme}
                className="flex w-full items-center gap-3 rounded-lg p-2.5 text-sm font-semibold text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] lg:gap-4 lg:p-3 lg:text-base"
              >
                {theme === "light" ? (
                  <MoonIcon className="h-5 w-5 flex-shrink-0 lg:h-6 lg:w-6" />
                ) : (
                  <SunIcon className="h-5 w-5 flex-shrink-0 lg:h-6 lg:w-6" />
                )}
                <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 p-2 border-t border-[hsl(var(--border))] pt-4">
              <img
                className="h-10 w-10 rounded-full"
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.username
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
                className="p-2 rounded-md text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]"
                title="Log out"
              >
                <ArrowLeftStartOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
