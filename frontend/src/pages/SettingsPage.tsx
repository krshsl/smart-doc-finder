import {
  UserPlusIcon,
  PencilSquareIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import * as Tabs from "@radix-ui/react-tabs";
import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Modal } from "../components/Modal";
import api from "../services/api";

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [notifcationModal, setNotifcationModal] = useState<{
    type: "info" | "success" | "error";
    text: string;
  } | null>(null);
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
      setNotifcationModal({
        type: "success",
        text: "Account removed successfully"
      });
      navigate("/login");
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      const message =
        error.response?.data?.detail ||
        error.message ||
        "An unexpected error occurred.";
      setNotifcationModal({
        type: "error",
        text: message
      });
    } finally {
      setIsActionLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <>
      <LoadingOverlay isLoading={isActionLoading} />
      <div className="p-6 lg:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          Settings
        </h1>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">
          Manage your account and system settings.
        </p>

        <Tabs.Root defaultValue="general" className="mt-8 max-w-4xl">
          <Tabs.List className="border-b border-[hsl(var(--border))]">
            <Tabs.Trigger
              value="general"
              className="px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))]"
            >
              General
            </Tabs.Trigger>
            {isAdmin && (
              <Tabs.Trigger
                value="admin"
                className="px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))]"
              >
                Admin
              </Tabs.Trigger>
            )}
          </Tabs.List>
          <Tabs.Content value="general" className="pt-8">
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                General Settings
              </h2>
              <div className="mt-6 border-t border-[hsl(var(--border))] pt-6">
                <h3 className="text-lg font-medium text-[hsl(var(--foreground))]">
                  Profile Information
                </h3>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  Update your account's profile information and email address.
                </p>
                <Link
                  to="/settings/edit-profile"
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-[hsl(var(--primary))] px-3 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-sm hover:bg-[hsl(var(--primary))]/90 transition"
                >
                  <PencilSquareIcon className="h-5 w-5" /> Edit Profile
                </Link>
              </div>
              <div className="mt-6 border-t border-[hsl(var(--border))] pt-6">
                <h3 className="text-lg font-medium text-[hsl(var(--destructive))]">
                  Delete Account
                </h3>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  Once you delete your account, there is no going back. This
                  action is permanent.
                </p>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-[hsl(var(--destructive))] px-3 py-2 text-sm font-semibold text-[hsl(var(--destructive-foreground))] shadow-sm hover:bg-[hsl(var(--destructive))]/90 transition"
                >
                  <TrashIcon className="h-5 w-5" /> Delete My Account
                </button>
              </div>
            </div>
          </Tabs.Content>
          {isAdmin && (
            <Tabs.Content value="admin" className="pt-8">
              <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                  Admin Controls
                </h2>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  Manage users and other system-wide settings.
                </p>
                <div className="mt-6 border-t border-[hsl(var(--border))] pt-6">
                  <Link
                    to="/users"
                    className="inline-flex items-center gap-2 rounded-md bg-[hsl(var(--secondary))] px-4 py-3 text-base font-semibold text-[hsl(var(--secondary-foreground))] shadow-sm hover:bg-[hsl(var(--accent))] transition w-full justify-center"
                  >
                    <UserPlusIcon className="h-5 w-5" /> Manage All Users
                  </Link>
                </div>
              </div>
            </Tabs.Content>
          )}
        </Tabs.Root>
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
      >
        Are you sure you want to permanently delete your account? This action
        cannot be undone.
      </ConfirmationModal>
      <Modal
        isOpen={!!notifcationModal}
        onClose={() => setNotifcationModal(null)}
        type={notifcationModal?.type}
      >
        {notifcationModal?.text}
      </Modal>
    </>
  );
};

export default SettingsPage;
