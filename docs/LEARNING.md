> Тег: `АКТУАЛЬНО` | Обновлён: `2026-03-02` | Версия: `1.0`

# 📖 Изучение Web Frontend

> Руководство по Web Frontend — React SPA для мониторинга транспорта.

---

## 1. Назначение

**Web Frontend** — основное веб-приложение для диспетчеров и администраторов:
- Карта с ТС в реальном времени (OpenLayers)
- Отображение маршрутов, геозон, стоянок
- Модальные окна: детали ТС, отчёты, геозоны, группы, настройки
- Управление уведомлениями, пользователями, датчиками
- Глобальный state через Zustand

**Порт:** 3001 (Vite dev server)

---

## 2. Архитектура

```
src/
├── App.tsx                   — главный layout (AppLayout)
├── main.tsx                  — entry point (React.render)
├── api/mock.ts               — Mock API для разработки
├── store/appStore.ts         — Zustand store (глобальное состояние)
├── types/index.ts            — TypeScript типы
├── components/
│   ├── AppLayout.tsx         — Toolbar + Map + LeftPanel + Modals
│   ├── MapView.tsx           — OpenLayers карта
│   ├── LeftPanel.tsx         — Список ТС, поиск, фильтры
│   ├── Toolbar.tsx           — Верхняя панель инструментов
│   ├── BottomToolbar.tsx     — Нижняя панель
│   ├── FloatingWindow.tsx    — Плавающие окна
│   ├── WindowManager.tsx     — Менеджер плавающих окон
│   ├── Splitter.tsx          — Разделитель панелей
│   └── modals/
│       ├── ModalManager.tsx          — Роутер модальных окон
│       ├── VehicleDetailsModal.tsx   — Детали ТС + команды
│       ├── TrackDisplayModal.tsx     — Отображение маршрута
│       ├── GeozonesModal.tsx         — Управление геозонами
│       ├── GroupsModal.tsx           — Группы ТС
│       ├── EventsModal.tsx           — Журнал событий
│       ├── NotificationRulesModal.tsx — Правила уведомлений
│       ├── UserSettingsModal.tsx     — Настройки пользователя
│       ├── MovingReportModal.tsx     — Отчёт "движение"
│       ├── ParkingReportModal.tsx    — Отчёт "стоянки"
│       └── FuelingReportModal.tsx    — Отчёт "заправки"
```

---

## 3. Технологии

| Библиотека | Версия | Назначение |
|-----------|--------|-----------|
| React | 19.2 | UI framework |
| TypeScript | 5.9 | Типизация |
| Vite | 7.2 | Сборка и dev server |
| OpenLayers | 10.7 | Карта |
| TanStack Query | 5 | Управление серверным состоянием |
| Zustand | 5 | Клиентское состояние |
| Tailwind CSS | 4 | Стилизация |
| Lucide | - | Иконки |

---

## 4. Zustand Store (appStore.ts)

```typescript
interface AppState {
  // Текущий пользователь
  user: User | null;
  companyId: string;
  
  // Список ТС
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  
  // Карта
  mapCenter: [number, number];
  mapZoom: number;
  
  // Модальные окна
  activeModal: ModalType | null;
  modalProps: Record<string, any>;
  
  // Фильтры
  searchQuery: string;
  showOffline: boolean;
  selectedGroupId: string | null;
  
  // Actions
  selectVehicle: (id: string) => void;
  openModal: (type: ModalType, props?: any) => void;
  closeModal: () => void;
  updateVehicles: (vehicles: Vehicle[]) => void;
}
```

---

## 5. MapView — OpenLayers

```typescript
// Карта инициализируется в MapView.tsx
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({ source: new OSM() }),  // Базовый слой
    vehicleLayer,                          // ТС (маркеры)
    trackLayer,                            // Маршруты (линии)
    geozoneLayer,                          // Геозоны (полигоны)
  ],
  view: new View({
    center: fromLonLat([37.62, 55.75]),    // Москва
    zoom: 10,
  }),
});

// Маркеры ТС обновляются через vehicleSource
// Каждый маркер: Feature с Point geometry + стиль (иконка + текст)
```

---

## 6. API интеграция

Все запросы идут через API Gateway (порт 8080):

```typescript
const API_BASE = '/api';

// TanStack Query пример
const { data: vehicles } = useQuery({
  queryKey: ['vehicles'],
  queryFn: () => fetch(`${API_BASE}/devices`).then(r => r.json()),
  refetchInterval: 5000,  // Обновление каждые 5 сек (polling)
});
```

**Real-time обновление позиций:** пока polling (каждые 5 сек). В Phase 2 → WebSocket.

---

## 7. Как запустить

```bash
cd services/web-frontend
npm install    # или pnpm install
npm run dev    # Vite dev server на порту 3001

# Production build
npm run build  # → dist/
```

---

## 8. Типичные ошибки

| Проблема | Причина | Решение |
|----------|---------|---------|
| Карта пустая | OpenLayers не загрузился / CORS | Проверить CDN и API Gateway CORS |
| ТС не обновляются | Polling не работает / API 401 | Проверить JWT, TanStack Query |
| TypeScript ошибки | Несовпадение типов API | Обновить types/index.ts |

---

*Версия: 1.0 | Обновлён: 2 марта 2026*
