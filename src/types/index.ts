// Типы для всего приложения

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
  ignition: boolean;
  time: number; // timestamp последнего сообщения
  latestmsg: number;
  satelliteNum: number;
  blocked: boolean;
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
  language?: 'ru' | 'en' | 'es';
  mapType?: 'osm' | 'google' | 'yandex';
  showPopupNotifications?: boolean;
  showUnreadNotificationsCount?: boolean;
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

// === Общие типы ===
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
}

export interface UpdatesResponse {
  newTime: number;
  data: EventMessage[];
  reload: boolean;
}
