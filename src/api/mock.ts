// API заглушки (моки) - имитация backend API
import type {
  Vehicle,
  Geozone,
  EventMessage,
  NotificationRule,
  Sensor,
  SensorType,
  GPSPosition,
  TrackBounds,
  UserSettings,
  VehicleGroup,
  CommandResponse,
  User,
  UpdatesResponse,
  MovingReportItem,
  ParkingReportItem,
  FuelingReportItem,
} from '@/types';

// Симуляция задержки сети
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// === Mock Data ===

const mockVehicles: Vehicle[] = [
  {
    id: 1,
    uid: 'o1001',
    name: 'КамАЗ-001',
    description: 'Самосвал КамАЗ 65115',
    imei: '860719020025346',
    phone: '+79001234567',
    simNumber: '89991234567',
    modelName: 'Teltonika FMB920',
    lon: 37.6156,
    lat: 55.7522,
    speed: 45,
    course: 90,
    ignition: true,
    time: Date.now() - 30000,
    latestmsg: Date.now() - 30000,
    satelliteNum: 12,
    blocked: false,
    hidden: false,
    checked: true,
    targeted: false,
    requireMaintenance: false,
    mileage: 125400,
    canBlock: true,
    canGetCoords: true,
    canRestartTerminal: true,
    blockingEnabled: true,
    sleeperInfo: null,
    radioUnit: null,
  },
  {
    id: 2,
    uid: 'o1002',
    name: 'ГАЗель-002',
    description: 'ГАЗель NEXT',
    imei: '860719020025347',
    phone: '+79001234568',
    simNumber: '89991234568',
    modelName: 'Teltonika FMB920',
    lon: 37.5891,
    lat: 55.7344,
    speed: 0,
    course: 180,
    ignition: false,
    time: Date.now() - 600000,
    latestmsg: Date.now() - 600000,
    satelliteNum: 8,
    blocked: false,
    hidden: false,
    checked: true,
    targeted: false,
    requireMaintenance: true,
    mileage: 87600,
    canBlock: true,
    canGetCoords: true,
    canRestartTerminal: false,
    blockingEnabled: false,
    sleeperInfo: null,
    radioUnit: null,
  },
  {
    id: 3,
    uid: 'o1003',
    name: 'МАЗ-003',
    description: 'Фура МАЗ',
    imei: '860719020025348',
    phone: '+79001234569',
    simNumber: '89991234569',
    modelName: 'Wialon Ruptela',
    lon: 37.6421,
    lat: 55.7689,
    speed: 72,
    course: 45,
    ignition: true,
    time: Date.now() - 15000,
    latestmsg: Date.now() - 15000,
    satelliteNum: 14,
    blocked: false,
    hidden: false,
    checked: false,
    targeted: true,
    requireMaintenance: false,
    mileage: 245800,
    canBlock: true,
    canGetCoords: true,
    canRestartTerminal: true,
    blockingEnabled: true,
    sleeperInfo: null,
    radioUnit: null,
  },
  {
    id: 4,
    uid: 'o1004',
    name: 'Лада Ларгус-004',
    description: 'Служебный автомобиль',
    imei: '860719020025349',
    phone: '+79001234570',
    simNumber: '89991234570',
    modelName: 'Teltonika FMB920',
    lon: 37.5512,
    lat: 55.7123,
    speed: 28,
    course: 270,
    ignition: true,
    time: Date.now() - 45000,
    latestmsg: Date.now() - 45000,
    satelliteNum: 10,
    blocked: false,
    hidden: false,
    checked: true,
    targeted: false,
    requireMaintenance: false,
    mileage: 54200,
    canBlock: false,
    canGetCoords: true,
    canRestartTerminal: false,
    blockingEnabled: false,
    sleeperInfo: null,
    radioUnit: null,
  },
  {
    id: 5,
    uid: 'o1005',
    name: 'Экскаватор JCB-005',
    description: 'Экскаватор-погрузчик',
    imei: '860719020025350',
    phone: '+79001234571',
    simNumber: '89991234571',
    modelName: 'Wialon Ruptela',
    lon: 37.6789,
    lat: 55.7890,
    speed: 0,
    course: 0,
    ignition: false,
    time: Date.now() - 3600000,
    latestmsg: Date.now() - 3600000,
    satelliteNum: 6,
    blocked: true,
    hidden: true,
    checked: false,
    targeted: false,
    requireMaintenance: true,
    mileage: 3200,
    canBlock: true,
    canGetCoords: true,
    canRestartTerminal: true,
    blockingEnabled: true,
    sleeperInfo: null,
    radioUnit: null,
  },
];

