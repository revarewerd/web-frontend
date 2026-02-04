// Левая панель со списком объектов (точная копия ExtJS Stels Grid)
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import type { Vehicle } from '@/types';

type TabType = 'objects' | 'groups';

// Проверка онлайн статуса - если время последнего сообщения менее 5 минут назад
function isOnline(vehicle: Vehicle): boolean {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return vehicle.latestmsg > fiveMinutesAgo;
}

export function LeftPanel() {
  const { vehicles, selectedVehicleUids, toggleVehicleChecked, toggleVehicleTargeted, openModal } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('objects');
  const [filter, setFilter] = useState('');

  const filteredDevices = vehicles.filter((d: Vehicle) => 
    d.name.toLowerCase().includes(filter.toLowerCase()) ||
    d.imei.includes(filter)
  );

  const onlineCount = vehicles.filter((d: Vehicle) => isOnline(d)).length;
  const movingCount = vehicles.filter((d: Vehicle) => d.speed > 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      {/* Панель тулбара списка объектов */}
      <div className="x-toolbar" style={{ minHeight: '28px', padding: '2px' }}>
        <button className="x-btn" title="Выбрать все" onClick={() => {}}>
          <span style={{ fontSize: '14px' }}>☑</span>
        </button>
        <button className="x-btn" title="Снять выделение" onClick={() => {}}>
          <span style={{ fontSize: '14px' }}>☐</span>
        </button>
        <div className="x-toolbar-separator" />
        <button className="x-btn" title="Показать все на карте" onClick={() => {}}>
          <span style={{ fontSize: '14px' }}>🗺</span>
        </button>
        <button className="x-btn" title="Скрыть все с карты" onClick={() => {}}>
          <span style={{ fontSize: '14px' }}>🚫</span>
        </button>
        <div style={{ flex: 1 }} />
        <div className="x-form-trigger-wrap" style={{ width: '120px' }}>
          <input
            type="text"
            className="x-form-text"
            placeholder="Поиск..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Табы */}
      <div className="x-tab-bar">
        <div 
          className={`x-tab ${activeTab === 'objects' ? 'x-tab-active' : ''}`}
          onClick={() => setActiveTab('objects')}
        >
          Объекты
        </div>
        <div 
          className={`x-tab ${activeTab === 'groups' ? 'x-tab-active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          Группы
        </div>
      </div>

      {/* Заголовок таблицы */}
      <div className="x-grid-header-ct">
        <div className="x-column-header" style={{ width: '24px' }} title="Выбрать">
          <input type="checkbox" className="x-form-checkbox" />
        </div>
        <div className="x-column-header" style={{ width: '24px' }} title="Показать на карте">
          🗺
        </div>
        <div className="x-column-header" style={{ flex: 1 }}>
          Название
        </div>
        <div className="x-column-header" style={{ width: '50px' }} title="Скорость">
          ⚡
        </div>
        <div className="x-column-header" style={{ width: '24px' }} title="Связь">
          📶
        </div>
        <div className="x-column-header" style={{ width: '24px' }} title="Спутники">
          🛰
        </div>
        <div className="x-column-header" style={{ width: '24px' }} title="Блокировка">
          🔒
        </div>
      </div>

      {/* Список объектов */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filteredDevices.map((device: Vehicle, index: number) => {
          const isSelected = selectedVehicleUids.includes(device.uid);
          const online = isOnline(device);
          
          // Определяем иконку статуса движения
          let carEmoji = '🚗';
          let carColor = '#999';
          if (device.speed > 0) {
            carEmoji = '🚙';
            carColor = '#5fa339';
          } else if (device.ignition) {
            carEmoji = '🚘';
            carColor = '#f6a828';
          }

          // Иконка спутников
          let satEmoji = '🛰';
          let satColor = '#999';
          if (device.satelliteNum >= 4) {
            satColor = '#5fa339';
          } else if (device.satelliteNum >= 2) {
            satColor = '#f6a828';
          } else {
            satColor = '#cc4b37';
          }

          return (
            <div 
              key={device.id}
              className={`x-grid-row ${isSelected ? 'x-grid-row-selected' : ''} ${index % 2 === 1 ? 'x-grid-row-alt' : ''} ${!online ? 'grayedText' : ''}`}
              onDoubleClick={() => openModal('vehicleDetails', { vehicleUid: device.uid })}
            >
              {/* Checkbox выбора */}
              <div className="x-grid-cell" style={{ width: '24px', justifyContent: 'center' }}>
                <input 
                  type="checkbox" 
                  className="x-form-checkbox"
                  checked={isSelected}
                  onChange={() => toggleVehicleChecked(device.uid)}
                />
              </div>

              {/* Показать на карте */}
              <div 
                className="x-grid-cell x-action-col-cell" 
                style={{ width: '24px', justifyContent: 'center', cursor: 'pointer' }}
                onClick={() => toggleVehicleTargeted(device.uid)}
              >
                <span style={{ opacity: device.targeted ? 1 : 0.4 }}>
                  {device.targeted ? '👁' : '👁‍🗨'}
                </span>
              </div>

              {/* Название */}
              <div className="x-grid-cell" style={{ flex: 1 }}>
                <span style={{ marginRight: '4px', color: carColor }}>{carEmoji}</span>
                <span className="x-grid-cell-inner">{device.name}</span>
              </div>

              {/* Скорость */}
              <div className="x-grid-cell" style={{ width: '50px', justifyContent: 'flex-end' }}>
                <span style={{ color: device.speed > 0 ? '#5fa339' : '#666' }}>
                  {device.speed} км/ч
                </span>
              </div>

              {/* Связь */}
              <div className="x-grid-cell" style={{ width: '24px', justifyContent: 'center' }}>
                <span style={{ color: online ? '#5fa339' : '#999' }}>
                  {online ? '●' : '○'}
                </span>
              </div>

              {/* Спутники */}
              <div className="x-grid-cell" style={{ width: '24px', justifyContent: 'center' }}>
                <span style={{ color: satColor }} title={`${device.satelliteNum} спутников`}>
                  {satEmoji}
                </span>
              </div>

              {/* Блокировка */}
              <div 
                className="x-grid-cell x-action-col-cell" 
                style={{ width: '24px', justifyContent: 'center', cursor: device.canBlock ? 'pointer' : 'default' }}
              >
                <span style={{ color: device.blocked ? '#cc4b37' : '#5fa339', opacity: device.canBlock ? 1 : 0.3 }}>
                  {device.blocked ? '🔒' : '🔓'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Статусбар */}
      <div className="x-statusbar">
        Всего: {vehicles.length} | Онлайн: {onlineCount} | В движении: {movingCount}
      </div>
    </div>
  );
}
