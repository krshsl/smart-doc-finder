import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { PlusIcon, FolderIcon } from "@heroicons/react/24/solid";
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { ContextMenu } from "../components/ContextMenu";
import { CreateItemModal } from "../components/CreateItemModal";
import { FileItemCard } from "../components/FileItemCard";
import { FileViewerModal } from "../components/FileViewerModal";
import { FolderItemCard } from "../components/FolderItemCard";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Modal } from "../components/Modal";
import { RenameModal } from "../components/RenameModal";
import * as cloudService from "../services/cloudService";
import { Breadcrumb, FileItem, FolderData, FolderItem } from "../types";

const buildBreadcrumbs = (currentFolder: FolderData | null): Breadcrumb[] => {
  const crumbs: Breadcrumb[] = [];
  let folder: FolderItem | null | undefined = currentFolder;
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
  const [allItems, setAllItems] = useState<{
    files: FileItem[];
    folders: FolderItem[];
  }>({ files: [], folders: [] });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
    type: string;
  } | null>(null);
  const [isFolderOptionsOpen, setIsFolderOptionsOpen] = useState(false);
  const observer = useRef<IntersectionObserver>();
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(event.target as Node)
      ) {
        setIsFolderOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const lastElementRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && page < totalPages) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, page, totalPages]
  );

  const fetchData = useCallback(
    async(pageNum = 1) => {
      setIsLoading(true);
      try {
        const response = await cloudService.getFolderContents(
          folderId || null,
          pageNum
        );
        const { folder_data, total_pages } = response;

        setFolderData(folder_data);
        setBreadcrumbs(buildBreadcrumbs(folder_data));
        setTotalPages(total_pages);

        if (pageNum === 1) {
          setAllItems({
            files: folder_data.files,
            folders: folder_data.sub_folders
          });
        } else {
          setAllItems((prevItems) => ({
            files: [...prevItems.files, ...folder_data.files],
            folders: [...prevItems.folders, ...folder_data.sub_folders]
          }));
        }
      } catch (error) {
        console.error("Failed to fetch folder data:", error);
        setNotificationModal({
          isOpen: true,
          message: "Could not load your files. Please try again later.",
          type: "error"
        });
      } finally {
        setIsLoading(false);
      }
    },
    [folderId]
  );

  useEffect(() => {
    setAllItems({ files: [], folders: [] });
    setPage(1);
    fetchData(1);
  }, [folderId, fetchData]);

  useEffect(() => {
    if (page > 1) {
      fetchData(page);
    }
  }, [page, fetchData]);

  const handleAction = useCallback(
    async(action: () => Promise<any>, successMessage?: string) => {
      setIsActionLoading(true);
      try {
        await action();
        if (successMessage) {
          setNotificationModal({
            isOpen: true,
            message: successMessage,
            type: "success"
          });
        }
        setAllItems({ files: [], folders: [] });
        setPage(1);
        fetchData(1);
      } catch (error: any) {
        console.error("An error occurred:", error);
        const message =
          error.response?.data?.detail ||
          error.message ||
          "An unexpected error occurred.";
        setNotificationModal({ isOpen: true, message, type: "error" });
      } finally {
        setIsActionLoading(false);
      }
    },
    [fetchData]
  );

  const handleOpen = (item: FileItem | FolderItem, type: "file" | "folder") => {
    if (type === "folder") {
      navigate(`/my-cloud/${item.id}`);
    } else {
      handleAction(async() => {
        const blob = await cloudService.getFileBlob(item.id);
        const fileURL = URL.createObjectURL(blob);
        setFilePreview({
          url: fileURL,
          type: (item as FileItem).file_type,
          name: (item as FileItem).file_name
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
      if (!deleteModal.isBulk && deleteModal.type === "folder") {
        navigate(
          `/my-cloud/${folderData?.parent?.id || ""}`.replace(/\/$/, "")
        );
      }
    });
    setDeleteModal(null);
  };

  const handleSaveRename = (newName: string) => {
    if (!renameModal?.item) return;
    handleAction(
      () => cloudService.renameItem(renameModal.item, newName),
      "Item renamed successfully."
    );
    setRenameModal(null);
  };

  const handleSaveFolder = (name: string) => {
    handleAction(
      () => cloudService.createFolder(name, folderData?.id || null),
      "Folder created successfully."
    );
  };

  const handleUploadFiles = (files: File[], paths: string[]) => {
    handleAction(async() => {
      const response = await cloudService.uploadItems(
        files,
        paths,
        folderData?.id || null
      );
      const { successful_uploads, failed_uploads } = response.data;
      let messageLines = [];
      if (successful_uploads?.length > 0)
        messageLines.push(
          `${successful_uploads.length} item(s) uploaded successfully.`
        );
      if (failed_uploads?.length > 0)
        messageLines.push(`\n${failed_uploads.length} item(s) failed.`);
      setNotificationModal({
        isOpen: true,
        message: messageLines.join(" ") || "Upload complete.",
        type: "success"
      });
    });
  };

  const handleDownload = (
    item: FileItem | FolderItem,
    type: "file" | "folder"
  ) => {
    handleAction(async() => {
      let blob, filename;
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
    handleAction(async() => {
      const blob = await cloudService.downloadItems(
        selectedItems.files,
        selectedItems.folders
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
    checked: boolean
  ) => {
    setSelectedItems((prev) => {
      const newSet = new Set(type === "file" ? prev.files : prev.folders);
      if (checked) newSet.add(id);
      else newSet.delete(id);
      return {
        ...prev,
        [type === "file" ? "files" : "folders"]: Array.from(newSet)
      };
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allFileIds = allItems.files.map((f) => f.id) || [];
      const allFolderIds = allItems.folders.map((f) => f.id) || [];
      setSelectedItems({ files: allFileIds, folders: allFolderIds });
    } else {
      setSelectedItems({ files: [], folders: [] });
    }
  };

  const menuItems = (item: FileItem | FolderItem, type: "file" | "folder") => [
    {
      label: "Open",
      onSelect: (e: Event) => {
        e.preventDefault();
        handleOpen(item, type);
      },
      icon: <ArrowTopRightOnSquareIcon className="h-5 w-5" />
    },
    {
      label: "Download",
      onSelect: (e: Event) => {
        e.preventDefault();
        handleDownload(item, type);
      },
      icon: <ArrowDownTrayIcon className="h-5 w-5" />
    },
    {
      label: "Rename",
      onSelect: (e: Event) => {
        e.preventDefault();
        setRenameModal({ isOpen: true, item });
      },
      icon: <PencilIcon className="h-5 w-5" />
    },
    {
      label: "Delete",
      onSelect: (e: Event) => {
        e.preventDefault();
        setDeleteModal({ isOpen: true, item, type });
      },
      icon: <TrashIcon className="h-5 w-5" />,
      className:
        "text-[hsl(var(--destructive))] data-[highlighted]:text-[hsl(var(--destructive-foreground))] data-[highlighted]:bg-[hsl(var(--destructive))]/90"
    }
  ];

  const hasSelection = useMemo(
    () => selectedItems.files.length > 0 || selectedItems.folders.length > 0,
    [selectedItems]
  );
  const totalItems = useMemo(
    () => (allItems.files.length || 0) + (allItems.folders.length || 0),
    [allItems]
  );
  const totalSelected = useMemo(
    () => selectedItems.files.length + selectedItems.folders.length,
    [selectedItems]
  );

  return (
    <div className="relative h-full p-4 sm:p-6 lg:p-8">
      <LoadingOverlay isLoading={isActionLoading} />

      <div className="border-b border-[hsl(var(--border))] pb-4">
        <Breadcrumbs crumbs={breadcrumbs} />
        <div className="flex items-center gap-2 mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            {folderData?.name || "..."}
          </h1>
          {!!folderData?.parent && (
            <div ref={optionsMenuRef} className="relative top-0.5">
              <button
                onClick={() => setIsFolderOptionsOpen((prev) => !prev)}
                className="p-2 rounded-full hover:bg-[hsl(var(--secondary))]"
              >
                <EllipsisVerticalIcon className="h-6 w-6" />
              </button>
              {isFolderOptionsOpen && (
                <div className="absolute left-0 mt-2 w-48 origin-top-left rounded-md bg-[hsl(var(--popover))] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setRenameModal({ isOpen: true, item: folderData });
                        setIsFolderOptionsOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left text-[hsl(var(--popover-foreground))] hover:bg-[hsl(var(--secondary))]"
                    >
                      <PencilIcon className="h-5 w-5" />
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        handleDownload(folderData, "folder");
                        setIsFolderOptionsOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left text-[hsl(var(--popover-foreground))] hover:bg-[hsl(var(--secondary))]"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      Download
                    </button>
                    <button
                      onClick={() => {
                        setDeleteModal({
                          isOpen: true,
                          item: folderData,
                          type: "folder"
                        });
                        setIsFolderOptionsOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive-foreground))]"
                    >
                      <TrashIcon className="h-5 w-5" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        {totalItems === 0 && !isLoading && (
          <div className="text-center py-16 px-6 rounded-lg bg-[hsl(var(--muted))]/50">
            <FolderIcon className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <h3 className="mt-2 text-xl font-semibold text-[hsl(var(--foreground))]">
              Empty Folder
            </h3>
            <p className="mt-1 text-[hsl(var(--muted-foreground))]">
              Upload something or create a new folder to get started.
            </p>
          </div>
        )}
        {allItems.folders.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-[hsl(var(--muted-foreground))] mb-4">
              Folders
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {allItems.folders.map((folder) => (
                <ContextMenu
                  key={folder.id}
                  items={menuItems(folder, "folder")}
                >
                  <FolderItemCard
                    folder={folder}
                    hasSelection={hasSelection}
                    isSelected={selectedItems.folders.includes(folder.id)}
                    onDoubleClick={() => handleOpen(folder, "folder")}
                    onSelectionChange={(checked) =>
                      handleSelectionChange(folder.id, "folder", checked)
                    }
                  />
                </ContextMenu>
              ))}
            </div>
          </section>
        )}

        {allItems.files.length > 0 && (
          <section className={allItems.folders.length > 0 ? "mt-12" : ""}>
            <h2 className="text-base font-semibold text-[hsl(var(--muted-foreground))] mb-4">
              Files
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {allItems.files.map((file, index) => {
                const isLastElement = index === allItems.files.length - 1;
                return (
                  <div
                    key={file.id}
                    ref={isLastElement ? lastElementRef : null}
                  >
                    <ContextMenu items={menuItems(file, "file")}>
                      <FileItemCard
                        file={file}
                        hasSelection={hasSelection}
                        isSelected={selectedItems.files.includes(file.id)}
                        onDoubleClick={() => handleOpen(file, "file")}
                        onSelectionChange={(checked) =>
                          handleSelectionChange(file.id, "file", checked)
                        }
                      />
                    </ContextMenu>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        {isLoading && (
          <div className="text-center py-4">Loading more items...</div>
        )}
      </div>

      {user?.role !== "guest" && !hasSelection && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-xl transition hover:bg-[hsl(var(--primary))]/90 hover:scale-105"
        >
          <PlusIcon className="h-8 w-8" />
          <span className="sr-only">Create new item</span>
        </button>
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-20 p-4 transition-transform duration-300 ease-in-out lg:pl-72 ${
          hasSelection ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 p-3 rounded-xl shadow-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSelectAll(false)}
              className="p-2 rounded-full hover:bg-[hsl(var(--secondary))]"
              title="Deselect All"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold">
              {totalSelected} / {totalItems} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            {totalSelected < totalItems && (
              <button
                onClick={() => handleSelectAll(true)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--secondary))]"
              >
                Select All
              </button>
            )}
            <button
              onClick={handleBulkDownload}
              className="flex items-center gap-2 rounded-md bg-[hsl(var(--secondary))] px-3 py-2 text-sm font-semibold text-[hsl(var(--secondary-foreground))] shadow-sm hover:bg-[hsl(var(--accent))] transition"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span>Download</span>
            </button>
            <button
              onClick={() => setDeleteModal({ isOpen: true, isBulk: true })}
              className="flex items-center gap-2 rounded-md bg-[hsl(var(--destructive))] px-3 py-2 text-sm font-semibold text-[hsl(var(--destructive-foreground))] shadow-sm hover:bg-[hsl(var(--destructive))]/80 transition"
            >
              <TrashIcon className="h-5 w-5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

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
        type={notificationModal?.type}
      >
        <p className="whitespace-pre-wrap">{notificationModal?.message}</p>
      </Modal>
      <ConfirmationModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={confirmDelete}
        title={deleteModal?.isBulk ? "Delete Selected Items" : "Delete Item"}
      >
        Are you sure you want to delete the selected{" "}
        {deleteModal?.isBulk
          ? `${totalSelected} items`
          : `"${deleteModal?.item?.name || deleteModal?.item?.file_name}"`}
        ? This action cannot be undone.
      </ConfirmationModal>
    </div>
  );
};

export default MyCloudPage;
