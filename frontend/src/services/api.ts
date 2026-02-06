import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthToken,
  Project,
  ProjectMember,
  FileInfo,
  ApiError
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<AuthToken> {
    const response = await this.client.post<AuthToken>('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<User> {
    const response = await this.client.post<User>('/auth/register', data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  // Projects endpoints
  async getProjects(): Promise<Project[]> {
    const response = await this.client.get<Project[]>('/projects');
    return response.data;
  }

  async getProject(id: number): Promise<Project> {
    const response = await this.client.get<Project>(`/projects/${id}`);
    return response.data;
  }

  async createProject(data: { name: string; description?: string }): Promise<Project> {
    const response = await this.client.post<Project>('/projects', data);
    return response.data;
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    const response = await this.client.patch<Project>(`/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: number): Promise<void> {
    await this.client.delete(`/projects/${id}`);
  }

  async getProjectStatistics(): Promise<{
    total: number;
    draft: number;
    in_progress: number;
    under_review: number;
    completed: number;
  }> {
    const response = await this.client.get('/projects/statistics');
    return response.data;
  }

  // Files endpoints
  async getProjectFiles(projectId: number): Promise<{ files: FileInfo[]; total: number }> {
    const response = await this.client.get(`/projects/${projectId}/files`);
    return response.data;
  }

  async uploadFile(projectId: number, file: File): Promise<FileInfo> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post<FileInfo>(
      `/projects/${projectId}/files`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  async getFileContent(projectId: number, fileId: number): Promise<{ filename: string; content: string; content_type: string | null }> {
    const response = await this.client.get(`/projects/${projectId}/files/${fileId}/content`);
    return response.data;
  }

  async downloadFile(projectId: number, fileId: number): Promise<Blob> {
    const response = await this.client.get(`/projects/${projectId}/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async deleteFile(projectId: number, fileId: number): Promise<void> {
    await this.client.delete(`/projects/${projectId}/files/${fileId}`);
  }

  async updateFile(projectId: number, fileId: number, file: File, version: number): Promise<FileInfo> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('version', version.toString());

    const response = await this.client.put<FileInfo>(
      `/projects/${projectId}/files/${fileId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  async createFile(projectId: number, filename: string, content: string = ''): Promise<FileInfo> {
    const response = await this.client.post<FileInfo>(
      `/projects/${projectId}/files/create`,
      { filename, content }
    );
    return response.data;
  }

  async updateProjectSettings(projectId: number, baseFolderPath: string): Promise<Project> {
    const response = await this.client.patch<Project>(
      `/projects/${projectId}`,
      { base_folder_path: baseFolderPath }
    );
    return response.data;
  }

  // Users endpoints (admin only)
  async getUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/users');
    return response.data;
  }

  async getWriters(): Promise<User[]> {
    const response = await this.client.get<User[]>('/users/writers');
    return response.data;
  }

  async getStatisticians(): Promise<User[]> {
    const response = await this.client.get<User[]>('/users/statisticians');
    return response.data;
  }

  // Project members endpoints
  async addProjectMember(projectId: number, data: { user_id: number; role: string }): Promise<void> {
    await this.client.post(`/projects/${projectId}/members`, data);
  }

  async removeProjectMember(projectId: number, memberId: number): Promise<void> {
    await this.client.delete(`/projects/${projectId}/members/${memberId}`);
  }

  async getProjectMembers(projectId: number): Promise<ProjectMember[]> {
    const response = await this.client.get<ProjectMember[]>(`/projects/${projectId}/members`);
    return response.data;
  }

  async getProjectDetail(projectId: number): Promise<{
    project: Project;
    members: ProjectMember[];
  }> {
    const response = await this.client.get(`/projects/${projectId}`);
    return response.data;
  }

  // Get auth token for WebSocket
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}

export const api = new ApiService();
