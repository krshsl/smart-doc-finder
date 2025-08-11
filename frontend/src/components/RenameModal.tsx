import * as Dialog from "@radix-ui/react-dialog";
import React, { useState, useEffect } from "react";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string) => void;
  currentItem: { id: string; name?: string; file_name?: string } | null;
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
      setName(currentItem.name || currentItem.file_name || "");
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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title asChild>
            <h3 className="text-lg font-semibold leading-6 text-slate-900">
              Rename Item
            </h3>
          </Dialog.Title>
          <div className="mt-4">
            <label htmlFor="itemName" className="sr-only">
              Item name
            </label>
            <input
              type="text"
              id="itemName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Save Changes
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
