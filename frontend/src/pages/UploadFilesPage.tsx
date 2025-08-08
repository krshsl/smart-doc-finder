import React from "react";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";

const UploadFilesPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Upload Files</h1>
      <div className="mt-8 flex h-64 w-full flex-col items-center justify-center rounded-xl border-4 border-dashed border-gray-300 bg-white">
        <CloudArrowUpIcon className="h-16 w-16 text-blue-500" />
        <p className="mt-4 text-lg font-semibold text-gray-700">
          Drag & drop your files here
        </p>
        <p className="text-gray-500">or</p>
        <button className="mt-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300">
          Choose files from your computer
        </button>
      </div>
    </div>
  );
};

export default UploadFilesPage;
