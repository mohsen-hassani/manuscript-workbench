import React from 'react';
import { clsx } from 'clsx';

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  color?: 'default' | 'blue' | 'purple' | 'green';
}

export function StatCard({ title, value, subtitle, color = 'default' }: StatCardProps) {
  const borderColors = {
    default: 'border-dark-600',
    blue: 'border-blue-500/50',
    purple: 'border-purple-500/50',
    green: 'border-green-500/50',
  };

  const titleColors = {
    default: 'text-gray-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
  };

  return (
    <div className={clsx(
      'bg-dark-800 rounded-xl border p-6',
      borderColors[color]
    )}>
      <p className={clsx('text-sm font-medium uppercase tracking-wide', titleColors[color])}>
        {title}
      </p>
      <p className="text-4xl font-bold text-white mt-2">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}
