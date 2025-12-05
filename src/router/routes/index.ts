import { App } from '@/App';
import LoginPage from '@/pages/login';
import WorkItemPage from '@/pages/space/[workItemId]';
import SpaceWorkItemLayout from '@/pages/space/_layout/SpaceWorkItemLayout';
import SpaceOverviewPage from '@/pages/space/overview';
import SpaceSettingsPage from '@/pages/space/settings';
import TablePage from '@/pages/table';
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
        path: 'space',
        Component: SpaceWorkItemLayout,
        children: [
          {
            path: ':spaceId',
            Component: SpaceOverviewPage,
          },
          {
            path: ':spaceId/settings',
            Component: SpaceSettingsPage,
          },
          {
            path: ':spaceId/:workItemId',
            Component: WorkItemPage,
          },
        ]
      },
      {
        path: '/login',
        Component: LoginPage
      }
    ]
  }
];
export default routes