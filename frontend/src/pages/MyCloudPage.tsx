import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { DocumentIcon, FolderIcon, PlusIcon } from "@heroicons/react/24/solid";
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { ContextMenu } from "../components/ContextMenu";
import { CreateItemModal } from "../components/CreateItemModal";
import { FileViewerModal } from "../components/FileViewerModal";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Modal } from "../components/Modal";
import { RenameModal } from "../components/RenameModal";
import * as cloudService from "../services/cloudService";
import { Breadcrumb, FileItem, FolderData, FolderItem } from "../types";

const buildBreadcrumbs = (currentFolder: FolderData | null): Breadcrumb[] => {
  const crumbs: Breadcrumb[] = [];
  let folder: FolderItem | null = currentFolder;
  while (folder?.parent) {
    crumbs.unshift({ id: folder.id, name: folder.name });
    folder = folder.parent;
  }

  if (crumbs.length > 1) {
    crumbs.shift();
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
  const [selectedItems, setSelectedItems] = useState<{
    files: string[];
    folders: string[];
  }>({ files: [], folders: [] });

  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    item: any;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    item?: any;
    isBulk?: boolean;
    type?: "file" | "folder";
  } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filePreview, setFilePreview] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);
  const [notificationModal, setNotificationModal] = useState<{
    isOpen: boolean;
    message: string;
  } | null>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await cloudService.getFolderContents(folderId || null);
      setFolderData(data);
      setBreadcrumbs(buildBreadcrumbs(data));
    } catch (error) {
      console.error("Failed to fetch folder data:", error);
      setNotificationModal({
        isOpen: true,
        message: "Could not load your files. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchData();
    setSelectedItems({ files: [], folders: [] });
  }, [fetchData]);

  const handleAction = useCallback(
    async (action: () => Promise<any>, successMessage?: string) => {
      setIsActionLoading(true);
      try {
        await action();
        if (successMessage) {
          setNotificationModal({ isOpen: true, message: successMessage });
        }
        fetchData();
      } catch (error: any) {
        console.error("An error occurred:", error);
        const message =
          error.response?.data?.detail || "An unexpected error occurred.";
        setNotificationModal({ isOpen: true, message });
      } finally {
        setIsActionLoading(false);
      }
    },
    [fetchData],
  );

  const handleOpen = (item: FileItem | FolderItem, type: "file" | "folder") => {
    if (type === "folder") {
      navigate(`/my-cloud/${item.id}`);
    } else {
      handleAction(async () => {
        const blob = await cloudService.getFileBlob(item.id);
        const fileURL = URL.createObjectURL(blob);
        setFilePreview({
          url: fileURL,
          type: (item as FileItem).file_type,
          name: (item as FileItem).file_name,
        });
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteModal) return;
    const action = deleteModal.isBulk
      ? () =>
          cloudService.deleteItems(selectedItems.files, selectedItems.folders)
      : () =>
          cloudService.deleteSingleItem(deleteModal.item!, deleteModal.type!);

    handleAction(action, "Item(s) deleted successfully.").then(() => {
      if (deleteModal.isBulk) setSelectedItems({ files: [], folders: [] });
    });
    setDeleteModal(null);
  };

  const handleSaveRename = (newName: string) => {
    if (!renameModal?.item) return;
    handleAction(
      () => cloudService.renameItem(renameModal.item, newName),
      "Item renamed successfully.",
    );
    setRenameModal(null);
  };

  const handleSaveFolder = (name: string) => {
    handleAction(
      () => cloudService.createFolder(name, folderData?.id || null),
      "Folder created successfully.",
    );
  };

  const handleUploadFiles = (files: File[], paths: string[]) => {
    handleAction(async () => {
      const response = await cloudService.uploadItems(
        files,
        paths,
        folderData?.id || null,
      );
      const { successful_uploads, failed_uploads } = response.data;
      let messageLines = [];
      if (successful_uploads?.length > 0)
        messageLines.push(
          `${successful_uploads.length} item(s) uploaded successfully.`,
        );
      if (failed_uploads?.length > 0)
        messageLines.push(`\n${failed_uploads.length} item(s) failed.`);
      setNotificationModal({
        isOpen: true,
        message: messageLines.join(" ") || "Upload complete.",
      });
    });
  };

  const handleDownload = (
    item: FileItem | FolderItem,
    type: "file" | "folder",
  ) => {
    handleAction(async () => {
      let blob;
      let filename;
      if (type === "file") {
        blob = await cloudService.getFileBlob(item.id);
        filename = (item as FileItem).file_name;
      } else {
        blob = await cloudService.downloadItems([], [item.id]);
        filename = `${(item as FolderItem).name}.zip`;
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    });
  };

  const handleBulkDownload = () => {
    handleAction(async () => {
      const blob = await cloudService.downloadItems(
        selectedItems.files,
        selectedItems.folders,
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "download.zip");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    });
  };

  const handleSelectionChange = (
    id: string,
    type: "file" | "folder",
    checked: boolean,
  ) => {
    setSelectedItems((prev) => {
      const newSet = new Set(type === "file" ? prev.files : prev.folders);
      if (checked) newSet.add(id);
      else newSet.delete(id);
      return {
        ...prev,
        [type === "file" ? "files" : "folders"]: Array.from(newSet),
      };
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allFileIds = folderData?.files.map((f) => f.id) || [];
      const allFolderIds = folderData?.sub_folders.map((f) => f.id) || [];
      setSelectedItems({ files: allFileIds, folders: allFolderIds });
    } else {
      setSelectedItems({ files: [], folders: [] });
    }
  };

  const menuItems = (item: FileItem | FolderItem, type: "file" | "folder") => [
    {
      label: "Open",
      onClick: () => handleOpen(item, type),
      icon: <ArrowTopRightOnSquareIcon className="h-5 w-5" />,
    },
    {
      label: "Download",
      onClick: () => handleDownload(item, type),
      icon: <ArrowDownTrayIcon className="h-5 w-5" />,
    },
    {
      label: "Rename",
      onClick: () => setRenameModal({ isOpen: true, item }),
      icon: <PencilIcon className="h-5 w-5" />,
    },
    {
      label: "Delete",
      onClick: () => setDeleteModal({ isOpen: true, item, type }),
      icon: <TrashIcon className="h-5 w-5" />,
      className: "text-red-600",
    },
  ];

  const hasSelection = useMemo(
    () => selectedItems.files.length > 0 || selectedItems.folders.length > 0,
    [selectedItems],
  );

  const totalItems = useMemo(
    () =>
      (folderData?.files.length || 0) + (folderData?.sub_folders.length || 0),
    [folderData],
  );
  const totalSelected = useMemo(
    () => selectedItems.files.length + selectedItems.folders.length,
    [selectedItems],
  );

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.checked =
        totalSelected === totalItems && totalItems > 0;
      selectAllCheckboxRef.current.indeterminate =
        totalSelected > 0 && totalSelected < totalItems;
    }
  }, [totalSelected, totalItems]);

  return (
    <div className="relative h-full p-4 sm:p-6">
      <LoadingOverlay isLoading={isActionLoading || isLoading} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Breadcrumbs crumbs={breadcrumbs} />
          <h1 className="mt-4 text-3xl font-bold text-gray-800">
            {folderData?.parent === null
              ? "Home"
              : folderData?.name || "My Cloud"}
          </h1>
        </div>
        {hasSelection && user?.role !== "guest" && (
          <div className="flex gap-2">
            <button
              onClick={handleBulkDownload}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-md transition hover:bg-blue-700"
            >
              <ArrowDownTrayIcon className="h-5 w-5" /> Download
            </button>
            <button
              onClick={() => setDeleteModal({ isOpen: true, isBulk: true })}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white shadow-md transition hover:bg-red-700"
            >
              <TrashIcon className="h-5 w-5" /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          ref={selectAllCheckboxRef}
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          onChange={(e) => handleSelectAll(e.target.checked)}
          disabled={totalItems === 0}
        />
        <label className="text-sm text-gray-600">Select All</label>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {folderData?.sub_folders.map((folder) => (
          <div key={folder.id} className="relative">
            <ContextMenu items={menuItems(folder, "folder")}>
              <div
                onDoubleClick={() => handleOpen(folder, "folder")}
                className="flex h-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 bg-white p-4 text-center shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
              >
                <FolderIcon className="h-16 w-16 text-blue-500" />
                <span className="mt-2 block w-full truncate text-sm font-medium text-gray-900">
                  {folder.name}
                </span>
              </div>
            </ContextMenu>
            <input
              type="checkbox"
              className="absolute top-2 left-2 h-4 w-4"
              checked={selectedItems.folders.includes(folder.id)}
              onChange={(e) =>
                handleSelectionChange(folder.id, "folder", e.target.checked)
              }
            />
          </div>
        ))}
        {folderData?.files.map((file) => (
          <div key={file.id} className="relative">
            <ContextMenu items={menuItems(file, "file")}>
              <div
                onDoubleClick={() => handleOpen(file, "file")}
                className="flex h-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-transparent bg-white p-4 text-center shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
              >
                <DocumentIcon className="h-16 w-16 text-gray-500" />
                <span className="mt-2 block w-full truncate text-sm font-medium text-gray-900">
                  {file.file_name}
                </span>
              </div>
            </ContextMenu>
            <input
              type="checkbox"
              className="absolute top-2 left-2 h-4 w-4"
              checked={selectedItems.files.includes(file.id)}
              onChange={(e) =>
                handleSelectionChange(file.id, "file", e.target.checked)
              }
            />
          </div>
        ))}
      </div>

      {user?.role !== "guest" && !hasSelection && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
        >
          <PlusIcon className="h-8 w-8" />
        </button>
      )}

      <RenameModal
        isOpen={!!renameModal}
        onClose={() => setRenameModal(null)}
        onSave={handleSaveRename}
        currentItem={renameModal?.item}
      />
      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSaveFolder={handleSaveFolder}
        onUploadFiles={handleUploadFiles}
      />
      <FileViewerModal
        isOpen={!!filePreview}
        onClose={() => setFilePreview(null)}
        file={filePreview}
      />
      <Modal
        isOpen={!!notificationModal}
        onClose={() => setNotificationModal(null)}
        title="Notification"
      >
        <p className="whitespace-pre-wrap">{notificationModal?.message}</p>
      </Modal>
      <ConfirmationModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={confirmDelete}
        title={deleteModal?.isBulk ? "Delete Selected Items" : "Delete"}
      >
        Are you sure you want to delete the selected items? This action cannot
        be undone.
      </ConfirmationModal>
    </div>
  );
};

export default MyCloudPage;
