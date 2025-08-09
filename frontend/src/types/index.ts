export type UserRole = "user" | "admin" | "guest";

export interface User {
  id?: string;
  name: string;
  email: string;
  role?: UserRole;
}

export interface FileItem {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

export interface FolderItem {
  id: string;
  name: string;
  folder_size: number;
  parent: FolderItem | null;
}

export interface Breadcrumb {
  id: string;
  name: string;
}

export interface FolderData extends FolderItem {
  files: FileItem[];
  sub_folders: FolderItem[];
  breadcrumbs: Breadcrumb[];
}
