// Основной Layout приложения (как в ExtJS: border layout)
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
    leftPanelWidth,
    leftPanelCollapsed,
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
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#15498b' }}>Загрузка...</div>
        </div>
      </div>
    );
  }

  const effectiveLeftWidth = leftPanelCollapsed ? 0 : leftPanelWidth;

  return (
    <div className="app-container">
      {/* North - Toolbar */}
      <Toolbar />
      
      {/* Center container */}
      <div className="main-content">
        {/* West - Left Panel */}
        <div 
          className="left-panel"
          style={{ width: effectiveLeftWidth, transition: 'width 0.2s' }}
        >
          <LeftPanel />
        </div>
        
        {/* Center - Map */}
        <div className="map-container">
          <MapView />
        </div>
      </div>
      
      {/* South - Bottom Toolbar */}
      <BottomToolbar />
      
      {/* Modals */}
      <ModalManager />
    </div>
  );
}
