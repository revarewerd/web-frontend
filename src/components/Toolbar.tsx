/**
 * Toolbar — верхняя панель мониторинга (north region)
 *
 * Legacy: app.js → tbar (Ext.toolbar.Toolbar)
 * Элементы (слева→направо):
 *   [Мониторинг▼] [Отчёт▼] [Инструменты▼] [Баланс▼] | Имя пользователя | [RU▼] | [📱] [Выход]
 *
 * Каждый dropdown открывает меню с пунктами:
 *   Мониторинг: Показать объекты, События, Геозоны, Группы
 *   Отчёт: Общий, Топливный, Групповой, Адресный
 *   Инструменты: Правила уведомлений, Настройки пользователя
 *   Баланс: Детализация абон.платы, Платежи за SMS
 *
 * API: userInfo.getSettings(), userInfo.getAccount()
 */
import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';

export function Toolbar() {
  const { user, unreadCount, openModal } = useAppStore();

  return (
    <div className="x-toolbar">
      {/* Logo - как в оригинале: homePageLink */}
      <a href="/" className="x-logo-link" title="Главная страница">
        <img src="/images/ksb_logo.png" alt="Stels" className="x-logo-img" />
      </a>

      <div className="x-toolbar-separator" />

      {/* Отчёты - itemId: 'reportsCtrl' */}
      <ToolbarDropdown
        icon="/images/ico24_report.png"
        label="Отчёты"
        tooltip="Построение отчётов"
        items={[
          { icon: '/images/ico16_report.png', label: 'Общий отчёт', onClick: () => openModal('report-general') },
          { icon: '/images/ico16_report.png', label: 'Топливный отчёт', onClick: () => openModal('report-fuel') },
          { icon: '/images/ico16_report.png', label: 'Групповой отчёт', onClick: () => openModal('report-group') },
          { icon: '/images/ico16_report.png', label: 'Адресный отчёт', onClick: () => openModal('report-address') },
        ]}
      />

      {/* Уведомления - itemId: 'notificationsCtrl' */}
      <ToolbarDropdown
        icon="/images/ico24_bell.png"
        label="Уведомления"
        tooltip="Уведомления о событиях"
        badge={unreadCount > 0 ? unreadCount : undefined}
        items={[
          { icon: '/images/ico16_eventsmsgs.png', label: 'История событий', onClick: () => openModal('events-history') },
          { divider: true },
          { icon: '/images/ico16_edit_def.png', label: 'Правила уведомлений', onClick: () => openModal('notification-rules') },
          { icon: '/images/ico16_options.png', label: 'Настройки', onClick: () => openModal('notification-settings') },
        ]}
      />

      {/* Гео-инструменты - itemId: 'geoTools' */}
      <ToolbarDropdown
        icon="/images/ico24_geozone.png"
        label="Гео-инструменты"
        tooltip="Работа с геозонами"
        items={[
          { icon: '/images/ico16_geozone.png', label: 'Геозоны', onClick: () => openModal('geozones') },
        ]}
      />

      {/* Группы объектов - itemId: 'groupsOfObjects' */}
      <ToolbarButton
        icon="/images/cars/car_001_blu_24.png"
        label="Группы объектов"
        tooltip="Группы объектов"
        onClick={() => openModal('vehicle-groups')}
      />

      {/* Поддержка - itemId: 'supportCtrl' */}
      <ToolbarDropdown
        icon="/images/ico24_question_def.png"
        label="Поддержка"
        tooltip="Техническая поддержка"
        items={[
          { icon: '/images/ico16_edit_def.png', label: 'Новый запрос', onClick: () => openModal('support-new') },
          { icon: '/images/ico16_eventsmsgs.png', label: 'Мои запросы', onClick: () => openModal('support-list') },
        ]}
      />

      {/* Spacer - '->' в ExtJS */}
      <div className="x-toolbar-spacer" />

      {/* Spacer 12px */}
      <div style={{ width: 12 }} />

      {/* Аккаунт: label */}
      <span className="x-toolbar-text">Аккаунт:</span>
      {user && (
        <span className="x-toolbar-text-bold">{user.name}</span>
      )}

      {/* Spacer 12px */}
      <div style={{ width: 12 }} />

      {/* Баланс - itemId: 'balanceCtrl' (как в legacy, условно показывается) */}
      <ToolbarDropdown
        icon="/images/ico24_coins.png"
        label={user?.balance ? `${user.balance} р.` : '0.00 р.'}
        tooltip="Баланс аккаунта"
        items={[
          { icon: '/images/ico16_report.png', label: 'Абонплата', onClick: () => openModal('subscription-fee') },
          { icon: '/images/ico16_report.png', label: 'Стоимость уведомлений', onClick: () => openModal('notification-cost') },
          { divider: true },
          { icon: '/images/ico16_report.png', label: 'Пополнить баланс', onClick: () => openModal('top-up-balance') },
        ]}
      />

      {/* Spacer 12px */}
      <div style={{ width: 12 }} />

      {/* Настройки пользователя - itemId: 'userSettings' */}
      <ToolbarButton
        icon="/images/ico24_user.png"
        label={user?.login || 'User'}
        tooltip="Настройки пользователя"
        onClick={() => openModal('user-settings')}
      />

      {/* Spacer 12px */}
      <div style={{ width: 12 }} />

      {/* Выбор языка */}
      <ToolbarDropdown
        label="RU"
        tooltip="Выбор языка"
        items={[
          { label: 'Русский', onClick: () => {} },
          { label: 'English', onClick: () => {} },
          { label: 'Español', onClick: () => {} },
        ]}
      />

      {/* Spacer 12px */}
      <div style={{ width: 12 }} />

      {/* Мобильная версия */}
      <ToolbarButton
        icon="/images/ico24_mobile.png"
        tooltip="Мобильная версия"
        onClick={() => { window.location.href = '/mobile.html'; }}
      />

      {/* Выход */}
      <ToolbarButton
        icon="/images/ico24_shutdown.png"
        label="Выход"
        tooltip="Выход из системы"
        onClick={() => {
          if (confirm('Выйти из системы?')) {
            window.location.href = '/logout';
          }
        }}
      />
    </div>
  );
}

