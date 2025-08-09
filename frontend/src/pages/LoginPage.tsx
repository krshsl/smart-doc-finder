import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { LoadingOverlay } from "../components/LoadingOverlay";
import { useAuth } from "../auth/AuthContext";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoginFailed, setHasLoginFailed] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      await login(formData);
      navigate("/");
    } catch (err) {
      setError("Failed to log in. Please check your credentials.");
      setHasLoginFailed(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = () => {
    if (hasLoginFailed) {
      setHasLoginFailed(false);
    }
    setError(null);
  };

  return (
    <div className="relative flex min-h-screen font-sans">
      <LoadingOverlay isLoading={isLoading} />
      <div className="hidden w-1/2 bg-[#2a457a] lg:flex"></div>
      <div className="flex w-full items-center justify-center bg-gray-100 p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">
            Welcome Back
          </h1>
          <p className="mb-8 text-gray-500">
            Please enter your details to sign in.
          </p>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label
                className="mb-2 block font-medium text-gray-700"
                htmlFor="username"
              >
                Username
              </label>
              <input
                type="username"
                id="username"
                name="username"
                placeholder="user"
                className="w-full rounded-lg border border-gray-300 p-3"
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-6">
              <label
                className="mb-2 block font-medium text-gray-700"
                htmlFor="password"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="password"
                className="w-full rounded-lg border border-gray-300 p-3"
                onChange={handleInputChange}
              />
            </div>
            {error && <p className="mb-4 text-center text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={isLoading || hasLoginFailed}
              className="w-full rounded-lg bg-[#2a457a] py-3 font-semibold text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/create-user"
              className="font-medium text-blue-600 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
