/**
 * MovingReportModal — отчёт по пробегу/поездкам
 *
 * Legacy: MovingReport.js / MovementStatsReport.js
 * API: movingReport.loadData(uid, from, to)
 *      movementStatsReport.loadData(uid, from, to)
 * Экспорт: /generatePDF/moving.pdf, /generateXLS/moving.xls
 */
import { useState } from 'react';
import { FileText, Download, Search } from 'lucide-react';
import { Modal } from './ModalManager';
import { useAppStore } from '@/store/appStore';
import { mockApi } from '@/api/mock';
import type { MovingReportItem } from '@/types';

interface MovingReportModalProps {
  onClose: () => void;
}

export function MovingReportModal({ onClose }: MovingReportModalProps) {
  const { vehicles } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<MovingReportItem[]>([]);
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
      const data = await mockApi.fetchMovingReport({
        vehicleIds: selectedVehicles.map(v => v.id),
        from: new Date(dateFrom).getTime(),
        to: new Date(dateTo).getTime() + 86400000, // до конца дня
      });
      setReportData(data);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}ч ${mins}м`;
  };

  const totalDistance = reportData.reduce((sum, r) => sum + r.distance, 0);
  const totalDuration = reportData.reduce((sum, r) => sum + r.duration, 0);

  return (
    <Modal title="Отчёт по пробегу" onClose={onClose} width={800}>
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
              <FileText size={48} className="text-gray-300 mb-2" />
              <span>Нажмите "Сформировать" для генерации отчёта</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium">Объект</th>
                  <th className="text-left p-2 font-medium">Дата</th>
                  <th className="text-left p-2 font-medium">Начало</th>
                  <th className="text-left p-2 font-medium">Конец</th>
                  <th className="text-right p-2 font-medium">Пробег (км)</th>
                  <th className="text-right p-2 font-medium">Длительность</th>
                  <th className="text-right p-2 font-medium">Макс. скорость</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-2">{row.vehicleName}</td>
                    <td className="p-2">{new Date(row.startTime).toLocaleDateString('ru')}</td>
                    <td className="p-2">{new Date(row.startTime).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-2">{new Date(row.endTime).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-2 text-right">{row.distance.toFixed(1)}</td>
                    <td className="p-2 text-right">{formatDuration(row.duration)}</td>
                    <td className="p-2 text-right">{row.maxSpeed} км/ч</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-medium">
                <tr>
                  <td className="p-2" colSpan={4}>Итого</td>
                  <td className="p-2 text-right">{totalDistance.toFixed(1)}</td>
                  <td className="p-2 text-right">{formatDuration(totalDuration)}</td>
                  <td className="p-2 text-right">-</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
