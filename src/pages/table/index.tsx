import { BookOutlined, HomeFilled, HomeOutlined } from '@ant-design/icons';
import { get } from '@/api/request';
import GreetingHeader from './components/GreetingHeader';
import CategoryList from './components/CategoryList';
import { Table, Tag } from 'antd';
import type { TablePaginationConfig } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUserStore } from '@/store/user';
import { useNavigate } from 'react-router';

type DashboardTask = {
  id: number;
  name: string;
  stage?: string;
  schedule?: [string, string] | null;
  workItemInfo?: { id: string; name: string } | null;
  spaceInfo?: { id: string; name: string } | null;
};

const CATEGORY_CONFIG = [
  { key: 'todo', label: '我的待办' },
  { key: 'done', label: '我的已办' },
  { key: 'part', label: '我参与的' },
  { key: 'created', label: '我创建的' },
  { key: 'thisWeek', label: '本周到期' },
  { key: 'overdue', label: '已超期' },
  { key: 'unscheduled', label: '未排期' },
] as const;

type CategoryKey = (typeof CATEGORY_CONFIG)[number]['key'];

type DashboardStats = Record<CategoryKey, number>;

type DashboardResponse = {
  rows: DashboardTask[];
  count: number;
};

type StatusOption = {
  id?: string | number;
  value?: string | number;
  label?: string;
  name?: string;
};

type WorkItemField = {
  id: string;
  jsonConfig?: { options?: StatusOption[] } | null;
};

const statusOptionCache = new Map<string, Record<string, string>>();

function DataList({
  dataSource,
  columns,
  loading,
  pagination,
  onChange,
  onRowClick,
}: {
  dataSource: DashboardTask[];
  columns: ColumnsType<DashboardTask>;
  loading: boolean;
  pagination: { current: number; pageSize: number; total: number };
  onChange: (next: TablePaginationConfig) => void;
  onRowClick: (record: DashboardTask) => void;
}) {
  return (
    <Table
      rowKey="id"
      dataSource={dataSource}
      columns={columns}
      loading={loading}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
      }}
      onChange={onChange}
      onRow={(record) => ({
        onClick: () => onRowClick(record),
      })}
      bordered={false}
    />
  );
}

