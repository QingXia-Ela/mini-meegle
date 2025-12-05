import React from 'react';
import StatCard from './StatCard';

type Category = {
  key: string;
  count: number | string;
  label: string;
  active?: boolean;
};

const categories: Category[] = [
  { key: 'todo', count: 22, label: '我的待办', active: true },
  { key: 'done', count: 3, label: '我的已办' },
  { key: 'follow', count: 0, label: '我的关注' },
  { key: 'part', count: 22, label: '我参与的' },
  { key: 'created', count: 27, label: '我创建的' },
  { key: 'task', count: 3, label: '任务' },
  { key: 'thisWeek', count: 0, label: '本周到期' },
  { key: 'overdue', count: 6, label: '已超期' },
  { key: 'unscheduled', count: 12, label: '未排期' },
];

const CategoryList: React.FC = () => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center bg-white rounded-md px-2 py-2">
        {categories.map((c, idx) => (
          <div key={c.key} className="flex items-center">
            <StatCard active={c.active} count={c.count} label={c.label} />
            {idx !== categories.length - 1 && <div className="border-r border-[#cacbcd] h-16 mx-4" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
