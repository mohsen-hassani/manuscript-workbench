import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar } from 'lucide-react';
import type { Project, ProjectStatus } from '@/types';

interface RecentManuscriptProps {
  project: Project;
}

const statusConfig: Record<ProjectStatus, { label: string; color: string }> = {
  draft: { label: 'DRAFT', color: 'bg-blue-500/20 text-blue-400' },
  in_progress: { label: 'IN PROGRESS', color: 'bg-yellow-500/20 text-yellow-400' },
  under_review: { label: 'REVIEW', color: 'bg-purple-500/20 text-purple-400' },
  completed: { label: 'COMPLETE', color: 'bg-green-500/20 text-green-400' },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `Updated ${diffHours} hours ago`;
  if (diffDays === 1) return 'Updated 1 day ago';
  if (diffDays < 7) return `Updated ${diffDays} days ago`;
  if (diffDays < 14) return 'Updated 1 week ago';
  return `Updated ${Math.floor(diffDays / 7)} weeks ago`;
}

function formatWordCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k words`;
  }
  return `${count} words`;
}

export function RecentManuscript({ project }: RecentManuscriptProps) {
  const status = statusConfig[project.status];

  return (
    <Link
      to={`/projects/${project.id}/workspace`}
      className="block p-4 border-l-2 border-accent-purple bg-dark-800/50 hover:bg-dark-800 rounded-r-lg transition-colors"
    >
      <h3 className="text-white font-medium">{project.name}</h3>
      <div className="flex items-center gap-4 mt-2 text-sm">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
          {status.label}
        </span>
        <span className="flex items-center gap-1 text-gray-500">
          <Calendar className="w-3 h-3" />
          {formatTimeAgo(project.updated_at)}
        </span>
        <span className="flex items-center gap-1 text-gray-500">
          <FileText className="w-3 h-3" />
          {formatWordCount(project.word_count)}
        </span>
      </div>
    </Link>
  );
}
