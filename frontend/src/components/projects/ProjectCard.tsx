import React from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, Users, FileText, Calendar, Trash2, Edit, FolderOpen } from 'lucide-react';
import { clsx } from 'clsx';
import type { Project, ProjectStatus } from '@/types';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  showActions?: boolean;
}

const statusConfig: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  in_progress: { label: 'In Progress', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  under_review: { label: 'Under Review', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  completed: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-500/20' },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ProjectCard({ project, onEdit, onDelete, showActions = false }: ProjectCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const status = statusConfig[project.status];

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 hover:border-dark-600 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-accent-purple" />
            <h3 className="text-lg font-semibold text-white">{project.name}</h3>
          </div>
          {project.description && (
            <p className="text-gray-400 text-sm mt-2 line-clamp-2">{project.description}</p>
          )}
        </div>

        {showActions && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-dark-700 rounded"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-20 bg-dark-700 border border-dark-600 rounded-lg shadow-lg py-1 min-w-[140px]">
                  <button
                    onClick={() => { onEdit?.(project); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-600 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => { onDelete?.(project); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-dark-600 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
        <span className={clsx('px-2 py-1 rounded text-xs font-medium', status.bgColor, status.color)}>
          {status.label}
        </span>
        <span className="flex items-center gap-1">
          <FileText className="w-4 h-4" />
          {project.word_count.toLocaleString()} words
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatDate(project.updated_at)}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-700">
        <span className="text-xs text-gray-500">
          Created by {project.creator_name}
        </span>
        <Link
          to={`/projects/${project.id}/workspace`}
          className="text-sm text-accent-purple hover:text-accent-purple/80 font-medium"
        >
          Open Workspace →
        </Link>
      </div>
    </div>
  );
}
