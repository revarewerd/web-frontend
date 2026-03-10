/**
 * =====================================================
 * MONITORING WEB — Пользовательская панель мониторинга
 * =====================================================
 *
 * Роутинг по роли:
 *   Не авторизован → LoginPage (вход по номеру телефона)
 *   user           → AppLayout (мониторинг, карта с трекерами)
 *   admin          → AppLayout (тот же мониторинг, позже → биллинг-админка)
 *
 * Стек: React 19 + TypeScript + Vite + TailwindCSS 4 + Zustand (state)
 *       + TanStack Query (кеширование API) + OpenLayers 10 (карта)
 */
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { getToken, clearToken } from './api/client';
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

/** UTF-8 safe Base64 → string (обратная utf8ToBase64 из LoginPage) */
function base64ToUtf8(b64: string): string {
  return decodeURIComponent(
    atob(b64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

/** Парсинг JWT payload из mock-токена */
function parseToken(token: string): { role: string; orgId: number; name: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(base64ToUtf8(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

function App() {
  const [auth, setAuth] = useState<{ role: string; orgId: number } | null>(null);
  const [checking, setChecking] = useState(true);

  // При загрузке проверяем сохранённый токен
  useEffect(() => {
    const token = getToken();
    if (token) {
      const payload = parseToken(token);
      if (payload && payload.exp > Date.now()) {
        setAuth({ role: payload.role, orgId: payload.orgId });
      } else {
        clearToken(); // Токен истёк или невалиден
      }
    }
    setChecking(false);
  }, []);

  // Слушаем событие logout (401 от API)
  useEffect(() => {
    const handleUnauthorized = () => {
      clearToken();
      setAuth(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const handleLogin = (role: 'user' | 'admin', orgId: number) => {
    setAuth({ role, orgId });
  };

  const handleLogout = () => {
    clearToken();
    setAuth(null);
  };

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff' }}>
        <div style={{ color: '#999', fontSize: 11, fontFamily: 'tahoma, arial, sans-serif' }}>Загрузка...</div>
      </div>
    );
  }

  // Не авторизован → логин
  if (!auth) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Авторизован → мониторинг (для user и admin одинаково, позже admin → биллинг)
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout orgId={auth.orgId} role={auth.role} onLogout={handleLogout} />
    </QueryClientProvider>
  );
}

export default App;
