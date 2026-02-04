// Модальное окно правил уведомлений
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, Bell, BellOff } from 'lucide-react';
import { Modal } from './ModalManager';
import { mockApi } from '@/api/mock';
import type { NotificationRule } from '@/types';

interface NotificationRulesModalProps {
  onClose: () => void;
}

export function NotificationRulesModal({ onClose }: NotificationRulesModalProps) {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    ruleType: 'speed' as NotificationRule['ruleType'],
    threshold: 0,
    enabled: true,
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await mockApi.fetchNotificationRules();
      setRules(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRule) {
      setFormData({
        name: selectedRule.name,
        ruleType: selectedRule.ruleType,
        threshold: selectedRule.threshold || 0,
        enabled: selectedRule.enabled,
      });
    }
  }, [selectedRule]);

  const handleSave = async () => {
    if (!selectedRule) return;
    
    setLoading(true);
    try {
      const updated = await mockApi.updateNotificationRule(selectedRule.id, formData);
      setRules(rules.map(r => r.id === updated.id ? updated : r));
      setEditMode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRule) return;
    if (!confirm(`Удалить правило "${selectedRule.name}"?`)) return;
    
    setLoading(true);
    try {
      await mockApi.deleteNotificationRule(selectedRule.id);
      setRules(rules.filter(r => r.id !== selectedRule.id));
      setSelectedRule(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const newRule = await mockApi.createNotificationRule({
        name: 'Новое правило',
        ruleType: 'speed',
        threshold: 80,
        enabled: true,
      });
      setRules([...rules, newRule]);
      setSelectedRule(newRule);
      setEditMode(true);
    } finally {
      setLoading(false);
    }
  };

  const ruleTypeLabels: Record<string, string> = {
    speed: 'Превышение скорости',
    geozoneEnter: 'Вход в геозону',
    geozoneExit: 'Выход из геозоны',
    ignitionOn: 'Зажигание вкл',
    ignitionOff: 'Зажигание выкл',
    lowBattery: 'Низкий заряд батареи',
    sos: 'SOS',
  };

  return (
    <Modal title="Правила уведомлений" onClose={onClose} width={700}>
      <div className="flex h-[450px]">
        {/* Список правил */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-2 border-b border-gray-200 flex gap-1">
            <button className="btn btn-sm" onClick={handleCreate} disabled={loading}>
              <Plus size={14} /> Создать
            </button>
          </div>
          
          <div className="flex-1 overflow-auto">
            {rules.map(rule => (
              <div
                key={rule.id}
                className={`grid-row px-2 py-1 cursor-pointer ${
                  selectedRule?.id === rule.id ? 'grid-row-selected' : ''
                }`}
                onClick={() => {
                  setSelectedRule(rule);
                  setEditMode(false);
                }}
              >
                <div className="flex items-center gap-2">
                  {rule.enabled ? (
                    <Bell size={14} className="text-green-600" />
                  ) : (
                    <BellOff size={14} className="text-gray-400" />
                  )}
                  <span className="text-sm truncate">{rule.name}</span>
                </div>
              </div>
            ))}
            
            {rules.length === 0 && !loading && (
              <div className="p-4 text-center text-gray-500 text-sm">
                Нет правил
              </div>
            )}
          </div>
        </div>

        {/* Детали правила */}
        <div className="flex-1 flex flex-col">
          {selectedRule ? (
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
                  <label className="form-label">Тип правила</label>
                  <select
                    className="form-input"
                    value={formData.ruleType}
                    onChange={e => setFormData({ ...formData, ruleType: e.target.value as any })}
                    disabled={!editMode}
                  >
                    {Object.entries(ruleTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {(formData.ruleType === 'speed' || formData.ruleType === 'lowBattery') && (
                  <div className="form-group">
                    <label className="form-label">
                      {formData.ruleType === 'speed' ? 'Лимит скорости (км/ч)' : 'Порог заряда (%)'}
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.threshold}
                      onChange={e => setFormData({ ...formData, threshold: parseInt(e.target.value) || 0 })}
                      disabled={!editMode}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                      disabled={!editMode}
                    />
                    <span className="text-sm">Активно</span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Выберите правило из списка
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
