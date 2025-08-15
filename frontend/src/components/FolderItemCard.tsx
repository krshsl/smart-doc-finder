import { FolderIcon, CheckIcon } from "@heroicons/react/24/solid";
import React from "react";

import { FolderItem } from "../types";

interface FolderItemCardProps {
  folder: FolderItem;
  isSelected?: boolean;
  hasSelection?: boolean;
  onDoubleClick: () => void;
  onSelectionChange?: (checked: boolean) => void;
}

export const FolderItemCard: React.FC<FolderItemCardProps> = ({
  folder,
  isSelected,
  hasSelection,
  onDoubleClick,
  onSelectionChange
}) => {
  const handleSelectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange?.(!isSelected);
  };

  const handleCardClick = () => {
    if (hasSelection) {
      onSelectionChange?.(!isSelected);
    } else {
      onDoubleClick();
    }
  };

  return (
    <div
      onDoubleClick={onDoubleClick}
      onClick={handleCardClick}
      className={`group relative flex h-full cursor-pointer flex-col rounded-lg border bg-[hsl(var(--card))] p-4 text-left transition-shadow duration-200 ease-in-out hover:shadow-md ${
        isSelected
          ? "ring-2 ring-[hsl(var(--primary))] border-[hsl(var(--primary))]"
          : "shadow-sm"
      }`}
    >
      {onSelectionChange && (
        <button
          onClick={handleSelectionClick}
          className={`absolute top-3 left-3 h-5 w-5 z-10 rounded-full flex items-center justify-center border transition-all duration-200 ${
            isSelected || hasSelection
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          } ${
            isSelected
              ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))]"
              : "bg-[hsl(var(--card))] border-[hsl(var(--muted-foreground))] group-hover:border-[hsl(var(--primary))]"
          }`}
        >
          {isSelected && (
            <CheckIcon className="h-3.5 w-3.5 text-[hsl(var(--primary-foreground))]" />
          )}
        </button>
      )}

      <div className="flex items-center gap-3">
        <FolderIcon className="h-8 w-8 text-[hsl(var(--primary))] flex-shrink-0" />
        <div className="truncate">
          <span className="block w-full truncate text-sm font-semibold text-[hsl(var(--foreground))]">
            {folder.name}
          </span>
        </div>
      </div>
    </div>
  );
};
