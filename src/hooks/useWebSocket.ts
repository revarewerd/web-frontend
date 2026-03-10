/**
 * =====================================================
 * useWebSocket — React-хук для WebSocket подключения
 * =====================================================
 *
 * Подключается к WebSocket Service для получения real-time данных:
 *   - GPS позиции транспорта (координаты, скорость, курс)
 *   - События геозон (вход/выход)
 *   - Нарушения правил (превышение скорости)
 *
 * Протокол (WebSocket Service):
 *   Клиент → Сервер: ClientMessage (JSON)
 *     - Subscribe { vehicleIds: [1, 2, 3] }
 *     - SubscribeOrg {}  (все ТС организации)
 *     - Unsubscribe { vehicleIds: [1] }
 *     - UnsubscribeAll {}
 *     - Ping {}
 *
 *   Сервер → Клиент: ServerMessage (JSON)
 *     - Connected { connectionId: "uuid" }
 *     - Subscribed { vehicleIds: [1, 2, 3] }
 *     - Unsubscribed { vehicleIds: [1] }
 *     - GpsPosition { vehicleId, lat, lon, speed, course, timestamp, ... }
 *     - GeozoneEvent { vehicleId, geozoneId, eventType: "enter"|"exit", ... }
 *     - RuleViolation { vehicleId, ruleType, details, ... }
 *     - Pong {}
 *     - Error { message: "..." }
 *
 * Соединение:
 *   URL: ws://host/ws?orgId={orgId}&token={jwt}    (через nginx-прокси)
 *   или: ws://host:8090/ws?orgId={orgId}            (прямое для dev)
 *
 * Reconnect:
 *   Автоматический экспоненциальный backoff (1с → 2с → 4с → 8с → max 30с).
 *   При потере соединения хук пытается переподключиться.
 *
 * Ping/Pong:
 *   Каждые 30 секунд отправляется Ping для поддержания соединения.
 *   Если Pong не получен за 10с — считаем соединение мёртвым → reconnect.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { getToken } from '@/api/client';

// ─── Конфигурация ──────────────────────────────────────────────────────────

/** URL WebSocket Service (через Vite env или относительный путь для nginx-прокси) */
const WS_BASE_URL = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

/** Интервал Ping (мс) — поддержание соединения */
const PING_INTERVAL_MS = 30_000;

/** Таймаут ожидания Pong (мс) — если не ответил, reconnect */
const PONG_TIMEOUT_MS = 10_000;

/** Минимальная задержка перед reconnect (мс) */
const RECONNECT_MIN_MS = 1_000;

/** Максимальная задержка перед reconnect (мс) */
const RECONNECT_MAX_MS = 30_000;

// ─── Типы сообщений ────────────────────────────────────────────────────────

/**
 * Типы сообщений от сервера
 * (соответствуют @jsonHint в Messages.scala WS-сервиса)
 */
export type ServerMessageType =
  | 'connected'
  | 'subscribed'
  | 'unsubscribed'
  | 'position'
  | 'geoEvent'
  | 'speedAlert'
  | 'pong'
  | 'error';

/** Базовый интерфейс сообщения от WS сервера */
export interface ServerMessage {
  type: ServerMessageType;
  [key: string]: unknown;
}

/**
 * GPS позиция от WS сервера.
 * Сервер отправляет: latitude, longitude, timestamp (ISO Instant).
 * Хук конвертирует в lat, lon, timestamp (epoch ms) для удобства фронтенда.
 */
export interface GpsPositionMessage {
  type: 'position';
  vehicleId: number;
  deviceId: number;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  satellites: number;
  timestamp: number;
  serverTimestamp: number;
}

/** Событие геозоны (enter/leave) — формат @jsonHint("geoEvent") */
export interface GeozoneEventMessage extends ServerMessage {
  type: 'geoEvent';
  eventType: string;
  vehicleId: number;
  geozoneId: number;
  geozoneName: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string; // ISO Instant
}

/** Алерт превышения скорости — формат @jsonHint("speedAlert") */
export interface SpeedAlertMessage extends ServerMessage {
  type: 'speedAlert';
  vehicleId: number;
  currentSpeed: number;
  maxSpeed: number;
  latitude: number;
  longitude: number;
  timestamp: string; // ISO Instant
}

/** Статус WebSocket соединения */
export type WsConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

