import React from 'react';

type Props = {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  iconBackgroundColor?: string;
};

const SidebarSelectItem: React.FC<Props> = ({ icon, label, active = false, iconBackgroundColor = 'bg-[#3250eb]', onClick }) => {
  const base = 'w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors';
  const stateClass = active
    ? 'bg-[#eef6ff] text-[#3250eb]'
    : 'bg-transparent text-gray-800 hover:bg-gray-200';

  return (
    <div className={`${base} ${stateClass}`} onClick={onClick} role="button">
      <div className={`w-5 h-5 rounded-sm flex items-center justify-center ${iconBackgroundColor}`}>
        {icon}
      </div>
      <div className="font-medium truncate">{label}</div>
    </div>
  );
};

export default SidebarSelectItem;
