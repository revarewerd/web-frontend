/**
 * AppLayout — главный layout мониторинга (аналог Ext.container.Viewport)
 *
 * Legacy: app.js → Ext.container.Viewport с border layout:
 *   north:  Toolbar (верхняя панель с меню)
 *   west:   LeftPanel (ресайзируемый список объектов/групп)
 *   center: MapView (OpenLayers карта)
 *   south:  BottomToolbar (таскбар открытых окон)
 *
 * Новое: Splitter между west и center для ресайза LeftPanel.
 * WindowManager рендерит плавающие окна поверх всего (без backdrop).
 * CSS: index.css → .app-layout, .left-panel, .map-container
 */
import { useState, useEffect } from 'react';
import { Toolbar } from './Toolbar';
import { LeftPanel } from './LeftPanel';
import { MapView } from './MapView';
import { Splitter } from './Splitter';
import { BottomToolbar } from './BottomToolbar';
import { WindowManager } from './WindowManager';
import { useAppStore } from '@/store/appStore';
import { fetchVehicles, fetchGeozones, fetchCurrentUser, fetchUserSettings, getUnreadMessagesCount } from '@/api/mock';

export function AppLayout() {
  const {
    setVehicles,
    setGeozones,
    setUser,
    setUserSettings,
    setUnreadCount,
    leftPanelCollapsed,
  } = useAppStore();

  const [loading, setLoading] = useState(true);

  // Загрузка начальных данных
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [vehicles, geozones, user, settings, unreadCount] = await Promise.all([
          fetchVehicles(),
          fetchGeozones(),
          fetchCurrentUser(),
          fetchUserSettings(),
          getUnreadMessagesCount(),
        ]);
        
        setVehicles(vehicles);
        setGeozones(geozones);
        setUser(user);
        setUserSettings(settings);
        setUnreadCount(unreadCount);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadInitialData();
  }, [setVehicles, setGeozones, setUser, setUserSettings, setUnreadCount]);

  if (loading) {
    return (
      <div className="app-viewport" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/images/ico24_loading.png" alt="" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 12, color: '#666' }}>Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-viewport">
      {/* North - Toolbar */}
      <Toolbar />
      
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
