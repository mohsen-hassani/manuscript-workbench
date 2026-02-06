export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: 'admin' | 'writer' | 'statistician';
  permissions: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  word_count: number;
  created_by: number;
  creator_name: string;
  base_folder_path?: string;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'draft' | 'in_progress' | 'under_review' | 'completed';

export interface ProjectMember {
  id: number;
  user_id: number;
  role: 'writer' | 'statistician';
  user_email: string;
  user_full_name: string;
  created_at: string;
}

export interface FileInfo {
  id: number;
  project_id: number;
  filename: string;
  original_filename: string;
  storage_path: string;
  content_type: string | null;
  size: number;
  uploaded_by: number;
  uploader_name: string;
  version: number;
  created_at: string;
  updated_at: string;
  download_url: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ApiError {
  detail: string;
}

export type PermissionStatus = 'granted' | 'prompt' | 'denied' | 'unsupported';

// File System Access API types for TypeScript compatibility
declare global {
  interface Window {
    showDirectoryPicker(options?: {
      mode?: 'read' | 'readwrite';
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }): Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemDirectoryHandle {
    queryPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
    requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
  }
}
