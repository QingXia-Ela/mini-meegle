import React, { useMemo } from 'react';
import { Select, Avatar, Tag, Input, Divider } from 'antd';
import { CloseOutlined, CheckCircleFilled, SearchOutlined } from '@ant-design/icons';
import type { CustomTagProps } from 'rc-select/lib/BaseSelect';
import { throttle } from 'lodash-es';

export interface Member {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

interface MemberSelectProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  options: Member[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  onSearchContentChange?: (content: string) => void;
}

const MemberSelect: React.FC<MemberSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = '请选择',
  className,
  style,
  onSearchContentChange,
}) => {
  // 节流处理搜索回调，200ms 节流
  const throttledSearch = useMemo(
    () => (onSearchContentChange ? throttle(onSearchContentChange, 200) : undefined),
    [onSearchContentChange]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    throttledSearch?.(e.target.value);
  };

  // 自定义标签渲染
  const tagRender = (props: CustomTagProps) => {
    const { label, value: val, closable, onClose } = props;
    const member = options.find(m => m.id === val);
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
    };

    return (
      <Tag
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClose={onClose}
        closeIcon={<CloseOutlined className="text-[10px] text-[#bfbfbf] hover:text-[#595959]" />}
        className="flex items-center bg-white border-[#d9d9d9] rounded-full px-1 py-0.5 mr-1 my-0.5 select-none"
      >
        <Avatar 
          size={20} 
          className="flex-shrink-0"
          style={{ backgroundColor: member?.color || '#8d6e63', fontSize: '12px' }}
        >
          {member?.avatar || member?.name?.[0]}
        </Avatar>
        <span className="text-[13px] text-[#262626] ml-1">{label}</span>
      </Tag>
    );
  };

  return (
    <>
      <Select
        mode="multiple"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`member-select w-full ${className || ''}`}
        style={style}
        tagRender={tagRender}
        optionLabelProp="label"
        showSearch={false} // 禁用 Select 原生搜索，改用自定义输入框
        popupRender={(menu) => (
          <div className="member-select-dropdown">
            <div className="p-2">
              <Input
                placeholder="搜索成员"
                prefix={<SearchOutlined className="text-[#bfbfbf]" />}
                onChange={handleSearch}
                className="bg-[#f5f5f5] border-none hover:bg-[#f0f0f0] focus:bg-[#f0f0f0] rounded-md h-9"
                onKeyDown={(e) => e.stopPropagation()} // 阻止事件冒泡，防止触发 Select 快捷键
              />
            </div>
            <Divider className="my-0" />
            {menu}
          </div>
        )}
        filterOption={(input, option) =>
          (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
        }
        dropdownStyle={{ padding: '4px' }}
      >
        {options.map(member => (
          <Select.Option key={member.id} value={member.id} label={member.name}>
            <div className="flex items-center justify-between w-full py-0.5">
              <div className="flex items-center gap-2">
                <Avatar 
                  size={24} 
                  className="flex-shrink-0 w-8 h-8"
                  style={{ backgroundColor: member.color || '#8d6e63', fontSize: '14px' }}
                >
                  {member.avatar || member.name?.[0]}
                </Avatar>
                <span className="text-sm text-[#262626]">{member.name}</span>
              </div>
            </div>
          </Select.Option>
        ))}
      </Select>
      <style>{`
        .member-select .ant-select-selector {
          border-radius: 8px !important;
          border-color: #d9d9d9 !important;
          padding: 2px 8px !important;
          min-height: 40px !important;
          box-shadow: none !important;
        }
        .member-select.ant-select-focused .ant-select-selector {
          border-color: #2f54eb !important;
          box-shadow: 0 0 0 2px rgba(47, 84, 235, 0.1) !important;
        }
        .ant-select-dropdown .ant-select-item-option-selected {
          background-color: #f0f5ff !important;
        }
        .ant-select-dropdown .ant-select-item-option-selected .ant-select-item-option-content {
          color: #262626 !important;
        }
        .ant-select-dropdown .ant-select-item-option-active {
          background-color: #f5f5f5 !important;
        }
        .ant-select-dropdown .ant-select-item {
          border-radius: 4px;
          margin: 2px 0;
          padding: 5px 12px !important;
        }
        .member-select-dropdown .ant-divider {
          margin: 4px 0;
        }
      `}</style>
    </>
  );
};

export default MemberSelect;
