import React from 'react';
import StatCard from './StatCard';

type Category = {
  key: string;
  count: number | string;
  label: string;
  active?: boolean;
};

type CategoryListProps = {
  categories: Category[];
  onChange?: (key: string) => void;
};

const CategoryList: React.FC<CategoryListProps> = ({ categories, onChange }) => {
  return (
    <div className="w-full overflow-x-auto flex justify-center">
      <div className="flex items-center bg-white rounded-md px-2 py-2">
        {categories.map((c, idx) => (
          <div key={c.key} className="flex items-center">
            <div onClick={() => onChange?.(c.key)}>
              <StatCard active={c.active} count={c.count} label={c.label} />
            </div>
            {idx !== categories.length - 1 && <div className="border-r border-[#cacbcd] h-16 mx-4" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
