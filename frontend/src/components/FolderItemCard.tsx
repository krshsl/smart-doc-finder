import { FolderIcon } from "@heroicons/react/24/solid";
import React from "react";

import { FolderItem } from "../types";

interface FolderItemCardProps {
  folder: FolderItem;
  isSelected?: boolean;
  onDoubleClick: () => void;
  onSelectionChange?: (checked: boolean) => void;
}

export const FolderItemCard: React.FC<FolderItemCardProps> = ({
  folder,
  isSelected,
  onDoubleClick,
  onSelectionChange,
}) => {
  const handleCheckboxClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  return (
    <div
      onDoubleClick={onDoubleClick}
      className={`group relative flex h-full cursor-pointer flex-col rounded-lg border bg-[hsl(var(--card))] p-4 text-left transition-shadow duration-200 ease-in-out hover:shadow-md ${
        isSelected
          ? "ring-2 ring-[hsl(var(--primary))] border-[hsl(var(--primary))]"
          : "shadow-sm"
      }`}
    >
      {onSelectionChange && (
        <input
          type="checkbox"
          className="absolute top-3 left-3 h-4 w-4 z-10 rounded border-[hsl(var(--input))] bg-[hsl(var(--card))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
          checked={!!isSelected}
          onChange={(e) => onSelectionChange(e.target.checked)}
          onClick={handleCheckboxClick}
        />
      )}

      <div className="flex items-center gap-3">
        <FolderIcon className="h-8 w-8 text-yellow-500 flex-shrink-0" />
        <div className="truncate">
          <span className="block w-full truncate text-sm font-semibold text-[hsl(var(--foreground))]">
            {folder.name}
          </span>
        </div>
      </div>
    </div>
  );
};