const mockGeozones: Geozone[] = [
  {
    id: 1,
    name: 'Склад №1',
    ftColor: '#FF0000',
    points: [
      { x: 37.61, y: 55.75 },
      { x: 37.62, y: 55.75 },
      { x: 37.62, y: 55.76 },
      { x: 37.61, y: 55.76 },
    ],
  },
  {
    id: 2,
    name: 'Офис',
    ftColor: '#00FF00',
    points: [
      { x: 37.58, y: 55.73 },
      { x: 37.59, y: 55.73 },
      { x: 37.59, y: 55.74 },
      { x: 37.58, y: 55.74 },
    ],
  },
  {
    id: 3,
    name: 'Заправка Лукойл',
    ftColor: '#0000FF',
    points: [
      { x: 37.55, y: 55.71 },
      { x: 37.56, y: 55.71 },
      { x: 37.56, y: 55.72 },
      { x: 37.55, y: 55.72 },
    ],
  },
];

const mockEvents: EventMessage[] = [
  {
    eid: 1,
    uid: 'o1001',
    name: 'КамАЗ-001',
    text: 'Вход в геозону: Склад №1',
    time: Date.now() - 120000,
    type: 'geozone_enter',
    readStatus: false,
    targetId: 'user1',
    lon: 37.615,
    lat: 55.752,
  },
  {
    eid: 2,
    uid: 'o1003',
    name: 'МАЗ-003',
    text: 'Превышение скорости: 85 км/ч',
    time: Date.now() - 300000,
    type: 'speed_violation',
    readStatus: false,
    targetId: 'user1',
    lon: 37.642,
    lat: 55.768,
  },
  {
    eid: 3,
    uid: 'o1002',
    name: 'ГАЗель-002',
    text: 'Требуется техобслуживание',
    time: Date.now() - 600000,
    type: 'maintenance',
    readStatus: true,
    targetId: 'user1',
  },
];

const mockNotificationRules: NotificationRule[] = [
  {
    name: 'Превышение скорости',
    type: 'ntfSpeed',
    allobjects: true,
    showmessage: true,
    messagemask: 'Скорость {speed} км/ч',
    email: 'admin@example.com',
    phone: '+79001234567',
    params: { maxSpeed: 90 },
    objects: [],
    action: 'none',
  },
  {
    name: 'Вход на склад',
    type: 'ntfGeoZ',
    allobjects: false,
    showmessage: true,
    messagemask: 'Объект {name} вошёл в {geozone}',
    email: '',
    phone: '',
    params: { geozoneId: 1, onEnter: true },
    objects: ['o1001', 'o1003'],
    action: 'none',
  },
];

const mockSensorTypes: SensorType[] = [
  { id: 'sFuelL', type: 'Уровень топлива', unit: 'л' },
  { id: 'sFuelLP', type: 'Уровень топлива %', unit: '%' },
  { id: 'sTmp', type: 'Температура', unit: '°C' },
  { id: 'sEngS', type: 'Обороты двигателя', unit: 'об/мин' },
  { id: 'sIgn', type: 'Зажигание', unit: '' },
  { id: 'sPwr', type: 'Напряжение', unit: 'В' },
  { id: 'sDist', type: 'Пробег', unit: 'км' },
];

const mockUser: User = {
  login: 'demo',
  name: 'Демо Пользователь',
  balance: 15000,
};

