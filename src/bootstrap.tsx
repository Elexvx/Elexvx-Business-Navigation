import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppProviders } from './app/AppProviders';
import './styles/global.css';
import 'antd/dist/reset.css';

export function renderApplication(content: ReactNode) {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('找不到 React 根节点 #root');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <AppProviders>{content}</AppProviders>
    </StrictMode>,
  );
}
