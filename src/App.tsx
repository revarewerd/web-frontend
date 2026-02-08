/**
 * =====================================================
 * MONITORING WEB — Пользовательская панель мониторинга
 * =====================================================
 *
 * Это МОНИТОРИНГ — для пользователей (не админов).
 * Карта + трекеры + уведомления + отчёты + геозоны.
 *
 * Legacy аналог: /monitoring/index.html (ExtJS 4.2.1 Gray Theme + OpenLayers 2.x)
 * Legacy Java:   ru.sosgps.wayrecall.monitoring.web.* (Ext.Direct RPC)
 * API контракт:  docs/MONITORING_API_CONTRACT.md (~76 Ext.Direct методов)
 *
 * ⚠️ Вторая вебка проекта — web-billing (services/web-billing/) — это
 * административная панель для управления учётками, тарифами, оборудованием.
 * API контракт биллинга: docs/BILLING_API_CONTRACT.md
 *
 * Стек: React 19 + TypeScript + Vite + TailwindCSS 4 + Zustand (state)
 *       + TanStack Query (кеширование API) + OpenLayers 10 (карта)
 *
 * TanStack Query (ниже) — замена legacy Ext.data.Store:
 *   staleTime: 1 мин — данные считаются свежими 1 минуту
 *   refetchOnWindowFocus: false — не перезапрашиваем при фокусе окна
 *   В будущем: polling каждые 2 сек для mapObjects.getUpdatedAfter()
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/AppLayout';
import './index.css';

// Создаём QueryClient для TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 минута
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout />
    </QueryClientProvider>
  );
}

export default App;
