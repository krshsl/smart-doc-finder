import {
  UserPlusIcon,
  PencilSquareIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { LoadingOverlay } from "../components/LoadingOverlay";
import api from "../services/api";

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const isNestedRoute = location.pathname.startsWith("/settings/");

  if (isNestedRoute) {
    return <Outlet />;
  }

  const handleDeleteAccount = async() => {
    setIsActionLoading(true);
    try {
      await api.delete(`/user/${user!.id}`);
      await logout(true);
      navigate("/login");
    } catch (error) {
      console.error("Failed to delete account:", error);
    } finally {
      setIsActionLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isActionLoading} />
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="mt-2 text-gray-500">Manage your account settings.</p>
        <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-700">
            General Settings
          </h2>
          <div className="mt-4 space-y-4">
            <Link
              to="/settings/edit-profile"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <PencilSquareIcon className="h-5 w-5 mr-2" />
              Edit Your Profile
            </Link>
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-red-600">
                Delete Account
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="mt-3 inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete My Account
              </button>
            </div>
          </div>
        </div>

        {user?.role === "admin" && (
          <div className="mt-8 rounded-lg border-2 border-dashed border-red-300 bg-red-50 p-4">
            <h2 className="text-xl font-semibold text-red-700">
              Admin Controls
            </h2>
            <p className="mt-2 text-red-600">
              Manage users and system settings.
            </p>
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
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
      >
        Are you sure you want to permanently delete your account? All of your
        data will be removed. This action cannot be undone.
      </ConfirmationModal>
    </>
  );
};

export default SettingsPage;
