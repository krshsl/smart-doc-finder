import {
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

import { ConfirmationModal } from "../components/ConfirmationModal";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Pagination } from "../components/Pagination";
import * as userService from "../services/userService";
import { User } from "../types";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null });
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const fetchUsers = useCallback(async() => {
    setIsLoading(true);
    try {
      const data = await userService.getUsers(page, search);
      setUsers(data.items);
      setTotalPages(data.pages);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async() => {
    if (!deleteModal.user) return;
    setIsDeleting(true);
    try {
      await userService.deleteUser(deleteModal.user.id!);
      setDeleteModal({ isOpen: false, user: null });
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmBulkDelete = async() => {
    if (selectedUsers.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await userService.bulkDeleteUsers(selectedUsers);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error("Failed to bulk delete users:", error);
    } finally {
      setIsBulkDeleteModalOpen(false);
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <LoadingOverlay isLoading={isLoading || isDeleting || isBulkDeleting} />
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            User Management
          </h1>
          <p className="mt-2 text-[hsl(var(--muted-foreground))]">
            Manage your team members and their account permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-xs">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="block w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--card))] py-2 pl-10 pr-3 shadow-sm placeholder:text-[hsl(var(--muted-foreground))]/50"
            />
          </div>
          <Link
            to="/settings/create-user"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-[hsl(var(--primary))] px-3 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-sm hover:bg-[hsl(var(--primary))]/80 transition"
          >
            <UserPlusIcon className="h-5 w-5" /> Add user
          </Link>
        </div>
      </header>

      {selectedUsers.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setIsBulkDeleteModalOpen(true)}
            className="rounded-md bg-[hsl(var(--destructive))] px-3 py-2 text-sm font-semibold text-[hsl(var(--destructive-foreground))] shadow-sm hover:bg-[hsl(var(--destructive))]/90 disabled:opacity-50"
            disabled={isDeleting || isBulkDeleting}
          >
            Delete Selected ({selectedUsers.length})
          </button>
        </div>
      )}

      <div className="mt-8 flow-root">
        <div className="overflow-x-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <table className="min-w-full divide-y divide-[hsl(var(--border))]">
            <thead className="bg-[hsl(var(--muted))]/50">
              <tr>
                <th
                  scope="col"
                  className="relative px-7 sm:w-12 sm:px-6 py-3.5"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[hsl(var(--input))] bg-[hsl(var(--card))] text-[hsl(var(--primary))]"
                    onChange={(e) =>
                      setSelectedUsers(
                        e.target.checked ? users.map((u) => u.id) : []
                      )
                    }
                  />
                </th>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[hsl(var(--foreground))] sm:pl-6"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-[hsl(var(--foreground))]"
                >
                  Role
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  <td className="relative px-7 sm:w-12 sm:px-6">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[hsl(var(--input))] bg-[hsl(var(--card))] text-[hsl(var(--primary))]"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) =>
                        setSelectedUsers(
                          e.target.checked
                            ? [...selectedUsers, user.id]
                            : selectedUsers.filter((id) => id !== user.id)
                        )
                      }
                    />
                  </td>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="flex items-center gap-3">
                      <img
                        className="h-8 w-8 rounded-full"
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`}
                        alt=""
                      />
                      <div>
                        <div className="font-medium text-[hsl(var(--foreground))]">
                          {user.username}
                        </div>
                        <div className="text-[hsl(var(--muted-foreground))]">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className="inline-flex items-center rounded-md bg-[hsl(var(--secondary))] px-2 py-1 text-xs font-medium text-[hsl(var(--secondary-foreground))] capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-4">
                    <Link
                      to={`/users/edit/${user.id}`}
                      state={{ user }}
                      className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80"
                    >
                      <PencilIcon className="h-5 w-5 inline" />
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, user })}
                      className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]/80 disabled:opacity-50"
                      disabled={isDeleting || isBulkDeleting}
                    >
                      <TrashIcon className="h-5 w-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={handleDelete}
        title="Delete User"
      >
        Are you sure you want to delete the user "{deleteModal.user?.username}"?
      </ConfirmationModal>
      <ConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Users"
      >
        Are you sure you want to delete the {selectedUsers.length} selected
        users?
      </ConfirmationModal>
    </div>
  );
};

export default UsersPage;
