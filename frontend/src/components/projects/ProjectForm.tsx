import React, { useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui';
import type { Project, ProjectStatus } from '@/types';

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (data: { name: string; description: string; status: ProjectStatus; base_folder_path?: string }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProjectForm({ project, onSubmit, onCancel, isLoading }: ProjectFormProps) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'draft');
  const [baseFolderPath, setBaseFolderPath] = useState(project?.base_folder_path || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setStatus(project.status);
      setBaseFolderPath(project.base_folder_path || '');
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      const submitData: any = { name: name.trim(), description: description.trim(), status };
      if (project && baseFolderPath.trim()) {
        submitData.base_folder_path = baseFolderPath.trim();
      }
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save project');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <Input
        label="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., AI Clinical Decision Support Research"
        required
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-300">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the manuscript project..."
          rows={3}
          className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent"
        />
      </div>

      {project && (
        <>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="under_review">Under Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-300">
              Obsidian Vault Base Directory
            </label>
            <Input
              value={baseFolderPath}
              onChange={(e) => setBaseFolderPath(e.target.value)}
              placeholder="e.g., /Users/john/Documents/ObsidianVault"
            />
            <p className="text-xs text-gray-500 mt-1">
              The local path to your Obsidian vault directory. Required for file creation.
            </p>
          </div>
        </>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {project ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}
