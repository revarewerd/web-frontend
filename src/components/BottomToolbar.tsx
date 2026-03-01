/**
 * BottomToolbar — нижняя панель (south region, таскбар)
 *
 * Legacy: app.js → bbar (reporttoolbar)
 * Кнопка "Свернуть все окна" + кнопки для каждого открытого окна.
 * Каждое окно добавляет toggle-кнопку сюда
 * (как taskbar в Windows — можно свернуть/развернуть).
 *
 * Клик по кнопке:
 *   - Если окно активное и видимое → свернуть
 *   - Если окно свёрнуто → развернуть + поднять наверх
 *   - Если окно видимое но не активное → поднять наверх
 */
import { useAppStore } from '@/store/appStore';

export function BottomToolbar() {
  const { 
    windows, 
    activeWindowId,
    minimizeAllWindows, 
    minimizeWindow, 
    restoreWindow, 
    bringToFront,
    toggleLeftPanel,
    leftPanelCollapsed,
  } = useAppStore();

  const handleWindowClick = (windowId: string) => {
    const win = windows.find(w => w.id === windowId);
    if (!win) return;

    if (win.minimized) {
      // Свёрнуто → развернуть
      restoreWindow(windowId);
    } else if (activeWindowId === windowId) {
      // Активное → свернуть
      minimizeWindow(windowId);
    } else {
      // Неактивное → поднять наверх
      bringToFront(windowId);
    }
  };

  return (
    <div className="x-toolbar-south">
      {/* Свернуть/развернуть левую панель */}
      <button
        className="x-btn x-btn-small"
        onClick={toggleLeftPanel}
        title={leftPanelCollapsed ? 'Развернуть панель объектов' : 'Свернуть панель объектов'}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>
          {leftPanelCollapsed ? '▶' : '◀'}
        </span>
      </button>

      <div className="x-toolbar-separator" />

      {/* Скрыть все окна */}
      <button 
        className="x-btn x-btn-small"
        onClick={minimizeAllWindows}
        title="Скрыть все окна"
        disabled={windows.length === 0}
      >
        <img src="/images/ico24_hideall2.png" alt="" className="x-btn-icon" style={{ width: 16, height: 16 }} />
      </button>
      
      <div className="x-toolbar-separator" />

      {/* Кнопки открытых окон (таскбар) */}
      <div className="x-taskbar">
        {windows.map((win) => {
          const isActive = activeWindowId === win.id && !win.minimized;
          
          return (
            <button
              key={win.id}
              className={`x-taskbar-btn ${isActive ? 'x-taskbar-btn-active' : ''} ${win.minimized ? 'x-taskbar-btn-minimized' : ''}`}
              onClick={() => handleWindowClick(win.id)}
              title={win.title}
            >
              {win.icon && (
                <img src={win.icon} alt="" style={{ width: 14, height: 14, flexShrink: 0 }} />
              )}
              <span className="x-taskbar-btn-text">{win.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
