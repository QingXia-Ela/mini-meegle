import { Modal, Form, Input, Button, message } from 'antd';
import { useState } from 'react';
import { apiJoinSpace } from '../api';

interface JoinSpaceModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const JoinSpaceModal: React.FC<JoinSpaceModalProps> = ({
  open,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await apiJoinSpace(values.spaceId);

      message.success('加入空间成功');
      form.resetFields();
      onSuccess();
      onCancel();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // 表单验证错误
        return;
      }
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : '加入空间失败';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="加入空间"
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          加入
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="spaceId"
          label="空间ID"
          rules={[
            { required: true, message: '请输入空间ID' },
            { min: 6, message: '空间ID至少6个字符' },
          ]}
        >
          <Input placeholder="请输入要加入的空间ID" />
        </Form.Item>
        <div className="text-xs text-gray-500">
          输入空间ID加入现有空间。您将成为该空间的普通成员。
        </div>
      </Form>
    </Modal>
  );
};

export default JoinSpaceModal;
