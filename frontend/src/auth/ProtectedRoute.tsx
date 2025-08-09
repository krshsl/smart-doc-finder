import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { UserRole } from "../types";

const UnauthorizedPage = () => (
  <div className="flex h-screen items-center justify-center">
    <h1 className="text-2xl font-bold">403 | Unauthorized Access</h1>
  </div>
);

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};
