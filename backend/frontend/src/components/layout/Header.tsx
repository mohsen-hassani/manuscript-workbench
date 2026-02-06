import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';

export function Header() {
  const { user, logout, isAdmin, isWriter, isStatistician } = useAuth();

  const getRoleBadgeColor = () => {
    if (isAdmin) return 'bg-red-500/20 text-red-400';
    if (isWriter) return 'bg-blue-500/20 text-blue-400';
    if (isStatistician) return 'bg-green-500/20 text-green-400';
    return 'bg-gray-500/20 text-gray-400';
  };

  return (
    <header className="h-16 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-6">
      <div>
        {/* Breadcrumb or page title can go here */}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center">
            <User className="w-4 h-4 text-accent-purple" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-white">{user?.full_name}</p>
            <span className={clsx(
              'text-xs px-2 py-0.5 rounded-full capitalize',
              getRoleBadgeColor()
            )}>
              {user?.role?.name}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-gray-400 hover:text-white"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}

function clsx(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
