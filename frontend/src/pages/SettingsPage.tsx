import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { UserPlusIcon } from "@heroicons/react/24/outline";

import { useAuth } from "../auth/AuthContext";

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isCreateUserPage = location.pathname.includes("/settings/create-user");

  if (isCreateUserPage) {
    return <Outlet />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
      <p className="mt-2 text-gray-500">Manage your account settings.</p>
      <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 bg-white p-4">
        <h2 className="text-xl font-semibold text-gray-700">
          General Settings
        </h2>
        <p className="mt-2 text-gray-500">
          General settings content goes here...
        </p>
      </div>

      {user?.role === "admin" && (
        <div className="mt-8 rounded-lg border-2 border-dashed border-red-300 bg-red-50 p-4">
          <h2 className="text-xl font-semibold text-red-700">Admin Controls</h2>
          <p className="mt-2 text-red-600">Manage users and system settings.</p>
          <div className="mt-4">
            <Link
              to="/settings/create-user"
              className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Create New User
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
