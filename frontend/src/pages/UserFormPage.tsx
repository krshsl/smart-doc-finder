import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
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

    // Simple client-side validation
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

    try {
      const response = await userService.saveUser(payload, targetUserId);
      if (isEditingCurrentUser && response.data.access_token) {
        updateToken(response.data.access_token);
      }
      setModalMessage(`User ${data.email} has been saved successfully!`);
      setIsModalOpen(true);
      if (!isEditMode) formRef.current?.reset();
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail;
      if (typeof errorDetail === "string") {
        setError(errorDetail);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
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
    ? "Edit User"
    : isPublicSignUp
      ? "Create an Account"
      : "Create New User";
  const pageSubtitle = isPublicSignUp
    ? "Join us today!"
    : "Manage user details.";

  return (
    <>
      <Modal isOpen={isModalOpen} onClose={handleModalClose} title="Success!">
        {modalMessage}
      </Modal>
      <LoadingOverlay isLoading={isLoading} />
      <div
        className={`flex w-full items-center justify-center p-8 ${isPublicSignUp ? "min-h-screen bg-gray-100" : ""}`}
      >
        <div className="w-full max-w-md">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">{pageTitle}</h1>
          <p className="mb-8 text-gray-500">{pageSubtitle}</p>
          <form ref={formRef} onSubmit={handleSubmit}>
            {/* Form fields remain the same */}
            <div className="mb-4">
              <label
                className="mb-2 block font-medium text-gray-700"
                htmlFor="username"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                defaultValue={currentUserData?.username}
                key={currentUserData?.id}
                required
                className="w-full rounded-lg border border-gray-300 p-3"
              />
            </div>
            <div className="mb-4">
              <label
                className="mb-2 block font-medium text-gray-700"
                htmlFor="new-email"
              >
                Email
              </label>
              <input
                type="email"
                id="new-email"
                name="email"
                defaultValue={currentUserData?.email}
                key={currentUserData?.id}
                required
                className="w-full rounded-lg border border-gray-300 p-3"
              />
            </div>
            <div className="mb-6">
              <label
                className="mb-2 block font-medium text-gray-700"
                htmlFor="new-password"
              >
                Password
              </label>
              <input
                type="password"
                id="new-password"
                name="password"
                placeholder={isEditMode ? "Leave blank to keep current" : ""}
                required={!isEditMode}
                className="w-full rounded-lg border border-gray-300 p-3"
              />
            </div>

            {user?.role === "admin" && !isEditMode && (
              <div className="mb-6">
                <LabelPrimitive.Root className="mb-2 block font-medium text-gray-700">
                  Role
                </LabelPrimitive.Root>
                <Select.Root
                  value={selectedRole.value}
                  onValueChange={(v) =>
                    setSelectedRole(roles.find((r) => r.value === v)!)
                  }
                >
                  <Select.Trigger className="relative mt-1 w-full cursor-default rounded-lg border border-gray-300 bg-white py-3 pl-3 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <Select.Value />
                    <Select.Icon className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      position="popper"
                      sideOffset={5}
                      className="z-10 mt-1 w-[var(--radix-select-trigger-width)] rounded-md bg-white shadow-lg"
                    >
                      <Select.Viewport className="p-1">
                        {roles.map((role) => (
                          <Select.Item
                            key={role.value}
                            value={role.value}
                            className="relative cursor-default select-none rounded-sm py-2 pl-10 pr-4 outline-none data-[highlighted]:bg-blue-100"
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

            {error && <p className="mb-4 text-center text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
            >
              {isLoading
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Account"}
            </button>
          </form>
          {isPublicSignUp && (
            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:underline"
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
