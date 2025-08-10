import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import React from "react";

interface MenuItemProps {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
}

interface ContextMenuProps {
  items: MenuItemProps[];
  children: React.ReactNode;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  children
}) => {
  return (
    <ContextMenuPrimitive.Root>
      <ContextMenuPrimitive.Trigger asChild>
        {children}
      </ContextMenuPrimitive.Trigger>
      <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content className="absolute z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {items.map((item, index) => (
            <ContextMenuPrimitive.Item
              key={index}
              onClick={item.onClick}
              className={`group flex w-full items-center px-4 py-2 text-sm text-gray-700 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900 ${item.className || ""}`}
            >
              {item.icon && (
                <div className="mr-3 h-5 w-5 text-gray-400 group-data-[highlighted]:text-gray-500">
                  {item.icon}
                </div>
              )}
              {item.label}
            </ContextMenuPrimitive.Item>
          ))}
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  );
};
