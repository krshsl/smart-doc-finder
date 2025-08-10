import { User, PaginatedUsersResponse } from "../types";

import api from "./api";

export const getUsers = async(
  page: number,
  search: string
): Promise<PaginatedUsersResponse> => {
  const response = await api.post("/users", { page, size: 10, q: search });
  return response.data;
};

export const getUserById = async(userId: string): Promise<User> => {
  const response = await api.get(`/user/${userId}`);
  return response.data;
};

export const saveUser = async(payload: Partial<User>, userId?: string) => {
  const endpoint = userId ? `/user/${userId}` : "/user";
  return api.post(endpoint, payload);
};

export const deleteUser = async(userId: string) => {
  return api.delete(`/user/${userId}`);
};

export const bulkDeleteUsers = async(userIds: string[]) => {
  return api.delete("/users", { data: { user_ids: userIds } });
};
