import React from "react";

export const LoadingOverlay: React.FC<{ isLoading: boolean }> = ({
  isLoading,
}) => {
  if (!isLoading) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[hsl(var(--background))]/80 backdrop-blur-sm">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-[hsl(var(--primary))] border-t-transparent"></div>
    </div>
  );
};
