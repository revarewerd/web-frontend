// Модальное окно отчёта по стоянкам
import { useState } from 'react';
import { MapPin, Download, Search } from 'lucide-react';
import { Modal } from './ModalManager';
import { useAppStore } from '@/store/appStore';
import { mockApi } from '@/api/mock';
import type { ParkingReportItem } from '@/types';

interface ParkingReportModalProps {
  onClose: () => void;
}

export function ParkingReportModal({ onClose }: ParkingReportModalProps) {
  const { vehicles } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ParkingReportItem[]>([]);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const selectedVehicles = vehicles.filter(v => v.checked);

  const handleGenerate = async () => {
    if (selectedVehicles.length === 0) return;
    
    setLoading(true);
    try {
      const data = await mockApi.fetchParkingReport({
        vehicleIds: selectedVehicles.map(v => v.id),
        from: new Date(dateFrom).getTime(),
        to: new Date(dateTo).getTime() + 86400000,
      });
      setReportData(data);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}ч ${mins}м`;
    return `${mins}м`;
  };

  const totalDuration = reportData.reduce((sum, r) => sum + r.duration, 0);

  return (
    <Modal title="Отчёт по стоянкам" onClose={onClose} width={850}>
      <div className="flex flex-col h-[500px]">
        {/* Параметры отчёта */}
        <div className="p-3 border-b border-gray-200 flex items-end gap-4">
          <div className="form-group mb-0">
            <label className="form-label">С даты</label>
            <input
              type="date"
              className="form-input"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">По дату</label>
            <input
              type="date"
              className="form-input"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading || selectedVehicles.length === 0}
          >
            <Search size={14} />
            Сформировать
          </button>
          {reportData.length > 0 && (
            <button className="btn">
              <Download size={14} />
              Экспорт
            </button>
          )}
        </div>

        {selectedVehicles.length === 0 && (
          <div className="p-3 bg-yellow-50 border-b border-yellow-200 text-yellow-700 text-sm">
            ⚠️ Выберите объекты в левой панели для формирования отчёта
          </div>
        )}

        {/* Таблица отчёта */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Загрузка...
            </div>
          ) : reportData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MapPin size={48} className="text-gray-300 mb-2" />
              <span>Нажмите "Сформировать" для генерации отчёта</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium">Объект</th>
                  <th className="text-left p-2 font-medium">Начало</th>
                  <th className="text-left p-2 font-medium">Конец</th>
                  <th className="text-right p-2 font-medium">Длительность</th>
                  <th className="text-left p-2 font-medium">Адрес</th>
                  <th className="text-center p-2 font-medium">Координаты</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-2">{row.vehicleName}</td>
                    <td className="p-2">{new Date(row.startTime).toLocaleString('ru')}</td>
                    <td className="p-2">{new Date(row.endTime).toLocaleString('ru')}</td>
                    <td className="p-2 text-right font-medium">{formatDuration(row.duration)}</td>
                    <td className="p-2 text-gray-600 max-w-[200px] truncate" title={row.address}>
                      {row.address || '—'}
                    </td>
                    <td className="p-2 text-center text-xs text-gray-500">
                      {row.lat.toFixed(5)}, {row.lon.toFixed(5)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-medium">
                <tr>
                  <td className="p-2" colSpan={3}>Итого стоянок: {reportData.length}</td>
                  <td className="p-2 text-right">{formatDuration(totalDuration)}</td>
                  <td className="p-2" colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
