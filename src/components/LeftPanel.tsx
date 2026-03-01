/**
 * LeftPanel — левая панель (west region, ресайзируемая)
 *
 * Legacy: LeftPanel.js + mapobject/List.js (Ext.grid.Panel)
 * API: mapObjects.loadObjects() + mapObjects.getUpdatedAfter() (polling 2сек)
 *
 * 2 вкладки: "Объекты" | "Группы"
 *
 * Таблица объектов (11 колонок):
 *   ☐ | Иконка | Имя | Сообщение | Скорость | Зажигание
 *   | Спящий | Радио | Команды | Отчёты | Настройки
 *
 * Цвета по lastMsg:
 *   зелёный (<20мин), серый (<3ч), красный (>3ч)
 *
 * Поиск: фильтрация по имени в реальном времени.
 * Действия (выпадающее меню): Выбрать все, Показать все, Скрыть все.
 *
 * Ширина динамическая — управляется из store через Splitter.
 */
// Табы: Объекты / Группы
// Грид с колонками: onMap(20px), name(flex), speed(24px), lastMsg(24px), tracing(24px)

import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import type { Vehicle } from '@/types';

type TabType = 'objects' | 'groups';

// Проверка онлайн статуса - если время последнего сообщения менее 24 часов назад
function isDataFresh(latestmsg: number): boolean {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return latestmsg > oneDayAgo;
}

// Получить цвет по времени последнего сообщения (как в WRUtils.getLastMsgColor)
// Пороги из legacy: < 20 мин = green, 20мин–3ч = yellow, > 3ч = red
function getLastMsgColor(latestmsg: number): 'grn' | 'yel' | 'red' {
  const now = Date.now();
  const twentyMin = 20 * 60 * 1000;
  const threeHours = 3 * 60 * 60 * 1000;
  
  if (now - latestmsg < twentyMin) return 'grn';
  if (now - latestmsg < threeHours) return 'yel';
  return 'red';
}

