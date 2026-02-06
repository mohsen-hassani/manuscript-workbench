import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/services/api';
import { WorkspaceLayout } from '@/components/workspace';
import type { Project } from '@/types';

export function WorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProject() {
      if (!projectId) {
        navigate('/projects');
        return;
      }

      try {
        const data = await api.getProject(Number(projectId));
        setProject(data);
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 403) {
          setError('Project not found or access denied');
        } else {
          setError('Failed to load project');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [projectId, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-purple"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-lg">{error || 'Project not found'}</p>
        <Link to="/projects" className="text-accent-purple hover:underline mt-4">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/projects"
          className="p-2 hover:bg-dark-700 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-gray-400">{project.description}</p>
          )}
        </div>
      </div>

      {/* Workspace */}
      <WorkspaceLayout projectId={Number(projectId)} />
    </div>
  );
}