let lastUpdateTime = Date.now();

// === API Functions ===

// --- Vehicles (MapObjects) ---

export async function fetchVehicles(): Promise<Vehicle[]> {
  await delay(300);
  return [...mockVehicles];
}

export async function fetchVehicleLonLat(uids: string[]): Promise<Array<{ uid: string; lon: number; lat: number; speed: number; course: number; time: number }>> {
  await delay(100);
  return mockVehicles
    .filter(v => uids.includes(v.uid))
    .map(v => ({
      uid: v.uid,
      lon: v.lon + (Math.random() - 0.5) * 0.001, // симуляция движения
      lat: v.lat + (Math.random() - 0.5) * 0.001,
      speed: v.ignition ? Math.floor(Math.random() * 80) : 0,
      course: v.course,
      time: Date.now(),
    }));
}

export async function updateCheckedVehicles(uids: string[]): Promise<void> {
  await delay(100);
  mockVehicles.forEach(v => {
    v.checked = uids.includes(v.uid);
  });
}

export async function updateTargetedVehicles(uids: string[]): Promise<void> {
  await delay(100);
  mockVehicles.forEach(v => {
    v.targeted = uids.includes(v.uid);
  });
}

export async function fetchVehicleUpdates(since: number): Promise<UpdatesResponse> {
  await delay(200);
  const newEvents = mockEvents.filter(e => e.time > since);
  const newTime = Date.now();
  return {
    newTime,
    data: newEvents,
    reload: false,
  };
}

// --- Geozones ---

export async function fetchGeozones(): Promise<Geozone[]> {
  await delay(200);
  return [...mockGeozones];
}

export async function fetchGeozoneById(id: number): Promise<Geozone | null> {
  await delay(100);
  return mockGeozones.find(g => g.id === id) || null;
}

export async function createGeozone(geozone: Omit<Geozone, 'id'>): Promise<Geozone> {
  await delay(300);
  const newGeozone: Geozone = {
    ...geozone,
    id: Math.max(...mockGeozones.map(g => g.id)) + 1,
  };
  mockGeozones.push(newGeozone);
  return newGeozone;
}

export async function updateGeozone(geozone: Geozone): Promise<boolean> {
  await delay(300);
  const index = mockGeozones.findIndex(g => g.id === geozone.id);
  if (index >= 0) {
    mockGeozones[index] = geozone;
    return true;
  }
  return false;
}

export async function deleteGeozone(id: number): Promise<void> {
  await delay(200);
  const index = mockGeozones.findIndex(g => g.id === id);
  if (index >= 0) {
    mockGeozones.splice(index, 1);
  }
}

// --- Events/Messages ---

export async function fetchEvents(params: { uids?: string[]; from?: string; to?: string }): Promise<EventMessage[]> {
  await delay(300);
  let events = [...mockEvents];
  if (params.uids && params.uids.length > 0) {
    events = events.filter(e => params.uids!.includes(e.uid));
  }
  return events.sort((a, b) => b.time - a.time);
}

export async function getUnreadMessagesCount(): Promise<number> {
  await delay(100);
  return mockEvents.filter(e => !e.readStatus).length;
}

export async function markEventsAsRead(eids: number[]): Promise<void> {
  await delay(100);
  mockEvents.forEach(e => {
    if (eids.includes(e.eid)) {
      e.readStatus = true;
    }
  });
}

// --- Notification Rules ---

export async function fetchNotificationRules(): Promise<NotificationRule[]> {
  await delay(200);
  return [...mockNotificationRules];
}

export async function createNotificationRule(rule: NotificationRule): Promise<NotificationRule> {
  await delay(300);
  mockNotificationRules.push(rule);
  return rule;
}

export async function updateNotificationRule(rule: NotificationRule): Promise<void> {
  await delay(300);
  const index = mockNotificationRules.findIndex(r => r.name === rule.name);
  if (index >= 0) {
    mockNotificationRules[index] = rule;
  }
}

