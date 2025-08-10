import * as Dialog from "@radix-ui/react-dialog";
import React, { useState, useEffect } from "react";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string) => void;
  currentItem: { id: string; name: string } | null;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentItem
}) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (currentItem) {
      setName(currentItem.name);
    }
  }, [currentItem]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name);
      onClose();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-10 bg-black/25 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Content className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
              <Dialog.Title asChild>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Rename Item
                </h3>
              </Dialog.Title>
              <div className="mt-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
              </div>
              <div className="mt-4 space-x-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Save
                </button>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                  >
                    Cancel
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
