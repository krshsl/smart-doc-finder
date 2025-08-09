import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/LoginPage";
import CreateUserPage from "../pages/CreateUserPage";
import DashboardLayout from "../layouts/DashboardLayout";
import MyCloudPage from "../pages/MyCloudPage";
import UploadFilesPage from "../pages/UploadFilesPage";
import SettingsPage from "../pages/SettingsPage";
import SearchPage from "../pages/SearchPage";

import { GuestRoute } from "../auth/GuestRoute";
import { ProtectedRoute } from "../auth/ProtectedRoute";

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/create-user"
        element={
          <GuestRoute>
            <CreateUserPage />
          </GuestRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={["user", "admin", "guest"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="my-cloud" replace />} />
        <Route path="my-cloud/:folderId?" element={<MyCloudPage />} />
        <Route path="upload-files" element={<UploadFilesPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="settings" element={<SettingsPage />}>
          <Route
            path="create-user"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <CreateUserPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRouter;
