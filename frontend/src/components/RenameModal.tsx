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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-left align-middle shadow-xl transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title asChild>
            <h3 className="text-lg font-semibold leading-6 text-[hsl(var(--foreground))]">
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
              className="block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] py-2 px-3 shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md bg-[hsl(var(--secondary))] px-4 py-2 text-sm font-semibold text-[hsl(var(--secondary-foreground))] shadow-sm ring-1 ring-inset ring-[hsl(var(--input))] hover:bg-[hsl(var(--accent))]"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-sm hover:bg-[hsl(var(--primary))]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--primary))]"
            >
              Save Changes
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
