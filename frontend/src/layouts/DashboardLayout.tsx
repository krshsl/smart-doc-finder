import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-[hsl(var(--background))]">
      <Sidebar user={user} isOpen={isSidebarOpen} toggle={toggleSidebar} />
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-74">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
