import React, { useCallback } from "react";
import { useDropzone, DropzoneOptions } from "react-dropzone";

import { getFilesFromEntry } from "../utils/fileUtils";

interface FileUploadProps {
  onFilesReady: (files: File[], paths: string[]) => void;
  dropzoneOptions?: DropzoneOptions;
  inputProps?: React.HTMLProps<HTMLInputElement>;
  children: (props: { isDragActive: boolean }) => React.ReactNode;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesReady,
  dropzoneOptions,
  inputProps,
  children,
  className
}) => {
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
        onFilesReady(allFiles, allPaths);
      }
    },
    [onFilesReady]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    ...dropzoneOptions
  });

  return (
    <div {...getRootProps()} className={className}>
      <input {...getInputProps(inputProps)} />
      {children({ isDragActive })}
    </div>
  );
};
