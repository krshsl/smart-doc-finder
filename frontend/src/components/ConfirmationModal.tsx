import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import * as Dialog from "@radix-ui/react-dialog";
import React from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-lg">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[hsl(var(--destructive))]/20 sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationTriangleIcon className="h-6 w-6 text-[hsl(var(--destructive))]" />
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <Dialog.Title asChild>
                <h3 className="text-lg font-semibold leading-6 text-[hsl(var(--card-foreground))]">
                  {title}
                </h3>
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {children}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex w-full justify-center rounded-md bg-[hsl(var(--destructive))] px-4 py-2 text-sm font-semibold text-[hsl(var(--destructive-foreground))] shadow-sm hover:bg-[hsl(var(--destructive))]/90 sm:w-auto"
            >
              Confirm
            </button>
            <Dialog.Close asChild>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-[hsl(var(--secondary))] px-4 py-2 text-sm font-semibold text-[hsl(var(--secondary-foreground))] shadow-sm hover:bg-[hsl(var(--accent))] sm:mt-0 sm:w-auto"
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
