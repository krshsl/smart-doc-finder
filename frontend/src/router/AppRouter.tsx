import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { GuestRoute } from "../auth/GuestRoute";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";
import LoginPage from "../pages/LoginPage";
import MyCloudPage from "../pages/MyCloudPage";
import SearchPage from "../pages/SearchPage";
import SettingsPage from "../pages/SettingsPage";
import UploadFilesPage from "../pages/UploadFilesPage";
import UserFormPage from "../pages/UserFormPage";
import UsersPage from "../pages/UsersPage";

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
            <UserFormPage />
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
        <Route path="search/ai" element={<SearchPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="settings" element={<SettingsPage />}>
          <Route
            path="create-user"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UserFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="edit-profile"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <UserFormPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/edit/:userId"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UserFormPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRouter;
