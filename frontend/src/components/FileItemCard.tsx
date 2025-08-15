import { DocumentIcon, CheckIcon } from "@heroicons/react/24/solid";
import React from "react";

import { FileItem } from "../types";

interface FileItemCardProps {
  file: FileItem;
  isSelected?: boolean;
  isAiSearch?: boolean;
  hasSelection?: boolean;
  onDoubleClick: () => void;
  onSelectionChange?: (checked: boolean) => void;
}

export const FileItemCard: React.FC<FileItemCardProps> = ({
  file,
  isSelected,
  isAiSearch,
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

      <div className="absolute top-0.5 left-0.5">
        {isAiSearch && typeof file.score === "number" && (
          <div className="rounded-full bg-ai-luminous px-2.5 py-1 text-xs font-bold text-white shadow-md">
            {Math.round(file.score * 100)}%
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <DocumentIcon className="h-8 w-8 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
        <div className="truncate">
          <span className="block w-full truncate text-sm font-semibold text-[hsl(var(--foreground))]">
            {file.file_name}
          </span>
          <span className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            {file.size
              ? new Intl.NumberFormat().format(Math.ceil(file.size / 1024)) +
                " KB"
              : ""}
          </span>
        </div>
      </div>
    </div>
  );
};
