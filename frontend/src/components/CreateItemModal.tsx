import {
  CloudArrowUpIcon,
  DocumentIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import * as Dialog from "@radix-ui/react-dialog";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

import { getFilesFromEntry } from "../utils/fileUtils";

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveFolder: (name: string) => void;
  onUploadFiles: (files: File[], paths: string[]) => void;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  onSaveFolder,
  onUploadFiles,
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<"folder" | "file">("folder");

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: any[], event: any) => {
      let allFiles: File[] = [];
      let allPaths: string[] = [];

      // This logic handles both drag-and-drop of files/folders and click-to-select
      if (event.dataTransfer && event.dataTransfer.items) {
        const items = Array.from(
          event.dataTransfer.items as DataTransferItemList,
        );
        for (const item of items) {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            const result = await getFilesFromEntry(entry);
            allFiles = allFiles.concat(result.files);
            allPaths = allPaths.concat(result.paths);
          }
        }
      }

      if (allFiles.length === 0 && acceptedFiles.length > 0) {
        allFiles = acceptedFiles;
        allPaths = acceptedFiles.map(
          (file) => (file as any).webkitRelativePath || file.name,
        );
      }

      if (allFiles.length > 0) {
        onUploadFiles(allFiles, allPaths);
        resetAndClose();
      }
    },
    [onUploadFiles],
  );

  // Dropzone for the "Folder" tab - configured to accept directories
  const {
    getRootProps: getFolderRootProps,
    getInputProps: getFolderInputProps,
    isDragActive: isFolderDragActive,
  } = useDropzone({
    onDrop,
    noClick: false, // Allow click to open folder selector
  });

  // Dropzone for the "File" tab - configured for files only
  const {
    getRootProps: getFileRootProps,
    getInputProps: getFileInputProps,
    isDragActive: isFileDragActive,
  } = useDropzone({
    onDrop,
    multiple: true,
  });

  const handleSave = () => {
    if (type === "folder" && name.trim()) {
      onSaveFolder(name);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setName("");
      setType("folder");
    }, 300);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={resetAndClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-10 bg-black/25 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Content className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
              <Dialog.Title asChild>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Create New
                </h3>
              </Dialog.Title>

              <RadioGroupPrimitive.Root
                value={type}
                onValueChange={(v) => setType(v as any)}
                className="mt-4 flex space-x-4"
              >
                <RadioGroupPrimitive.Item
                  value="folder"
                  className="flex-1 cursor-pointer items-center justify-center rounded-lg px-5 py-4 text-center shadow-md data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=unchecked]:bg-white data-[state=unchecked]:text-gray-900"
                >
                  <FolderIcon className="mr-3 inline h-6 w-6" /> Folder
                </RadioGroupPrimitive.Item>
                <RadioGroupPrimitive.Item
                  value="file"
                  className="flex-1 cursor-pointer items-center justify-center rounded-lg px-5 py-4 text-center shadow-md data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=unchecked]:bg-white data-[state=unchecked]:text-gray-900"
                >
                  <DocumentIcon className="mr-3 inline h-6 w-6" /> File Upload
                </RadioGroupPrimitive.Item>
              </RadioGroupPrimitive.Root>

              {type === "folder" ? (
                <div className="mt-4">
                  <div>
                    <label
                      htmlFor="itemName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      New Folder Name
                    </label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        id="itemName"
                        placeholder="Folder Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-grow rounded-md pl-4  border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-opacity-50"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                  <div className="my-4 flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="mx-4 flex-shrink text-xs text-gray-500">
                      OR
                    </span>
                    <div className="flex-grow border-t border-gray-300"></div>
                  </div>
                  <div
                    {...getFolderRootProps({
                      className: `flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                        isFolderDragActive
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300"
                      }`,
                    })}
                  >
                    <input
                      {...getFolderInputProps({
                        directory: "true",
                        webkitdirectory: "true",
                      })}
                    />
                    <CloudArrowUpIcon className="h-8 w-8 text-blue-500" />
                    <p className="mt-2 text-center text-sm font-semibold text-gray-700">
                      {isFolderDragActive
                        ? "Drop folder here..."
                        : "Drag & drop or click to upload a folder"}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  {...getFileRootProps({
                    className: `mt-4 flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                      isFileDragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`,
                  })}
                >
                  <input {...getFileInputProps()} />
                  <CloudArrowUpIcon className="h-10 w-10 text-blue-500" />
                  <p className="mt-2 text-center text-sm font-semibold text-gray-700">
                    {isFileDragActive
                      ? "Drop files here..."
                      : "Drag & drop or click to select files"}
                  </p>
                </div>
              )}

              <div className="mt-6">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </div>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