export function LeftPanel() {
  const { 
    vehicles, 
    selectedVehicleUids, 
    toggleVehicleChecked,
    updateVehicle,
    toggleVehicleTargeted,
    openModal,
    leftPanelWidth,
  } = useAppStore();
  
  // toggleVehicleOnMap меняет поле checked (показ на карте)
  const toggleVehicleOnMap = (uid: string) => {
    const vehicle = vehicles.find(v => v.uid === uid);
    if (vehicle) {
      updateVehicle(uid, { checked: !vehicle.checked });
    }
  };
  
  const [activeTab, setActiveTab] = useState<TabType>('objects');
  const [filter, setFilter] = useState('');
  const [showHidden, setShowHidden] = useState(false);

  // Фильтрация по имени (как в оригинале)
  const filteredDevices = vehicles.filter((d: Vehicle) => {
    // Фильтр по hidden
    if (!showHidden && d.hidden) return false;
    // Фильтр по имени
    if (filter) {
      const re = new RegExp(filter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      return re.test(d.name);
    }
    return true;
  });

  const onlineCount = vehicles.filter((d: Vehicle) => d.latestmsg && isDataFresh(d.latestmsg)).length;
  const movingCount = vehicles.filter((d: Vehicle) => d.speed > 0).length;

  // Выбрать все / Снять выделение
  const selectAll = () => {
    filteredDevices.forEach(d => {
      if (!selectedVehicleUids.includes(d.uid)) {
        toggleVehicleChecked(d.uid);
      }
    });
  };

  const deselectAll = () => {
    filteredDevices.forEach(d => {
      if (selectedVehicleUids.includes(d.uid)) {
        toggleVehicleChecked(d.uid);
      }
    });
  };

  return (
    <div className="left-panel" style={{ width: leftPanelWidth }}>
      {/* Тулбар грида - как dockedItems toolbar в List.js */}
      <div className="left-panel-toolbar">
        {/* Поиск */}
        <span className="x-form-label">Поиск объекта:</span>
        <div className="x-form-trigger-wrap" style={{ flex: 1 }}>
          <input
            type="text"
            className="x-form-text"
            placeholder=""
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        <div className="x-toolbar-separator" />
        
        {/* Показать скрытые объекты - itemId:'showHiddenObjects' */}
        <button 
          className={`x-btn ${showHidden ? 'x-btn-pressed' : ''}`}
          onClick={() => setShowHidden(!showHidden)}
          title="Показать скрытые объекты"
        >
          <img src="/images/ico16_show.png" alt="" className="x-btn-icon" />
        </button>
        
        <div className="x-toolbar-separator" />
        
        {/* Действия с выбранными */}
        <ActionsDropdown 
          onShowOnMap={selectAll}
          onHideFromMap={deselectAll}
        />
      </div>

      {/* Табы - как в LeftPanel.js */}
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

      {/* Заголовок грида - columns из List.js */}
      <div className="x-grid-header-ct">
        {/* Checkbox header */}
        <div className="x-column-header" style={{ width: 24 }}>
          <input 
            type="checkbox" 
            className="x-form-checkbox"
            onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
          />
        </div>
        {/* onMap - 20px */}
        <div className="x-column-header" style={{ width: 20 }} title="Отображение на карте">
          <img src="/images/ico16_globe.png" alt="" className="ico16" style={{ width: 14, height: 14 }} />
        </div>
        {/* name - flex */}
        <div className="x-column-header x-grid-cell-flex">
          Название объекта
        </div>
        {/* speed - 24px */}
        <div className="x-column-header" style={{ width: 24 }} title="Состояние движения">
          <img src="/images/ico16_car_move.png" alt="" className="ico16" />
        </div>
        {/* lastMsg - 24px */}
        <div className="x-column-header" style={{ width: 24 }} title="Последнее сообщение">
          <img src="/images/ico16_sathgrn.png" alt="" className="ico16" />
        </div>
        {/* tracing - 24px */}
        <div className="x-column-header" style={{ width: 24 }} title="Слежение за объектом">
          <img src="/images/ico16_target.png" alt="" className="ico16" />
        </div>
        {/* sleeper - 24px (состояние устройства) */}
        <div className="x-column-header" style={{ width: 24 }} title="Состояние устройства">
          <img src="/images/ico16_device_def.png" alt="" className="ico16" />
        </div>
        {/* radio - 24px (связь) */}
        <div className="x-column-header" style={{ width: 24 }} title="Связь с устройством">
          <img src="/images/ico16_radio_ok.png" alt="" className="ico16" />
        </div>
        {/* commands - 24px */}
        <div className="x-column-header" style={{ width: 24 }} title="Команды">
          <img src="/images/ico16_commands.png" alt="" className="ico16" />
        </div>
        {/* reports - 24px */}
        <div className="x-column-header" style={{ width: 24 }} title="Отчёт по объекту">
          <img src="/images/ico16_report.png" alt="" className="ico16" />
        </div>
        {/* settings - 24px */}
        <div className="x-column-header" style={{ width: 24 }} title="Настройки объекта">
          <img src="/images/ico16_options.png" alt="" className="ico16" />
        </div>
      </div>

      {/* Тело грида - список объектов */}
      <div className="x-grid-body">
        {activeTab === 'objects' ? (
          filteredDevices.map((device: Vehicle) => (
            <MapObjectRow 
              key={device.uid} 
              device={device}
              isSelected={selectedVehicleUids.includes(device.uid)}
              onCheck={() => toggleVehicleChecked(device.uid)}
              onToggleMap={() => toggleVehicleOnMap(device.uid)}
              onTrace={() => toggleVehicleTargeted(device.uid)}
              onDoubleClick={() => openModal('vehicleDetails', { vehicleUid: device.uid })}
            />
          ))
        ) : (
          <div style={{ padding: 8, color: '#666' }}>
            Группы объектов (в разработке)
          </div>
        )}
      </div>

      {/* Статусбар */}
      <div className="x-statusbar">
        Всего: {vehicles.length} | Онлайн: {onlineCount} | В движении: {movingCount}
      </div>
    </div>
  );
}

// Строка объекта в гриде - точная копия columns из List.js
interface MapObjectRowProps {
  device: Vehicle;
  isSelected: boolean;
  onCheck: () => void;
  onToggleMap: () => void;
  onTrace: () => void;
  onDoubleClick: () => void;
}

function MapObjectRow({ device, isSelected, onCheck, onToggleMap, onTrace, onDoubleClick }: MapObjectRowProps) {
  const isFresh = device.latestmsg && isDataFresh(device.latestmsg);
  const imgPostfix = isFresh ? '' : '_old';
  const color = device.latestmsg ? getLastMsgColor(device.latestmsg) : 'red';
  const satPrefix = (device.satelliteNum || 0) > 5 ? 'h' : 'l';
  
  // Определение иконки скорости (как в renderer для speed column)
  let speedIcon = 'ico16_car_stop';
  const ignition = device.ignition !== 'unknown' && device.ignition !== false;
  
  if (device.speed > 0) {
    speedIcon = ignition ? 'ico16_car_drve' : 'ico16_car_move';
  } else if (ignition) {
    speedIcon = 'ico16_car_engn';
  }
  
  // Иконка для отображения на карте
  const mapIcon = device.checked ? 'ico16_globeact' : 'ico16_globe';
  
  // Иконка для трассировки
  const targetIcon = device.targeted ? 'ico16_targeted' : 'ico16_target';

  return (
    <div 
      className={`x-grid-row ${isSelected ? 'x-grid-row-selected' : ''} ${device.hidden ? 'grayedText' : ''}`}
      onDoubleClick={onDoubleClick}
    >
      {/* Checkbox */}
      <div className="x-grid-cell" style={{ width: 24, justifyContent: 'center' }}>
        <input 
          type="checkbox" 
          className="x-form-checkbox"
          checked={isSelected}
          onChange={onCheck}
        />
      </div>

      {/* onMap - показать/скрыть на карте (actioncolumn) */}
      <div 
        className="x-grid-cell object-list-button" 
        style={{ width: 20, justifyContent: 'center' }}
        onClick={onToggleMap}
        title={device.checked ? 'Скрыть с карты' : 'Показать на карте'}
      >
        {device.latestmsg ? (
          <img src={`/images/${mapIcon}.png`} alt="" className="ico16" style={{ width: 14, height: 14 }} />
        ) : (
          <img src="/images/ico16_globe.png" alt="" className="ico16 object-list-button-disabled" style={{ width: 14, height: 14, opacity: 0.4 }} />
        )}
      </div>

      {/* name - название объекта */}
      <div className="x-grid-cell x-grid-cell-flex">
        {device.blocked === 'wait' && (
          <img src="/images/ico16_loading.png" alt="" title="Ожидание ответа" />
        )}
        {device.blocked === true && (
          <img src="/images/ico16_lock.png" alt="" title="Объект заблокирован" />
        )}
        <span className="x-grid-cell-inner object-list-name-text">{device.name}</span>
      </div>

      {/* speed - состояние движения */}
      <div 
        className="x-grid-cell" 
        style={{ width: 24, justifyContent: 'center' }}
        title={`Скорость: ${device.speed} км/ч`}
      >
        <img src={`/images/${speedIcon}${imgPostfix}.png`} alt="" className="ico16" />
      </div>

      {/* lastMsg - спутники и время */}
      <div 
        className="x-grid-cell" 
        style={{ width: 24, justifyContent: 'center' }}
        title={`Последнее сообщение: ${device.latestmsg ? new Date(device.latestmsg).toLocaleString() : 'нет'}\nСпутников: ${device.satelliteNum || 0}`}
      >
        <img src={`/images/ico16_sat${satPrefix}${color}.png`} alt="" className="ico16" />
      </div>

      {/* tracing - слежение */}
      <div 
        className="x-grid-cell object-list-button" 
        style={{ width: 24, justifyContent: 'center' }}
        onClick={onTrace}
        title={device.targeted ? 'Отключить слежение' : 'Включить слежение'}
      >
        <img 
          src={`/images/${targetIcon}.png`} 
          alt="" 
          className="ico16" 
          style={{ opacity: device.targeted ? 1 : 0.5 }}
        />
      </div>

      {/* sleeper - состояние устройства */}
      <div 
        className="x-grid-cell" 
        style={{ width: 24, justifyContent: 'center' }}
        title="Состояние устройства"
      >
        <img src="/images/ico16_device_def.png" alt="" className="ico16" />
      </div>

      {/* radio - связь */}
      <div 
        className="x-grid-cell" 
        style={{ width: 24, justifyContent: 'center' }}
        title="Связь с устройством"
      >
        <img src={`/images/ico16_radio_ok.png`} alt="" className="ico16" />
      </div>

      {/* commands - команды */}
      <div 
        className="x-grid-cell object-list-button" 
        style={{ width: 24, justifyContent: 'center' }}
        onClick={() => onDoubleClick()}
        title="Команды"
      >
        <img src="/images/ico16_commands.png" alt="" className="ico16" />
      </div>

      {/* reports - отчёт по объекту */}
      <div 
        className="x-grid-cell object-list-button" 
        style={{ width: 24, justifyContent: 'center' }}
        title="Отчёт по объекту"
      >
        <img src="/images/ico16_report.png" alt="" className="ico16" />
      </div>

      {/* settings - настройки */}
      <div 
        className="x-grid-cell object-list-button" 
        style={{ width: 24, justifyContent: 'center' }}
        title="Настройки объекта"
      >
        <img src="/images/ico16_options.png" alt="" className="ico16" />
      </div>
    </div>
  );
}

// Dropdown для действий с выбранными объектами
interface ActionsDropdownProps {
  onShowOnMap: () => void;
  onHideFromMap: () => void;
}

function ActionsDropdown({ onShowOnMap, onHideFromMap }: ActionsDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="x-btn"
        onClick={() => setOpen(!open)}
        title="Действия с выделенными объектами"
      >
        <img src="/images/ico16_checkall.png" alt="" className="x-btn-icon" />
        <span className="x-btn-arrow" />
      </button>
      
      {open && (
        <div className="x-menu" style={{ top: '100%', right: 0, marginTop: 2 }}>
          <div className="x-menu-item" onClick={() => { onShowOnMap(); setOpen(false); }}>
            <img src="/images/ico16_globeact.png" alt="" className="x-menu-item-icon" />
            <span>Показать на карте</span>
          </div>
          <div className="x-menu-item" onClick={() => { onHideFromMap(); setOpen(false); }}>
            <img src="/images/ico16_globe.png" alt="" className="x-menu-item-icon" />
            <span>Скрыть с карты</span>
          </div>
          <div className="x-menu-item-separator" />
          <div className="x-menu-item" onClick={() => setOpen(false)}>
            <img src="/images/ico16_hide.png" alt="" className="x-menu-item-icon" />
            <span>Скрыть в списке</span>
          </div>
          <div className="x-menu-item" onClick={() => setOpen(false)}>
            <img src="/images/ico16_show.png" alt="" className="x-menu-item-icon" />
            <span>Показать в списке</span>
          </div>
        </div>
      )}
    </div>
  );
}
