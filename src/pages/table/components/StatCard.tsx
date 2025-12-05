import React from 'react';

type StatCardProps = {
  active?: boolean;
  count: number | string;
  label: string;
  className?: string;
};

const StatCard: React.FC<StatCardProps> = ({ active = false, count, label, className = '' }) => {
  if (active) {
    return (
      <div
        className={`flex flex-col items-center justify-center w-32 h-24 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer ${className}`}
        role="status"
      >
        <div className="text-4xl font-bold text-indigo-600">{count}</div>
        <div className="text-md text-indigo-500 mt-4">{label}</div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center w-32 h-24 rounded-lg bg-white  hover:bg-gray-100 transition-colors cursor-pointer ${className}`}
      role="status"
    >
      <div className="text-4xl font-semibold text-gray-700">{count}</div>
      <div className="text-md text-gray-500 mt-4">{label}</div>
    </div>
  );
};

export default StatCard;

/*
Usage example:

import StatCard from '@/components/StatCard';

<div className="flex space-x-4">
  <StatCard active count={22} label="我的待办" />
  <StatCard count={3} label="我的已办" />
</div>

*/
