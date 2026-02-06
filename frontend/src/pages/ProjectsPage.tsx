import { useEffect, useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { ProjectCard, ProjectForm, ProjectModal, TeamAssignment } from '@/components/projects';
import type { Project, ProjectStatus, ProjectMember } from '@/types';

export function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [teamProject, setTeamProject] = useState<{ project: Project; members: ProjectMember[] } | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = async (data: { name: string; description: string; status: ProjectStatus }) => {
    setIsSubmitting(true);
    try {
      await api.createProject(data);
      await fetchProjects();
      setShowCreateModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProject = async (data: { name: string; description: string; status: ProjectStatus; base_folder_path?: string }) => {
    if (!editingProject) return;
    setIsSubmitting(true);
    try {
      await api.updateProject(editingProject.id, data);
      await fetchProjects();
      setEditingProject(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProject) return;
    setIsSubmitting(true);
    try {
      await api.deleteProject(deleteProject.id);
      await fetchProjects();
      setDeleteProject(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTeamModal = async (project: Project) => {
    try {
      const members = await api.getProjectMembers(project.id);
      setTeamProject({ project, members });
    } catch (error) {
      console.error('Failed to fetch project members:', error);
    }
  };

  const refreshTeamMembers = async () => {
    if (!teamProject) return;
    try {
      const members = await api.getProjectMembers(teamProject.project.id);
      setTeamProject({ ...teamProject, members });
    } catch (error) {
      console.error('Failed to refresh members:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-purple"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 mt-1">
            {isAdmin ? 'Manage all manuscript projects' : 'Your assigned projects'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
            className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
            <option value="under_review">Under Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">
              {searchQuery || statusFilter !== 'all'
                ? 'No projects match your filters.'
                : 'No projects yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              showActions={isAdmin}
              onEdit={(p) => setEditingProject(p)}
              onDelete={(p) => setDeleteProject(p)}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <ProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
      >
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isSubmitting}
        />
      </ProjectModal>

      {/* Edit Project Modal */}
      <ProjectModal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        title="Edit Project"
      >
        {editingProject && (
          <div className="space-y-6">
            <ProjectForm
              project={editingProject}
              onSubmit={handleUpdateProject}
              onCancel={() => setEditingProject(null)}
              isLoading={isSubmitting}
            />
            <div className="border-t border-dark-700 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingProject(null);
                  openTeamModal(editingProject);
                }}
                className="w-full"
              >
                Manage Team Members
              </Button>
            </div>
          </div>
        )}
      </ProjectModal>

      {/* Team Assignment Modal */}
      <ProjectModal
        isOpen={!!teamProject}
        onClose={() => setTeamProject(null)}
        title={`Team: ${teamProject?.project.name}`}
      >
        {teamProject && (
          <TeamAssignment
            projectId={teamProject.project.id}
            members={teamProject.members}
            onMemberAdded={refreshTeamMembers}
            onMemberRemoved={refreshTeamMembers}
          />
        )}
      </ProjectModal>

      {/* Delete Confirmation Modal */}
      <ProjectModal
        isOpen={!!deleteProject}
        onClose={() => setDeleteProject(null)}
        title="Delete Project"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete <strong className="text-white">{deleteProject?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteProject(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteProject} isLoading={isSubmitting}>
              Delete Project
            </Button>
          </div>
        </div>
      </ProjectModal>
    </div>
  );
}
