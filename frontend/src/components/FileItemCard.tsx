import { DocumentIcon } from "@heroicons/react/24/solid";
import React from "react";

import { FileItem } from "../types";

interface FileItemCardProps {
  file: FileItem;
  isSelected?: boolean;
  isAiSearch?: boolean;
  onDoubleClick: () => void;
  onSelectionChange?: (checked: boolean) => void;
}

export const FileItemCard: React.FC<FileItemCardProps> = ({
  file,
  isSelected,
  isAiSearch,
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

      <div className="absolute top-0.5 left-0.5">
        {isAiSearch && typeof file.score === "number" && (
          <div className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-2.5 py-1 text-xs font-bold text-white shadow-md">
            {Math.round(file.score * 100)}%
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <DocumentIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
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
