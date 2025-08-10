import * as Dialog from "@radix-ui/react-dialog";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type?: "success" | "error";
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  type = "success",
  children,
}) => {
  const Icon = type === "success" ? CheckCircleIcon : ExclamationTriangleIcon;
  const iconColor = type === "success" ? "text-green-500" : "text-red-500";
  const buttonClass =
    type === "success"
      ? "bg-blue-100 text-blue-900 hover:bg-blue-200 focus-visible:ring-blue-500"
      : "bg-red-100 text-red-900 hover:bg-red-200 focus-visible:ring-red-500";

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-25 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 flex items-center">
            <Icon className={`h-6 w-6 ${iconColor} mr-2`} />
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-500">
            {children}
          </Dialog.Description>
          <div className="mt-4">
            <Dialog.Close asChild>
              <button
                type="button"
                className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${buttonClass}`}
              >
                Got it, thanks!
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
