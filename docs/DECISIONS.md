# 🗺️ Web Frontend — Архитектурные решения (ADR)

> Тег: `АКТУАЛЬНО` | Обновлён: `2026-06-02` | Версия: `1.0`

---

## ADR-001: React + TypeScript вместо альтернатив

**Статус:** Принято  
**Дата:** 2026-01

### Контекст
Нужно выбрать фреймворк для веб-интерфейса GPS мониторинга.

### Решение
React 18 + TypeScript 5 + Vite 5.

### Альтернативы
1. **Vue 3** — меньше экосистема для map-heavy приложений, Leaflet-плагины слабее
2. **Angular** — слишком тяжёлый для MVP, overhead для маленькой команды
3. **Svelte/SvelteKit** — молодая экосистема, меньше UI-библиотек
4. **Next.js** — SSR не нужен для dashboard-приложения, SPA достаточно

### Последствия
- Зрелая экосистема React + Leaflet
- TypeScript strict mode — минимум runtime ошибок
- Vite — быстрая сборка и HMR
- Большой пул разработчиков

---

## ADR-002: Zustand + TanStack Query для state management

**Статус:** Принято  
**Дата:** 2026-01

### Контекст
Нужен state management для real-time данных (позиции устройств) и серверных данных (списки, настройки).

### Решение
- **Zustand** — client state (позиции, карта, алерты, UI)
- **TanStack Query** — server state (REST API данные с кэшем)

### Альтернативы
1. **Redux Toolkit + RTK Query** — слишком verbose для нашего масштаба
2. **MobX** — class-based, не дружит с functional React
3. **Jotai/Recoil** — atomic state, но hard to reason about for map data
4. **Только TanStack Query** — не подходит для WebSocket real-time updates

### Последствия
- Zustand: простой API, нет boilerplate, `immer` для immutable updates
- TanStack Query: automatic refetch, staleTime, caching, optimistic updates
- Чёткое разделение: Zustand = client state, TQ = server state
- WebSocket → напрямую в Zustand store (updatePosition)

---

## ADR-003: Leaflet вместо Google Maps / Mapbox

**Статус:** Принято  
**Дата:** 2026-01

### Контекст
Карта — ключевой компонент приложения. Нужна отрисовка маркеров,
геозон (polygon/circle), треков (polyline), кластеризация.

### Решение
Leaflet 1.9 + OpenStreetMap tiles.

### Альтернативы
1. **Google Maps** — платный (>$200/mo при 10K+ loads), vendor lock-in
2. **Mapbox GL** — WebGL, красиво, но платный и тяжелее
3. **OpenLayers** — мощный, но API сложнее для React-интеграции
4. **Leaflet + react-leaflet** — отклонено react-leaflet, юзаем ref-based подход для перфоманса

### Последствия
- Бесплатно (OSM tiles)
- Лёгкий: ~40KB gzipped
- Canvas renderer для >500 маркеров
- `leaflet.markercluster` для кластеризации
- Ref-based подход (не react-leaflet) — прямой контроль над перфомансом
- Smooth marker animation при обновлении позиций

---

## ADR-004: Feature-based структура проекта

**Статус:** Принято  
**Дата:** 2026-01

### Контекст
Нужна структура, которая масштабируется и понятна.

### Решение
Feature-based: `src/features/{feature}/` — components, hooks, api.
Разделение: `pages/` = роуты, `features/` = бизнес-логика, `shared/` = UI-kit.

### Альтернативы
1. **Type-based** (`components/`, `hooks/`, `api/`) — плоская, сложнее при росте
2. **Domain-driven layers** — overengineering для frontend

### Последствия
- Каждая фича самодостаточна (map, devices, alerts, geozones, analytics)
- Shared компоненты переиспользуются между фичами
- Lazy loading per feature (React.lazy)
- Команда сразу понимает, где что лежит

---

## ADR-005: Axios + interceptors вместо fetch

**Статус:** Принято  
**Дата:** 2026-01

### Контекст
Нужен HTTP клиент с поддержкой interceptors для JWT auto-refresh.

### Решение
Axios с interceptors:
- Request interceptor: добавить `Authorization: Bearer {token}`
- Response interceptor: при 401 → refresh token → retry запроса

### Альтернативы
1. **Native fetch** — нет interceptors, нужна ручная обёртка
2. **ky** — лёгкий, но меньше поддержки interceptors
3. **TanStack Query fetch adapter** — недостаточно для refresh flow

### Последствия
- Автоматический refresh token при любом 401
- Централизованная обработка ошибок
- Все запросы через один клиент → логирование, метрики
