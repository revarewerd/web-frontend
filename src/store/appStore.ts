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
 * Оконная система (legacy — Ext.window.Window):
 *   windows[] — массив WindowInstance, каждое окно перетаскиваемое,
 *   ресайзируемое, сворачиваемое. Заменяет activeModal + modalProps.
 *   BottomToolbar — таскбар как в Windows для свёрнутых/открытых окон.
 */
import { create } from 'zustand';
import type { Vehicle, Geozone, EventMessage, UserSettings, User, WindowInstance } from '@/types';

// Конфиг по умолчанию для каждого типа окна
const WINDOW_DEFAULTS: Record<string, { title: string; icon?: string; width: number; height: number }> = {
  'geozones':            { title: 'Геозоны',               icon: '/images/ico16_geozone.png',    width: 700, height: 500 },
  'notification-rules':  { title: 'Правила уведомлений',   icon: '/images/ico16_edit_def.png',   width: 650, height: 450 },
  'notificationRules':   { title: 'Правила уведомлений',   icon: '/images/ico16_edit_def.png',   width: 650, height: 450 },
  'user-settings':       { title: 'Настройки пользователя',icon: '/images/ico16_options.png',    width: 500, height: 400 },
  'userSettings':        { title: 'Настройки пользователя',icon: '/images/ico16_options.png',    width: 500, height: 400 },
  'vehicle-groups':      { title: 'Группы объектов',       icon: '/images/ico16_car_def.png',    width: 550, height: 400 },
  'groups':              { title: 'Группы объектов',       icon: '/images/ico16_car_def.png',    width: 550, height: 400 },
  'events-history':      { title: 'История событий',       icon: '/images/ico16_eventsmsgs.png', width: 700, height: 450 },
  'events':              { title: 'История событий',       icon: '/images/ico16_eventsmsgs.png', width: 700, height: 450 },
  'report-moving':       { title: 'Отчёт движения',       icon: '/images/ico16_report.png',     width: 750, height: 500 },
  'movingReport':        { title: 'Отчёт движения',       icon: '/images/ico16_report.png',     width: 750, height: 500 },
  'report-parking':      { title: 'Отчёт стоянок',        icon: '/images/ico16_report.png',     width: 750, height: 500 },
  'parkingReport':       { title: 'Отчёт стоянок',        icon: '/images/ico16_report.png',     width: 750, height: 500 },
  'report-fueling':      { title: 'Отчёт заправок',       icon: '/images/ico16_report.png',     width: 700, height: 450 },
  'fuelingReport':       { title: 'Отчёт заправок',       icon: '/images/ico16_report.png',     width: 700, height: 450 },
  'report-general':      { title: 'Общий отчёт',          icon: '/images/ico16_report.png',     width: 750, height: 500 },
  'report-fuel':         { title: 'Топливный отчёт',      icon: '/images/ico16_report.png',     width: 750, height: 500 },
  'report-group':        { title: 'Групповой отчёт',      icon: '/images/ico16_report.png',     width: 750, height: 500 },
  'report-address':      { title: 'Адресный отчёт',       icon: '/images/ico16_report.png',     width: 700, height: 450 },
  'trackDisplay':        { title: 'Трек',                  icon: '/images/ico16_route.png',      width: 350, height: 300 },
  'vehicleDetails':      { title: 'Информация об объекте', icon: '/images/ico16_car_def.png',    width: 450, height: 500 },
  'support-new':         { title: 'Новый запрос',          icon: '/images/ico16_edit_def.png',   width: 500, height: 400 },
  'support-list':        { title: 'Мои запросы',           icon: '/images/ico16_eventsmsgs.png', width: 600, height: 450 },
  'subscription-fee':    { title: 'Абонплата',             icon: '/images/ico16_report.png',     width: 600, height: 400 },
  'notification-cost':   { title: 'Стоимость уведомлений', icon: '/images/ico16_report.png',     width: 600, height: 400 },
  'top-up-balance':      { title: 'Пополнить баланс',     icon: '/images/ico16_report.png',     width: 450, height: 350 },
  'notification-settings': { title: 'Настройки уведомлений', icon: '/images/ico16_options.png',  width: 500, height: 400 },
};

