import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Modal } from "../components/Modal";
import * as userService from "../services/userService";
import { User } from "../types";

const roles = [
  { value: "user", name: "User" },
  { value: "guest", name: "Guest" },
  { value: "admin", name: "Admin" }
];

const UserFormPage: React.FC = () => {
  const { user, updateToken } = useAuth();
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const formRef = useRef<HTMLFormElement>(null);

  const isEditingCurrentUser = location.pathname.includes(
    "/settings/edit-profile"
  );
  const passedUserData = location.state?.user;

  const [currentUserData, setCurrentUserData] = useState<User | null>(
    isEditingCurrentUser ? user : passedUserData || null
  );

  const isPublicSignUp = !user;
  const isEditMode = !!userId || isEditingCurrentUser;

  const fetchUserData = useCallback(async() => {
    if (isEditMode && !passedUserData && userId) {
      setIsLoading(true);
      try {
        const data = await userService.getUserById(userId);
        setCurrentUserData(data);
        const role = roles.find((r) => r.value === data.role) || roles[0];
        setSelectedRole(role);
      } catch (err: any) {
        setError("Failed to fetch user data: " + err?.message);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isEditMode, passedUserData, userId]);

  useEffect(() => {
    if (isEditMode && passedUserData) {
      setCurrentUserData(passedUserData);
      const role =
        roles.find((r) => r.value === passedUserData.role) || roles[0];
      setSelectedRole(role);
    } else {
      fetchUserData();
    }
  }, [passedUserData, isEditMode, fetchUserData]);

  const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (
      (data.username as string).includes(" ") ||
      (data.username as string).length < 4
    ) {
      setError("Username must be at least 4 characters and contain no spaces.");
      setIsLoading(false);
      return;
    }
    if (data.password && (data.password as string).length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    const payload: any = {
      username: data.username,
      email: data.email,
      role: selectedRole.value
    };
    if (data.password) payload.password = data.password;

    const targetUserId = isEditingCurrentUser ? user?.id : userId;
    let isSuccess = true;

    try {
      const response = await userService.saveUser(payload, targetUserId);
      if (isEditingCurrentUser && response.data.access_token) {
        updateToken(response.data.access_token);
      }
      setModalMessage(`User ${data.email} has been saved successfully!`);
      if (!isEditMode) formRef.current?.reset();
    } catch (err: any) {
      isSuccess = false;
      const errorDetail = err.response?.data?.detail;
      if (typeof errorDetail === "string") {
        setError(errorDetail);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      if (isSuccess) setIsModalOpen(true);
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (isEditMode && isEditingCurrentUser) navigate("/settings");
    else if (isEditMode || user?.role === "admin") navigate("/users");
    else if (isPublicSignUp) navigate("/login");
  };

  const pageTitle = isEditMode
    ? "Edit Profile"
    : isPublicSignUp
      ? "Create an Account"
      : "Create New User";
  const pageSubtitle = isPublicSignUp
    ? "Join us today to start storing your files securely."
    : "Manage user details and permissions.";

  return (
    <>
      <Modal isOpen={isModalOpen} onClose={handleModalClose} title="Success!">
        {modalMessage}
      </Modal>
      <LoadingOverlay isLoading={isLoading} />
      <div
        className={`flex w-full items-center justify-center p-8 ${
          isPublicSignUp ? "min-h-screen bg-[hsl(var(--background))]" : ""
        }`}
      >
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))]">
            {pageTitle}
          </h1>
          <p className="mt-3 mb-8 text-[hsl(var(--muted-foreground))]">
            {pageSubtitle}
          </p>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label
                className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2"
                htmlFor="username"
              >
                Username
              </label>
              <UserIcon className="pointer-events-none absolute top-10 left-3 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                id="username"
                name="username"
                defaultValue={currentUserData?.username}
                key={currentUserData?.id}
                placeholder="e.g. john.doe"
                required
                className="block w-full rounded-lg border border-[hsl(var(--input))] bg-transparent py-2.5 pl-10 pr-4 shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))]/50"
              />
            </div>
            <div className="relative">
              <label
                className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2"
                htmlFor="new-email"
              >
                Email
              </label>
              <EnvelopeIcon className="pointer-events-none absolute top-10 left-3 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              <input
                type="email"
                id="new-email"
                name="email"
                defaultValue={currentUserData?.email}
                key={currentUserData?.id}
                placeholder="e.g. john.doe@example.com"
                required
                className="block w-full rounded-lg border border-[hsl(var(--input))] bg-transparent py-2.5 pl-10 pr-4 shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))]/50"
              />
            </div>
            <div className="relative">
              <label
                className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2"
                htmlFor="new-password"
              >
                Password
              </label>
              <LockClosedIcon className="pointer-events-none absolute top-10 left-3 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              <input
                type="password"
                id="new-password"
                name="password"
                placeholder={
                  isEditMode ? "Leave blank to keep current" : "••••••••"
                }
                required={!isEditMode}
                className="block w-full rounded-lg border border-[hsl(var(--input))] bg-transparent py-2.5 pl-10 pr-4 shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))]/50"
              />
            </div>

            {user?.role === "admin" && !isEditMode && (
              <div className="pt-2">
                <LabelPrimitive.Root className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Role
                </LabelPrimitive.Root>
                <Select.Root
                  value={selectedRole.value}
                  onValueChange={(v) =>
                    setSelectedRole(roles.find((r) => r.value === v)!)
                  }
                >
                  <Select.Trigger className="relative w-full cursor-default rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] py-2.5 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-[hsl(var(--primary))]">
                    <Select.Value />
                    <Select.Icon className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      position="popper"
                      sideOffset={5}
                      className="z-10 mt-1 w-[var(--radix-select-trigger-width)] rounded-md bg-[hsl(var(--popover))] shadow-lg ring-1 ring-black ring-opacity-5"
                    >
                      <Select.Viewport className="p-1">
                        {roles.map((role) => (
                          <Select.Item
                            key={role.value}
                            value={role.value}
                            className="relative cursor-default select-none rounded-md py-2 pl-10 pr-4 text-sm outline-none data-[highlighted]:bg-[hsl(var(--accent))] data-[highlighted]:text-[hsl(var(--accent-foreground))]"
                          >
                            <Select.ItemText>{role.name}</Select.ItemText>
                            <Select.ItemIndicator className="absolute left-0 flex w-10 items-center justify-center">
                              <CheckIcon className="h-5 w-5" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            )}

            {error && (
              <p className="text-center text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center rounded-lg bg-[hsl(var(--primary))] py-3 px-4 font-semibold text-[hsl(var(--primary-foreground))] shadow-sm transition hover:bg-[hsl(var(--primary))]/90 disabled:cursor-not-allowed disabled:bg-[hsl(var(--primary))]/50"
            >
              {isLoading
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Account"}
            </button>
          </form>
          {isPublicSignUp && (
            <p className="mt-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 hover:underline"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default UserFormPage;