/** Callback-и для обработки сообщений */
export interface WsCallbacks {
  /** Новая GPS позиция (вызывается часто — каждые 1-60 сек на каждое ТС) */
  onGpsPosition?: (msg: GpsPositionMessage) => void;
  /** Событие геозоны (вход/выход) */
  onGeozoneEvent?: (msg: GeozoneEventMessage) => void;
  /** Алерт превышения скорости */
  onSpeedAlert?: (msg: SpeedAlertMessage) => void;
  /** Соединение установлено */
  onConnected?: (connectionId: string) => void;
  /** Ошибка от сервера */
  onError?: (message: string) => void;
  /** Изменение статуса соединения */
  onStatusChange?: (status: WsConnectionStatus) => void;
}

// ─── React Hook ────────────────────────────────────────────────────────────

/**
 * React-хук для WebSocket подключения к GPS tracking.
 *
 * @param orgId - ID организации (для multi-tenant фильтрации на сервере)
 * @param callbacks - обработчики входящих сообщений
 * @param autoConnect - автоматически подключаться при mount (default: true)
 *
 * @returns {object}
 *   - status: текущий статус соединения
 *   - subscribe(vehicleIds): подписаться на конкретные ТС
 *   - subscribeOrg(): подписаться на все ТС организации
 *   - unsubscribe(vehicleIds): отписаться от ТС
 *   - unsubscribeAll(): отписаться от всех ТС
 *   - connect(): ручное подключение
 *   - disconnect(): ручное отключение
 *
 * @example
 * ```tsx
 * function MapView() {
 *   const { status, subscribeOrg } = useWebSocket('org-123', {
 *     onGpsPosition: (pos) => updateVehicleOnMap(pos),
 *     onGeozoneEvent: (evt) => showGeozoneAlert(evt),
 *   });
 *
 *   useEffect(() => { subscribeOrg(); }, [subscribeOrg]);
 *
 *   return <div>WS: {status}</div>;
 * }
 * ```
 */
