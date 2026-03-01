/**
 * WindowManager — рендерит все открытые плавающие окна
 *
 * Заменяет ModalManager. Вместо одного модального окна с backdrop —
 * множество плавающих окон без backdrop (как в Ext.window.Window).
 *
 * Каждое окно:
 *   - Перетаскиваемое (drag за заголовок)
 *   - Ресайзируемое (8 направлений)
 *   - Сворачиваемое в таскбар (minimize)
 *   - Z-index стекинг (клик → наверх)
 *   - Нет backdrop/маски — карта и панели кликабельны
 */
import { useAppStore } from '@/store/appStore';
import { FloatingWindow } from './FloatingWindow';
import { GeozonesModal } from './modals/GeozonesModal';
import { NotificationRulesModal } from './modals/NotificationRulesModal';
import { UserSettingsModal } from './modals/UserSettingsModal';
import { GroupsModal } from './modals/GroupsModal';
import { EventsModal } from './modals/EventsModal';
import { MovingReportModal } from './modals/MovingReportModal';
import { ParkingReportModal } from './modals/ParkingReportModal';
import { FuelingReportModal } from './modals/FuelingReportModal';
import { TrackDisplayModal } from './modals/TrackDisplayModal';
import { VehicleDetailsModal } from './modals/VehicleDetailsModal';

export function WindowManager() {
  const { windows } = useAppStore();

  if (windows.length === 0) return null;

  return (
    <>
      {windows.map((win) => {
        // Не рендерим свернутые окна (FloatingWindow сам это проверяет, но для скорости)
        if (win.minimized) return null;

        const content = renderWindowContent(win.type, win.id, win.props);

        return (
          <FloatingWindow key={win.id} window={win}>
            {content}
          </FloatingWindow>
        );
      })}
    </>
  );
}

/**
 * Маппинг типа окна → React-компонент содержимого.
 * Каждый компонент получает onClose (привязан к closeWindow(id)).
 */
function renderWindowContent(type: string, windowId: string, props: Record<string, unknown>) {
  const { closeWindow } = useAppStore.getState();
  const onClose = () => closeWindow(windowId);

  switch (type) {
    case 'geozones':
      return <GeozonesModal onClose={onClose} />;
    case 'notification-rules':
    case 'notificationRules':
      return <NotificationRulesModal onClose={onClose} />;
    case 'user-settings':
    case 'userSettings':
      return <UserSettingsModal onClose={onClose} />;
    case 'vehicle-groups':
    case 'groups':
      return <GroupsModal onClose={onClose} />;
    case 'events-history':
    case 'events':
      return <EventsModal onClose={onClose} />;
    case 'report-moving':
    case 'movingReport':
      return <MovingReportModal onClose={onClose} />;
    case 'report-parking':
    case 'parkingReport':
      return <ParkingReportModal onClose={onClose} />;
    case 'report-fueling':
    case 'fuelingReport':
      return <FuelingReportModal onClose={onClose} />;
    case 'trackDisplay':
      return <TrackDisplayModal onClose={onClose} />;
    case 'vehicleDetails':
      return <VehicleDetailsModal data={props} onClose={onClose} />;
    default:
      // Заглушка для нереализованных окон
      return (
        <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>
          Модуль "{type}" в разработке
        </div>
      );
  }
}
