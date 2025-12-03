import { createRoot } from 'react-dom/client';
import './src/styles/global.css';
import 'antd/dist/reset.css';
import { RouterProvider } from 'react-router/dom';
import router from '@/router/index.tsx';

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
);
