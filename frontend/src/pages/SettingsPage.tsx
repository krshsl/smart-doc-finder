import {
  UserPlusIcon,
  PencilSquareIcon,
  TrashIcon,
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

  const handleDeleteAccount = async () => {
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
      <div className="p-6 lg:p-8">
        <h1 className="text-4xl font-bold text-slate-800">Settings</h1>
        <p className="mt-2 text-base text-slate-500">
          Manage your account and system settings.
        </p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* General Settings Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">
              General Settings
            </h2>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-700">
                  Profile Information
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Update your account's profile information and email address.
                </p>
                <Link
                  to="/settings/edit-profile"
                  className="mt-3 inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-black shadow-sm hover:bg-brand-500 transition"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                  Edit Your Profile
                </Link>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-medium text-red-600">
                  Delete Account
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Once you delete your account, there is no going back. Please
                  be certain.
                </p>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 transition"
                >
                  <TrashIcon className="h-5 w-5" />
                  Delete My Account
                </button>
              </div>
            </div>
          </div>

          {user?.role === "admin" && (
            <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-800">
                Admin Controls
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Manage users and other system-wide settings.
              </p>
              <div className="mt-6">
                <Link
                  to="/users"
                  className="inline-flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-600 transition w-full justify-center"
                >
                  <UserPlusIcon className="h-5 w-5" />
                  Manage All Users
                </Link>
              </div>
              <div className="mt-4">
                <Link
                  to="/settings/create-user"
                  className="inline-flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-600 transition w-full justify-center"
                >
                  <UserPlusIcon className="h-5 w-5" />
                  Create New User
                </Link>
              </div>
            </div>
          )}
        </div>
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
