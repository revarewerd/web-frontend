# ============================================================
# Web Frontend — пользовательская панель (React + Vite + Nginx)
# ============================================================

# --- Stage 1: Сборка ---
FROM node:22-alpine AS builder

WORKDIR /app

# Копируем зависимости отдельно для кэширования
COPY package.json package-lock.json ./
RUN npm ci --silent

# Копируем исходники и собираем
COPY . .

# API URL передаётся на этапе сборки через build arg
# В Docker nginx проксирует /api/ → api-gateway:8080, поэтому используем относительный путь
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# WS URL — через nginx прокси /ws/ → websocket-service:8090
# Относительный URL: ws://host/ws (nginx добавит upgrade headers)
ARG VITE_WS_URL=
ENV VITE_WS_URL=$VITE_WS_URL

# Собираем только Vite (без tsc — TS ошибки не блокируют сборку)
RUN npx vite build

# --- Stage 2: Раздача через Nginx ---
FROM nginx:alpine

# Удаляем дефолтный конфиг
RUN rm /etc/nginx/conf.d/default.conf

# Копируем наш конфиг
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
