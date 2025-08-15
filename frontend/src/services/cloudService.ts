import { FileItem, FolderItem, FolderResponse } from "../types";

import api from "./api";

export const getStorageUsage = async(userId: string): Promise<any> => {
  const response = await api.get(`/storage/${userId}`, { allowGuest: true });
  return response.data;
};

export const getFolderContents = async(
  folderId: string | null,
  page: number
): Promise<FolderResponse> => {
  const endpoint = folderId ? `/folder/${folderId}` : "/folder";
  const response = await api.get(endpoint, {
    params: { page },
    allowGuest: true
  });
  return response.data;
};

export const getFileBlob = async(fileId: string): Promise<Blob> => {
  const response = await api.get(`/file/${fileId}`, {
    responseType: "blob",
    allowGuest: true
  });
  return response.data;
};

export const uploadItems = async(
  files: File[],
  paths: string[],
  parentFolderId: string | null
) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file, file.name));
  paths.forEach((path) => formData.append("file_paths", path));

  if (parentFolderId) {
    formData.append("parent_folder_id", parentFolderId);
  }

  return api.post("/bulk/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const deleteItems = async(fileIds: string[], folderIds: string[]) => {
  return api.post("/bulk/delete", {
    file_ids: fileIds,
    folder_ids: folderIds
  });
};

export const deleteSingleItem = async(
  item: FileItem | FolderItem,
  type: "file" | "folder"
) => {
  return api.delete(`/${type}/${item.id}`);
};

export const renameItem = async(
  item: FileItem | FolderItem,
  newName: string
) => {
  const type = "file_name" in item ? "file" : "folder";
  return api.post(`/${type}/edit/${item.id}`, { name: newName });
};

export const createFolder = async(
  name: string,
  parentFolderId: string | null
) => {
  return api.post("/folder", { name, parent_folder_id: parentFolderId });
};

export const downloadItems = async(
  fileIds: string[],
  folderIds: string[]
): Promise<Blob> => {
  const response = await api.post(
    "/bulk/download",
    {
      file_ids: fileIds,
      folder_ids: folderIds
    },
    { responseType: "blob" }
  );
  return response.data;
};
