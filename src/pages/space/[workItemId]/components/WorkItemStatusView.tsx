import React from 'react';

type Item = {
  name: string;
  value: string | number;
};

type Props = {
  items: Item[];
  className?: string;
};

const WorkItemStatusView: React.FC<Props> = ({ items, className = '' }) => {
  return (
    <div className={`w-full h-24 bg-white border border-[#d9dbe0] rounded-lg ${className}`}>
      <div className="h-full flex items-center justify-between px-4">
        {items.map((it, idx) => (
          <React.Fragment key={`${it.name}-${idx}`}>
            <div className="flex-1 min-w-0 flex flex-col items-center text-center">
              <div className="text-sm text-gray-500 whitespace-nowrap truncate">{it.name}</div>
              <div className="text-3xl font-bold text-gray-900 mt-2 whitespace-nowrap truncate">{it.value}</div>
            </div>
            {idx < items.length - 1 && <div className="h-8 w-px bg-[#d9dbe0] mx-4" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WorkItemStatusView;
