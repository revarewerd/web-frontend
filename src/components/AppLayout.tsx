/**
 * AppLayout — главный layout мониторинга (аналог Ext.container.Viewport)
 *
 * Загружает устройства из Device Manager, подключается к WebSocket
 * для real-time GPS позиций, отображает маркеры на карте OpenLayers.
 *
 * Props:
 *   orgId   — ID организации (из JWT)
 *   role    — роль пользователя (user/admin)
 *   onLogout — callback для выхода из системы
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Toolbar } from './Toolbar';
import { LeftPanel } from './LeftPanel';
import { MapView } from './MapView';
import { Splitter } from './Splitter';
import { BottomToolbar } from './BottomToolbar';
import { WindowManager } from './WindowManager';
import { useAppStore } from '@/store/appStore';
import {
  fetchLiveVehicles,
  fetchLiveGeozones,
  fetchLiveUser,
  fetchLiveUserSettings,
  getLiveUnreadCount,
} from '@/api/liveApi';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { GpsPositionMessage } from '@/hooks/useWebSocket';

interface AppLayoutProps {
  orgId: number;
  role: string;
  onLogout: () => void;
}

export function AppLayout({ orgId, role, onLogout }: AppLayoutProps) {
  const {
    vehicles,
    setVehicles,
    setGeozones,
    setUser,
    setUserSettings,
    setUnreadCount,
    leftPanelCollapsed,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<string>('disconnected');
  const vehiclesRef = useRef(vehicles);
  vehiclesRef.current = vehicles;

  // Callback для обновления GPS позиции на карте
  const handleGpsPosition = useCallback((msg: GpsPositionMessage) => {
    const updated = vehiclesRef.current.map(v => {
      // Совпадение по vehicleId
      if (v.id === msg.vehicleId) {
        return {
          ...v,
          lat: msg.lat,
          lon: msg.lon,
          speed: msg.speed,
          course: msg.course,
          satelliteNum: msg.satellites || v.satelliteNum,
          time: msg.timestamp || Date.now(),
          latestmsg: Date.now(),
        };
      }
      return v;
    });
    setVehicles(updated);
  }, [setVehicles]);

  // Подключаем WebSocket
  const { status: wsConnectionStatus, subscribeOrg } = useWebSocket(
    String(orgId),
    {
      onGpsPosition: handleGpsPosition,
      onStatusChange: (s) => setWsStatus(s),
      onConnected: (connId) => {
        console.log('[AppLayout] WS Connected:', connId);
        // Подписываемся на все ТС организации
        subscribeOrg();
      },
      onError: (msg) => console.error('[AppLayout] WS Error:', msg),
    },
    true // autoConnect
  );

  // Загрузка начальных данных из живых API (устойчивая — каждый запрос отдельно)
  useEffect(() => {
    async function loadInitialData() {
      console.log('[AppLayout] Начинаю загрузку данных, orgId=', orgId);
      const errors: string[] = [];

      // Устройства из Device Manager (главный запрос)
      try {
        const fetchedVehicles = await fetchLiveVehicles(orgId);
        console.log('[AppLayout] Загружено устройств:', fetchedVehicles.length);
        setVehicles(fetchedVehicles);
      } catch (err) {
        const msg = `Устройства: ${err instanceof Error ? err.message : String(err)}`;
        console.error('[AppLayout]', msg);
        errors.push(msg);
      }

      // Геозоны (пока Rule Checker не задеплоен — вернёт [])
      try {
        const geozones = await fetchLiveGeozones(orgId);
        setGeozones(geozones);
      } catch (err) {
        console.warn('[AppLayout] Геозоны недоступны:', err);
      }

      // Пользователь (из localStorage)
      try {
        const user = await fetchLiveUser();
        setUser(user);
      } catch (err) {
        console.warn('[AppLayout] Пользователь:', err);
      }

      // Настройки пользователя
      try {
        const settings = await fetchLiveUserSettings();
        setUserSettings(settings);
      } catch (err) {
        console.warn('[AppLayout] Настройки:', err);
      }

      // Непрочитанные уведомления
      try {
        const count = await getLiveUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.warn('[AppLayout] Уведомления:', err);
      }

      if (errors.length > 0) {
        setLoadError(errors.join('; '));
      }
      setLoading(false);
      console.log('[AppLayout] Загрузка завершена');
    }

    loadInitialData();
  }, [orgId, setVehicles, setGeozones, setUser, setUserSettings, setUnreadCount]);

  if (loading) {
    return (
      <div className="app-viewport" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#666' }}>Загрузка данных...</div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>orgId: {orgId}</div>
        </div>
      </div>
    );
  }

  // Показываем ошибку загрузки, но всё равно рендерим карту (частичные данные лучше пустой страницы)
  const errorBanner = loadError ? (
    <div style={{
      background: '#cc4b37',
      color: '#fff',
      fontSize: 12,
      padding: '4px 12px',
      textAlign: 'center',
    }}>
      ⚠ {loadError}
    </div>
  ) : null;

  return (
    <div className="app-viewport">
      {/* Баннер ошибки загрузки (если есть) */}
      {errorBanner}

      {/* North - Toolbar */}
      <Toolbar />

      {/* WS статус (мини-индикатор) */}
      <div style={{
        position: 'absolute',
        top: 2,
        right: 8,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        color: '#888',
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: wsStatus === 'connected' ? '#5fa339' : wsStatus === 'connecting' ? '#f59e0b' : '#cc4b37',
        }} />
        <span>{wsStatus === 'connected' ? 'Online' : wsStatus === 'connecting' ? 'Connecting...' : 'Offline'}</span>
        <span style={{ color: '#aaa' }}>| {role}</span>
        <button
          onClick={onLogout}
          style={{
            background: 'none',
            border: '1px solid #ccc',
            borderRadius: 3,
            padding: '1px 8px',
            fontSize: 11,
            cursor: 'pointer',
            color: '#666',
          }}
        >
          Выход
        </button>
      </div>

      {/* Main container (west + splitter + center) */}
      <div className="main-container">
        {/* West - Left Panel (ресайзируемая, сворачиваемая) */}
        {!leftPanelCollapsed && <LeftPanel />}

        {/* Splitter (разделитель west/center) */}
        <Splitter />

        {/* Center - Map */}
        <MapView />
      </div>

      {/* South - Bottom Toolbar (таскбар открытых окон) */}
      <BottomToolbar />

      {/* Плавающие окна (без backdrop, поверх всего) */}
      <WindowManager />
    </div>
  );
}
