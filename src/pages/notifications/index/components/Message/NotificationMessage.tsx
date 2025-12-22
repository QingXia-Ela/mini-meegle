import React from 'react';

interface NotificationMessageProps {
  avatarUrl?: string;
  userName?: string;
  title?: string;
  content?: React.ReactNode;
  time?: string;
  source?: string;
}

export default function NotificationMessage({
  avatarUrl,
  userName = 'spark xiao',
  title = '欢迎使用 Meegle',
  content,
  time = '2025-11-17 15:03:24',
  source = 'Meegle',
}: NotificationMessageProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
              ✨
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="text-sm text-gray-700">
            <span className="mr-2">🎉 Hi~</span>
            <span className="font-medium">@{userName}</span>
            <span>，{title}</span>
          </div>

          <div className="mt-3 flex flex-col">
            <div className="flex-1 text-sm text-gray-700 border-l-2 border-blue-400 pl-1">
              <div className="flex items-start">
                <div className="ml-2 leading-relaxed">
                  {content ? (
                    content
                  ) : (
                    <div className="text-gray-700">
                      <span className="text-sm text-gray-700">管理 Meegle：</span>
                      <span className="ml-1 text-gray-700">
                        <a className="text-blue-600 underline">进入企业管理平台</a>
                        ，即可管理本企业的资产及席位。详细功能使用，请查看
                        <a className="text-blue-600 underline ml-1">企业管理手册</a>
                        。
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>
            <div className="mt-3 text-sm text-gray-400">{time}</div>
          </div>
        </div>
      </div>
    </div>
  );
}