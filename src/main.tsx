/**
 * Точка входа React-приложения мониторинга.
 * Запуск: cd services/web-frontend && npm run dev (порт 3002)
 *
 * index.css содержит все стили, эмулирующие ExtJS Gray Theme.
 * Используется TailwindCSS 4 + кастомный CSS для ExtJS-виджетов.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

// Глобальный перехват ошибок — логируем всё что не поймал React
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[GLOBAL ERROR]', message, source, lineno, colno, error);
};
window.onunhandledrejection = (event) => {
  console.error('[UNHANDLED PROMISE]', event.reason);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
