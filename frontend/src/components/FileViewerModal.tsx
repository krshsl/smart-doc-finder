import FileViewer from "@imparth/react-file-viewer";
import * as Dialog from "@radix-ui/react-dialog";
import React from "react";

import { CsvViewer } from "./CsvViewerModal";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: { url: string; type: string; name: string } | null;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  isOpen,
  onClose,
  file
}) => {
  const fileType = file?.name.split(".").pop()?.toLowerCase();

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[75vw] h-[75vh] -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {" "}
          <header className="flex items-center justify-between flex-shrink-0 pb-4">
            <Dialog.Title className="text-lg font-medium text-[hsl(var(--foreground))]">
              {file?.name}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="sr-only">Close</span>
              </button>
            </Dialog.Close>
          </header>
          <div className="flex-grow mt-2 bg-[hsl(var(--card))] rounded-lg overflow-hidden">
            <div className="h-full w-full overflow-y-auto">
              {file &&
                fileType &&
                (fileType === "csv" ? (
                  <CsvViewer url={file.url} />
                ) : (
                  <FileViewer
                    type="url"
                    url={file.url}
                    onError={(e: any) => console.error("FileViewer Error:", e)}
                    width="100%"
                    height="100%"
                  />
                ))}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
