import React from "react";

interface LoadingOverlayProps {
  isLoading: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading
}) => {
  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white bg-opacity-75 backdrop-blur-sm">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-brand-500 border-t-transparent"></div>
    </div>
  );
};
