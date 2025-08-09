import React, { useState, Fragment, useRef } from "react";
import { Dialog, Transition, RadioGroup } from "@headlessui/react";
import { FolderIcon, DocumentIcon } from "@heroicons/react/24/outline";

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveFolder: (name: string) => void;
  onUploadFile: (file: File) => void;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  onSaveFolder,
  onUploadFile,
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<"folder" | "file">("folder");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (type === "folder") {
      if (name.trim()) {
        onSaveFolder(name);
        resetAndClose();
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    onClose();
    setName("");
    setType("folder");
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={resetAndClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Create New
                </Dialog.Title>

                <RadioGroup
                  value={type}
                  onChange={setType}
                  className="mt-4 flex space-x-4"
                >
                  <RadioGroup.Option
                    value="folder"
                    className={({ checked }) =>
                      `${checked ? "bg-blue-600 text-white" : "bg-white text-gray-900"} relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none flex-1`
                    }
                  >
                    <FolderIcon className="h-6 w-6 mr-3" /> Folder
                  </RadioGroup.Option>
                  <RadioGroup.Option
                    value="file"
                    className={({ checked }) =>
                      `${checked ? "bg-blue-600 text-white" : "bg-white text-gray-900"} relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none flex-1`
                    }
                  >
                    <DocumentIcon className="h-6 w-6 mr-3" /> File
                  </RadioGroup.Option>
                </RadioGroup>

                {type === "folder" && (
                  <div className="mt-4">
                    <label
                      htmlFor="itemName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Folder Name
                    </label>
                    <input
                      type="text"
                      id="itemName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="mt-6 space-x-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {type === "folder" ? "Create Folder" : "Upload File"}
                  </button>
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