// Счётчик для уникальных ID окон
let windowCounter = 0;
// Счётчик для z-index — всегда растёт
let zIndexCounter = 100;

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
  
  // Оконная система (заменяет activeModal / modalProps)
  windows: WindowInstance[];
  /** ID активного (фокусированного) окна */
  activeWindowId: string | null;
  
  // Обратная совместимость (для компонентов, использующих openModal/closeModal)
  /** @deprecated используй openWindow / closeWindow */
  activeModal: string | null;
  /** @deprecated используй openWindow / closeWindow */
  modalProps: Record<string, unknown>;
  
  // Actions — пользователь
  setUser: (user: User | null) => void;
  setUserSettings: (settings: UserSettings) => void;
  
  // Actions — объекты
  setVehicles: (vehicles: Vehicle[]) => void;
  updateVehicle: (uid: string, updates: Partial<Vehicle>) => void;
  toggleVehicleChecked: (uid: string) => void;
  toggleVehicleTargeted: (uid: string) => void;
  setSelectedVehicleUids: (uids: string[]) => void;
  
  // Actions — геозоны
  setGeozones: (geozones: Geozone[]) => void;
  addGeozone: (geozone: Geozone) => void;
  updateGeozone: (geozone: Geozone) => void;
  removeGeozone: (id: number) => void;
  
  // Actions — события
  setEvents: (events: EventMessage[]) => void;
  addEvents: (events: EventMessage[]) => void;
  markEventRead: (eid: number) => void;
  setUnreadCount: (count: number) => void;
  setLastUpdateTime: (time: number) => void;
  
  // Actions — UI
  setLeftPanelWidth: (width: number) => void;
  toggleLeftPanel: () => void;
  setActiveTab: (tab: 'objects' | 'groups') => void;
  setShowHiddenObjects: (show: boolean) => void;
  
  // Actions — оконная система
  /** Открыть новое окно (аналог Ext.create('Ext.window.Window')) */
  openWindow: (type: string, props?: Record<string, unknown>, config?: Partial<WindowInstance>) => string;
  /** Закрыть окно по id */
  closeWindow: (id: string) => void;
  /** Свернуть окно в таскбар */
  minimizeWindow: (id: string) => void;
  /** Развернуть окно из таскбара */
  restoreWindow: (id: string) => void;
  /** Поднять окно наверх (z-index) при клике */
  bringToFront: (id: string) => void;
  /** Обновить позицию окна (после перетаскивания) */
  updateWindowPosition: (id: string, x: number, y: number) => void;
  /** Обновить размер окна (после ресайза) */
  updateWindowSize: (id: string, width: number, height: number) => void;
  /** Свернуть все окна */
  minimizeAllWindows: () => void;
  
  // Обратная совместимость
  /** @deprecated используй openWindow */
  openModal: (modalId: string, props?: Record<string, unknown>) => void;
  /** @deprecated используй closeWindow */
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
  
  windows: [],
  activeWindowId: null,
  
  activeModal: null,
  modalProps: {},
  
  // Actions — пользователь
  setUser: (user) => set({ user }),
  setUserSettings: (settings) => set({ userSettings: settings }),
  
  // Actions — объекты
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
  
  // Actions — геозоны
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
  
  // Actions — события
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
  
  // Actions — UI
  setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
  toggleLeftPanel: () => set((state) => ({ leftPanelCollapsed: !state.leftPanelCollapsed })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setShowHiddenObjects: (show) => set({ showHiddenObjects: show }),
  
  // Actions — оконная система
  openWindow: (type, props = {}, config = {}) => {
    const id = `win-${++windowCounter}-${Date.now()}`;
    const defaults = WINDOW_DEFAULTS[type] || { title: type, width: 500, height: 400 };
    const z = ++zIndexCounter;
    
    // Каскадное смещение: каждое новое окно сдвигается на 30px
    const state = get();
    const offset = (state.windows.length % 10) * 30;
    
    const newWindow: WindowInstance = {
      id,
      type,
      title: config.title || defaults.title,
      icon: config.icon || defaults.icon,
      x: config.x ?? (Math.max(100, (window.innerWidth - defaults.width) / 2) + offset),
      y: config.y ?? (Math.max(60, (window.innerHeight - defaults.height) / 2) + offset),
      width: config.width || defaults.width,
      height: config.height || defaults.height,
      minimized: false,
      zIndex: z,
      props,
    };
    
    set((state) => ({
      windows: [...state.windows, newWindow],
      activeWindowId: id,
      // Обратная совместимость
      activeModal: type,
      modalProps: props,
    }));
    
    return id;
  },
  
  closeWindow: (id) => set((state) => {
    const remaining = state.windows.filter(w => w.id !== id);
    // Активируем предыдущее окно в стеке
    const topWindow = remaining
      .filter(w => !w.minimized)
      .sort((a, b) => b.zIndex - a.zIndex)[0];
    
    return {
      windows: remaining,
      activeWindowId: topWindow?.id || null,
      // Обратная совместимость
      activeModal: remaining.length > 0 ? remaining[remaining.length - 1].type : null,
      modalProps: remaining.length > 0 ? remaining[remaining.length - 1].props : {},
    };
  }),
  
  minimizeWindow: (id) => set((state) => {
    const remaining = state.windows.map(w => 
      w.id === id ? { ...w, minimized: true } : w
    );
    // Активируем следующее видимое окно
    const topVisible = remaining
      .filter(w => !w.minimized)
      .sort((a, b) => b.zIndex - a.zIndex)[0];
    
    return {
      windows: remaining,
      activeWindowId: topVisible?.id || null,
    };
  }),
  
  restoreWindow: (id) => {
    const z = ++zIndexCounter;
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, minimized: false, zIndex: z } : w
      ),
      activeWindowId: id,
    }));
  },
  
  bringToFront: (id) => {
    const z = ++zIndexCounter;
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, zIndex: z } : w
      ),
      activeWindowId: id,
    }));
  },
  
  updateWindowPosition: (id, x, y) => set((state) => ({
    windows: state.windows.map(w =>
      w.id === id ? { ...w, x, y } : w
    ),
  })),
  
  updateWindowSize: (id, width, height) => set((state) => ({
    windows: state.windows.map(w =>
      w.id === id ? { ...w, width, height } : w
    ),
  })),
  
  minimizeAllWindows: () => set((state) => ({
    windows: state.windows.map(w => ({ ...w, minimized: true })),
    activeWindowId: null,
  })),
  
  // Обратная совместимость — openModal теперь открывает окно
  openModal: (modalId, props = {}) => {
    get().openWindow(modalId, props);
  },
  
  closeModal: () => {
    const state = get();
    // Закрываем последнее открытое окно (для обратной совместимости)
    if (state.windows.length > 0) {
      const lastWindow = state.windows[state.windows.length - 1];
      get().closeWindow(lastWindow.id);
    } else {
      set({ activeModal: null, modalProps: {} });
    }
  },
}));
