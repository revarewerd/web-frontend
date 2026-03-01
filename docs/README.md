# 🗺️ Web Frontend — Веб-интерфейс мониторинга

> Тег: `АКТУАЛЬНО` | Обновлён: `2026-06-02` | Версия: `1.0`

## Обзор

**Web Frontend** — веб-приложение для мониторинга транспорта в реальном времени (Block 3 — Presentation).
React + TypeScript. Карта Leaflet, real-time обновления через WebSocket,
management устройств, геозон, уведомлений и отчётов.

| Параметр | Значение |
|----------|----------|
| **Блок** | 3 — Presentation |
| **Порт** | 3001 (Vite dev), 80 (nginx prod) |
| **Framework** | React 18 + TypeScript 5 |
| **Build** | Vite 5 |
| **State** | Zustand 4 + TanStack Query 5 |
| **Maps** | Leaflet 1.9 |
| **UI** | Tailwind CSS + Shadcn/ui |
| **Charts** | Recharts 2 |

## Основные экраны

| Экран | Описание |
|-------|----------|
| **Login** | Форма логина, JWT аутентификация |
| **Dashboard** | Карта + список устройств + статистика + алерты |
| **Monitoring** | Полноэкранная карта с геозонами, детали устройства, история треков |
| **Reports** | Фильтры, графики (пробег/скорость/топливо), экспорт Excel |
| **Settings** | Профиль, уведомления, компании и пользователи (admin) |

## Связь с backend

| Сервис | Протокол | Назначение |
|--------|----------|------------|
| API Gateway `:8080` | REST/HTTP | Все API запросы (через Axios) |
| WebSocket Service `:8081` | WebSocket | Real-time позиции и алерты |

## Быстрый старт

```bash
# 1. Установить зависимости
cd services/web-frontend
npm install

# 2. Настроить .env
cp .env.example .env
# VITE_API_URL=http://localhost:8080/api/v1
# VITE_WS_URL=ws://localhost:8081/ws

# 3. Запустить dev server
npm run dev

# 4. Открыть в браузере
open http://localhost:3001

# 5. Сборка production
npm run build
npm run preview
```

## Переменные окружения (.env)

| Переменная | По умолчанию | Описание |
|------------|-------------|----------|
| `VITE_API_URL` | `http://localhost:8080/api/v1` | URL API Gateway |
| `VITE_WS_URL` | `ws://localhost:8081/ws` | URL WebSocket Service |
| `VITE_MAP_DEFAULT_CENTER` | `55.7558,37.6173` | Центр карты (Москва) |
| `VITE_MAP_DEFAULT_ZOOM` | `10` | Zoom по умолчанию |
| `VITE_SENTRY_DSN` | — | Sentry для отслеживания ошибок |
| `VITE_ENABLE_ANALYTICS` | `false` | Аналитика пользователей |

## Docker

```bash
# Build
docker build -t wayrecall/web-frontend .

# Run
docker run -p 80:80 wayrecall/web-frontend

# Multi-stage: node:20-alpine → nginx:alpine
```

## Связанные документы

- [ARCHITECTURE.md](ARCHITECTURE.md) — Структура проекта, компоненты, state, WebSocket
- [DECISIONS.md](DECISIONS.md) — Архитектурные решения
- [RUNBOOK.md](RUNBOOK.md) — Запуск, дебаг, ошибки
- [INDEX.md](INDEX.md) — Содержание документации
- [docs/services/WEB_FRONTEND.md](../../../docs/services/WEB_FRONTEND.md) — Системный дизайн-документ
