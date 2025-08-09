import React, { useState, useRef, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

import { LoadingOverlay } from "../components/LoadingOverlay";
import { Modal } from "../components/Modal";

import { useAuth } from "../auth/AuthContext";
import api from "../services/api";

const roles = [
  { value: "user", name: "User" },
  { value: "guest", name: "Guest" },
  { value: "admin", name: "Admin" },
];

const CreateUserPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const formRef = useRef<HTMLFormElement>(null);

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
      role: selectedRole.value,
    };

    try {
      await api.post("/user", payload);
      setModalMessage(`Account for ${data.email} created successfully!`);
      setIsModalOpen(true);
      formRef.current?.reset();
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
      <form ref={formRef} onSubmit={handleCreateUser}>
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
            <Listbox value={selectedRole} onChange={setSelectedRole}>
              <div className="relative mt-1">
                <Listbox.Label className="mb-2 block font-medium text-gray-700">
                  Role
                </Listbox.Label>
                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-3 pl-3 pr-10 text-left border border-gray-300">
                  <span className="block truncate">{selectedRole.name}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {roles.map((role) => (
                      <Listbox.Option
                        key={role.value}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-blue-100 text-blue-900" : "text-gray-900"}`
                        }
                        value={role}
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                            >
                              {role.name}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
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
