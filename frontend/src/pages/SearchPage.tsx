import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { FolderIcon, DocumentIcon } from "@heroicons/react/24/solid";
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { ContextMenu } from "../components/ContextMenu";
import { FileViewerModal } from "../components/FileViewerModal";
import { LoadingOverlay } from "../components/LoadingOverlay";
import api from "../services/api";
import * as cloudService from "../services/cloudService";
import { FileItem, FolderItem } from "../types";

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q");

  const [results, setResults] = useState<{
    files: FileItem[];
    folders: FolderItem[];
  }>({ files: [], folders: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [filePreview, setFilePreview] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);
  const isAiSearch = location.pathname.includes("/search/ai");

  useEffect(() => {
    if (query) {
      const fetchResults = async () => {
        setIsLoading(true);
        try {
          const endpoint = isAiSearch ? "/search/ai" : "/search";
          const response = await api.get(`${endpoint}?q=${query}`);
          setResults(response.data);
        } catch (error) {
          console.error("Failed to fetch search results:", error);
          setResults({ files: [], folders: [] });
        } finally {
          setIsLoading(false);
        }
      };
      fetchResults();
    } else {
      setResults({ files: [], folders: [] });
      setIsLoading(false);
    }
  }, [query]);

  const handleOpenFile = async (item: FileItem) => {
    setIsActionLoading(true);
    try {
      const blob = await cloudService.getFileBlob(item.id);
      const fileURL = URL.createObjectURL(blob);
      setFilePreview({
        url: fileURL,
        type: item.file_type,
        name: item.file_name,
      });
    } catch (error) {
      console.error("Failed to fetch file for preview:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenFolder = (item: FolderItem) => {
    navigate(`/my-cloud/${item.id}`);
  };

  const handleGoToFolder = (file: FileItem) => {
    if (file.folder) {
      navigate(`/my-cloud/${file.folder.id}`);
    } else {
      navigate("/my-cloud");
    }
  };

  const handleDownload = async (
    item: FileItem | FolderItem,
    type: "file" | "folder",
  ) => {
    setIsActionLoading(true);
    try {
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
    } catch (error) {
      console.error("Failed to download item:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div>
      <LoadingOverlay isLoading={isActionLoading} />
      <h1 className="text-3xl font-bold text-gray-800">Search Results</h1>
      <p className="mt-2 text-gray-500">
        {isLoading
          ? "Searching..."
          : `Found ${results.folders.length + results.files.length} results for "${query}"`}
      </p>

      <div className="mt-8">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-6">
            {results.folders.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-700">Folders</h2>
                <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {results.folders.map((folder) => (
                    <ContextMenu
                      key={folder.id}
                      items={[
                        {
                          label: "Open",
                          onClick: () => handleOpenFolder(folder),
                          icon: (
                            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                          ),
                        },
                        {
                          label: "Download",
                          onClick: () => handleDownload(folder, "folder"),
                          icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                        },
                      ]}
                    >
                      <div
                        onDoubleClick={() => handleOpenFolder(folder)}
                        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-transparent bg-white p-4 text-center shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
                      >
                        <FolderIcon className="h-16 w-16 text-blue-500" />
                        <span className="mt-2 block truncate text-sm font-medium text-gray-900">
                          {folder.name}
                        </span>
                      </div>
                    </ContextMenu>
                  ))}
                </div>
              </div>
            )}

            {results.files.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-700">Files</h2>
                <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {results.files.map((file) => (
                    <ContextMenu
                      key={file.id}
                      items={[
                        {
                          label: "Open",
                          onClick: () => handleOpenFile(file),
                          icon: (
                            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                          ),
                        },
                        {
                          label: "Download",
                          onClick: () => handleDownload(file, "file"),
                          icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                        },
                        {
                          label: "Go to Folder",
                          onClick: () => handleGoToFolder(file),
                          icon: (
                            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                          ),
                        },
                      ]}
                    >
                      <div
                        onDoubleClick={() => handleOpenFile(file)}
                        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-transparent bg-white p-4 text-center shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
                      >
                        <DocumentIcon className="h-16 w-16 text-gray-500" />
                        <span className="mt-2 block truncate text-sm font-medium text-gray-900">
                          {file.file_name}
                        </span>
                      </div>
                    </ContextMenu>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <FileViewerModal
        isOpen={!!filePreview}
        onClose={() => setFilePreview(null)}
        file={filePreview}
      />
    </div>
  );
};

export default SearchPage;
