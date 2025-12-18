import { Select, Space } from 'antd';

const options = [
  {
    label: 'China',
    value: 'china',
    emoji: '🇨🇳',
    desc: 'China (中国)',
  },
  {
    label: 'USA',
    value: 'usa',
    emoji: '🇺🇸',
    desc: 'USA (美国)',
  },
  {
    label: 'Japan',
    value: 'japan',
    emoji: '🇯🇵',
    desc: 'Japan (日本)',
  },
  {
    label: 'Korea',
    value: 'korea',
    emoji: '🇰🇷',
    desc: 'Korea (韩国)',
  },
];

function ProcessMemberSelector() {
  return (
    <div className='p-4 w-[40%] flex gap-4 items-center'>
      参与角色：
      <Select
        size='large'
        mode="multiple"
        className='min-w-72'
        placeholder="选择参与成员"
        defaultValue={['china']}
        options={options}
        optionRender={(option) => (
          <Space>
            <span role="img" aria-label={option.data.label}>
              {option.data.emoji}
            </span>
            {option.data.desc}
          </Space>
        )}
      />
    </div>
  );
}

export default ProcessMemberSelector;