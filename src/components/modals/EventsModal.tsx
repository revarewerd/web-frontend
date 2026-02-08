/**
 * EventsModal — окно событий/уведомлений
 *
 * Legacy: EventMessagesView.js (Ext.grid.Panel)
 * API: eventsMessages.loadObjects({uids, period, from, to})
 *      eventsMessages.getUpdatedAfter() — polling новых событий
 *
 * Типы событий: вход/выход геозоны, превышение скорости,
 * отключение питания, SOS, низкий уровень топлива.
 * Фильтры: по объекту, периоду, прочитанности.
 */
import { useState, useEffect } from 'react';
import { Bell, CheckCheck, AlertTriangle, Info, XCircle } from 'lucide-react';
import { Modal } from './ModalManager';
import { useAppStore } from '@/store/appStore';
import { mockApi } from '@/api/mock';
import type { EventMessage } from '@/types';

interface EventsModalProps {
  onClose: () => void;
}

export function EventsModal({ onClose }: EventsModalProps) {
  const { events, setEvents, setUnreadCount } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'alarm'>('all');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await mockApi.fetchEvents();
      setEvents(data);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = events.filter(e => !e.isRead).map(e => e.id);
    if (unreadIds.length === 0) return;

    await mockApi.markEventsAsRead(unreadIds);
    setEvents(events.map(e => ({ ...e, isRead: true })));
    setUnreadCount(0);
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'unread') return !event.isRead;
    if (filter === 'alarm') return event.eventType === 'alarm';
    return true;
  });

  const getEventIcon = (type: EventMessage['eventType']) => {
    switch (type) {
      case 'alarm':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'warning':
        return <XCircle size={16} className="text-yellow-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    return date.toLocaleDateString('ru');
  };

  return (
    <Modal title="Уведомления" onClose={onClose} width={550}>
      <div className="flex flex-col h-[450px]">
        {/* Фильтры */}
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          <div className="flex gap-1">
            <button
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : ''}`}
              onClick={() => setFilter('all')}
            >
              Все
            </button>
            <button
              className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Непрочитанные
            </button>
            <button
              className={`btn btn-sm ${filter === 'alarm' ? 'btn-primary' : ''}`}
              onClick={() => setFilter('alarm')}
            >
              Тревоги
            </button>
          </div>
          
          <button className="btn btn-sm" onClick={handleMarkAllRead}>
            <CheckCheck size={14} /> Прочитать все
          </button>
        </div>

        {/* Список событий */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Загрузка...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Bell size={48} className="text-gray-300 mb-2" />
              <span>Нет уведомлений</span>
            </div>
          ) : (
            filteredEvents.map(event => (
              <div
                key={event.id}
                className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                  !event.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getEventIcon(event.eventType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {event.vehicleName || 'Система'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5">{event.message}</p>
                    {event.lat && event.lon && (
                      <p className="text-xs text-gray-400 mt-1">
                        📍 {event.lat.toFixed(5)}, {event.lon.toFixed(5)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
