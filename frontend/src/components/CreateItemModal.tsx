import {
  CloudArrowUpIcon,
  FolderPlusIcon,
  DocumentPlusIcon
} from "@heroicons/react/24/outline";
import * as Dialog from "@radix-ui/react-dialog";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import React, { useState } from "react";

import { FileUpload } from "./FileUpload";

export const CreateItemModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSaveFolder: (name: string) => void;
  onUploadFiles: (files: File[], paths: string[]) => void;
}> = ({ isOpen, onClose, onSaveFolder, onUploadFiles }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<"folder" | "file">("folder");

  const handleFilesReady = (files: File[], paths: string[]) => {
    onUploadFiles(files, paths);
    resetAndClose();
  };

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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-lg">
          <Dialog.Title asChild>
            <h3 className="text-xl font-semibold leading-6 text-[hsl(var(--foreground))]">
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
              className="group rounded-lg p-4 text-center cursor-pointer transition ring-1 ring-[hsl(var(--border))] data-[state=checked]:ring-2 data-[state=checked]:ring-[hsl(var(--primary))] data-[state=unchecked]:hover:bg-[hsl(var(--accent))]"
            >
              <FolderPlusIcon className="mx-auto h-8 w-8 text-[hsl(var(--muted-foreground))] group-data-[state=checked]:text-[hsl(var(--primary))] transition" />
              <span className="mt-2 block font-medium text-[hsl(var(--foreground))] group-data-[state=checked]:text-[hsl(var(--primary))]">
                New Folder
              </span>
            </RadioGroupPrimitive.Item>
            <RadioGroupPrimitive.Item
              value="file"
              className="group rounded-lg p-4 text-center cursor-pointer transition ring-1 ring-[hsl(var(--border))] data-[state=checked]:ring-2 data-[state=checked]:ring-[hsl(var(--primary))] data-[state=unchecked]:hover:bg-[hsl(var(--accent))]"
            >
              <DocumentPlusIcon className="mx-auto h-8 w-8 text-[hsl(var(--muted-foreground))] group-data-[state=checked]:text-[hsl(var(--primary))] transition" />
              <span className="mt-2 block font-medium text-[hsl(var(--foreground))] group-data-[state=checked]:text-[hsl(var(--primary))]">
                Upload
              </span>
            </RadioGroupPrimitive.Item>
          </RadioGroupPrimitive.Root>

          {type === "folder" ? (
            <div className="mt-6">
              <label
                htmlFor="itemName"
                className="block text-sm font-medium text-[hsl(var(--foreground))]"
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
                  className="block p-2 w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))] sm:text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="rounded-md border border-transparent bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <FileUpload
                onFilesReady={handleFilesReady}
                dropzoneOptions={{ multiple: true }}
                className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors hover:border-[hsl(var(--muted-foreground))]"
              >
                {({ isDragActive }) => (
                  <>
                    <CloudArrowUpIcon className="h-10 w-10 text-[hsl(var(--primary))]" />
                    <p className="mt-2 text-center text-sm font-semibold text-[hsl(var(--foreground))]">
                      {isDragActive
                        ? "Drop files here..."
                        : "Drag & drop or click to select files"}
                    </p>
                  </>
                )}
              </FileUpload>
              <div className="my-2 flex items-center">
                <div className="flex-grow border-t border-[hsl(var(--border))]"></div>
                <span className="mx-4 flex-shrink text-xs text-[hsl(var(--muted-foreground))]">
                  OR
                </span>
                <div className="flex-grow border-t border-[hsl(var(--border))]"></div>
              </div>
              <FileUpload
                onFilesReady={handleFilesReady}
                inputProps={{ directory: "true", webkitdirectory: "true" }}
                className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors hover:border-[hsl(var(--muted-foreground))]"
              >
                {({ isDragActive }) => (
                  <>
                    <CloudArrowUpIcon className="h-10 w-10 text-[hsl(var(--primary))]" />
                    <p className="mt-2 text-center text-sm font-semibold text-[hsl(var(--foreground))]">
                      {isDragActive
                        ? "Drop folder here..."
                        : "Drag & drop or click to upload a folder"}
                    </p>
                  </>
                )}
              </FileUpload>
            </div>
          )}

          <div className="mt-8">
            <Dialog.Close asChild>
              <button
                type="button"
                className="w-full rounded-md bg-[hsl(var(--secondary))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--accent))]"
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
