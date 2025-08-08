import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoadingOverlay from "../components/LoadingOverlay";
import Modal from "../components/Modal";
import api from "../services/api";
import { useAuth } from "../auth/AuthContext";

const CreateUserPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const isPublicSignUp = !user;

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const payload = {
      username: data.username,
      email: data.email,
      password: data.password,
      role: data.role || "user",
    };

    try {
      await api.post("/create_user", payload);
      setModalMessage(`Account for ${data.email} created successfully!`);
      setIsModalOpen(true);
      e.currentTarget.reset();
    } catch (err: any) {
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        if (err.response.status === 422 && Array.isArray(errorData.detail)) {
          const messages = errorData.detail.map((d: any) => d.msg).join(", ");
          setError(messages);
        } else if (typeof errorData.detail === "string") {
          setError(errorData.detail);
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (isPublicSignUp) {
      navigate("/login");
    }
  };

  const pageTitle = isPublicSignUp ? "Create an Account" : "Create New User";
  const pageSubtitle = isPublicSignUp
    ? "Join us today!"
    : "Add a new user to the system.";

  const formContent = (
    <div className="w-full max-w-md">
      <h1 className="mb-2 text-4xl font-bold text-gray-800">{pageTitle}</h1>
      <p className="mb-8 text-gray-500">{pageSubtitle}</p>
      <form onSubmit={handleCreateUser}>
        <div className="mb-4">
          <label
            className="mb-2 block font-medium text-gray-700"
            htmlFor="username"
          >
            Full Name
          </label>
          <input
            type="text"
            id="username"
            name="username"
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
            required
            className="w-full rounded-lg border border-gray-300 p-3"
          />
        </div>

        {user?.role === "admin" && (
          <div className="mb-6">
            <label
              className="mb-2 block font-medium text-gray-700"
              htmlFor="role"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue="user"
              className="w-full rounded-lg border border-gray-300 p-3 bg-white"
            >
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        )}

        {error && <p className="mb-4 text-center text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
        >
          {isLoading ? "Creating Account..." : "Create Account"}
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
  );

  return (
    <>
      <Modal isOpen={isModalOpen} onClose={handleModalClose} title="Success!">
        {modalMessage}
      </Modal>
      <LoadingOverlay isLoading={isLoading} />
      {isPublicSignUp ? (
        <div className="relative flex min-h-screen font-sans">
          <div className="hidden w-1/2 bg-[#2a457a] lg:flex"></div>
          <div className="flex w-full items-center justify-center bg-gray-100 p-8 lg:w-1/2">
            {formContent}
          </div>
        </div>
      ) : (
        formContent
      )}
    </>
  );
};

export default CreateUserPage;
