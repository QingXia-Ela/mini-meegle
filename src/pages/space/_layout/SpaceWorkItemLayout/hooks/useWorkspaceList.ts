import { useEffect } from 'react';
import useRequest from '@/hooks/useRequest';
import { apiGetMySpaces, apiGetSpaceWorkItems } from '../api';

function useWorkspaceList() {
  // 获取空间列表（无参数，自动请求）
  const {
    data: spaces,
    loading: spacesLoading,
    error: spacesError,
    request: requestSpaces,
  } = useRequest(apiGetMySpaces);

  // 获取工作项列表（需要 spaceId 参数）
  const {
    data: workItems,
    loading: workItemsLoading,
    error: workItemsError,
    request: requestWorkItems,
  } = useRequest(apiGetSpaceWorkItems);

  // 组件挂载时自动请求空间列表
  useEffect(() => {
    requestSpaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 暴露请求工作项的函数，接受 spaceId 参数
  const fetchWorkItems = (spaceId: string) => {
    if (spaceId) {
      requestWorkItems(spaceId);
    }
  };

  return {
    // 空间列表相关
    spaces,
    spacesLoading,
    spacesError,
    requestSpaces,
    // 工作项列表相关
    workItems,
    workItemsLoading,
    workItemsError,
    // 请求工作项的函数
    fetchWorkItems,
  };
}

export default useWorkspaceList;