export async function deleteNotificationRule(name: string): Promise<void> {
  await delay(200);
  const index = mockNotificationRules.findIndex(r => r.name === name);
  if (index >= 0) {
    mockNotificationRules.splice(index, 1);
  }
}

// --- Sensors ---

export async function fetchSensorTypes(): Promise<SensorType[]> {
  await delay(100);
  return [...mockSensorTypes];
}

export async function fetchVehicleSensors(uid: string): Promise<Sensor[]> {
  await delay(200);
  // Mock sensors for a vehicle
  return [
    { code: 'fuel', name: 'Топливо', type: 'sFuelL', unit: 'л', value: 45 },
    { code: 'pwr_ext', name: 'Напряжение', type: 'sPwr', unit: 'В', value: 13.8 },
    { code: 'temp', name: 'Температура', type: 'sTmp', unit: '°C', value: 85 },
  ];
}

// --- Commands ---

export async function sendBlockCommand(uid: string, block: boolean, password: string): Promise<CommandResponse> {
  await delay(500);
  const vehicle = mockVehicles.find(v => v.uid === uid);
  if (vehicle) {
    vehicle.blocked = block;
    return { success: true, message: block ? 'Объект заблокирован' : 'Объект разблокирован' };
  }
  return { success: false, error: 'Объект не найден' };
}

export async function sendGetCoordsCommand(uid: string, password: string): Promise<CommandResponse> {
  await delay(500);
  return { success: true, message: 'Команда отправлена' };
}

export async function sendRestartCommand(uid: string, password: string): Promise<CommandResponse> {
  await delay(500);
  return { success: true, message: 'Команда перезагрузки отправлена' };
}

export async function isCommandPasswordRequired(): Promise<boolean> {
  await delay(100);
  return false; // для demo
}

// --- Position/Track ---

export async function fetchTrackBounds(uid: string, from: Date, to: Date): Promise<TrackBounds> {
  await delay(200);
  return {
    minlat: 55.70,
    maxlat: 55.80,
    minlon: 37.50,
    maxlon: 37.70,
    first: { lon: 37.55, lat: 55.72 },
    last: { lon: 37.65, lat: 55.78 },
  };
}

export async function fetchTrackPositions(uid: string, from: Date, to: Date): Promise<GPSPosition[]> {
  await delay(500);
  // Генерируем фейковый трек
  const positions: GPSPosition[] = [];
  const start = from.getTime();
  const end = to.getTime();
  const step = (end - start) / 100;
  
  for (let i = 0; i <= 100; i++) {
    positions.push({
      lat: 55.72 + i * 0.0006,
      lon: 37.55 + i * 0.001,
      time: start + i * step,
      speed: 30 + Math.random() * 40,
      course: 45 + Math.random() * 20,
    });
  }
  
  return positions;
}

// --- Reports ---

export async function fetchMovingReport(uids: string[], from: string, to: string): Promise<MovingReportItem[]> {
  await delay(500);
  return [
    {
      num: 1,
      uid: 'o1001',
      name: 'КамАЗ-001',
      startTime: Date.now() - 7200000,
      endTime: Date.now() - 3600000,
      startAddress: 'г. Москва, ул. Ленина, 1',
      endAddress: 'г. Москва, ул. Пушкина, 15',
      distance: 25.4,
      maxSpeed: 72,
      avgSpeed: 45,
    },
    {
      num: 2,
      uid: 'o1001',
      name: 'КамАЗ-001',
      startTime: Date.now() - 3000000,
      endTime: Date.now() - 1800000,
      startAddress: 'г. Москва, ул. Пушкина, 15',
      endAddress: 'г. Москва, Склад №1',
      distance: 12.8,
      maxSpeed: 65,
      avgSpeed: 38,
    },
  ];
}

