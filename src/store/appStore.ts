/**
 * =====================================================
 * Zustand Store — глобальное состояние мониторинга
 * =====================================================
 *
 * Zustand — лёгкий state manager (альтернатива Redux).
 * Использование: const { vehicles, setVehicles } = useAppStore();
 *
 * Legacy аналоги (каждый был отдельным Ext.data.Store):
 *   vehicles        ← EDS.store.MapObjects (mapObjects.loadObjects)
 *   geozones        ← EDS.store.GeozonesData (geozonesData.loadObjects)
 *   events          ← EDS.store.EventsMessages (eventsMessages.loadObjects)
 *   userSettings    ← userInfo.getSettings()
 *
 * Polling (legacy каждые 2 сек):
 *   lastUpdateTime → mapObjects.getUpdatedAfter(timestamp)
 *   unreadCount    → eventsMessages.getUnreadUserMessagesCount()
 *
 * Модальные окна (legacy — Ext.window.Window):
 *   activeModal + modalProps → ModalManager.tsx рендерит нужное окно
 */
import { create } from 'zustand';
import type { Vehicle, Geozone, EventMessage, UserSettings, User } from '@/types';

// Типы модальных окон
export type ModalType = 
  | 'geozones'
  | 'notificationRules'
  | 'userSettings'
  | 'groups'
  | 'events'
  | 'movingReport'
  | 'parkingReport'
  | 'fuelingReport'
  | 'trackDisplay'
  | 'vehicleDetails';

interface AppState {
  // Пользователь
  user: User | null;
  userSettings: UserSettings;
  
  // Объекты (транспорт)
  vehicles: Vehicle[];
  selectedVehicleUids: string[];
  targetedVehicleUids: string[];
  
  // Геозоны
  geozones: Geozone[];
  
  // События/Уведомления
  events: EventMessage[];
  unreadCount: number;
  lastUpdateTime: number;
  
  // UI состояние
  leftPanelWidth: number;
  leftPanelCollapsed: boolean;
  activeTab: 'objects' | 'groups';
  showHiddenObjects: boolean;
  
  // Модальные окна
  activeModal: string | null;
  modalProps: Record<string, unknown>;
  
  // Actions
  setUser: (user: User | null) => void;
  setUserSettings: (settings: UserSettings) => void;
  
  setVehicles: (vehicles: Vehicle[]) => void;
  updateVehicle: (uid: string, updates: Partial<Vehicle>) => void;
  toggleVehicleChecked: (uid: string) => void;
  toggleVehicleTargeted: (uid: string) => void;
  setSelectedVehicleUids: (uids: string[]) => void;
  
  setGeozones: (geozones: Geozone[]) => void;
  addGeozone: (geozone: Geozone) => void;
  updateGeozone: (geozone: Geozone) => void;
  removeGeozone: (id: number) => void;
  
  setEvents: (events: EventMessage[]) => void;
  addEvents: (events: EventMessage[]) => void;
  markEventRead: (eid: number) => void;
  setUnreadCount: (count: number) => void;
  setLastUpdateTime: (time: number) => void;
  
  setLeftPanelWidth: (width: number) => void;
  toggleLeftPanel: () => void;
  setActiveTab: (tab: 'objects' | 'groups') => void;
  setShowHiddenObjects: (show: boolean) => void;
  
  openModal: (modalId: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  userSettings: {
    language: 'ru',
    mapType: 'osm',
    showPopupNotifications: true,
    showUnreadNotificationsCount: true,
  },
  
  vehicles: [],
  selectedVehicleUids: [],
  targetedVehicleUids: [],
  
  geozones: [],
  
  events: [],
  unreadCount: 0,
  lastUpdateTime: Date.now(),
  
  leftPanelWidth: 420,
  leftPanelCollapsed: false,
  activeTab: 'objects',
  showHiddenObjects: false,
  
  activeModal: null,
  modalProps: {},
  
  // Actions
  setUser: (user) => set({ user }),
  setUserSettings: (settings) => set({ userSettings: settings }),
  
  setVehicles: (vehicles) => set({ 
    vehicles,
    selectedVehicleUids: vehicles.filter(v => v.checked).map(v => v.uid),
    targetedVehicleUids: vehicles.filter(v => v.targeted).map(v => v.uid),
  }),
  
  updateVehicle: (uid, updates) => set((state) => ({
    vehicles: state.vehicles.map(v => 
      v.uid === uid ? { ...v, ...updates } : v
    ),
  })),
  
  toggleVehicleChecked: (uid) => set((state) => {
    const vehicle = state.vehicles.find(v => v.uid === uid);
    if (!vehicle) return state;
    
    const newChecked = !vehicle.checked;
    const newSelectedUids = newChecked
      ? [...state.selectedVehicleUids, uid]
      : state.selectedVehicleUids.filter(id => id !== uid);
    
    return {
      vehicles: state.vehicles.map(v => 
        v.uid === uid ? { ...v, checked: newChecked } : v
      ),
      selectedVehicleUids: newSelectedUids,
    };
  }),
  
  toggleVehicleTargeted: (uid) => set((state) => {
    const vehicle = state.vehicles.find(v => v.uid === uid);
    if (!vehicle) return state;
    
    const newTargeted = !vehicle.targeted;
    const newTargetedUids = newTargeted
      ? [...state.targetedVehicleUids, uid]
      : state.targetedVehicleUids.filter(id => id !== uid);
    
    return {
      vehicles: state.vehicles.map(v => 
        v.uid === uid ? { ...v, targeted: newTargeted } : v
      ),
      targetedVehicleUids: newTargetedUids,
    };
  }),
  
  setSelectedVehicleUids: (uids) => set((state) => ({
    selectedVehicleUids: uids,
    vehicles: state.vehicles.map(v => ({
      ...v,
      checked: uids.includes(v.uid),
    })),
  })),
  
  setGeozones: (geozones) => set({ geozones }),
  addGeozone: (geozone) => set((state) => ({ 
    geozones: [...state.geozones, geozone] 
  })),
  updateGeozone: (geozone) => set((state) => ({
    geozones: state.geozones.map(g => g.id === geozone.id ? geozone : g),
  })),
  removeGeozone: (id) => set((state) => ({
    geozones: state.geozones.filter(g => g.id !== id),
  })),
  
  setEvents: (events) => set({ events }),
  addEvents: (newEvents) => set((state) => ({
    events: [...newEvents, ...state.events].slice(0, 500), // Храним максимум 500
  })),
  markEventRead: (eventId) => set((state) => ({
    events: state.events.map(e => 
      e.id === eventId ? { ...e, isRead: true } : e
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setLastUpdateTime: (time) => set({ lastUpdateTime: time }),
  
  setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
  toggleLeftPanel: () => set((state) => ({ leftPanelCollapsed: !state.leftPanelCollapsed })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setShowHiddenObjects: (show) => set({ showHiddenObjects: show }),
  
  openModal: (modalId, props = {}) => set({ activeModal: modalId, modalProps: props }),
  closeModal: () => set({ activeModal: null, modalProps: {} }),
}));
