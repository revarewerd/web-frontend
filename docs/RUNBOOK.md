# 🗺️ Web Frontend — Runbook

> Тег: `АКТУАЛЬНО` | Обновлён: `2026-06-02` | Версия: `1.0`

## Запуск

### Development

```bash
cd services/web-frontend
npm install
npm run dev         # Vite dev server → http://localhost:3001
```

### Production build

```bash
npm run build       # → dist/
npm run preview     # Предпросмотр production build
```

### Docker

```bash
docker build -t wayrecall/web-frontend .
docker run -p 80:80 wayrecall/web-frontend
```

### Docker Compose

```bash
docker-compose up web-frontend
```

### Линтинг и тесты

```bash
npm run lint        # ESLint
npm run type-check  # TypeScript strict
npm run test        # Vitest
npm run test:coverage
```

---

## Типичные ошибки

### 1. CORS ошибки при запросах к API

**Симптом:** Консоль браузера: `Access to XMLHttpRequest blocked by CORS policy`.

**Диагностика:**
```bash
# Проверить CORS headers от API Gateway
curl -v -X OPTIONS http://localhost:8080/api/v1/devices \
  -H "Origin: http://localhost:3001"
```

**Причины:**
- API Gateway не включает `localhost:3001` в `CORS_ORIGINS` → настроить
- Vite proxy не настроен → добавить в `vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': 'http://localhost:8080'
  }
}
```

### 2. WebSocket не подключается

**Симптом:** Карта не обновляется, нет real-time данных.

**Диагностика:**
```javascript
// В консоли браузера
const ws = new WebSocket('ws://localhost:8081/ws?token=your_token');
ws.onopen = () => console.log('OK');
ws.onerror = (e) => console.error('FAIL', e);
```

**Причины:**
- WebSocket Service не запущен → `docker-compose up websocket-service`
- Неправильный `VITE_WS_URL` в `.env`
- JWT истёк → WebSocket отклоняет соединение
- nginx proxy не настроен для Upgrade header

### 3. Карта не отображается

**Симптом:** Пустой серый блок вместо карты.

**Диагностика:**
```javascript
// Проверить в DevTools Console
console.log(L.map);  // Должен быть function
console.log(document.getElementById('map'));  // Должен быть div
```

**Причины:**
- CSS Leaflet не подключён → `import 'leaflet/dist/leaflet.css'`
- Контейнер карты имеет `height: 0` → задать явную высоту
- `invalidateSize()` не вызван после resize → `map.invalidateSize()`

### 4. Белый экран / React error boundary

**Симптом:** Белый экран без контента.

**Диагностика:**
```
1. Открыть DevTools → Console → ищи красные ошибки
2. React DevTools → Components → искать ошибку
3. Network tab → проверить 4xx/5xx ответы от API
```

**Причины:**
- Unhandled error в компоненте → добавить Error Boundary
- API вернул неожиданный формат → проверить Zod-схему
- LocalStorage повреждён → `localStorage.clear()` и перелогиниться

### 5. Тормозит карта при >200 устройствах

**Симптом:** FPS падает, карта «дёргается».

**Решения:**
1. Включить Canvas renderer: `L.canvas()` вместо SVG
2. Включить marker clustering: `L.markerClusterGroup()`
3. Viewport filtering: рендерить только маркеры в bounds
4. Throttle `updatePosition`: не чаще 1 раз в 2 секунды
5. `useMemo` для маркеров, `useCallback` для handlers

---

## Performance Checklist

| Метрика | Цель | Как измерить |
|---------|------|-------------|
| LCP | < 2.5s | Lighthouse |
| FID | < 100ms | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| Bundle size | < 500KB gz | `npm run build` |
| Map render (100 devices) | < 100ms | Performance tab |
| Map render (1000 devices) | < 500ms | Canvas renderer |
| WS message processing | < 10ms | Performance tab |

### Оптимизации

```typescript
// 1. Lazy loading страниц
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Reports = React.lazy(() => import('@/pages/Reports'));
const Settings = React.lazy(() => import('@/pages/Settings'));

// 2. Мемоизация тяжёлых компонентов
const DeviceList = React.memo(({ devices, onSelect }: Props) => { ... });

// 3. Виртуализация длинных списков
import { useVirtualizer } from '@tanstack/react-virtual';

// 4. Code splitting для фич
const GeozoneEditor = React.lazy(() => import('@/features/geozones/GeozoneEditor'));
```

---

## Мониторинг

### Sentry (production)

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.2,
});
```

### Web Vitals

```typescript
import { onLCP, onFID, onCLS } from 'web-vitals';

onLCP(console.log);
onFID(console.log);
onCLS(console.log);
```

### Полезные DevTools

| Инструмент | Назначение |
|-----------|-----------|
| React DevTools | Компоненты, renders, profiler |
| TanStack Query DevTools | Query cache, stale/fresh, refetch |
| Network tab | API запросы, WebSocket frames |
| Performance tab | FPS, Long Tasks, Layout Shift |
| Lighthouse | Общий Performance/Accessibility audit |
