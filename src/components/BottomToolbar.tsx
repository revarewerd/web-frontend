/**
 * BottomToolbar — нижняя панель (south region, таскбар)
 *
 * Legacy: app.js → bbar (reporttoolbar)
 * Кнопка "Свернуть все окна" + иконки открытых окон.
 * Каждое модальное окно добавляет toggle-кнопку сюда
 * (как taskbar в Windows — можно свернуть/развернуть).
 */
import { useAppStore } from '@/store/appStore';

export function BottomToolbar() {
  const { openModal } = useAppStore();

  return (
    <div className="x-toolbar-south">
      {/* Скрыть все окна */}
      <button 
        className="x-btn x-btn-medium"
        onClick={() => {
          // TODO: скрыть все модальные окна
        }}
        title="Скрыть все окна"
      >
        <img src="/images/ico24_hideall2.png" alt="" className="x-btn-icon ico24" />
      </button>
      
      <div className="x-toolbar-separator" />
    </div>
  );
}
