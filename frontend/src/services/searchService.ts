import { FileItem, FolderItem } from "../types";

import api from "./api";

interface SearchResults {
  files: FileItem[];
  folders: FolderItem[];
}

export const search = async(
  query: string,
  isAi: boolean
): Promise<SearchResults> => {
  const endpoint = isAi ? "/search/ai" : "/search";
  const response = await api.get(`${endpoint}?q=${query}`, {
    allowGuest: true
  });
  return response.data;
};