export async function fetchParkingReport(uids: string[], from: string, to: string): Promise<ParkingReportItem[]> {
  await delay(500);
  return [
    {
      num: 1,
      uid: 'o1001',
      name: 'КамАЗ-001',
      startTime: Date.now() - 3600000,
      endTime: Date.now() - 3000000,
      duration: 600000,
      address: 'г. Москва, ул. Пушкина, 15',
      lon: 37.59,
      lat: 55.73,
    },
  ];
}

export async function fetchFuelingReport(uids: string[], from: string, to: string): Promise<FuelingReportItem[]> {
  await delay(500);
  return [
    {
      num: 1,
      uid: 'o1001',
      name: 'КамАЗ-001',
      time: Date.now() - 5400000,
      type: 'fueling',
      volume: 120,
      address: 'АЗС Лукойл',
      lon: 37.55,
      lat: 55.71,
    },
  ];
}

// --- User ---

export async function fetchCurrentUser(): Promise<User> {
  await delay(100);
  return { ...mockUser };
}

export async function fetchUserSettings(): Promise<UserSettings> {
  await delay(100);
  return {
    molcmpwdth: 420,
    timezone: 'Europe/Moscow',
    language: 'ru',
    mapType: 'osm',
    showPopupNotifications: true,
    showUnreadNotificationsCount: true,
  };
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  await delay(200);
  console.log('Settings saved:', settings);
}

export async function logout(): Promise<void> {
  await delay(100);
  // В реальности здесь будет редирект на страницу логина
}

// --- Groups ---

export async function fetchVehicleGroups(): Promise<VehicleGroup[]> {
  await delay(200);
  return [
    { id: 1, name: 'Грузовики', vehicles: ['o1001', 'o1003'] },
    { id: 2, name: 'Легковые', vehicles: ['o1004'] },
  ];
}

// --- Reverse Geocoding ---