function MyWorkCard() {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState<CategoryKey>('todo');
  const [stats, setStats] = useState<DashboardStats>({
    todo: 0,
    done: 0,
    part: 0,
    created: 0,
    thisWeek: 0,
    overdue: 0,
    unscheduled: 0,
  });
  const [dataSource, setDataSource] = useState<DashboardTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 6,
    total: 0,
  });
  const [statusCacheTick, setStatusCacheTick] = useState(0);
  const statusLoadingRef = useRef(new Set<string>());

  const categories = useMemo(
    () =>
      CATEGORY_CONFIG.map((item) => ({
        ...item,
        count: stats[item.key] ?? 0,
        active: item.key === activeKey,
      })),
    [activeKey, stats],
  );

  const fetchStats = useCallback(async () => {
    const data = await get<DashboardStats>('/tasks/dashboard/stats');
    if (data) {
      setStats(data);
    }
  }, []);

  const fetchTasks = useCallback(
    async (current: number, pageSize: number, type: string) => {
      setLoading(true);
      try {
        const offset = (current - 1) * pageSize;
        const data = await get<DashboardResponse>(
          `/tasks/dashboard?count=${pageSize}&offset=${offset}&type=${type}`,
        );
        setDataSource(data?.rows || []);
        setPagination((prev) => ({
          ...prev,
          current,
          pageSize,
          total: data?.count || 0,
        }));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const buildStatusOptionMap = useCallback((options: StatusOption[]) => {
    const map: Record<string, string> = {};
    options.forEach((opt) => {
      if (!opt) return;
      const id = opt.id ?? opt.value;
      if (id === undefined || id === null) return;
      map[String(id)] = String(opt.label ?? opt.name ?? id);
    });
    return map;
  }, []);

  const fetchStatusOptions = useCallback(
    async (workItemIds: string[]) => {
      const pending = workItemIds.filter(
        (id) => !statusOptionCache.has(id) && !statusLoadingRef.current.has(id),
      );
      if (pending.length === 0) return;
      pending.forEach((id) => statusLoadingRef.current.add(id));
      let updated = false;
      await Promise.all(
        pending.map(async (id) => {
          try {
            const fields = await get<WorkItemField[]>(
              `/workItems/${id}/fields`,
            );
            const statusField = (fields || []).find(
              (field) => field.id === 'status',
            );
            const options = (statusField?.jsonConfig?.options ||
              []) as StatusOption[];
            statusOptionCache.set(id, buildStatusOptionMap(options));
            updated = true;
          } catch {
            statusOptionCache.set(id, {});
          } finally {
            statusLoadingRef.current.delete(id);
          }
        }),
      );
      if (updated) {
        setStatusCacheTick((prev) => prev + 1);
      }
    },
    [buildStatusOptionMap],
  );

  useEffect(() => {
    if (dataSource.length === 0) return;
    const workItemIds = Array.from(
      new Set(
        dataSource
          .map((item) => item.workItemInfo?.id)
          .filter(Boolean) as string[],
      ),
    );
    if (workItemIds.length > 0) {
      fetchStatusOptions(workItemIds);
    }
  }, [dataSource, fetchStatusOptions]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchTasks(pagination.current, pagination.pageSize, activeKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTasks, pagination.current, pagination.pageSize, activeKey]);

  const handleCategoryChange = (key: string) => {
    if (CATEGORY_CONFIG.some((item) => item.key === key)) {
      setActiveKey(key as CategoryKey);
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  };

  const handleRowClick = (record: DashboardTask) => {
    const spaceId = record.spaceInfo?.id;
    const workItemId = record.workItemInfo?.id;
    if (!spaceId || !workItemId) return;
    navigate(`/space/${spaceId}/${workItemId}/${record.id}/detail`);
  };

  const resolveStageLabel = useCallback(
    (item: DashboardTask) => {
      void statusCacheTick;
      if (!item.stage) return '-';
      const workItemId = item.workItemInfo?.id;
      if (!workItemId) return item.stage;
      const map = statusOptionCache.get(workItemId);
      if (!map) return item.stage;
      return map[item.stage] ?? item.stage;
    },
    [statusCacheTick],
  );

  const columns = useMemo<ColumnsType<DashboardTask>>(
    () => [
      {
        title: '事项',
        dataIndex: 'name',
        key: 'name',
        render: (text: string, item: DashboardTask) => (
          <div className="flex items-start space-x-3 cursor-pointer hover:text-[#3250eb]">
            <div className="bg-[#3250eb] w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0">
              <HomeOutlined style={{ color: '#fff', fontSize: 14 }} />
            </div>
            <div className="flex-1">
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-base sm:text-lg font-semibold  truncate ">
                    {text}
                  </div>
                  {item.schedule?.[1] &&
                  dayjs().isAfter(item.schedule[1]) ? (
                    <Tag color="red" className="text-xs">
                      已超期
                    </Tag>
                  ) : null}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {resolveStageLabel(item)}
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: '排期',
        dataIndex: 'schedule',
        key: 'schedule',
        render: (_: DashboardTask['schedule'], item: DashboardTask) => {
          if (!item.schedule?.[0] || !item.schedule?.[1]) {
            return <span className=" text-gray-400">未排期</span>;
          }
          return (
            <span>
              {`${dayjs(item.schedule[0]).format('MM-DD')} - ${dayjs(item.schedule[1]).format('MM-DD')}`}
            </span>
          );
        },
        width: 180,
      },
      {
        title: '所属工作项',
        dataIndex: 'workItemInfo',
        key: 'workItemInfo',
        render: (workItemInfo: DashboardTask['workItemInfo']) => (
          <Tag color="blue" className="text-lg">
            {workItemInfo?.name || '-'}
          </Tag>
        ),
      },
      {
        title: '所属空间',
        dataIndex: 'spaceInfo',
        key: 'spaceInfo',
        render: (spaceInfo: DashboardTask['spaceInfo']) =>
          spaceInfo ? (
            <span className="text-lg ">{spaceInfo.name}</span>
          ) : (
            <span className="text-lg text-gray-400">-</span>
          ),
      },
    ],
    [resolveStageLabel],
  );

  return (
    <div className='py-8 px-6 border border-[#cacbcd] rounded-xl w-full hover:shadow-lg transition-shadow max-w-[1920px]'>
      <div className="flex w-full items-center mb-6">
        <div className="bg-orange-400 w-12 h-12 flex items-center justify-center rounded-full">
          <BookOutlined style={{ color: '#fff', fontSize: 22 }} />
        </div>
        <span className='ml-3 text-2xl font-bold'>我的工作</span>
      </div>
      <div className="mb-4">
        <CategoryList categories={categories} onChange={handleCategoryChange} />
      </div>
      <DataList
        dataSource={dataSource}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onChange={(next) =>
          setPagination((prev) => ({
            ...prev,
            current: next.current || 1,
            pageSize: next.pageSize || 6,
          }))
        }
        onRowClick={handleRowClick}
      />
    </div>
  )
}

function TablePage() {
  const { userInfo } = useUserStore();
  return (
    <>
      <header className="flex py-3 px-5 w-full bg-white border-b border-[#cacbcd] items-center">
        <div className="bg-[#3250eb] w-8 h-8 flex items-center justify-center rounded-lg">
          <HomeFilled style={{ color: '#fff' }} />
        </div>
        <span className='ml-3 text-lg'>工作台</span>
      </header>
      <div className='py-8 flex flex-col items-center w-full'>
        <GreetingHeader name={userInfo?.user.name} />
        <div className='mt-6 px-36 w-full flex flex-col items-center'>
          <MyWorkCard />
        </div>
      </div>
    </>
  );
}

export default TablePage;