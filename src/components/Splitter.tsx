/**
 * Splitter — разделитель между LeftPanel и MapView (аналог ExtJS splitter)
 *
 * Legacy: Ext.container.Viewport с border layout автоматически добавлял
 * splitter между region: 'west' и 'center' для ресайза.
 *
 * Перетаскивание мышью изменяет ширину LeftPanel через store.
 * Двойной клик по сплиттеру — сворачивает/разворачивает панель.
 */
import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';

const MIN_PANEL_WIDTH = 200;
const MAX_PANEL_WIDTH = 800;

export function Splitter() {
  const { leftPanelWidth, setLeftPanelWidth, toggleLeftPanel } = useAppStore();
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = leftPanelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [leftPanelWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - startX.current;
      const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, startWidth.current + dx));
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setLeftPanelWidth]);

  return (
    <div
      className="x-splitter"
      onMouseDown={handleMouseDown}
      onDoubleClick={toggleLeftPanel}
      title="Перетащите для изменения размера. Двойной клик — свернуть/развернуть."
    >
      {/* Визуальный индикатор (точки как в ExtJS) */}
      <div className="x-splitter-dots">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
