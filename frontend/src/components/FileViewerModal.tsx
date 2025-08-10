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
        <Dialog.Overlay className="fixed inset-0 z-30 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <div className="fixed inset-0 z-30 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Content className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
              <Dialog.Title asChild>
                <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900">
                  {file?.name}
                </h3>
              </Dialog.Title>
              <Dialog.Description asChild>
                <div className="mt-2 h-[80vh] overflow-y-auto">
                  {file &&
                    fileType &&
                    (fileType === "csv" ? (
                      <CsvViewer url={file.url} />
                    ) : (
                      <FileViewer
                        type="url"
                        url={file.url}
                        onError={(e: any) =>
                          console.error("FileViewer Error:", e)
                        }
                        height="100%"
                        width="100%"
                      />
                    ))}
                </div>
              </Dialog.Description>
              <div className="mt-4">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    Close
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
