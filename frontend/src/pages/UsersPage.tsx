import {
  PencilIcon,
  TrashIcon,
  UserPlusIcon
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
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-4xl font-bold text-slate-800">Users</h1>
          <p className="mt-2 text-base text-slate-500">
            A list of all the users in the system.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            to="/settings/create-user"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition"
          >
            <UserPlusIcon className="h-5 w-5" /> Add user
          </Link>
        </div>
      </div>
      <div className="mt-6 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full max-w-xs rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
        />
        {selectedUsers.length > 0 && (
          <button
            onClick={() => setIsBulkDeleteModalOpen(true)}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting || isBulkDeleting}
          >
            Delete Selected ({selectedUsers.length})
          </button>
        )}
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="relative overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                      <input
                        type="checkbox"
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        onChange={(e) =>
                          setSelectedUsers(
                            e.target.checked ? users.map((u) => u.id) : []
                          )
                        }
                      />
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="relative px-7 sm:w-12 sm:px-6">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
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
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">
                        {user.username}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 capitalize">
                        {user.role}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-4">
                        <Link
                          to={`/users/edit/${user.id}`}
                          state={{ user }}
                          className="text-brand-600 hover:text-brand-800"
                        >
                          <PencilIcon
                            className="h-5 w-5 inline"
                            aria-hidden="true"
                          />
                        </Link>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, user })}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          disabled={isDeleting || isBulkDeleting}
                        >
                          <TrashIcon
                            className="h-5 w-5 inline"
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
