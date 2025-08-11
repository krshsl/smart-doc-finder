import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  FolderArrowDownIcon
} from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import {
  useSearchParams,
  useNavigate,
  useLocation,
  Link
} from "react-router-dom";

import { ContextMenu } from "../components/ContextMenu";
import { FileItemCard } from "../components/FileItemCard";
import { FileViewerModal } from "../components/FileViewerModal";
import { FolderItemCard } from "../components/FolderItemCard";
import { LoadingOverlay } from "../components/LoadingOverlay";
import * as cloudService from "../services/cloudService";
import * as searchService from "../services/searchService";
import { FileItem, FolderItem } from "../types";

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
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
      const fetchResults = async() => {
        setIsLoading(true);
        try {
          const data = await searchService.search(query, isAiSearch);
          setResults(data);
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
  }, [query, isAiSearch]);

  const handleOpenFile = async(item: FileItem) => {
    setIsActionLoading(true);
    try {
      const blob = await cloudService.getFileBlob(item.id);
      const fileURL = URL.createObjectURL(blob);
      setFilePreview({
        url: fileURL,
        type: item.file_type,
        name: item.file_name
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

  const handleDownload = async(
    item: FileItem | FolderItem,
    type: "file" | "folder"
  ) => {
    setIsActionLoading(true);
    try {
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
    } catch (error) {
      console.error("Failed to download item:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const folderMenuItems = (item: FolderItem) => [
    {
      label: "Open",
      onClick: () => handleOpenFolder(item),
      icon: <ArrowTopRightOnSquareIcon className="h-5 w-5" />
    },
    {
      label: "Download",
      onClick: () => handleDownload(item, "folder"),
      icon: <ArrowDownTrayIcon className="h-5 w-5" />
    }
  ];

  const fileMenuItems = (item: FileItem) => [
    {
      label: "Open",
      onClick: () => handleOpenFile(item),
      icon: <ArrowTopRightOnSquareIcon className="h-5 w-5" />
    },
    {
      label: "Download",
      onClick: () => handleDownload(item, "file"),
      icon: <ArrowDownTrayIcon className="h-5 w-5" />
    },
    {
      label: "Go to folder",
      onClick: () => handleGoToFolder(item),
      icon: <FolderArrowDownIcon className="h-5 w-5" />
    }
  ];

  return (
    <div className="p-6 lg:p-8">
      <LoadingOverlay isLoading={isActionLoading || isLoading} />
      <h1 className="text-4xl font-bold text-slate-800">Search Results</h1>
      <p className="mt-2 text-slate-500">
        {isLoading
          ? "Searching..."
          : `Found ${
            results.folders.length + results.files.length
          } results for `}
        <span className="font-semibold text-slate-700">"{query}"</span>
        {isAiSearch && (
          <span className="ml-2 inline-block bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent font-bold">
            (AI-Powered)
          </span>
        )}
      </p>

      <div className="mt-10">
        {isLoading ? (
          <div className="text-center text-slate-500">Loading results...</div>
        ) : results.folders.length === 0 && results.files.length === 0 ? (
          <div className="text-center py-16 px-6 rounded-lg bg-white border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800">
              No results found
            </h3>
            <p className="mt-2 text-slate-500">
              Try searching for something else, or go back to{" "}
              <Link to="/my-cloud" className="text-brand-600 hover:underline">
                your cloud
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {results.folders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-slate-600 mb-4">
                  Folders
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {results.folders.map((folder) => (
                    <ContextMenu
                      key={folder.id}
                      items={folderMenuItems(folder)}
                    >
                      <FolderItemCard
                        folder={folder}
                        onDoubleClick={() => handleOpenFolder(folder)}
                      />
                    </ContextMenu>
                  ))}
                </div>
              </section>
            )}

            {results.files.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-slate-600 mb-4">
                  Files
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {results.files.map((file) => (
                    <ContextMenu key={file.id} items={fileMenuItems(file)}>
                      <FileItemCard
                        file={file}
                        isAiSearch={isAiSearch}
                        onDoubleClick={() => handleOpenFile(file)}
                      />
                    </ContextMenu>
                  ))}
                </div>
              </section>
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
