import React from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import { useAuth } from "../auth/AuthContext";

const DashboardLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar user={user!} />
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
