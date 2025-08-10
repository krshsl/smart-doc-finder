import {
  Dialog,
  DialogTitle,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import React, { Fragment, useEffect, useState } from "react";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: { url: string; type: string; name: string } | null;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  isOpen,
  onClose,
  file,
}) => {
  const [textContent, setTextContent] = useState("");

  useEffect(() => {
    if (file && (file.type === "text/plain" || file.type === "text/csv")) {
      fetch(file.url)
        .then((response) => response.text())
        .then((text) => setTextContent(text));
    }
  }, [file]);

  const renderContent = () => {
    if (!file) return null;

    if (file.type.startsWith("image/")) {
      return (
        <img
          src={file.url}
          alt={file.name}
          className="max-w-full max-h-[80vh] object-contain"
        />
      );
    }
    if (file.type === "application/pdf") {
      return (
        <iframe src={file.url} className="w-full h-[80vh]" title={file.name} />
      );
    }
    if (file.type === "text/plain" || file.type === "text/csv") {
      return (
        <pre className="w-full h-full bg-gray-100 p-4 overflow-auto text-sm">
          {textContent}
        </pre>
      );
    }
    return <p>Unsupported file type: {file.type}</p>;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </TransitionChild>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  {file?.name}
                </DialogTitle>
                <div className="mt-2">{renderContent()}</div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200"
                  >
                    Close
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
