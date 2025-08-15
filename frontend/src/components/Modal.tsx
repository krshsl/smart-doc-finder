import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import * as Dialog from "@radix-ui/react-dialog";
import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  type?: "success" | "error" | "info";
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  type = "info",
  children
}) => {
  const _title = {
    success: "Success",
    error: "Error",
    info: "Info"
  };

  const config = {
    success: {
      Icon: CheckCircleIcon,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      buttonClass:
        "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 focus-visible:ring-[hsl(var(--ring))]"
    },
    error: {
      Icon: ExclamationTriangleIcon,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      buttonClass:
        "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))]/90 focus-visible:ring-[hsl(var(--destructive))]"
    },
    info: {
      Icon: InformationCircleIcon,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      buttonClass:
        "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 focus-visible:ring-[hsl(var(--ring))]"
    }
  }[type];

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-left align-middle shadow-xl transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="sm:flex sm:items-start">
            <div
              className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${config.bgColor} sm:mx-0 sm:h-10 sm:w-10`}
            >
              <config.Icon
                className={`h-6 w-6 ${config.iconColor}`}
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <Dialog.Title asChild>
                <h3 className="text-lg font-semibold leading-6 text-[hsl(var(--foreground))]">
                  {!!title ? title : _title[type]}
                </h3>
              </Dialog.Title>
              <div className="mt-2">
                <div className="text-sm text-[hsl(var(--muted-foreground))]">
                  {children}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6">
            <Dialog.Close asChild>
              <button
                type="button"
                className={`inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${config.buttonClass}`}
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
