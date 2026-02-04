import { HomeFilled, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { Button, Spin, message } from 'antd';
import RichTextEditor from './components/RichTextEditor';
import {
  getSpaceDetail,
  checkSpacePermission,
  updateOverviewContent,
  Space,
} from './api';

function SpaceOverviewPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [space, setSpace] = useState<Space | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<any>(null);

  // 加载数据
  useEffect(() => {
    if (!spaceId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [spaceData, permissionData] = await Promise.all([
          getSpaceDetail(spaceId),
          checkSpacePermission(spaceId),
        ]);
        setSpace(spaceData);
        setIsManager(permissionData.isManager);
        setContent(spaceData.overviewContent || null);
      } catch (error) {
        console.error('Failed to load space data:', error);
        message.error('加载空间数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [spaceId]);

  const handleSave = async () => {
    if (!spaceId) return;

    setSaving(true);
    try {
      const updatedSpace = await updateOverviewContent(spaceId, content);
      setSpace(updatedSpace);
      setIsEditing(false);
      message.success('保存成功');
    } catch (error) {
      console.error('Failed to save content:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(space?.overviewContent || null);
    setIsEditing(false);
  };

  return (
    <>
      <header className="flex py-3 px-5 w-full bg-white border-b border-[#cacbcd] items-center justify-between">
        <div className="flex items-center">
          <div className="bg-[#3250eb] w-8 h-8 flex items-center justify-center rounded-lg">
            <HomeFilled style={{ color: '#fff' }} />
          </div>
          <span className="ml-3 text-lg">{space?.name || '空间主页'}</span>
        </div>
        {isManager && !loading && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleCancel}>取消</Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saving}
                >
                  保存
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setIsEditing(true)}
              >
                编辑主页
              </Button>
            )}
          </div>
        )}
      </header>
      <div className="py-8 w-full flex justify-center">
        <div className="w-full max-w-5xl bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" />
            </div>
          ) : (
            <RichTextEditor
              content={content}
              editable={isEditing}
              onChange={setContent}
              placeholder={isManager ? '开始编写你的空间主页内容...' : '暂无内容'}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default SpaceOverviewPage;