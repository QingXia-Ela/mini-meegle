import { MenuOutlined } from '@ant-design/icons';
import type { ProcessNodeStatusType, ProcessNodeType } from './types';
import type { ReactNode } from 'react';
import { getColorByStatus } from './utils';

export interface ProcessNodeProps {
  status?: ProcessNodeStatusType;
  node?: ProcessNodeType;
  showEdit?: boolean;
  onEditButtonClick?: () => void;
  getEditClickPopoverMenu?: (node: ProcessNodeType) => ReactNode
}


function ProcessNode({ status = 'pending', showEdit = false, onEditButtonClick }: ProcessNodeProps) {
  return (
    <div className="h-8 rounded-[2rem] border border-gray-300 hover:border-gray-500 py-4 px-3 flex items-center justify-center gap-1 cursor-pointer relative group">
      <div className="rounded-full w-3 h-3" style={getColorByStatus(status)}></div>
      123
      {showEdit && <div className='absolute w-5 h-5 rounded-full -right-5 top-1.5 border border-gray-400 hover:border-blue-500 group-hover:flex hidden  justify-center items-center' onClick={onEditButtonClick}>
        <MenuOutlined style={{ fontSize: 9 }} />
      </div>}
    </div>
  );
}

export default ProcessNode;
