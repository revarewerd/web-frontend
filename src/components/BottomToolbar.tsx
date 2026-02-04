// Нижняя панель инструментов
import { FileText, X } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

export function BottomToolbar() {
  const { openModal, vehicles } = useAppStore();

  const selectedCount = vehicles.filter(v => v.checked).length;

  return (
    <div className="bottom-toolbar h-[32px] flex items-center justify-between px-2">
      {/* Левая часть - кнопки отчётов */}
      <div className="flex items-center gap-1">
        <button
          className="btn btn-sm"
          onClick={() => openModal('movingReport')}
          disabled={selectedCount === 0}
          title="Отчёт по пробегу"
        >
          <FileText size={14} />
          <span>Пробег</span>
        </button>

        <button
          className="btn btn-sm"
          onClick={() => openModal('parkingReport')}
          disabled={selectedCount === 0}
          title="Отчёт по стоянкам"
        >
          <FileText size={14} />
          <span>Стоянки</span>
        </button>

        <button
          className="btn btn-sm"
          onClick={() => openModal('fuelingReport')}
          disabled={selectedCount === 0}
          title="Отчёт по заправкам"
        >
          <FileText size={14} />
          <span>Заправки</span>
        </button>

        <button
          className="btn btn-sm"
          onClick={() => openModal('trackDisplay')}
          disabled={selectedCount === 0}
          title="Показать трек"
        >
          <FileText size={14} />
          <span>Трек</span>
        </button>

        <div className="border-l border-gray-300 h-4 mx-2" />

        <span className="text-xs text-gray-600">
          Выбрано объектов: <strong>{selectedCount}</strong>
        </span>
      </div>

      {/* Правая часть */}
      <div className="flex items-center gap-1">
        <button
          className="btn btn-sm"
          onClick={() => {
            // Сбросить выбор всех объектов
            // TODO: Добавить action в store
          }}
          title="Скрыть все окна"
        >
          <X size={14} />
          <span>Скрыть всё</span>
        </button>
      </div>
    </div>
  );
}
