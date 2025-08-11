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

      <FolderIcon className="h-16 w-16 text-amber-400" />
      <span className="mt-3 block w-full truncate text-sm font-semibold text-slate-800 group-hover:text-brand-600">
        {folder.name}
      </span>
    </div>
  );
};
