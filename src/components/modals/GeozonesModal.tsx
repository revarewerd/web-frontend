// Модальное окно редактора геозон
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { Modal } from './ModalManager';
import { useAppStore } from '@/store/appStore';
import { mockApi } from '@/api/mock';
import type { Geozone } from '@/types';

interface GeozonesModalProps {
  onClose: () => void;
}

export function GeozonesModal({ onClose }: GeozonesModalProps) {
  const { geozones, setGeozones } = useAppStore();
  const [selectedGeozone, setSelectedGeozone] = useState<Geozone | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Форма редактирования
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ftColor: '#3388ff',
    lineColor: '#3388ff',
    speedLimit: 0,
    isPrivate: false,
  });

  useEffect(() => {
    if (selectedGeozone) {
      setFormData({
        name: selectedGeozone.name,
        description: selectedGeozone.description || '',
        ftColor: selectedGeozone.ftColor || '#3388ff',
        lineColor: selectedGeozone.lineColor || '#3388ff',
        speedLimit: selectedGeozone.speedLimit || 0,
        isPrivate: selectedGeozone.isPrivate || false,
      });
    }
  }, [selectedGeozone]);

  const handleSave = async () => {
    if (!selectedGeozone) return;
    
    setLoading(true);
    try {
      const updated = await mockApi.updateGeozone(selectedGeozone.id, formData);
      setGeozones(geozones.map(g => g.id === updated.id ? updated : g));
      setEditMode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedGeozone) return;
    if (!confirm(`Удалить геозону "${selectedGeozone.name}"?`)) return;
    
    setLoading(true);
    try {
      await mockApi.deleteGeozone(selectedGeozone.id);
      setGeozones(geozones.filter(g => g.id !== selectedGeozone.id));
      setSelectedGeozone(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const newGeozone = await mockApi.createGeozone({
        name: 'Новая геозона',
        description: '',
        points: [],
        ftColor: '#3388ff',
        lineColor: '#3388ff',
        speedLimit: 0,
        isPrivate: false,
      });
      setGeozones([...geozones, newGeozone]);
      setSelectedGeozone(newGeozone);
      setEditMode(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Геозоны" onClose={onClose} width={800}>
      <div className="flex h-[500px]">
        {/* Список геозон */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-2 border-b border-gray-200 flex gap-1">
            <button className="btn btn-sm" onClick={handleCreate} disabled={loading}>
              <Plus size={14} /> Создать
            </button>
          </div>
          
          <div className="flex-1 overflow-auto">
            {geozones.map(geozone => (
              <div
                key={geozone.id}
                className={`grid-row px-2 py-1 cursor-pointer ${
                  selectedGeozone?.id === geozone.id ? 'grid-row-selected' : ''
                }`}
                onClick={() => {
                  setSelectedGeozone(geozone);
                  setEditMode(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: geozone.ftColor }}
                  />
                  <span className="text-sm truncate">{geozone.name}</span>
                </div>
              </div>
            ))}
            
            {geozones.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                Нет геозон
              </div>
            )}
          </div>
        </div>

        {/* Детали геозоны */}
        <div className="flex-1 flex flex-col">
          {selectedGeozone ? (
            <>
              <div className="p-2 border-b border-gray-200 flex gap-1 justify-end">
                {editMode ? (
                  <>
                    <button className="btn btn-sm" onClick={handleSave} disabled={loading}>
                      <Save size={14} /> Сохранить
                    </button>
                    <button className="btn btn-sm" onClick={() => setEditMode(false)}>
                      <X size={14} /> Отмена
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-sm" onClick={() => setEditMode(true)}>
                      <Edit size={14} /> Редактировать
                    </button>
                    <button className="btn btn-sm text-red-600" onClick={handleDelete} disabled={loading}>
                      <Trash2 size={14} /> Удалить
                    </button>
                  </>
                )}
              </div>

              <div className="flex-1 p-4 overflow-auto">
                <div className="form-group">
                  <label className="form-label">Название</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    disabled={!editMode}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Описание</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    disabled={!editMode}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Цвет заливки</label>
                    <input
                      type="color"
                      className="form-input h-8"
                      value={formData.ftColor}
                      onChange={e => setFormData({ ...formData, ftColor: e.target.value })}
                      disabled={!editMode}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Цвет линии</label>
                    <input
                      type="color"
                      className="form-input h-8"
                      value={formData.lineColor}
                      onChange={e => setFormData({ ...formData, lineColor: e.target.value })}
                      disabled={!editMode}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ограничение скорости (км/ч)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.speedLimit}
                    onChange={e => setFormData({ ...formData, speedLimit: parseInt(e.target.value) || 0 })}
                    disabled={!editMode}
                  />
                </div>

                <div className="form-group">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isPrivate}
                      onChange={e => setFormData({ ...formData, isPrivate: e.target.checked })}
                      disabled={!editMode}
                    />
                    <span className="text-sm">Приватная геозона</span>
                  </label>
                </div>

                <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
                  <strong>Точек в геозоне:</strong> {selectedGeozone.points?.length || 0}
                  <p className="text-gray-500 text-xs mt-1">
                    Для редактирования точек используйте инструменты на карте
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Выберите геозону из списка
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
