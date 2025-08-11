import {
  CloudArrowUpIcon,
  FolderPlusIcon,
  DocumentPlusIcon
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
  onUploadFiles
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<"folder" | "file">("folder");

  const onDrop = useCallback(
    async(acceptedFiles: File[], fileRejections: any[], event: any) => {
      let allFiles: File[] = [];
      let allPaths: string[] = [];

      if (event.dataTransfer && event.dataTransfer.items) {
        const items = Array.from(
          event.dataTransfer.items as DataTransferItemList
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
          (file) => (file as any).webkitRelativePath || file.name
        );
      }

      if (allFiles.length > 0) {
        onUploadFiles(allFiles, allPaths);
        resetAndClose();
      }
    },
    [onUploadFiles]
  );

  const {
    getRootProps: getFolderRootProps,
    getInputProps: getFolderInputProps,
    isDragActive: isFolderDragActive
  } = useDropzone({ onDrop, noClick: false });
  const {
    getRootProps: getFileRootProps,
    getInputProps: getFileInputProps,
    isDragActive: isFileDragActive
  } = useDropzone({ onDrop, multiple: true });

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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 transform rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title asChild>
            <h3 className="text-xl font-semibold leading-6 text-slate-900">
              Create New
            </h3>
          </Dialog.Title>

          <RadioGroupPrimitive.Root
            value={type}
            onValueChange={(v) => setType(v as any)}
            className="mt-6 grid grid-cols-2 gap-4"
          >
            <RadioGroupPrimitive.Item
              value="folder"
              className="group rounded-lg p-4 text-center cursor-pointer transition ring-1 ring-slate-200 data-[state=checked]:ring-2 data-[state=checked]:ring-brand-500 data-[state=unchecked]:hover:bg-slate-50"
            >
              <FolderPlusIcon className="mx-auto h-8 w-8 text-slate-400 group-data-[state=checked]:text-brand-500 transition" />
              <span className="mt-2 block font-medium text-slate-700 group-data-[state=checked]:text-brand-600">
                New Folder
              </span>
            </RadioGroupPrimitive.Item>
            <RadioGroupPrimitive.Item
              value="file"
              className="group rounded-lg p-4 text-center cursor-pointer transition ring-1 ring-slate-200 data-[state=checked]:ring-2 data-[state=checked]:ring-brand-500 data-[state=unchecked]:hover:bg-slate-50"
            >
              <DocumentPlusIcon className="mx-auto h-8 w-8 text-slate-400 group-data-[state=checked]:text-brand-500 transition" />
              <span className="mt-2 block font-medium text-slate-700 group-data-[state=checked]:text-brand-600">
                Upload
              </span>
            </RadioGroupPrimitive.Item>
          </RadioGroupPrimitive.Root>

          {type === "folder" ? (
            <div className="mt-6">
              <label
                htmlFor="itemName"
                className="block text-sm font-medium text-slate-700"
              >
                New Folder Name
              </label>
              <div className="mt-2 flex gap-3">
                <input
                  type="text"
                  id="itemName"
                  placeholder="e.g. Vacation Photos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div
                {...getFileRootProps({
                  className: `flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${isFileDragActive ? "border-brand-500 bg-brand-50" : "border-slate-300 hover:border-slate-400"}`
                })}
              >
                <input {...getFileInputProps()} />
                <CloudArrowUpIcon className="h-10 w-10 text-brand-500" />
                <p className="mt-2 text-center text-sm font-semibold text-slate-700">
                  {isFileDragActive
                    ? "Drop files here..."
                    : "Drag & drop or click to select files"}
                </p>
              </div>
              <div className="my-2 flex items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="mx-4 flex-shrink text-xs text-slate-400">
                  OR
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
              <div
                {...getFolderRootProps({
                  className: `flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${isFolderDragActive ? "border-brand-500 bg-brand-50" : "border-slate-300 hover:border-slate-400"}`
                })}
              >
                <input
                  {...getFolderInputProps({
                    directory: "true",
                    webkitdirectory: "true"
                  })}
                />
                <CloudArrowUpIcon className="h-10 w-10 text-brand-500" />
                <p className="mt-2 text-center text-sm font-semibold text-slate-700">
                  {isFolderDragActive
                    ? "Drop folder here..."
                    : "Drag & drop or click to upload a folder"}
                </p>
              </div>
            </div>
          )}

          <div className="mt-8">
            <Dialog.Close asChild>
              <button
                type="button"
                className="w-full rounded-md bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                Cancel
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
