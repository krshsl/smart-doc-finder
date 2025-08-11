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
  onSelectionChange
}) => {
  const handleCheckboxClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent card selection from firing
  };

  return (
    <div
      onDoubleClick={onDoubleClick}
      className={`group relative flex h-full cursor-pointer flex-col items-center justify-center rounded-xl p-4 text-center transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl ${
        isSelected
          ? "bg-brand-50 shadow-lg ring-2 ring-brand-500"
          : "bg-white shadow-md shadow-slate-200/50 border border-slate-200 hover:border-brand-300"
      }`}
    >
      {onSelectionChange && (
        <input
          type="checkbox"
          className="absolute top-3 left-3 h-4 w-4 z-10 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          checked={isSelected}
          onChange={(e) => onSelectionChange(e.target.checked)}
          onClick={handleCheckboxClick}
        />
      )}

      {isAiSearch && typeof file.score === "number" && (
        <div className="absolute top-2 right-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-2.5 py-1 text-xs font-bold text-white shadow-md">
          {Math.round(file.score * 100)}%
        </div>
      )}

      <DocumentIcon className="h-16 w-16 text-sky-500" />
      <span className="mt-3 block w-full truncate text-sm font-semibold text-slate-800 group-hover:text-brand-600">
        {file.file_name}
      </span>
      <span className="text-xs text-slate-400 mt-1">
        {file.size
          ? new Intl.NumberFormat().format(Math.ceil(file.size / 1024)) + " KB"
          : ""}
      </span>
    </div>
  );
};
