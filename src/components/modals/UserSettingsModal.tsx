/**
 * UserSettingsModal — настройки пользователя
 *
 * Legacy: UserSettingsWindow.js
 * API: userInfo.getSettings() / userInfo.updateSettings()
 *
 * Настройки: пароль, email, телефон, часовой пояс,
 * кластеризация, показ маркеров, тип карты.
 */
import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Modal } from './ModalManager';
import { useAppStore } from '@/store/appStore';
import { mockApi } from '@/api/mock';
import type { UserSettings } from '@/types';

interface UserSettingsModalProps {
  onClose: () => void;
}

export function UserSettingsModal({ onClose }: UserSettingsModalProps) {
  const { userSettings, setUserSettings } = useAppStore();
  const [formData, setFormData] = useState<UserSettings>(userSettings || {
    language: 'ru',
    timezone: 'Europe/Moscow',
    mapType: 'osm',
    refreshInterval: 10,
    showOffline: true,
    soundEnabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (userSettings) {
      setFormData(userSettings);
    }
  }, [userSettings]);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      await mockApi.saveUserSettings(formData);
      setUserSettings(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Настройки" onClose={onClose} width={500}>
      <div className="p-4 space-y-4">
        <div className="form-group">
          <label className="form-label">Язык интерфейса</label>
          <select
            className="form-input"
            value={formData.language}
            onChange={e => setFormData({ ...formData, language: e.target.value as UserSettings['language'] })}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="uk">Українська</option>
            <option value="kk">Қазақша</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Часовой пояс</label>
          <select
            className="form-input"
            value={formData.timezone}
            onChange={e => setFormData({ ...formData, timezone: e.target.value })}
          >
            <option value="Europe/Moscow">Москва (UTC+3)</option>
            <option value="Europe/Kiev">Киев (UTC+2)</option>
            <option value="Asia/Almaty">Алматы (UTC+6)</option>
            <option value="Europe/Minsk">Минск (UTC+3)</option>
            <option value="Europe/London">Лондон (UTC+0)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Тип карты</label>
          <select
            className="form-input"
            value={formData.mapType}
            onChange={e => setFormData({ ...formData, mapType: e.target.value as UserSettings['mapType'] })}
          >
            <option value="osm">OpenStreetMap</option>
            <option value="google">Google Maps</option>
            <option value="yandex">Яндекс.Карты</option>
            <option value="satellite">Спутник</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Интервал обновления (сек)</label>
          <select
            className="form-input"
            value={formData.refreshInterval}
            onChange={e => setFormData({ ...formData, refreshInterval: parseInt(e.target.value) })}
          >
            <option value={5}>5 секунд</option>
            <option value={10}>10 секунд</option>
            <option value={30}>30 секунд</option>
            <option value={60}>1 минута</option>
          </select>
        </div>

        <div className="form-group">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.showOffline}
              onChange={e => setFormData({ ...formData, showOffline: e.target.checked })}
            />
            <span className="text-sm">Показывать offline объекты</span>
          </label>
        </div>

        <div className="form-group">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.soundEnabled}
              onChange={e => setFormData({ ...formData, soundEnabled: e.target.checked })}
            />
            <span className="text-sm">Звуковые уведомления</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          {saved && (
            <span className="text-green-600 text-sm self-center">✓ Сохранено</span>
          )}
          <button className="btn" onClick={onClose}>
            Отмена
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            <Save size={14} />
            Сохранить
          </button>
        </div>
      </div>
    </Modal>
  );
}
