import React from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "./AuthContext";

interface GuestRouteProps {
  redirect_admin?: boolean;
  children: React.ReactNode;
}

export const GuestRoute: React.FC<GuestRouteProps> = ({
  redirect_admin = true,
  children
}) => {
  const { user } = useAuth();

  if (user && (user.role !== "admin" || redirect_admin)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
