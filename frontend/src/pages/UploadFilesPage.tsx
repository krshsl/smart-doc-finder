import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import React, { useState } from "react";

import { FileUpload } from "../components/FileUpload";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Modal } from "../components/Modal";
import * as cloudService from "../services/cloudService";

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
          `${successful_uploads.length} item(s) uploaded successfully.`
        );
      }

      if (failed_uploads?.length > 0) {
        modalType =
          failed_uploads.length === files.length ? "error" : "success";
        const failedNames = failed_uploads
          .map((f: any) => f.file_name)
          .join(", ");
        messageLines.push(
          `\n${failed_uploads.length} item(s) failed to upload: ${failedNames}.`
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

  const getInputPropsConfig = () =>
    uploadType === "folder"
      ? { directory: "true", webkitdirectory: "true" }
      : {};

  const getDropzoneOptions = () =>
    uploadType === "file" ? { multiple: true } : {};

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

      <div className="p-6 lg:p-8">
        <h1 className="text-4xl font-bold text-[hsl(var(--foreground))]">
          Upload to Cloud
        </h1>
        <p className="mt-2 text-base text-[hsl(var(--muted-foreground))]">
          Add new files and folders to your cloud storage.
        </p>

        <div className="mt-8 max-w-4xl mx-auto">
          <FileUpload
            onFilesReady={handleUpload}
            inputProps={getInputPropsConfig()}
            dropzoneOptions={getDropzoneOptions()}
          >
            {({ isDragActive }) => (
              <div
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-[hsl(var(--card))] p-12 text-center transition-all duration-300 ease-in-out cursor-pointer
                  ${
              isDragActive
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 scale-105 shadow-2xl shadow-[hsl(var(--primary))]/20"
                : "border-[hsl(var(--input))] hover:border-[hsl(var(--primary))]/50 hover:bg-[hsl(var(--primary))]/20"
              }`}
              >
                <div className="absolute top-6 right-6">
                  <RadioGroupPrimitive.Root
                    value={uploadType}
                    onValueChange={(v) => setUploadType(v as any)}
                    className="flex rounded-full bg-[hsl(var(--secondary))] p-1 border border-[hsl(var(--border))]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <RadioGroupPrimitive.Item
                      value="file"
                      className="group rounded-full px-4 py-1.5 text-sm font-medium cursor-pointer transition-colors data-[state=checked]:bg-[hsl(var(--primary))] data-[state=checked]:text-[hsl(var(--primary-foreground))] data-[state=unchecked]:text-[hsl(var(--muted-foreground))] data-[state=unchecked]:hover:bg-[hsl(var(--card))]"
                    >
                      Files
                    </RadioGroupPrimitive.Item>
                    <RadioGroupPrimitive.Item
                      value="folder"
                      className="group rounded-full px-4 py-1.5 text-sm font-medium cursor-pointer transition-colors data-[state=checked]:bg-[hsl(var(--primary))] data-[state=checked]:text-[hsl(var(--primary-foreground))] data-[state=unchecked]:text-[hsl(var(--muted-foreground))] data-[state=unchecked]:hover:bg-[hsl(var(--card))]"
                    >
                      Folder
                    </RadioGroupPrimitive.Item>
                  </RadioGroupPrimitive.Root>
                </div>

                <CloudArrowUpIcon className="h-20 w-20 text-[hsl(var(--primary))] transition-transform duration-300 group-hover:scale-110" />
                <h3 className="mt-4 text-2xl font-bold text-[hsl(var(--foreground))]">
                  {isDragActive
                    ? "Drop to upload"
                    : `Select a ${uploadType} to upload`}
                </h3>
                <p className="mt-2 text-[hsl(var(--muted-foreground))]">
                  or drag and drop it here
                </p>
              </div>
            )}
          </FileUpload>
        </div>
      </div>
    </>
  );
};

export default UploadFilesPage;
