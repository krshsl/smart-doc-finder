import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FolderIcon, DocumentIcon, PlusIcon } from "@heroicons/react/24/solid";

import { ContextMenu } from "../components/ContextMenu";
import { RenameModal } from "../components/RenameModal";
import { CreateItemModal } from "../components/CreateItemModal";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { FileViewerModal } from "../components/FileViewerModal";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Modal } from "../components/Modal";

import { useAuth } from "../auth/AuthContext";
import api from "../services/api";
import { FolderData, Breadcrumb, FolderItem, FileItem } from "../types";

const buildBreadcrumbs = (currentFolder: FolderData | null): Breadcrumb[] => {
  const crumbs: Breadcrumb[] = [];
  let folder: FolderItem | null = currentFolder;

  while (folder?.parent) {
    crumbs.unshift({ id: folder.id, name: folder.name });
    folder = folder.parent;
  }
  return crumbs;
};

const MyCloudPage: React.FC = () => {
  const { folderId } = useParams<{ folderId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [folderData, setFolderData] = useState<FolderData | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    item: any;
    type: "file" | "folder";
  } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filePreview, setFilePreview] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    message: string;
  } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endpoint = folderId ? `/folder/${folderId}` : "/folder";
      const response = await api.get(endpoint);
      setFolderData(response.data);
      setBreadcrumbs(buildBreadcrumbs(response.data));
    } catch (error) {
      console.error("Failed to fetch folder data:", error);
      setErrorModal({
        isOpen: true,
        message: "Could not load your files. Please try again later.",
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [folderId]);

  const handleOpen = async (
    item: FileItem | FolderItem,
    type: "file" | "folder",
  ) => {
    if (type === "folder") {
      navigate(`/my-cloud/${item.id}`);
    } else {
      setIsActionLoading(true);
      try {
        const response = await api.get(`/file/${item.id}`, {
          responseType: "blob",
        });
        const fileURL = URL.createObjectURL(response.data);
        setFilePreview({
          url: fileURL,
          type: item.file_type,
          name: item.file_name,
        });
      } catch (error) {
        console.error("Failed to fetch file for preview:", error);
        setErrorModal({ isOpen: true, message: "Could not open the file." });
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleDelete = async (item: any, type: "file" | "folder") => {
    if (
      window.confirm(
        `Are you sure you want to delete ${type === "file" ? item.file_name : item.name}?`,
      )
    ) {
      try {
        await api.delete(`/${type}/${item.id}`);
        fetchData();
      } catch (error) {
        console.error(`Failed to delete ${type}:`, error);
        setErrorModal({
          isOpen: true,
          message: `Could not delete the ${type}.`,
        });
      }
    }
  };

  const handleRename = (item: any, type: "file" | "folder") => {
    setRenameModal({ isOpen: true, item, type });
  };

  const handleSaveRename = async (newName: string) => {
    if (!renameModal || !renameModal.item) return;
    try {
      await api.post(`/${renameModal.type}/edit/${renameModal.item.id}`, {
        name: newName,
      });
      fetchData();
    } catch (error) {
      console.error(`Failed to rename ${renameModal.type}:`, error);
      setErrorModal({
        isOpen: true,
        message: `Could not rename the ${renameModal.type}.`,
      });
    }
  };

  const handleSaveFolder = async (name: string) => {
    setIsActionLoading(true);
    try {
      const payload = { name, parent_folder_id: folderData?.id || null };
      await api.post(`/folder`, payload);
      fetchData();
    } catch (error: any) {
      console.error(`Failed to create folder:`, error);
      const message =
        error.response?.data?.detail || "Could not create the folder.";
      setErrorModal({ isOpen: true, message });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    setIsActionLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_name", file.name);
    if (folderData?.id) {
      formData.append("folder_id", folderData.id);
    }
    try {
      await api.post("/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchData();
    } catch (error: any) {
      console.error("Failed to upload file:", error);
      const message =
        error.response?.data?.detail || "Could not upload the file.";
      setErrorModal({ isOpen: true, message });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="relative h-full">
      <LoadingOverlay isLoading={isActionLoading} />
      <Breadcrumbs crumbs={breadcrumbs} />
      <h1 className="mt-4 text-3xl font-bold text-gray-800">
        {folderData?.parent === null ? "Home" : folderData?.name || "My Cloud"}
      </h1>
      <p className="mt-2 text-gray-500">Your files and folders.</p>

      <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <>
            {folderData?.sub_folders.map((folder) => (
              <ContextMenu
                key={folder.id}
                onOpen={() => handleOpen(folder, "folder")}
                onRename={() => handleRename(folder, "folder")}
                onDelete={() => handleDelete(folder, "folder")}
              >
                <div
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-transparent bg-white p-4 text-center shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
                  onDoubleClick={() => handleOpen(folder, "folder")}
                >
                  <FolderIcon className="h-16 w-16 text-blue-500" />
                  <span className="mt-2 block truncate text-sm font-medium text-gray-900">
                    {folder.name}
                  </span>
                </div>
              </ContextMenu>
            ))}
            {folderData?.files.map((file) => (
              <ContextMenu
                key={file.id}
                onOpen={() => handleOpen(file, "file")}
                onRename={() => handleRename(file, "file")}
                onDelete={() => handleDelete(file, "file")}
              >
                <div
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-transparent bg-white p-4 text-center shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
                  onDoubleClick={() => handleOpen(file, "file")}
                >
                  <DocumentIcon className="h-16 w-16 text-gray-500" />
                  <span className="mt-2 block truncate text-sm font-medium text-gray-900">
                    {file.file_name}
                  </span>
                </div>
              </ContextMenu>
            ))}
          </>
        )}
      </div>

      {user?.role !== "guest" && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="absolute bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
        >
          <PlusIcon className="h-8 w-8" />
        </button>
      )}

      <RenameModal
        isOpen={renameModal?.isOpen || false}
        onClose={() => setRenameModal(null)}
        onSave={handleSaveRename}
        currentItem={
          renameModal?.item
            ? {
                id: renameModal.item.id,
                name:
                  renameModal.type === "file"
                    ? renameModal.item.file_name
                    : renameModal.item.name,
              }
            : null
        }
      />
      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSaveFolder={handleSaveFolder}
        onUploadFile={handleUploadFile}
      />
      <FileViewerModal
        isOpen={!!filePreview}
        onClose={() => setFilePreview(null)}
        file={filePreview}
      />
      <Modal
        isOpen={errorModal?.isOpen || false}
        onClose={() => setErrorModal(null)}
        title="Error"
        type="error"
      >
        {errorModal?.message}
      </Modal>
    </div>
  );
};

export default MyCloudPage;
