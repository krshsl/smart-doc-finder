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
        <ContextMenuPrimitive.Content className="z-20 w-56 min-w-[8rem] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {items.map((item, index) => (
            <ContextMenuPrimitive.Item
              key={index}
              onClick={item.onClick}
              className={`group flex relative w-full cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-slate-100 data-[disabled]:opacity-50 ${item.className || "text-slate-700"}`}
            >
              {item.icon && (
                <div className="mr-3 h-5 w-5 opacity-70 group-data-[highlighted]:opacity-100">
                  {item.icon}
                </div>
              )}
              <span>{item.label}</span>
            </ContextMenuPrimitive.Item>
          ))}
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  );
};
