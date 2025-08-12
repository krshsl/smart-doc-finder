import { Bars3Icon } from "@heroicons/react/24/outline";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import React from "react";

interface MenuItemProps {
  label: string;
  onSelect: (e: Event) => void;
  icon?: React.ReactNode;
  className?: string;
}

const MenuContent: React.FC<{
  items: MenuItemProps[];
  isDropdown?: boolean;
}> = ({ items, isDropdown }) => (
  <>
    {items.map((item, index) => {
      const ItemComponent = isDropdown
        ? DropdownMenuPrimitive.Item
        : ContextMenuPrimitive.Item;
      return (
        <ItemComponent
          key={index}
          onSelect={item.onSelect}
          className={`group flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-[hsl(var(--accent))] data-[highlighted]:text-[hsl(var(--accent-foreground))] ${
            item.className || ""
          }`}
        >
          {item.icon}
          {item.label}
        </ItemComponent>
      );
    })}
  </>
);

interface ContextMenuProps {
  items: MenuItemProps[];
  children: React.ReactNode;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  children,
}) => {
  return (
    <ContextMenuPrimitive.Root>
      <div className="relative h-full w-full">
        <ContextMenuPrimitive.Trigger className="h-full w-full">
          {children}
        </ContextMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Root>
          <DropdownMenuPrimitive.Trigger asChild>
            <button
              aria-label="Open menu"
              className="absolute top-2 right-2 z-20 rounded-md p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          </DropdownMenuPrimitive.Trigger>
          <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
              sideOffset={5}
              align="end"
              className="z-50 min-w-[12rem] origin-top-right rounded-md border bg-[hsl(var(--popover))] p-1 text-[hsl(var(--popover-foreground))] shadow-md"
            >
              <MenuContent items={items} isDropdown />
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
      </div>

      <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content className="z-50 min-w-[12rem] origin-top-right rounded-md border bg-[hsl(var(--popover))] p-1 text-[hsl(var(--popover-foreground))] shadow-md">
          <MenuContent items={items} />
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  );
};
