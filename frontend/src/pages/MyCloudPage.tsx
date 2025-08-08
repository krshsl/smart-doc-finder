import React, { useEffect, useState } from "react";

const MyCloudPage: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      try {
        setTimeout(() => {
          const mockFiles = Array.from({ length: 10 }).map((_, i) => ({
            id: i,
            name: `File ${i + 1}`,
          }));
          setFiles(mockFiles);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">My Cloud</h1>
      <p className="mt-2 text-gray-500">Your files and folders.</p>
      <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {isLoading ? (
          <p>Loading files...</p>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white"
            >
              <span className="text-sm text-gray-400">{file.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyCloudPage;
