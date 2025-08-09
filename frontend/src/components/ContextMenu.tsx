import React, { Fragment } from "react";
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  Transition,
} from "@headlessui/react";
import {
  PencilIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

interface ContextMenuProps {
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  onOpen,
  onRename,
  onDelete,
  children,
}) => {
  return (
    <Menu as="div" className="relative">
      <MenuButton as="div" onContextMenu={(e) => e.preventDefault()}>
        {children}
      </MenuButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <MenuItem>
              {({ focus }) => (
                <button
                  onClick={onOpen}
                  className={`${focus ? "bg-gray-100 text-gray-900" : "text-gray-700"} group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <ArrowTopRightOnSquareIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Open
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  onClick={onRename}
                  className={`${focus ? "bg-gray-100 text-gray-900" : "text-gray-700"} group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <PencilIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Rename
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  onClick={onDelete}
                  className={`${focus ? "bg-red-50 text-red-900" : "text-red-700"} group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <TrashIcon className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" />
                  Delete
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
};
