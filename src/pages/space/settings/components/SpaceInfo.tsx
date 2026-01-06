import { Form, Input, message, Upload } from 'antd';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router';
import { apiGetSpace, apiUpdateSpace } from '../api';

const SpaceInfo = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [icon, setIcon] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (spaceId) {
      fetchSpaceInfo();
    }
  }, [spaceId]);

  const fetchSpaceInfo = async () => {
    try {
      const data = await apiGetSpace(spaceId!);
      form.setFieldsValue({ name: data.name });
      setIcon(data.icon || '');
    } catch (error) {
      console.error('Failed to fetch space info:', error);
    }
  };

  const handleUpdate = async (values: { name?: string; icon?: string }) => {
    if (!spaceId) return;
    try {
      setLoading(true);
      await apiUpdateSpace(spaceId, values);
      message.success('更新成功');
    } catch (error) {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const resizeImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        message.error('图片大小不能超过 1MB');
        return;
      }
      try {
        const base64 = await resizeImageToBase64(file);
        setIcon(base64);
        handleUpdate({ icon: base64 });
      } catch {
        message.error('图片处理失败');
      }
    }
  };

  return (
    <div className="w-full px-12">
      <div className="text-xl text-[#262626] mb-8 font-bold">空间信息</div>
      
      <div className="flex items-center mb-6">
        <div className="w-[3px] h-4 bg-blue-600 rounded-full mr-2" />
        <span className="text-base font-semibold text-[#262626]">基础信息</span>
      </div>

      <Form form={form} layout="vertical" requiredMark={true}>
        <Form.Item 
          name="name"
          label={<span className="text-[#262626] font-medium">空间名称</span>} 
          required 
        >
          <Input 
            placeholder="请输入空间名称" 
            className="h-10 bg-[#f5f5f5] border-none hover:bg-[#f2f2f2] focus:bg-[#f2f2f2] rounded-lg"
            onBlur={(e) => {
              const newName = e.target.value;
              if (newName) {
                handleUpdate({ name: newName });
              }
            }}
          />
        </Form.Item>

        <Form.Item 
          label={<span className="text-[#262626] font-medium">空间图标</span>} 
          required
        >
          <div 
            className="w-20 h-20 bg-[#fff2e8] rounded-xl flex items-center justify-center cursor-pointer border border-transparent hover:border-blue-500 transition-all overflow-hidden"
            onClick={handleIconClick}
          >
            {icon ? (
              <img 
                src={icon} 
                alt="space icon" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-xs text-center px-1">点击选择图标</div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default SpaceInfo;

