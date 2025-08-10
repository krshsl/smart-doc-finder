export async function getFilesFromEntry(
  entry: any,
  path = "",
): Promise<{ files: File[]; paths: string[] }> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file: File) =>
        resolve({ files: [file], paths: [path + file.name] }),
      );
    });
  }

  if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const entries = await new Promise<any[]>((resolve) =>
      dirReader.readEntries(resolve),
    );
    let allFiles: File[] = [];
    let allPaths: string[] = [];
    for (const subEntry of entries) {
      const result = await getFilesFromEntry(subEntry, path + entry.name + "/");
      allFiles = allFiles.concat(result.files);
      allPaths = allPaths.concat(result.paths);
    }
    return { files: allFiles, paths: allPaths };
  }

  return { files: [], paths: [] };
}
