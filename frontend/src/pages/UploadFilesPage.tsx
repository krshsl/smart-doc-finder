import {
  CloudArrowUpIcon,
  DocumentIcon,
  FolderIcon
} from "@heroicons/react/24/outline";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

import { LoadingOverlay } from "../components/LoadingOverlay";
import { Modal } from "../components/Modal";
import * as cloudService from "../services/cloudService";
import { getFilesFromEntry } from "../utils/fileUtils";

const UploadFilesPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadType, setUploadType] = useState<"file" | "folder">("file");
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleUpload = async(files: File[], paths: string[]) => {
    if (files.length === 0) return;
    setIsLoading(true);
    setModalState(null);

    try {
      const response = await cloudService.uploadItems(files, paths, null);
      const { successful_uploads, failed_uploads } = response.data;

      let messageLines = [];
      let modalType: "success" | "error" = "success";

      if (successful_uploads?.length > 0) {
        messageLines.push(
          `${successful_uploads.length} file(s) uploaded successfully.`
        );
      }

      if (failed_uploads?.length > 0) {
        modalType = "error";
        const failedNames = failed_uploads
          .map((f: any) => f.file_name)
          .join(", ");
        messageLines.push(
          `\n${failed_uploads.length} file(s) failed to upload: ${failedNames}.`
        );
      }

      setModalState({
        isOpen: true,
        type: modalType,
        message: messageLines.join(" ") || "No files were processed."
      });
    } catch (error: any) {
      const message =
        error.response?.data?.detail || "An unexpected error occurred.";
      setModalState({ isOpen: true, type: "error", message });
    } finally {
      setIsLoading(false);
    }
  };

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
        handleUpload(allFiles, allPaths);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop
  });

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />
      <Modal
        isOpen={modalState?.isOpen || false}
        onClose={() => setModalState(null)}
        title={
          modalState?.type === "success" ? "Upload Complete" : "Upload Error"
        }
        type={modalState?.type}
      >
        <p className="whitespace-pre-wrap">{modalState?.message}</p>
      </Modal>

      <div className="p-4 sm:p-6">
        <h1 className="text-3xl font-bold text-gray-800">Upload Items</h1>

        <RadioGroupPrimitive.Root
          value={uploadType}
          onValueChange={(v) => setUploadType(v as any)}
          className="mt-6 flex max-w-md space-x-4"
        >
          <RadioGroupPrimitive.Item
            value="file"
            className="flex-1 cursor-pointer items-center justify-center rounded-lg px-5 py-4 text-center shadow-md data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=unchecked]:bg-white data-[state=unchecked]:text-gray-900"
          >
            <DocumentIcon className="mr-3 inline h-6 w-6" /> Upload Files
          </RadioGroupPrimitive.Item>
          <RadioGroupPrimitive.Item
            value="folder"
            className="flex-1 cursor-pointer items-center justify-center rounded-lg px-5 py-4 text-center shadow-md data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=unchecked]:bg-white data-[state=unchecked]:text-gray-900"
          >
            <FolderIcon className="mr-3 inline h-6 w-6" /> Upload Folder
          </RadioGroupPrimitive.Item>
        </RadioGroupPrimitive.Root>

        <div
          {...getRootProps()}
          className={`mt-4 flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-4 border-dashed bg-white transition-colors ${
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
        >
          <input
            {...getInputProps(
              uploadType === "folder"
                ? { directory: "true", webkitdirectory: "true" }
                : { multiple: true }
            )}
          />
          <CloudArrowUpIcon className="h-16 w-16 text-blue-500" />
          <p className="mt-4 text-center text-lg font-semibold text-gray-700">
            {isDragActive
              ? "Drop items here..."
              : `Drag & drop or click to select ${uploadType === "folder" ? "a folder" : "files"}`}
          </p>
        </div>
      </div>
    </>
  );
};

export default UploadFilesPage;
