import { UserIcon, LockClosedIcon } from "@heroicons/react/24/outline";
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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleGuestLogin = async () => {
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--background))] p-8">
      <LoadingOverlay isLoading={isLoading} />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Welcome Back
          </h1>
          <p className="mt-2 text-[hsl(var(--muted-foreground))]">
            Please enter your details to sign in.
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <label
              className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5"
              htmlFor="username"
            >
              Username
            </label>
            <UserIcon className="pointer-events-none absolute top-10 left-3 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              id="username"
              name="username"
              placeholder="e.g. user"
              className="block w-full rounded-md border border-[hsl(var(--input))] bg-transparent py-2.5 pl-10 pr-4 shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))]/50"
            />
          </div>
          <div className="relative">
            <label
              className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5"
              htmlFor="password"
            >
              Password
            </label>
            <LockClosedIcon className="pointer-events-none absolute top-10 left-3 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              className="block w-full rounded-md border border-[hsl(var(--input))] bg-transparent py-2.5 pl-10 pr-4 shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))]/50"
            />
          </div>
          {error && (
            <p className="text-center text-sm text-[hsl(var(--destructive))]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center rounded-md bg-[hsl(var(--primary))] py-2.5 px-4 font-semibold text-[hsl(var(--primary-foreground))] shadow-sm hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-[hsl(var(--border))]"></div>
          <span className="mx-4 flex-shrink text-sm text-[hsl(var(--muted-foreground))]">
            OR
          </span>
          <div className="flex-grow border-t border-[hsl(var(--border))]"></div>
        </div>
        <button
          type="button"
          onClick={handleGuestLogin}
          className="w-full flex justify-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] py-2.5 px-4 font-semibold text-[hsl(var(--secondary-foreground))] shadow-sm hover:bg-[hsl(var(--accent))]"
        >
          Login as Guest
        </button>
        <p className="mt-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Don't have an account?{" "}
          <Link
            to="/create-user"
            className="font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
