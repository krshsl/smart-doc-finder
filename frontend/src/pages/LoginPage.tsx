import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { guestUser } from "../config";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    let login_success = true;
    try {
      await login(formData);
    } catch (err: any) {
      login_success = false;
      const errorDetail = err.response?.data?.detail;
      if (typeof errorDetail === "string") {
        setError(errorDetail);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      if (login_success) navigate("/");
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async() => {
    setIsLoading(true);
    setError(null);
    let login_success = true;
    try {
      const guestFormData = new FormData();
      guestFormData.append("username", guestUser.username);
      guestFormData.append("password", guestUser.password);
      await login(guestFormData);
    } catch (err: any) {
      login_success = false;
      const errorDetail = err.response?.data?.detail;
      if (typeof errorDetail === "string") {
        setError(errorDetail);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      if (login_success) navigate("/");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen font-sans bg-slate-50">
      <LoadingOverlay isLoading={isLoading} />
      {/* Decorative background */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-tr from-brand-400 to-sky-600 items-center justify-center p-12 text-white">
        <div className="text-center">
          {/* You can replace this with your app's logo or a nice illustration */}
          <svg
            className="w-32 h-32 mx-auto mb-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
            />
          </svg>
          <h1 className="text-4xl font-bold">Your Cloud, Smarter.</h1>
          <p className="mt-4 text-lg opacity-80">
            Access your files anywhere with the power of AI search.
          </p>
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold text-slate-800">Welcome Back</h1>
          <p className="mt-3 mb-8 text-slate-500">
            Please enter your details to sign in.
          </p>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                className="block text-sm font-medium text-slate-700 mb-2"
                htmlFor="username"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="user"
                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-slate-700 mb-2"
                htmlFor="password"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="password"
                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
              />
            </div>
            {error && (
              <p className="text-center text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center rounded-lg bg-brand-600 py-3 px-4 font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-brand-400"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>
          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-slate-300"></div>
            <span className="mx-4 flex-shrink text-sm text-slate-500">or</span>
            <div className="flex-grow border-t border-slate-300"></div>
          </div>
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full flex justify-center rounded-lg border border-slate-300 bg-white py-3 px-4 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Login as Guest
          </button>
          <p className="mt-8 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link
              to="/create-user"
              className="font-medium text-brand-600 hover:text-brand-500 hover:underline"
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
