// Верхний тулбар (точная копия ExtJS Stels)
import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';

export function Toolbar() {
  const { user, unreadCount, openModal } = useAppStore();

  return (
    <div className="x-toolbar">
      {/* Logo */}
      <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <img 
          src="/images/logo.png" 
          alt="Stels" 
          className="x-logo"
          onError={(e) => {
            e.currentTarget.src = '/images/ico24_car.png';
          }}
        />
        <span style={{ fontWeight: 'bold', color: '#15498b', fontSize: '14px' }}>Stels GPS</span>
      </a>

      <div className="x-toolbar-separator" />

      {/* Отчёты */}
      <ToolbarDropdown
        icon="/images/ico24_report.png"
        label="Отчёты"
        items={[
          { icon: '/images/ico16_car_move.png', label: 'Движение', onClick: () => openModal('report-moving') },
          { icon: '/images/ico16_car_stop.png', label: 'Стоянки', onClick: () => openModal('report-parking') },
          { icon: '/images/ico16_fuel.png', label: 'Заправки/Сливы', onClick: () => openModal('report-fueling') },
          { divider: true },
          { icon: '/images/ico16_route.png', label: 'Маршрут', onClick: () => openModal('report-path') },
          { icon: '/images/ico16_address.png', label: 'Адреса', onClick: () => openModal('report-addresses') },
          { icon: '/images/ico16_event.png', label: 'События', onClick: () => openModal('report-events') },
        ]}
      />

      {/* Уведомления */}
      <ToolbarDropdown
        icon="/images/ico24_bell.png"
        label="Уведомления"
        badge={unreadCount > 0 ? unreadCount : undefined}
        items={[
          { icon: '/images/ico16_bell.png', label: 'История событий', onClick: () => openModal('events-history') },
          { divider: true },
          { icon: '/images/ico16_settings.png', label: 'Правила уведомлений', onClick: () => openModal('notification-rules') },
          { icon: '/images/ico16_settings.png', label: 'Настройки', onClick: () => openModal('notification-settings') },
        ]}
      />

      {/* Геоинструменты */}
      <ToolbarDropdown
        icon="/images/ico24_geozone.png"
        label="Гео-инструменты"
        items={[
          { icon: '/images/ico16_geozone.png', label: 'Геозоны', onClick: () => openModal('geozones') },
          { icon: '/images/ico16_route.png', label: 'Маршруты', onClick: () => openModal('routes') },
          { icon: '/images/ico16_poi.png', label: 'Точки интереса', onClick: () => openModal('poi') },
        ]}
      />

      {/* Группы объектов */}
      <ToolbarButton
        icon="/images/ico24_group.png"
        label="Группы объектов"
        onClick={() => openModal('vehicle-groups')}
      />

      {/* Поддержка */}
      <ToolbarDropdown
        icon="/images/ico24_support.png"
        label="Поддержка"
        items={[
          { icon: '/images/ico16_add.png', label: 'Новый запрос', onClick: () => openModal('support-new') },
          { icon: '/images/ico16_list.png', label: 'Мои запросы', onClick: () => openModal('support-list') },
        ]}
      />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Аккаунт */}
      {user && (
        <>
          <span style={{ fontSize: '11px', color: '#666' }}>Аккаунт:</span>
          <span style={{ fontWeight: 'bold', fontSize: '11px', marginLeft: '4px' }}>{user.name}</span>
          <div className="x-toolbar-separator" />
        </>
      )}

      {/* Настройки пользователя */}
      <ToolbarButton
        icon="/images/ico16_user.png"
        label={user?.login || 'User'}
        onClick={() => openModal('user-settings')}
      />

      {/* Язык */}
      <ToolbarDropdown
        icon="/images/ico16_lang.png"
        label="RU"
        items={[
          { label: 'Русский', onClick: () => {} },
          { label: 'English', onClick: () => {} },
          { label: 'Español', onClick: () => {} },
        ]}
      />

      {/* Мобильная версия */}
      <ToolbarButton
        icon="/images/ico16_mobile.png"
        onClick={() => window.location.href = '/mobile.html'}
        tooltip="Мобильная версия"
      />

      {/* Выход */}
      <ToolbarButton
        icon="/images/ico16_logout.png"
        label="Выход"
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
  icon: string;
  label?: string;
  onClick?: () => void;
  tooltip?: string;
  disabled?: boolean;
}

function ToolbarButton({ icon, label, onClick, tooltip, disabled }: ToolbarButtonProps) {
  return (
    <button
      className="x-btn"
      onClick={onClick}
      disabled={disabled}
      title={tooltip || label}
    >
      <img src={icon} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
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
  icon: string;
  label: string;
  items: DropdownItem[];
  badge?: number;
}

function ToolbarDropdown({ icon, label, items, badge }: ToolbarDropdownProps) {
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
        className="x-btn"
        onClick={() => setOpen(!open)}
      >
        <img src={icon} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <span>{label}</span>
        {badge !== undefined && (
          <span style={{ 
            background: '#d33', 
            color: '#fff', 
            borderRadius: '8px', 
            padding: '0 5px', 
            fontSize: '10px',
            marginLeft: '4px'
          }}>
            {badge}
          </span>
        )}
        <span className="x-btn-arrow" />
      </button>
      
      {open && (
        <div className="x-menu" style={{ top: '100%', left: 0, marginTop: '2px' }}>
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
                {item.icon && <img src={item.icon} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                <span>{item.label}</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
