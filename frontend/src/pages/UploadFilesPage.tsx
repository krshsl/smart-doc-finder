import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

import { LoadingOverlay } from "../components/LoadingOverlay";
import { Modal } from "../components/Modal";
import api from "../services/api";

const UploadFilesPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleUpload = async(files: File[]) => {
    if (files.length === 0) return;
    setIsLoading(true);
    setModalState(null);

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_name", file.name);

    try {
      await api.post("/file", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setModalState({
        isOpen: true,
        type: "success",
        message: `File "${file.name}" uploaded successfully!`
      });
    } catch (error: any) {
      const message =
        error.response?.data?.detail || "Could not upload the file.";
      setModalState({ isOpen: true, type: "error", message });
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleUpload(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false
  });

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />
      <Modal
        isOpen={modalState?.isOpen || false}
        onClose={() => setModalState(null)}
        title={modalState?.type === "success" ? "Success!" : "Error"}
        type={modalState?.type}
      >
        {modalState?.message}
      </Modal>

      <div>
        <h1 className="text-3xl font-bold text-gray-800">Upload Files</h1>
        <div
          {...getRootProps()}
          className={`mt-8 flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-4 border-dashed bg-white transition-colors ${
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
        >
          <input {...getInputProps()} />
          <CloudArrowUpIcon className="h-16 w-16 text-blue-500" />
          <p className="mt-4 text-lg font-semibold text-gray-700">
            {isDragActive
              ? "Drop the file here ..."
              : "Drag & drop a file here, or click to select"}
          </p>
        </div>
      </div>
    </>
  );
};

export default UploadFilesPage;
