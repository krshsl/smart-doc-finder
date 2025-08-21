import { FileItem, FolderItem, FolderResponse } from "../types";

import api from "./api";

const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB

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

const uploadChunk = (formData: FormData) => {
  return api.post("/upload/chunk", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

const finalizeUpload = (data: object) => {
  return api.post("/upload/finalize", data);
};

export const uploadItems = async(
  files: File[],
  paths: string[],
  parentFolderId: string | null
) => {
  const filesWithPaths = files.map((file, index) => ({
    file,
    path: paths[index]
  }));

  const smallFiles = filesWithPaths.filter((f) => f.file.size < CHUNK_SIZE);
  const largeFiles = filesWithPaths.filter((f) => f.file.size >= CHUNK_SIZE);
  const uploadPromises: Promise<any>[] = [];

  largeFiles.forEach((item) => {
    const file = item.file;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = crypto.randomUUID();
    const chunkPromises: Promise<any>[] = [];
    const fileName = item.path.split("/").pop() || file.name;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const formData = new FormData();
      formData.append("file_chunk", chunk);
      formData.append("upload_id", uploadId);
      formData.append("chunk_index", String(chunkIndex));
      chunkPromises.push(uploadChunk(formData));
    }

    const finalPromise = Promise.all(chunkPromises).then(() =>
      finalizeUpload({
        upload_id: uploadId,
        file_name: fileName,
        total_chunks: totalChunks,
        parent_folder_id: parentFolderId,
        file_path: item.path
      })
    );
    uploadPromises.push(finalPromise);
  });

  if (smallFiles.length > 0) {
    const formData = new FormData();
    smallFiles.forEach((item) => {
      const fileName = item.path.split("/").pop() || item.file.name;
      formData.append("files", item.file, fileName);
      formData.append("file_paths", item.path);
    });
    if (parentFolderId) {
      formData.append("parent_folder_id", parentFolderId);
    }
    uploadPromises.push(
      api.post("/bulk/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
    );
  }

  const results = await Promise.allSettled(uploadPromises);
  const aggregatedResponse = {
    data: { successful_uploads: [] as any[], failed_uploads: [] as any[] }
  };

  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value.data) {
      const data = result.value.data;
      if (data.successful_uploads) {
        aggregatedResponse.data.successful_uploads.push(
          ...data.successful_uploads
        );
      } else {
        aggregatedResponse.data.successful_uploads.push(data);
      }
      if (data.failed_uploads) {
        aggregatedResponse.data.failed_uploads.push(...data.failed_uploads);
      }
    } else if (result.status === "rejected") {
      const errorData = result.reason?.response?.data;
      aggregatedResponse.data.failed_uploads.push({
        file_name: errorData?.detail?.file_name || "Unknown file",
        error: errorData?.detail?.error || "Upload failed"
      });
    }
  });

  return aggregatedResponse;
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
    { file_ids: fileIds, folder_ids: folderIds },
    { responseType: "blob" }
  );
  return response.data;
};
