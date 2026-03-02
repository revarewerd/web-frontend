/**
 * =====================================================
 * Типы данных мониторинга (пользовательская часть)
 * =====================================================
 *
 * Данные приходят из legacy Ext.Direct сервисов:
 *   Vehicle     ← mapObjects.loadObjects()    (MongoDB: objects)
 *   Geozone     ← geozonesData.loadObjects()  (MongoDB: geoZonesState)
 *   EventMessage← eventsMessages.loadObjects() (MongoDB: events)
 *   NotificationRule ← notificationRules.loadObjects()
 *   User/UserSettings ← userInfo.getSettings()
 *
 * В новой архитектуре:
 *   Vehicle → device-manager REST API
 *   Geozone → geozones-service REST API
 *   Events  → notification-service WebSocket
 *   User    → auth-service + user-service
 */

// === Объекты (транспорт) ===
export interface Vehicle {
  id: number;
  uid: string;
  name: string;
  description: string;
  imei: string;
  phone?: string;
  simNumber?: string;
  modelName?: string;
  lon: number;
  lat: number;
  speed: number;
  course: number;
  ignition: boolean | string | number; // может быть 'unknown', 0, 1, true, false
  time: number; // timestamp последнего сообщения
  latestmsg: number;
  satelliteNum: number;
  blocked: boolean | 'wait'; // может быть true, false, или 'wait' (ожидание команды)
  hidden: boolean;
  checked: boolean;
  targeted: boolean;
  requireMaintenance: boolean;
  mileage: number;
  canBlock: boolean;
  canGetCoords: boolean;
  canRestartTerminal: boolean;
  blockingEnabled: boolean;
  sleeperInfo?: SleeperInfo | null;
  radioUnit?: string | null;
}

export interface SleeperInfo {
  loaded: boolean;
  model: string;
  type: string;
  state: string;
  serialNum: string;
  owner: string;
  rights: string;
  instDate: string;
  simNumber: string;
  workDate: string;
  fuelLevel?: number;
  temperature?: number;
}

// === Геозоны ===
export interface Geozone {
  id: number;
  name: string;
  description?: string;
  ftColor: string;
  lineColor?: string;
  speedLimit?: number;
  isPrivate?: boolean;
  points: GeozonePoint[];
}

export interface GeozonePoint {
  x: number;
  y: number;
}

// === События/Уведомления ===
export interface EventMessage {
  id: number;
  vehicleId?: number;
  vehicleName?: string;
  eventType: 'info' | 'warning' | 'alarm';
  message: string;
  timestamp: number;
  isRead: boolean;
  lat?: number;
  lon?: number;
}

// Для совместимости с legacy API
export interface LegacyEventMessage {
  eid: number;
  uid: string;
  name: string;
  text: string;
  time: number;
  type: string;
  user?: string;
  lon?: number;
  lat?: number;
  readStatus: boolean;
  targetId: string;
}

// === Правила уведомлений ===
export interface NotificationRule {
  id: number;
  name: string;
  ruleType: 'speed' | 'geozoneEnter' | 'geozoneExit' | 'ignitionOn' | 'ignitionOff' | 'lowBattery' | 'sos';
  threshold?: number;
  enabled: boolean;
}

// Legacy формат правил
export interface LegacyNotificationRule {
  name: string;
  type: NotificationRuleType;
  allobjects: boolean;
  showmessage: boolean;
  messagemask: string;
  email: string;
  phone: string;
  params: Record<string, unknown>;
  objects: string[];
  action: 'none' | 'block';
}

export type NotificationRuleType = 
  | 'ntfSpeed' 
  | 'ntfGeoZ' 
  | 'ntfData' 
  | 'ntfStop' 
  | 'ntfNoData';

// === Датчики ===
export interface Sensor {
  code: string;
  name: string;
  type?: string;
  unit?: string;
  value?: number | string;
}

export interface SensorType {
  id: string;
  type: string;
  unit: string;
}

// === Позиции/Трек ===
export interface GPSPosition {
  lat: number;
  lon: number;
  timestamp: number;
  speed: number;
  course: number;
  placeName?: string;
  satelliteNum?: number;
}

export interface TrackBounds {
  minlat: number;
  maxlat: number;
  minlon: number;
  maxlon: number;
  first?: { lon: number; lat: number };
  last?: { lon: number; lat: number };
}

// === Отчёты ===
export interface ReportRequest {
  vehicleIds: number[];
  from: number; // timestamp
  to: number;   // timestamp
}

export interface MovingReportItem {
  vehicleId: number;
  vehicleName: string;
  startTime: number;
  endTime: number;
  distance: number;
  duration: number;
  maxSpeed: number;
}

export interface ParkingReportItem {
  vehicleId: number;
  vehicleName: string;
  startTime: number;
  endTime: number;
  duration: number;
  lat: number;
  lon: number;
  address?: string;
}

export interface FuelingReportItem {
  vehicleId: number;
  vehicleName: string;
  timestamp: number;
  volumeBefore: number;
  volumeAfter: number;
  volumeAdded: number;
  lat: number;
  lon: number;
  address?: string;
}

// === Настройки пользователя ===
export interface UserSettings {
  molcmpwdth?: number; // ширина левой панели
  timezone?: string;
  language?: 'ru' | 'en' | 'es' | 'uk' | 'kk';
  mapType?: 'osm' | 'google' | 'yandex' | 'satellite';
  showPopupNotifications?: boolean;
  showUnreadNotificationsCount?: boolean;
  refreshInterval?: number;
  showOffline?: boolean;
  soundEnabled?: boolean;
}

// === Группы объектов ===
export interface VehicleGroup {
  id: number;
  name: string;
  vehicleIds: number[];
}

// === Команды ===
export interface CommandResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// === Аутентификация ===
export interface User {
  login: string;
  name: string;
  balance?: number;
}

// === Оконная система (замена Ext.window.Window) ===

/** Описание типа окна: размеры по умолчанию, иконка, заголовок */
export interface WindowTypeConfig {
  type: string;
  title: string;
  icon?: string;
  defaultWidth: number;
  defaultHeight: number;
  /** Минимальные размеры окна */
  minWidth?: number;
  minHeight?: number;
  /** Можно ли открыть несколько экземпляров этого типа */
  allowMultiple?: boolean;
}

/** Экземпляр открытого окна в менеджере */
export interface WindowInstance {
  /** Уникальный ID экземпляра окна */
  id: string;
  /** Тип окна (geozones, vehicleDetails, etc.) */
  type: string;
  /** Заголовок окна */
  title: string;
  /** Иконка в заголовке */
  icon?: string;
  /** Позиция X (left) в пикселях */
  x: number;
  /** Позиция Y (top) в пикселях */
  y: number;
  /** Ширина окна */
  width: number;
  /** Высота окна */
  height: number;
  /** Окно свёрнуто в таскбар */
  minimized: boolean;
  /** Z-index для порядка наложения окон */
  zIndex: number;
  /** Пропсы для содержимого окна */
  props: Record<string, unknown>;
}

// === Общие типы ===
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
}

export interface UpdatesResponse {
  newTime: number;
  data: LegacyEventMessage[];
  reload: boolean;
}