export function useWebSocket(orgId: string, callbacks: WsCallbacks, autoConnect = true) {
  const [status, setStatus] = useState<WsConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbacksRef = useRef(callbacks);
  const isManualDisconnect = useRef(false);

  // Обновляем callbacks ref без перерендера
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // ─── Утилиты ───────────────────────────────────────────────────────────

  /** Отправить JSON-сообщение в WebSocket */
  const send = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  /** Очистить все таймеры */
  const clearTimers = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // ─── Управление Ping/Pong ─────────────────────────────────────────────

  /** Запустить Ping/Pong heartbeat */
  const startPingPong = useCallback(() => {
    pingIntervalRef.current = setInterval(() => {
      send({ type: 'ping' });

      // Ожидаем Pong в течение 10с — иначе reconnect
      pongTimeoutRef.current = setTimeout(() => {
        console.warn('[WS] Pong не получен — закрываю соединение');
        wsRef.current?.close();
      }, PONG_TIMEOUT_MS);
    }, PING_INTERVAL_MS);
  }, [send]);

  // ─── Reconnect с экспоненциальным backoff ──────────────────────────────

  const scheduleReconnect = useCallback(() => {
    if (isManualDisconnect.current) return;

    const attempt = reconnectAttemptRef.current;
    const delay = Math.min(RECONNECT_MIN_MS * Math.pow(2, attempt), RECONNECT_MAX_MS);
    reconnectAttemptRef.current = attempt + 1;

    console.log(`[WS] Reconnect через ${delay}ms (попытка ${attempt + 1})`);
    setStatus('reconnecting');
    callbacksRef.current.onStatusChange?.('reconnecting');

    reconnectTimeoutRef.current = setTimeout(() => {
      connect(); // eslint-disable-line @typescript-eslint/no-use-before-define
    }, delay);
  }, []); // connect будет в ref

  // ─── Подключение ──────────────────────────────────────────────────────

  const connect = useCallback(() => {
    // Закрываем предыдущее соединение если есть
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
    }

    isManualDisconnect.current = false;
    setStatus('connecting');
    callbacksRef.current.onStatusChange?.('connecting');

    // Формируем URL с orgId и JWT token
    const token = getToken();
    const params = new URLSearchParams({ orgId });
    if (token) params.set('token', token);
    const url = `${WS_BASE_URL}?${params.toString()}`;

    console.log(`[WS] Подключаюсь к ${WS_BASE_URL}?orgId=${orgId}`);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Соединение установлено');
      reconnectAttemptRef.current = 0; // Сбрасываем счётчик попыток
      startPingPong();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        handleMessage(msg);
      } catch (err) {
        console.error('[WS] Ошибка парсинга сообщения:', err);
      }
    };

    ws.onclose = (event) => {
      console.log(`[WS] Соединение закрыто: code=${event.code} reason=${event.reason}`);
      clearTimers();
      setStatus('disconnected');
      callbacksRef.current.onStatusChange?.('disconnected');

      // Автореконнект (если не ручное закрытие)
      if (!isManualDisconnect.current) {
        scheduleReconnect();
      }
    };

    ws.onerror = (event) => {
      console.error('[WS] Ошибка WebSocket:', event);
    };
  }, [orgId, startPingPong, clearTimers, scheduleReconnect]);

  // ─── Обработка входящих сообщений ─────────────────────────────────────

  /** Конвертация ISO Instant → epoch ms */
  const parseTimestamp = (ts: unknown): number => {
    if (typeof ts === 'number') return ts;
    if (typeof ts === 'string') return new Date(ts).getTime();
    return Date.now();
  };

  const handleMessage = (msg: ServerMessage) => {
    switch (msg.type) {
      case 'connected':
        setStatus('connected');
        callbacksRef.current.onStatusChange?.('connected');
        callbacksRef.current.onConnected?.(msg.connectionId as string);
        break;

      case 'position': {
        // Сервер шлёт latitude/longitude, конвертируем → lat/lon + timestamp → epoch ms
        const raw = msg as Record<string, unknown>;
        const gpsMsg: GpsPositionMessage = {
          type: 'position',
          vehicleId: raw.vehicleId as number,
          deviceId: raw.deviceId as number,
          lat: raw.latitude as number,
          lon: raw.longitude as number,
          speed: raw.speed as number,
          course: (raw.course as number) ?? 0,
          satellites: (raw.satellites as number) ?? 0,
          timestamp: parseTimestamp(raw.timestamp),
          serverTimestamp: parseTimestamp(raw.serverTimestamp),
        };
        callbacksRef.current.onGpsPosition?.(gpsMsg);
        break;
      }

      case 'geoEvent':
        callbacksRef.current.onGeozoneEvent?.(msg as GeozoneEventMessage);
        break;

      case 'speedAlert':
        callbacksRef.current.onSpeedAlert?.(msg as SpeedAlertMessage);
        break;

      case 'pong':
        // Сбрасываем таймаут ожидания Pong
        if (pongTimeoutRef.current) {
          clearTimeout(pongTimeoutRef.current);
          pongTimeoutRef.current = null;
        }
        break;

      case 'error':
        console.error('[WS] Ошибка от сервера:', msg.message);
        callbacksRef.current.onError?.(msg.message as string);
        break;

      case 'subscribed':
      case 'unsubscribed':
        // Информационные — логируем
        console.log(`[WS] ${msg.type}:`, msg);
        break;

      default:
        console.warn('[WS] Неизвестный тип сообщения:', msg.type);
    }
  };

  // ─── Публичные методы ─────────────────────────────────────────────────

  /** Подписаться на GPS позиции конкретных ТС */
  const subscribe = useCallback((vehicleIds: number[]) => {
    send({ type: 'subscribe', vehicleIds });
  }, [send]);

  /** Подписаться на ВСЕ ТС организации */
  const subscribeOrg = useCallback(() => {
    send({ type: 'subscribeOrg' });
  }, [send]);

  /** Отписаться от конкретных ТС */
  const unsubscribe = useCallback((vehicleIds: number[]) => {
    send({ type: 'unsubscribe', vehicleIds });
  }, [send]);

  /** Отписаться от всех ТС */
  const unsubscribeAll = useCallback(() => {
    send({ type: 'unsubscribeAll' });
  }, [send]);

  /** Ручное отключение (без автореконнекта) */
  const disconnect = useCallback(() => {
    isManualDisconnect.current = true;
    clearTimers();
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setStatus('disconnected');
  }, [clearTimers]);

  // ─── Lifecycle ────────────────────────────────────────────────────────

  useEffect(() => {
    if (autoConnect && orgId) {
      connect();
    }

    // Cleanup при unmount
    return () => {
      isManualDisconnect.current = true;
      clearTimers();
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount');
      }
    };
  }, [orgId, autoConnect]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    /** Текущий статус WS соединения */
    status,
    /** Подписаться на конкретные ТС по ID */
    subscribe,
    /** Подписаться на все ТС организации */
    subscribeOrg,
    /** Отписаться от конкретных ТС */
    unsubscribe,
    /** Отписаться от всех */
    unsubscribeAll,
    /** Ручное подключение */
    connect,
    /** Ручное отключение */
    disconnect,
  };
}
