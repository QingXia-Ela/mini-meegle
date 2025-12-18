import { SendOutlined } from '@ant-design/icons';
import { Avatar, Button, Input } from 'antd';

function ProcessViewComment() {
  return (
    <div className="h-20 w-full flex items-center px-6 py-2 border-t border-gray-300 gap-4 absolute bottom-0 bg-white">
      <Avatar>S</Avatar>
      <Input placeholder="请输入评论" />
      <Button icon={<SendOutlined />} type="primary">发送</Button>
    </div>
  );
}

export default ProcessViewComment;