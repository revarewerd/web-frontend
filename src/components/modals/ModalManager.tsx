/**
 * ModalManager — рендерит модальные окна поверх карты
 *
 * Legacy: каждое окно = Ext.window.Window (перетаскиваемое, сворачиваемое)
 * Здесь: appStore.activeModal → switch → рендер нужного компонента.
 * CSS: .ext-window, .ext-window-header (стили ExtJS окон)
 */
import { useAppStore } from '@/store/appStore';
import { GeozonesModal } from './GeozonesModal';
import { NotificationRulesModal } from './NotificationRulesModal';
import { UserSettingsModal } from './UserSettingsModal';
import { GroupsModal } from './GroupsModal';
import { EventsModal } from './EventsModal';
import { MovingReportModal } from './MovingReportModal';
import { ParkingReportModal } from './ParkingReportModal';
import { FuelingReportModal } from './FuelingReportModal';
import { TrackDisplayModal } from './TrackDisplayModal';
import { VehicleDetailsModal } from './VehicleDetailsModal';

export function ModalManager() {
  const { activeModal, modalProps, closeModal } = useAppStore();

  if (!activeModal) return null;

  // Маппинг modalId -> компонент
  const renderModal = () => {
    switch (activeModal) {
      case 'geozones':
        return <GeozonesModal onClose={closeModal} />;
      case 'notification-rules':
      case 'notificationRules':
        return <NotificationRulesModal onClose={closeModal} />;
      case 'user-settings':
      case 'userSettings':
        return <UserSettingsModal onClose={closeModal} />;
      case 'vehicle-groups':
      case 'groups':
        return <GroupsModal onClose={closeModal} />;
      case 'events-history':
      case 'events':
        return <EventsModal onClose={closeModal} />;
      case 'report-moving':
      case 'movingReport':
        return <MovingReportModal onClose={closeModal} />;
      case 'report-parking':
      case 'parkingReport':
        return <ParkingReportModal onClose={closeModal} />;
      case 'report-fueling':
      case 'fuelingReport':
        return <FuelingReportModal onClose={closeModal} />;
      case 'trackDisplay':
        return <TrackDisplayModal onClose={closeModal} />;
      case 'vehicleDetails':
        return <VehicleDetailsModal data={modalProps} onClose={closeModal} />;
      default:
        // Заглушка для нереализованных модалок
        return (
          <Modal title={activeModal} onClose={closeModal} width={400}>
            <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>
              Модуль "{activeModal}" в разработке
            </div>
          </Modal>
        );
    }
  };

  return (
    <>
      <div className="x-window-mask" onClick={closeModal} />
      <div onClick={(e) => e.stopPropagation()}>
        {renderModal()}
      </div>
    </>
  );
}

// Базовый компонент модального окна - ExtJS Window стиль
interface ModalProps {
  title: string;
  icon?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  footer?: React.ReactNode;
}

export function Modal({ title, icon, onClose, children, width = 600, footer }: ModalProps) {
  return (
    <div 
      className="x-window" 
      style={{ 
        width, 
        left: '50%', 
        top: '50%', 
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="x-window-header">
        <span className="x-window-header-text">
          {icon && <img src={icon} alt="" className="x-window-header-icon" />}
          {title}
        </span>
        <button className="x-tool-close" onClick={onClose}>×</button>
      </div>
      <div className="x-window-body">
        {children}
      </div>
      {footer && (
        <div className="x-window-footer">
          {footer}
        </div>
      )}
    </div>
  );
}
