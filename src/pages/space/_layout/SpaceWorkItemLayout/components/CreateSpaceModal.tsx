import { Modal, Form, Input, Button, message, Upload } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { apiCreateSpace } from '../api';
import type { CreateSpaceDto } from '@backend/types';
import type { UploadProps } from 'antd';

interface CreateSpaceModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({
  open,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 支持的图片格式
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  // 将图片压缩/调整到 128x128 并转为 base64
  const resizeImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // 创建 canvas 来调整图片尺寸
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建画布上下文'));
            return;
          }

          // 计算缩放比例，保持宽高比
          let width = img.width;
          let height = img.height;
          const maxSize = 128;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // 绘制调整后的图片
          ctx.drawImage(img, 0, 0, width, height);

          // 转为 base64
          const base64 = canvas.toDataURL('image/png');
          resolve(base64);
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  };

  // 验证文件
  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    // 检查文件类型
    const isValidType = allowedTypes.includes(file.type) || 
      allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      message.error('仅支持 JPG、PNG、GIF、WEBP 格式的图片');
      return Upload.LIST_IGNORE;
    }

    // 检查文件大小（限制为 5MB）
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB');
      return Upload.LIST_IGNORE;
    }

    try {
      // 调整图片尺寸并转为 base64
      const base64 = await resizeImageToBase64(file);
      form.setFieldsValue({ icon: base64 });
      setPreviewImage(base64);
    } catch {
      message.error('图片处理失败');
      return Upload.LIST_IGNORE;
    }

    // 阻止自动上传
    return false;
  };

  // 处理文件移除
  const handleRemove = () => {
    form.setFieldsValue({ icon: undefined });
    setPreviewImage(null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const createData: CreateSpaceDto = {
        name: values.name,
        icon: values.icon || undefined,
      };

      await apiCreateSpace(createData);
      
      message.success('空间创建成功');
      form.resetFields();
      setPreviewImage(null);
      onSuccess();
      onCancel();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // 表单验证错误
        return;
      }
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : '创建空间失败';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setPreviewImage(null);
    onCancel();
  };

  return (
    <Modal
      title="创建新空间"
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          创建
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="空间名称"
          rules={[{ required: true, message: '请输入空间名称' }]}
        >
          <Input placeholder="请输入空间名称" />
        </Form.Item>
        <Form.Item name="icon" label="图标（可选）">
          <div>
            <Upload
              beforeUpload={beforeUpload}
              maxCount={1}
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>上传图标</Button>
            </Upload>
            <div className="text-xs text-gray-500 mt-1">
              支持 JPG、PNG、GIF、WEBP 格式，最大 5MB，将自动调整为 128x128
            </div>
            {previewImage && (
              <div className="mt-4 relative inline-block">
                <img
                  src={previewImage}
                  alt="预览"
                  className="w-32 h-32 object-contain border border-gray-200 rounded"
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleRemove}
                  className="absolute -top-2 -right-2"
                  size="small"
                />
              </div>
            )}
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateSpaceModal;

