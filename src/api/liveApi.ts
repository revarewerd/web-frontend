/**
 * Live API — подключение к реальным бэкенд-сервисам
 *
 * MVP: данные устройств из Device Manager + последние GPS позиции из TimescaleDB.
 * Конвертация DM Device → Vehicle (формат для Zustand store и MapView).
 *
 * Без API Gateway: nginx проксирует напрямую:
 *   /api/devices/**     → device-manager:10092/api/devices/**
 *   /api/history/**     → history-writer:10091/api/history/**
 *   /ws/                → websocket-service:8090/ws/
 */

import type { Vehicle, Geozone, User, UserSettings } from '@/types';

// ─── Базовый URL ────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ─── Типы ответов от Device Manager ─────────────────────────────────────

interface DmDevice {
  id: number;
  imei: string;
  name: string;
  protocol: Record<string, unknown> | string;
  status: Record<string, unknown> | string;
  organizationId: number;
  vehicleId: number | null;
  sensorProfileId?: number | null;
  phoneNumber?: string | null;
  firmwareVersion?: string | null;
  lastSeenAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DmVehicle {
  id: number;
  organizationId: number;
  name: string;
  vehicleType: string;
  licensePlate: string;
  vin?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
}

// ─── Запрос к бэкенду ──────────────────────────────────────────────────

async function apiGet<T>(path: string, timeoutMs = 10000): Promise<T> {
  const token = localStorage.getItem('wayrecall_jwt_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // AbortController для таймаута (защита от зависающих запросов)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${path}`, { headers, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Последние GPS позиции из gps_positions (через HW API, если есть) ──

interface LastPosition {
  deviceId: number;
  vehicleId: number;
  imei: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  altitude: number;
  satellites: number;
  time: string;
}

// ─── Загрузка устройств ─────────────────────────────────────────────────

/**
 * Загрузить устройства из Device Manager и преобразовать в Vehicle[].
 * Для MVP: GPS позиции будут приходить через WebSocket.
 * Начальные координаты — из последних gps_positions (если доступен endpoint).
 */
export async function fetchLiveVehicles(orgId: number): Promise<Vehicle[]> {
  const devices = await apiGet<DmDevice[]>(`/devices?organizationId=${orgId}`);

  // Попытаемся получить последние позиции (может не быть endpoint'а)
  let positions: LastPosition[] = [];
  try {
    positions = await apiGet<LastPosition[]>(`/history/latest?organizationId=${orgId}`);
  } catch {
    // HW может не иметь этого endpoint — ничего страшного
    console.log('[LiveAPI] /history/latest недоступен, позиции придут через WS');
  }

  // Индексируем позиции по imei
  const posMap = new Map<string, LastPosition>();
  positions.forEach(p => posMap.set(p.imei, p));

  return devices.map((d, i) => {
    const pos = posMap.get(d.imei);
    const statusStr = typeof d.status === 'string' ? d.status : Object.keys(d.status)[0] || 'Active';

    return {
      id: d.vehicleId || d.id,
      uid: `d${d.id}`,
      name: d.name,
      description: `${d.imei} (${typeof d.protocol === 'string' ? d.protocol : Object.keys(d.protocol)[0]})`,
      imei: d.imei,
      phone: d.phoneNumber || undefined,
      simNumber: undefined,
      modelName: d.firmwareVersion || undefined,
      // GPS данные — из последней позиции или 0 (придут через WS)
      lon: pos?.longitude || 0,
      lat: pos?.latitude || 0,
      speed: pos?.speed || 0,
      course: pos?.course || 0,
      ignition: false,
      time: pos ? new Date(pos.time).getTime() : 0,
      latestmsg: pos ? new Date(pos.time).getTime() : 0,
      satelliteNum: pos?.satellites || 0,
      blocked: statusStr === 'Inactive',
      hidden: false,
      checked: true,
      targeted: false,
      requireMaintenance: false,
      mileage: 0,
      canBlock: true,
      canGetCoords: true,
      canRestartTerminal: false,
      blockingEnabled: false,
      sleeperInfo: null,
      radioUnit: null,
    };
  });
}

// ─── Загрузка геозон (заглушка — Rule Checker не задеплоен) ─────────────

export async function fetchLiveGeozones(_orgId: number): Promise<Geozone[]> {
  // Пока Rule Checker не задеплоен — возвращаем пустой массив
  try {
    return await apiGet<Geozone[]>(`/geozones?organizationId=${_orgId}`);
  } catch {
    return [];
  }
}

// ─── Пользователь (из localStorage, set при логине) ─────────────────────

export async function fetchLiveUser(): Promise<User> {
  const stored = localStorage.getItem('wayrecall_user');
  if (stored) {
    const u = JSON.parse(stored);
    return {
      login: u.name || u.userId,
      name: u.name || 'User',
      balance: undefined,
    };
  }
  return { login: 'User', name: 'User' };
}

export async function fetchLiveUserSettings(): Promise<UserSettings> {
  return {
    molcmpwdth: 280,
    timezone: 'Europe/Moscow',
    language: 'ru',
    mapType: 'osm',
    showPopupNotifications: true,
    showUnreadNotificationsCount: true,
    refreshInterval: 2000,
    showOffline: true,
    soundEnabled: false,
  };
}

export async function getLiveUnreadCount(): Promise<number> {
  return 0;
}
