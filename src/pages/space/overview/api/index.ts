import { get, put, post } from '@/api/request';

export interface Space {
  id: string;
  name: string;
  icon: string;
  overviewContent?: any;
}

export interface PermissionResponse {
  isManager: boolean;
}

// 获取空间详情
export function getSpaceDetail(spaceId: string) {
  return get<Space>(`/spaces/${spaceId}`);
}

// 检查用户权限
export function checkSpacePermission(spaceId: string) {
  return get<PermissionResponse>(`/spaces/${spaceId}/permission`);
}

// 更新主页富文本内容
export function updateOverviewContent(spaceId: string, overviewContent: any) {
  return put<Space>(`/spaces/${spaceId}/overview-content`, { overviewContent });
}

// 上传图片
export function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return post<{ url: string }>('/upload/image', formData);
}
