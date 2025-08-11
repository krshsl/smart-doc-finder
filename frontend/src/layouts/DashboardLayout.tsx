import React from "react";
import { Outlet } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const DashboardLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar user={user!} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
