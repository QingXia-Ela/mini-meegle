import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

type Props = {
  name: string;
};

const getGreeting = (hour: number) => {
  if (hour >= 6 && hour < 12) return '上午好';
  if (hour >= 12 && hour < 18) return '下午好';
  if (hour >= 18 && hour < 24) return '晚上好';
  return '早上好';
};

const GreetingHeader: React.FC<Props> = ({ name }) => {
  const now = dayjs();
  const dateStr = `${now.format('M')} 月 ${now.format('D')} 日, ${now.format('dddd')}`;
  const greeting = getGreeting(now.hour());

  return (
    <div className="flex flex-col items-center">
      <div className="text-md text-gray-500 mb-2">{dateStr}</div>
      <div className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">
        {greeting}，{name}
      </div>
    </div >
  );
};

export default GreetingHeader;
