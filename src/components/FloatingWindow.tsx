/**
 * FloatingWindow — перетаскиваемое, ресайзируемое окно (аналог Ext.window.Window)
 *
 * Legacy: каждое окно в Stels — Ext.window.Window с:
 *   - Перетаскивание за заголовок (header drag)
 *   - Ресайз за края и углы (8 направлений)
 *   - Сворачивание в таскбар (minimize)
 *   - Закрытие (close)
 *   - Z-index стекинг (клик → наверх)
 *
 * Реализация: нативные mouse events, без внешних библиотек.
 * Стили: .x-window, .x-window-header — ExtJS Gray Theme.
 */
import { useRef, useCallback, useEffect, type ReactNode, type MouseEvent } from 'react';
import { useAppStore } from '@/store/appStore';
import type { WindowInstance } from '@/types';

interface FloatingWindowProps {
  /** Данные экземпляра окна из стора */
  window: WindowInstance;
  /** Содержимое окна */
  children: ReactNode;
  /** Футер окна (кнопки OK/Отмена) */
  footer?: ReactNode;
}

export function FloatingWindow({ window: win, children, footer }: FloatingWindowProps) {
  const {
    closeWindow,
    minimizeWindow,
    bringToFront,
    updateWindowPosition,
    updateWindowSize,
    activeWindowId,
  } = useAppStore();

  const windowRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, winX: 0, winY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, winX: 0, winY: 0, dir: '' });

  const isActive = activeWindowId === win.id;

  // Перетаскивание за заголовок
  const handleHeaderMouseDown = useCallback((e: MouseEvent) => {
    // Не перетаскиваем если кликнули по кнопке
    if ((e.target as HTMLElement).closest('button')) return;
    
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      winX: win.x,
      winY: win.y,
    };
    bringToFront(win.id);
  }, [win.id, win.x, win.y, bringToFront]);

  // Ресайз за края
  const handleResizeMouseDown = useCallback((e: MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: win.width,
      h: win.height,
      winX: win.x,
      winY: win.y,
      dir: direction,
    };
    bringToFront(win.id);
  }, [win.id, win.width, win.height, win.x, win.y, bringToFront]);

  // Глобальные обработчики mouse move/up
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isDragging.current) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        const newX = Math.max(0, Math.min(window.innerWidth - 100, dragStart.current.winX + dx));
        const newY = Math.max(0, Math.min(window.innerHeight - 40, dragStart.current.winY + dy));
        updateWindowPosition(win.id, newX, newY);
      }
      
      if (isResizing.current) {
        const { x: startX, y: startY, w, h, winX, winY, dir } = resizeStart.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const minW = 250;
        const minH = 150;
        
        let newW = w;
        let newH = h;
        let newX = winX;
        let newY = winY;
        
        // Горизонтальный ресайз
        if (dir.includes('e')) {
          newW = Math.max(minW, w + dx);
        }
        if (dir.includes('w')) {
          const delta = Math.min(dx, w - minW);
          newW = w - delta;
          newX = winX + delta;
        }
        
        // Вертикальный ресайз
        if (dir.includes('s')) {
          newH = Math.max(minH, h + dy);
        }
        if (dir.includes('n')) {
          const delta = Math.min(dy, h - minH);
          newH = h - delta;
          newY = winY + delta;
        }
        
        updateWindowSize(win.id, newW, newH);
        if (dir.includes('w') || dir.includes('n')) {
          updateWindowPosition(win.id, newX, newY);
        }
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      isResizing.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [win.id, updateWindowPosition, updateWindowSize]);

  // Не рендерить свёрнутое окно
  if (win.minimized) return null;

  return (
    <div
      ref={windowRef}
      className={`x-window x-floating-window ${isActive ? 'x-window-active' : ''}`}
      style={{
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
        position: 'fixed',
      }}
      onMouseDown={() => bringToFront(win.id)}
    >
      {/* Заголовок — drag handle */}
      <div
        className={`x-window-header ${isActive ? 'x-window-header-active' : 'x-window-header-inactive'}`}
        onMouseDown={handleHeaderMouseDown}
      >
        <span className="x-window-header-text">
          {win.icon && <img src={win.icon} alt="" className="x-window-header-icon" />}
          {win.title}
        </span>
        <div className="x-window-header-tools">
          {/* Кнопка свернуть */}
          <button
            className="x-tool-btn"
            onClick={() => minimizeWindow(win.id)}
            title="Свернуть"
          >
            <span className="x-tool-minimize">_</span>
          </button>
          {/* Кнопка закрыть */}
          <button
            className="x-tool-close"
            onClick={() => closeWindow(win.id)}
            title="Закрыть"
          >
            ×
          </button>
        </div>
      </div>

      {/* Тело окна */}
      <div className="x-window-body">
        {children}
      </div>

      {/* Футер (если есть) */}
      {footer && (
        <div className="x-window-footer">
          {footer}
        </div>
      )}

      {/* Ресайз-хэндлы (8 направлений как в Ext.window.Window) */}
      <div className="x-resize-handle x-resize-n" onMouseDown={(e) => handleResizeMouseDown(e, 'n')} />
      <div className="x-resize-handle x-resize-s" onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
      <div className="x-resize-handle x-resize-e" onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />
      <div className="x-resize-handle x-resize-w" onMouseDown={(e) => handleResizeMouseDown(e, 'w')} />
      <div className="x-resize-handle x-resize-ne" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
      <div className="x-resize-handle x-resize-nw" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
      <div className="x-resize-handle x-resize-se" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
      <div className="x-resize-handle x-resize-sw" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
    </div>
  );
}
