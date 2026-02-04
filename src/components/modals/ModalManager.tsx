// Менеджер модальных окон
import { useAppStore } from '@/store/appStore';
import type { ModalType } from '@/store/appStore';
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

  const modalComponents: Record<ModalType, React.ReactNode> = {
    geozones: <GeozonesModal onClose={closeModal} />,
    notificationRules: <NotificationRulesModal onClose={closeModal} />,
    userSettings: <UserSettingsModal onClose={closeModal} />,
    groups: <GroupsModal onClose={closeModal} />,
    events: <EventsModal onClose={closeModal} />,
    movingReport: <MovingReportModal onClose={closeModal} />,
    parkingReport: <ParkingReportModal onClose={closeModal} />,
    fuelingReport: <FuelingReportModal onClose={closeModal} />,
    trackDisplay: <TrackDisplayModal onClose={closeModal} />,
    vehicleDetails: <VehicleDetailsModal data={modalProps} onClose={closeModal} />,
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div onClick={(e) => e.stopPropagation()}>
        {modalComponents[activeModal]}
      </div>
    </div>
  );
}

// Базовый компонент модального окна
interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ title, onClose, children, width = 600 }: ModalProps) {
  return (
    <div className="modal" style={{ width: `${width}px` }}>
      <div className="modal-header">
        <span>{title}</span>
        <button onClick={onClose} className="text-white hover:bg-white/20 px-2">×</button>
      </div>
      <div className="modal-body">
        {children}
      </div>
    </div>
  );
}