// Компонент кнопки в тулбаре
interface ToolbarButtonProps {
  icon?: string;
  label?: string;
  onClick?: () => void;
  tooltip?: string;
  disabled?: boolean;
}

function ToolbarButton({ icon, label, onClick, tooltip, disabled }: ToolbarButtonProps) {
  return (
    <button
      className="x-btn x-btn-medium"
      onClick={onClick}
      disabled={disabled}
      title={tooltip || label}
    >
      {icon && <img src={icon} alt="" className="x-btn-icon ico24" />}
      {label && <span>{label}</span>}
    </button>
  );
}

// Компонент dropdown в тулбаре
interface DropdownItem {
  label?: string;
  icon?: string;
  onClick?: () => void;
  divider?: boolean;
}

interface ToolbarDropdownProps {
  icon?: string;
  label: string;
  items: DropdownItem[];
  badge?: number;
  tooltip?: string;
}

function ToolbarDropdown({ icon, label, items, badge, tooltip }: ToolbarDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Закрыть при клике вне
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        className="x-btn x-btn-medium"
        onClick={() => setOpen(!open)}
        title={tooltip}
      >
        {icon && <img src={icon} alt="" className="x-btn-icon ico24" />}
        <span>{label}</span>
        {badge !== undefined && (
          <span className="x-btn-badge">{badge}</span>
        )}
        <span className="x-btn-arrow" />
      </button>
      
      {open && (
        <div className="x-menu" style={{ top: '100%', left: 0, marginTop: 2 }}>
          {items.map((item, i) => 
            item.divider ? (
              <div key={i} className="x-menu-item-separator" />
            ) : (
              <div
                key={i}
                className="x-menu-item"
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
              >
                {item.icon && <img src={item.icon} alt="" className="x-menu-item-icon" />}
                <span>{item.label}</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
