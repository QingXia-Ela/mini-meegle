import React from 'react';

type Item = {
  name: string;
  count: number;
};

type Props = {
  items: Item[];
  className?: string;
};

const WorkItemPageTotalView: React.FC<Props> = ({ items, className = '' }) => {
  return (
    <div className={`w-full h-32 bg-white border border-[#e6e7ea] rounded-lg ${className}`}>
      <div className="h-full flex items-center justify-between px-4">
        {items.map((it, idx) => (
          <React.Fragment key={`${it.name}-${idx}`}>
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="text-sm text-gray-500">{it.name}</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{it.count}</div>
            </div>
            {idx < items.length - 1 && <div className="h-16 w-px bg-[#e6e7ea] mx-4" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WorkItemPageTotalView;
