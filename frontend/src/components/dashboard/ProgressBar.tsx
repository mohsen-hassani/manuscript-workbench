import React from 'react';

interface ProgressBarProps {
  label: string;
  value: number;
  color?: 'blue' | 'purple' | 'pink' | 'green';
}

export function ProgressBar({ label, value, color = 'blue' }: ProgressBarProps) {
  const gradients = {
    blue: 'from-blue-500 to-blue-400',
    purple: 'from-purple-500 to-pink-500',
    pink: 'from-pink-500 to-orange-400',
    green: 'from-green-500 to-emerald-400',
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">{label}</span>
        <span className={`text-sm font-medium text-${color}-400`}>{value}%</span>
      </div>
      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradients[color]} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
