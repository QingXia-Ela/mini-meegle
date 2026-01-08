import { App } from '@/App';
import FavoritesPage from '@/pages/favorites/index';
import LoginPage from '@/pages/login';
import NoticeIndexPage from '@/pages/notifications/index/index';
import TaskDetailRoutePage from '@/pages/space/[workItemId]/[taskId]/detail';
import WorkItemPage from '@/pages/space/[workItemId]/index';
import SpaceWorkItemLayout from '@/pages/space/_layout/SpaceWorkItemLayout';
import SpaceOverviewPage from '@/pages/space/overview';
import { SettingsLayout, IndexPage, WorkItemPage as WorkItemSettingsPage, PermissionPage } from '@/pages/space/settings';
import TablePage from '@/pages/table';
import { Navigate } from 'react-router';
import type { RouteObject } from 'react-router';

const routes: RouteObject[] = [
  {
    path: '/',
    Component: App,
    children: [
      {
        path: '/',
        Component: TablePage,
      },
      {
        path: '/space',
        Component: SpaceWorkItemLayout,
        children: [
          {
            path: ':spaceId/overview',
            Component: SpaceOverviewPage,
          },
          {
            path: ':spaceId/settings',
            Component: SettingsLayout,
            children: [
              {
                path: '',
                Component: IndexPage,
              },
              {
                path: 'workItem',
                Component: WorkItemSettingsPage,
              },
              {
                path: 'permission',
                Component: PermissionPage,
              },
            ]
          },
          {
            path: ':spaceId/:workItemId/:taskId/detail',
            Component: TaskDetailRoutePage,
          },
          {
            path: ':spaceId/:workItemId',
            Component: WorkItemPage,
          },
        ]
      },
      {
        path: '/favorites',
        Component: FavoritesPage
      },
      {
        path: '/notifications',
        Component: NoticeIndexPage
      }
    ]
  },
  {
    path: '/login',
    Component: LoginPage
  }
];
export default routes
