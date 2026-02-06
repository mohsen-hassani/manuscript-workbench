import React, { useState, useEffect } from 'react';
import { UserPlus, X, User } from 'lucide-react';
import { Button } from '@/components/ui';
import { api } from '@/services/api';
import type { User as UserType, ProjectMember } from '@/types';

interface TeamAssignmentProps {
  projectId: number;
  members: ProjectMember[];
  onMemberAdded: () => void;
  onMemberRemoved: () => void;
}

export function TeamAssignment({ projectId, members, onMemberAdded, onMemberRemoved }: TeamAssignmentProps) {
  const [writers, setWriters] = useState<UserType[]>([]);
  const [statisticians, setStatisticians] = useState<UserType[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<'writer' | 'statistician'>('writer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const [writersData, statisticiansData] = await Promise.all([
          api.getWriters(),
          api.getStatisticians(),
        ]);
        setWriters(writersData);
        setStatisticians(statisticiansData);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    }
    fetchUsers();
  }, []);

  const availableUsers = selectedRole === 'writer' ? writers : statisticians;
  const alreadyAssignedIds = members.map(m => m.user_id);
  const filteredUsers = availableUsers.filter(u => !alreadyAssignedIds.includes(u.id));

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    setIsLoading(true);
    setError('');

    try {
      await api.addProjectMember(projectId, {
        user_id: Number(selectedUserId),
        role: selectedRole,
      });
      setSelectedUserId('');
      onMemberAdded();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add team member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    setIsLoading(true);
    try {
      await api.removeProjectMember(projectId, memberId);
      onMemberRemoved();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove team member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Team Members</h3>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Current members */}
      <div className="space-y-2">
        {members.length === 0 ? (
          <p className="text-gray-400 text-sm">No team members assigned yet.</p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-dark-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-accent-purple" />
                </div>
                <div>
                  <p className="text-white text-sm">{member.user_full_name}</p>
                  <p className="text-gray-500 text-xs">{member.user_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded ${
                  member.role === 'writer'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {member.role}
                </span>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="p-1 hover:bg-dark-600 rounded text-gray-400 hover:text-red-400"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add member form */}
      <div className="border-t border-dark-700 pt-4">
        <p className="text-sm font-medium text-gray-300 mb-3">Add Team Member</p>
        <div className="flex gap-3">
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value as 'writer' | 'statistician');
              setSelectedUserId('');
            }}
            className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple"
          >
            <option value="writer">Writer</option>
            <option value="statistician">Statistician</option>
          </select>

          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
            className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple"
          >
            <option value="">Select a user...</option>
            {filteredUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} ({user.email})
              </option>
            ))}
          </select>

          <Button
            onClick={handleAddMember}
            disabled={!selectedUserId || isLoading}
            size="sm"
          >
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>
        {filteredUsers.length === 0 && (
          <p className="text-gray-500 text-xs mt-2">
            No available {selectedRole}s to add.
          </p>
        )}
      </div>
    </div>
  );
}
