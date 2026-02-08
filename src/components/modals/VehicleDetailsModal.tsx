/**
 * VehicleDetailsModal — детали объекта (двойной клик по строке грида)
 *
 * Legacy: ObjectInfoWindow.js (Ext.window.Window)
 * API: mapObjects.getLonLat(uid), objectSettings.loadObjectSettings(uid)
 *
 * Показывает: имя, IMEI, координаты, скорость, адрес,
 * датчики, состояние блокировки, спящий блок.
 */
import { useState } from 'react';
import { 
  MapPin, Activity, Gauge, Navigation, Battery, Thermometer,
  Lock, Unlock, RefreshCw, Send
} from 'lucide-react';
import { Modal } from './ModalManager';
import { useAppStore } from '@/store/appStore';
import { mockApi } from '@/api/mock';
import type { Vehicle } from '@/types';

interface VehicleDetailsModalProps {
  data: any;
  onClose: () => void;
}

export function VehicleDetailsModal({ data, onClose }: VehicleDetailsModalProps) {
  const { vehicles, setVehicles } = useAppStore();
  const vehicle = vehicles.find(v => v.uid === data?.vehicleUid);
  const [loading, setLoading] = useState(false);
  const [commandResult, setCommandResult] = useState<string | null>(null);

  if (!vehicle) {
    return (
      <Modal title="Объект не найден" onClose={onClose} width={400}>
        <div className="p-4 text-center text-gray-500">
          Объект не найден
        </div>
      </Modal>
    );
  }

  const isOnline = Date.now() - vehicle.time < 300000;
  const isMoving = vehicle.speed > 2;

  const handleBlockCommand = async () => {
    setLoading(true);
    setCommandResult(null);
    try {
      const result = await mockApi.sendBlockCommand(vehicle.id, !vehicle.blocked);
      setCommandResult(result.message);
      
      // Обновляем состояние объекта
      setVehicles(vehicles.map(v => 
        v.id === vehicle.id ? { ...v, blocked: !v.blocked } : v
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleGetCoordsCommand = async () => {
    setLoading(true);
    setCommandResult(null);
    try {
      const result = await mockApi.sendGetCoordsCommand(vehicle.id);
      setCommandResult(result.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestartCommand = async () => {
    if (!confirm('Вы уверены, что хотите перезапустить трекер?')) return;
    
    setLoading(true);
    setCommandResult(null);
    try {
      const result = await mockApi.sendRestartCommand(vehicle.id);
      setCommandResult(result.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={vehicle.name} onClose={onClose} width={500}>
      <div className="p-4">
        {/* Статус */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded">
          <div
            className={`w-4 h-4 rounded-full ${
              isOnline
                ? isMoving
                  ? 'bg-blue-500'
                  : 'bg-green-500'
                : 'bg-gray-400'
            }`}
          />
          <div>
            <div className="font-medium">
              {isOnline ? (isMoving ? 'В движении' : 'На стоянке') : 'Нет связи'}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(vehicle.time).toLocaleString('ru')}
            </div>
          </div>
          {vehicle.blocked && (
            <div className="ml-auto flex items-center gap-1 text-red-600">
              <Lock size={16} />
              <span className="text-sm font-medium">Заблокирован</span>
            </div>
          )}
        </div>

        {/* Параметры */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 p-2 border border-gray-200 rounded">
            <MapPin size={18} className="text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Координаты</div>
              <div className="text-sm">{vehicle.lat.toFixed(5)}, {vehicle.lon.toFixed(5)}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 border border-gray-200 rounded">
            <Gauge size={18} className="text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Скорость</div>
              <div className="text-sm font-medium">{vehicle.speed} км/ч</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 border border-gray-200 rounded">
            <Navigation size={18} className="text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Курс</div>
              <div className="text-sm">{vehicle.course}°</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 border border-gray-200 rounded">
            <Activity size={18} className="text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Пробег</div>
              <div className="text-sm">{(vehicle.mileage / 1000).toFixed(1)} км</div>
            </div>
          </div>

          {vehicle.sleeperInfo && (
            <>
              <div className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                <Battery size={18} className="text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">Топливо</div>
                  <div className="text-sm">{vehicle.sleeperInfo.fuelLevel} л</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                <Thermometer size={18} className="text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">Температура</div>
                  <div className="text-sm">{vehicle.sleeperInfo.temperature}°C</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Информация об устройстве */}
        <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500">IMEI:</span>
              <span className="ml-2 font-mono">{vehicle.imei}</span>
            </div>
            <div>
              <span className="text-gray-500">Модель:</span>
              <span className="ml-2">{vehicle.modelName || '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Телефон:</span>
              <span className="ml-2">{vehicle.phone || '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">SIM:</span>
              <span className="ml-2">{vehicle.simNumber || '—'}</span>
            </div>
          </div>
        </div>

        {/* Команды */}
        <div className="border-t border-gray-200 pt-4">
          <div className="text-sm font-medium mb-2">Команды управления</div>
          <div className="flex gap-2 flex-wrap">
            <button
              className={`btn btn-sm ${vehicle.blocked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              onClick={handleBlockCommand}
              disabled={loading || !isOnline}
            >
              {vehicle.blocked ? (
                <>
                  <Unlock size={14} />
                  Разблокировать
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Заблокировать
                </>
              )}
            </button>
            
            <button
              className="btn btn-sm"
              onClick={handleGetCoordsCommand}
              disabled={loading || !isOnline}
            >
              <Send size={14} />
              Запросить координаты
            </button>
            
            <button
              className="btn btn-sm"
              onClick={handleRestartCommand}
              disabled={loading || !isOnline}
            >
              <RefreshCw size={14} />
              Перезапуск
            </button>
          </div>
          
          {!isOnline && (
            <div className="mt-2 text-xs text-yellow-600">
              ⚠️ Команды недоступны — объект офлайн
            </div>
          )}
          
          {commandResult && (
            <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-sm rounded">
              {commandResult}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
