import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FolderIcon, DocumentIcon } from "@heroicons/react/24/solid";

import api from "../services/api";
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

  useEffect(() => {
    if (query) {
      const fetchResults = async () => {
        setIsLoading(true);
        try {
          const response = await api.get(`/search?q=${query}`);
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

  const handleItemClick = (
    item: FileItem | FolderItem,
    type: "file" | "folder",
  ) => {
    if (type === "folder") {
      navigate(`/my-cloud/${item.id}`);
    } else {
      // Logic to open file preview can be added here later
      console.log("Opening file:", item.id);
    }
  };

  return (
    <div>
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
                    <div
                      key={folder.id}
                      onClick={() => handleItemClick(folder, "folder")}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-transparent bg-white p-4 text-center shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
                    >
                      <FolderIcon className="h-16 w-16 text-blue-500" />
                      <span className="mt-2 block truncate text-sm font-medium text-gray-900">
                        {folder.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.files.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-700">Files</h2>
                <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {results.files.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleItemClick(file, "file")}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-transparent bg-white p-4 text-center shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
                    >
                      <DocumentIcon className="h-16 w-16 text-gray-500" />
                      <span className="mt-2 block truncate text-sm font-medium text-gray-900">
                        {file.file_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
