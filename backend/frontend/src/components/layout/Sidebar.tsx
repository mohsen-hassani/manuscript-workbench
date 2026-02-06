import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
];

const adminNavigation = [
  { name: 'Users', href: '/users', icon: Users },
];

export function Sidebar() {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const navItems = isAdmin
    ? [...navigation, ...adminNavigation]
    : navigation;

  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-accent-purple" />
          <div>
            <h1 className="text-lg font-semibold text-white">Manuscript</h1>
            <p className="text-xs text-gray-500">Workbench</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-purple/10 text-accent-purple'
                  : 'text-gray-400 hover:bg-dark-700 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-dark-700">
        <p className="text-xs text-gray-500 text-center">
          Demo Version
        </p>
      </div>
    </aside>
  );
}