export async function reverseGeocode(lon: number, lat: number): Promise<string> {
  await delay(300);
  return `г. Москва, координаты ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

// === Mock API объект для удобного использования в компонентах ===
export const mockApi = {
  // Vehicles
  fetchVehicles,
  fetchVehicleLonLat,
  updateCheckedVehicles,
  updateTargetedVehicles,
  fetchVehicleUpdates,

  // Geozones  
  fetchGeozones,
  fetchGeozoneById,
  createGeozone,
  updateGeozone: async (id: number, data: Partial<Geozone>): Promise<Geozone> => {
    await delay(300);
    const geozone = mockGeozones.find(g => g.id === id);
    if (geozone) {
      Object.assign(geozone, data);
      return geozone;
    }
    throw new Error('Geozone not found');
  },
  deleteGeozone,

  // Events
  fetchEvents: async (): Promise<EventMessage[]> => {
    await delay(200);
    return mockEvents.map(e => ({
      id: e.eid,
      vehicleId: parseInt(e.uid.replace('o', '')),
      vehicleName: e.name,
      eventType: e.type === 'speed_violation' ? 'alarm' as const : 'info' as const,
      message: e.text,
      timestamp: e.time,
      isRead: e.readStatus,
      lat: e.lat,
      lon: e.lon,
    }));
  },
  getUnreadMessagesCount,
  markEventsAsRead: async (ids: number[]): Promise<void> => {
    await delay(100);
    mockEvents.forEach(e => {
      if (ids.includes(e.eid)) {
        e.readStatus = true;
      }
    });
  },

  // Notification rules
  fetchNotificationRules: async (): Promise<NotificationRule[]> => {
    await delay(200);
    return mockNotificationRules.map((r, idx) => ({
      id: idx + 1,
      name: r.name,
      ruleType: 'speed' as const,
      threshold: (r.params as any)?.maxSpeed ?? 0,
      enabled: r.showmessage,
    }));
  },
  createNotificationRule: async (data: any): Promise<NotificationRule> => {
    await delay(300);
    const newRule = { id: mockNotificationRules.length + 1, ...data };
    return newRule;
  },
  updateNotificationRule: async (id: number, data: any): Promise<NotificationRule> => {
    await delay(300);
    return { id, ...data };
  },
  deleteNotificationRule: async (id: number): Promise<void> => {
    await delay(200);
  },

  // Sensors
  fetchSensorTypes,
  fetchVehicleSensors,

  // Commands
  sendBlockCommand: async (id: number, block: boolean): Promise<CommandResponse> => {
    await delay(500);
    const vehicle = mockVehicles.find(v => v.uid === `o${1000 + id}` || parseInt(v.uid.replace('o', '')) === id);
    if (vehicle) {
      vehicle.blocked = block;
    }
    return { success: true, message: block ? 'Объект заблокирован' : 'Объект разблокирован' };
  },
  sendGetCoordsCommand: async (id: number): Promise<CommandResponse> => {
    await delay(500);
    return { success: true, message: 'Команда запроса координат отправлена' };
  },
  sendRestartCommand: async (id: number): Promise<CommandResponse> => {
    await delay(500);
    return { success: true, message: 'Команда перезагрузки отправлена' };
  },

  // Tracks
  fetchTrackBounds,
  fetchTrackPositions: async (vehicleId: number, from: number, to: number): Promise<GPSPosition[]> => {
    await delay(500);
    const positions: GPSPosition[] = [];
    const step = (to - from) / 100;
    for (let i = 0; i <= 100; i++) {
      positions.push({
        lat: 55.72 + i * 0.0006,
        lon: 37.55 + i * 0.001,
        timestamp: from + i * step,
        speed: 30 + Math.random() * 40,
        course: 45 + Math.random() * 20,
      });
    }
    return positions;
  },

  // Reports
  fetchMovingReport: async (params: { vehicleIds: number[]; from: number; to: number }): Promise<MovingReportItem[]> => {
    await delay(500);
    return params.vehicleIds.flatMap(id => [
      {
        vehicleId: id,
        vehicleName: mockVehicles.find(v => parseInt(v.uid.replace('o', '')) === id + 1000)?.name ?? `Объект ${id}`,
        startTime: params.from + 3600000,
        endTime: params.from + 7200000,
        distance: 25.4 + Math.random() * 10,
        duration: 3600,
        maxSpeed: 72 + Math.floor(Math.random() * 20),
      },
    ]);
  },
  fetchParkingReport: async (params: { vehicleIds: number[]; from: number; to: number }): Promise<ParkingReportItem[]> => {
    await delay(500);
    return params.vehicleIds.map(id => ({
      vehicleId: id,
      vehicleName: mockVehicles.find(v => parseInt(v.uid.replace('o', '')) === id + 1000)?.name ?? `Объект ${id}`,
      startTime: params.from + 1800000,
      endTime: params.from + 3600000,
      duration: 1800,
      lat: 55.73,
      lon: 37.59,
      address: 'г. Москва, ул. Пушкина, 15',
    }));
  },
  fetchFuelingReport: async (params: { vehicleIds: number[]; from: number; to: number }): Promise<FuelingReportItem[]> => {
    await delay(500);
    return params.vehicleIds.map(id => ({
      vehicleId: id,
      vehicleName: mockVehicles.find(v => parseInt(v.uid.replace('o', '')) === id + 1000)?.name ?? `Объект ${id}`,
      timestamp: params.from + 5400000,
      volumeBefore: 20.5,
      volumeAfter: 65.3,
      volumeAdded: 44.8,
      lat: 55.71,
      lon: 37.55,
      address: 'АЗС Лукойл, Ленинградское ш.',
    }));
  },

  // User
  fetchCurrentUser,
  fetchUserSettings,
  saveUserSettings,
  logout,

  // Groups
  fetchVehicleGroups: async (): Promise<VehicleGroup[]> => {
    await delay(200);
    return [
      { id: 1, name: 'Грузовики', vehicleIds: [1001, 1003] },
      { id: 2, name: 'Легковые', vehicleIds: [1004] },
      { id: 3, name: 'Спецтехника', vehicleIds: [1005] },
    ];
  },

  // Geocoding
  reverseGeocode,
};
