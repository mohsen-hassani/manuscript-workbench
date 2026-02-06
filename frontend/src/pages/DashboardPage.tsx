import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Card, CardHeader, CardContent } from '@/components/ui';
import { StatCard, ProgressBar, RecentManuscript } from '@/components/dashboard';
import type { Project } from '@/types';

interface Statistics {
  total: number;
  draft: number;
  in_progress: number;
  under_review: number;
  completed: number;
}

export function DashboardPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const projectsData = await api.getProjects();
        setProjects(projectsData);

        if (isAdmin) {
          const stats = await api.getProjectStatistics();
          setStatistics(stats);
        } else {
          // Calculate stats from user's projects
          const stats = {
            total: projectsData.length,
            draft: projectsData.filter(p => p.status === 'draft').length,
            in_progress: projectsData.filter(p => p.status === 'in_progress').length,
            under_review: projectsData.filter(p => p.status === 'under_review').length,
            completed: projectsData.filter(p => p.status === 'completed').length,
          };
          setStatistics(stats);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [isAdmin]);

  // Calculate progress percentages
  const calculateProgress = () => {
    if (!statistics || statistics.total === 0) {
      return { literatureReview: 0, draftWriting: 0, citationChecking: 0, peerReview: 0 };
    }

    // These are mock calculations for demo purposes
    // In a real app, these would come from actual progress tracking
    const completedRatio = statistics.completed / statistics.total;
    const reviewRatio = (statistics.under_review + statistics.completed) / statistics.total;
    const progressRatio = (statistics.in_progress + statistics.under_review + statistics.completed) / statistics.total;

    return {
      literatureReview: Math.round(reviewRatio * 100 * 0.85 + 15),
      draftWriting: Math.round(progressRatio * 100 * 0.62 + 20),
      citationChecking: Math.round(reviewRatio * 100 * 0.78 + 10),
      peerReview: Math.round(completedRatio * 100 * 0.45 + 10),
    };
  };

  const progress = calculateProgress();

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
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back! Here's an overview of your manuscripts.</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Manuscripts"
          value={statistics?.total || 0}
          subtitle="Active projects"
        />
        <StatCard
          title="In Progress"
          value={statistics?.in_progress || 0}
          subtitle="Currently writing"
          color="blue"
        />
        <StatCard
          title="Under Review"
          value={statistics?.under_review || 0}
          subtitle="Awaiting feedback"
          color="purple"
        />
        <StatCard
          title="Completed"
          value={statistics?.completed || 0}
          subtitle="Ready for submission"
          color="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Overall Progress</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProgressBar label="Literature Review" value={progress.literatureReview} color="blue" />
            <ProgressBar label="Draft Writing" value={progress.draftWriting} color="purple" />
            <ProgressBar label="Citation Checking" value={progress.citationChecking} color="pink" />
            <ProgressBar label="Peer Review" value={progress.peerReview} color="green" />
          </CardContent>
        </Card>

        {/* Recent Manuscripts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Manuscripts</h2>
            <Link
              to="/projects"
              className="text-sm text-accent-purple hover:text-accent-purple/80 flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No manuscripts yet.</p>
              </div>
            ) : (
              projects
                .slice(0, 3)
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .map((project) => (
                  <RecentManuscript key={project.id} project={project} />
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
