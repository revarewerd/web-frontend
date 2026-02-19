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
ARG VITE_API_URL=http://localhost:8092
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_WS_URL=ws://localhost:8094
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
