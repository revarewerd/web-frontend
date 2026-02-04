// Модальное окно групп объектов
import { useState, useEffect } from 'react';
import { Folder, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { Modal } from './ModalManager';
import { useAppStore } from '@/store/appStore';
import { mockApi } from '@/api/mock';
import type { VehicleGroup, Vehicle } from '@/types';

interface GroupsModalProps {
  onClose: () => void;
}

export function GroupsModal({ onClose }: GroupsModalProps) {
  const { vehicles, setSelectedVehicleUids } = useAppStore();
  const [groups, setGroups] = useState<VehicleGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await mockApi.fetchVehicleGroups();
      setGroups(data);
      // Раскрываем все группы по умолчанию
      setExpandedGroups(new Set(data.map(g => g.id)));
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId: number) => {
    const next = new Set(expandedGroups);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    setExpandedGroups(next);
  };

  const selectGroup = (group: VehicleGroup) => {
    // Выбрать все объекты из группы
    const groupVehicleUids = vehicles
      .filter(v => group.vehicleIds.includes(v.id))
      .map(v => v.uid);
    
    setSelectedVehicleUids(groupVehicleUids);
    onClose();
  };

  const getGroupVehicles = (group: VehicleGroup): Vehicle[] => {
    return vehicles.filter(v => group.vehicleIds.includes(v.id));
  };

  const getOnlineCount = (group: VehicleGroup): number => {
    const groupVehicles = getGroupVehicles(group);
    return groupVehicles.filter(v => Date.now() - v.time < 300000).length;
  };

  return (
    <Modal title="Группы объектов" onClose={onClose} width={450}>
      <div className="h-[400px] overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Загрузка...
          </div>
        ) : groups.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Нет групп
          </div>
        ) : (
          <div className="p-2">
            {groups.map(group => {
              const isExpanded = expandedGroups.has(group.id);
              const groupVehicles = getGroupVehicles(group);
              const onlineCount = getOnlineCount(group);

              return (
                <div key={group.id} className="mb-1">
                  {/* Заголовок группы */}
                  <div
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded"
                    onClick={() => toggleGroup(group.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-500" />
                    )}
                    <Folder size={16} className="text-yellow-500" />
                    <span className="font-medium flex-1">{group.name}</span>
                    <span className="text-xs text-gray-500">
                      {onlineCount}/{groupVehicles.length} online
                    </span>
                    <button
                      className="btn btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectGroup(group);
                      }}
                    >
                      <Check size={12} /> Выбрать
                    </button>
                  </div>

                  {/* Объекты в группе */}
                  {isExpanded && (
                    <div className="ml-8 border-l border-gray-200 pl-2">
                      {groupVehicles.length === 0 ? (
                        <div className="text-xs text-gray-400 py-1">
                          Нет объектов в группе
                        </div>
                      ) : (
                        groupVehicles.map(vehicle => {
                          const isOnline = Date.now() - vehicle.time < 300000;
                          return (
                            <div
                              key={vehicle.uid}
                              className="flex items-center gap-2 py-1 px-2 text-sm hover:bg-gray-50 rounded"
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  isOnline ? 'bg-green-500' : 'bg-gray-400'
                                }`}
                              />
                              <span className="truncate">{vehicle.name}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 flex justify-end">
        <button className="btn" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </Modal>
  );
}
