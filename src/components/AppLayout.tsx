/**
 * AppLayout — главный layout мониторинга (аналог Ext.container.Viewport)
 *
 * Legacy: app.js → Ext.container.Viewport с border layout:
 *   north:  Toolbar (верхняя панель с меню)
 *   west:   LeftPanel 420px (список объектов/групп)
 *   center: MapView (OpenLayers карта)
 *   south:  BottomToolbar (таскбар открытых окон)
 *
 * + ModalManager — рендерит модальные окна поверх всего.
 * CSS: index.css → .app-layout, .left-panel, .map-container
 */
// region: west = leftpanel (width: 420)
// region: center = mainmap
// region: south = reporttoolbar

import { useState, useEffect } from 'react';
import { Toolbar } from './Toolbar';
import { LeftPanel } from './LeftPanel';
import { MapView } from './MapView';
import { BottomToolbar } from './BottomToolbar';
import { ModalManager } from './modals/ModalManager';
import { useAppStore } from '@/store/appStore';
import { fetchVehicles, fetchGeozones, fetchCurrentUser, fetchUserSettings, getUnreadMessagesCount } from '@/api/mock';

export function AppLayout() {
  const {
    setVehicles,
    setGeozones,
    setUser,
    setUserSettings,
    setUnreadCount,
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
      
      {/* Main container (center + west) */}
      <div className="main-container">
        {/* West - Left Panel (width: 420 как в оригинале) */}
        <LeftPanel />
        
        {/* Center - Map */}
        <MapView />
      </div>
      
      {/* South - Bottom Toolbar */}
      <BottomToolbar />
      
      {/* Modals */}
      <ModalManager />
    </div>
  );
}
