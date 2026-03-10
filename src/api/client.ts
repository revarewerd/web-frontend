/**
 * =====================================================
 * API Client — HTTP-клиент для REST API через API Gateway
 * =====================================================
 *
 * Все запросы к бэкендам идут через API Gateway (:8080):
 *   /api/v1/devices/**        → device-manager
 *   /api/v1/history/**        → history-writer
 *   /api/v1/geozones/**       → rule-checker
 *   /api/v1/notifications/**  → notification-service
 *   /api/v1/reports/**        → analytics-service
 *   /api/v1/users/**          → user-service
 *   /api/v1/sensors/**        → sensors-service
 *   /api/v1/maintenance/**    → maintenance-service
 *
 * В dev-режиме: Vite proxy → localhost:8080
 * В Docker: nginx proxy → api-gateway:8080
 *
 * Аутентификация: JWT Bearer token в Authorization header.
 * Токен хранится в localStorage после логина.
 */

// ─── Конфигурация ──────────────────────────────────────────────────────────

/** Базовый URL API (через Vite env или window origin для nginx-прокси) */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/** Ключ для хранения JWT в localStorage */
const TOKEN_KEY = 'wayrecall_jwt_token';

/** Ключ для хранения данных пользователя в localStorage */
const USER_KEY = 'wayrecall_user';

// ─── Работа с токеном ────────────────────────────────────────────────────

/** Получить JWT токен из localStorage */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Сохранить JWT токен в localStorage */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Удалить JWT токен (логаут) */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Проверить, авторизован ли пользователь */
export function isAuthenticated(): boolean {
  return !!getToken();
}

// ─── Типы ответов ────────────────────────────────────────────────────────

/** Стандартный формат ошибки от API Gateway */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  requestId?: string;
}

/** Ответ логина от Auth Service */
export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: {
    userId: string;
    email: string;
    name: string;
    roles: string[];
    companyId: string;
  };
}

// ─── HTTP методы ─────────────────────────────────────────────────────────

/**
 * Базовый fetch с JWT-авторизацией и обработкой ошибок.
 *
 * Если сервер вернул 401 — автоматически чистим токен и редиректим на логин.
 * Если сервер вернул JSON с полем error — бросаем ApiError.
 */
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Добавляем JWT токен если есть
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 401 — токен истёк или невалиден
  if (response.status === 401) {
    clearToken();
    // Перенаправляем на страницу логина (если SPA роутер поддерживает)
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new Error('Не авторизован. Требуется повторный вход.');
  }

  // 204 No Content — нет тела ответа
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  // Проверяем на ошибку от Gateway
  if (!response.ok) {
    const apiError = data as ApiError;
    throw new Error(apiError.message || `Ошибка ${response.status}`);
  }

  return data as T;
}

/** GET запрос */
export function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

/** POST запрос с JSON body */
export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** PUT запрос с JSON body */
export function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** DELETE запрос */
export function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

/** PATCH запрос с JSON body */
export function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ─── Auth API ────────────────────────────────────────────────────────────

/**
 * Логин: POST /api/v1/auth/login
 * Открытый endpoint — JWT не нужен.
 * При успехе сохраняет токен и данные пользователя.
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await post<LoginResponse>('/auth/login', { email, password });
  setToken(data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

/** Логаут — чистим локальное состояние */
export function logout(): void {
  clearToken();
  window.location.href = '/';
}

// ─── Device Manager API ─────────────────────────────────────────────────

/** Получить список устройств */
export function getDevices() {
  return get<unknown[]>('/devices');
}

/** Получить устройство по ID */
export function getDevice(id: string) {
  return get<unknown>(`/devices/${id}`);
}

// ─── History Writer API ─────────────────────────────────────────────────

/** Получить телеметрию за период */
export function getTelemetry(vehicleId: string, from: string, to: string) {
  return get<unknown>(`/history/telemetry/${vehicleId}?from=${from}&to=${to}`);
}

/** Получить список маршрутов (трипов) */
export function getTrips(vehicleId: string, from: string, to: string) {
  return get<unknown>(`/history/trips/${vehicleId}?from=${from}&to=${to}`);
}

// ─── Rule Checker API ───────────────────────────────────────────────────

/** Получить список геозон */
export function getGeozones() {
  return get<unknown[]>('/geozones');
}

/** Создать геозону */
export function createGeozone(geozone: unknown) {
  return post<unknown>('/geozones', geozone);
}

/** Обновить геозону */
export function updateGeozone(id: string, geozone: unknown) {
  return put<unknown>(`/geozones/${id}`, geozone);
}

/** Удалить геозону */
export function deleteGeozone(id: string) {
  return del<void>(`/geozones/${id}`);
}

// ─── Notification Service API ───────────────────────────────────────────

/** Получить правила уведомлений */
export function getNotificationRules() {
  return get<unknown[]>('/notifications/rules');
}

// ─── Analytics Service API ──────────────────────────────────────────────

/** Получить отчёт по движению */
export function getMovingReport(vehicleId: string, from: string, to: string) {
  return get<unknown>(`/reports/moving?vehicleId=${vehicleId}&from=${from}&to=${to}`);
}

/** Получить отчёт по стоянкам */
export function getParkingReport(vehicleId: string, from: string, to: string) {
  return get<unknown>(`/reports/parking?vehicleId=${vehicleId}&from=${from}&to=${to}`);
}

// ─── User Service API ───────────────────────────────────────────────────

/** Получить информацию о текущем пользователе */
export function getMe() {
  return get<unknown>('/users/me');
}

// ─── Health Check ───────────────────────────────────────────────────────

/** Проверить здоровье API Gateway */
export function checkHealth() {
  return fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`)
    .then(r => r.json());
}
