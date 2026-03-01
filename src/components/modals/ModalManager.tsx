/**
 * ModalManager — DEPRECATED (заменён на WindowManager)
 *
 * Этот файл сохранён для обратной совместимости.
 * Компонент Modal теперь рендерит только children (passthrough),
 * потому что FloatingWindow предоставляет window chrome (заголовок, кнопки, ресайз).
 *
 * Все модальные компоненты продолжают импортировать Modal отсюда —
 * но Modal больше не рендерит свою обёртку .x-window.
 */
import type { ReactNode } from 'react';

/**
 * @deprecated Используй WindowManager вместо ModalManager
 */
export function ModalManager() {
  // ModalManager больше не используется — AppLayout рендерит WindowManager
  return null;
}

/**
 * Modal — обёртка для содержимого модальных окон.
 *
 * Раньше: рендерила полное окно (.x-window с заголовком, кнопками, позиционированием).
 * Теперь: passthrough (Fragment) — потому что FloatingWindow уже предоставляет window chrome.
 *
 * Все существующие модальные компоненты (GeozonesModal, VehicleDetailsModal и т.д.)
 * продолжают работать без изменений.
 */
interface ModalProps {
  title: string;
  icon?: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
}

export function Modal({ children }: ModalProps) {
  // Passthrough — FloatingWindow уже предоставляет заголовок, кнопки, ресайз
  return <>{children}</>;
}
