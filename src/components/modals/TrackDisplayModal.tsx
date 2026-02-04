// Модальное окно отображения трека
import { useState, useEffect, useRef } from 'react';
import { Route, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import { Style, Stroke, Circle as CircleStyle, Fill } from 'ol/style';
import { Modal } from './ModalManager';
import { useAppStore } from '@/store/appStore';
import { mockApi } from '@/api/mock';
import type { GPSPosition } from '@/types';
import 'ol/ol.css';

interface TrackDisplayModalProps {
  onClose: () => void;
}

export function TrackDisplayModal({ onClose }: TrackDisplayModalProps) {
  const { vehicles } = useAppStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const trackLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [trackData, setTrackData] = useState<GPSPosition[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Анимация
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const animationRef = useRef<number | null>(null);

  const selectedVehicles = vehicles.filter(v => v.checked);

  // Инициализация карты
  useEffect(() => {
    if (!mapRef.current) return;

    const trackSource = new VectorSource();
    const trackLayer = new VectorLayer({
      source: trackSource,
    });
    trackLayerRef.current = trackLayer;

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        trackLayer,
      ],
      view: new View({
        center: fromLonLat([37.6156, 55.7522]),
        zoom: 11,
      }),
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  // Отрисовка трека
  useEffect(() => {
    if (!trackLayerRef.current || trackData.length === 0) return;
    
    const source = trackLayerRef.current.getSource();
    if (!source) return;
    
    source.clear();

    // Линия трека
    const coords = trackData.map(p => fromLonLat([p.lon, p.lat]));
    const lineFeature = new Feature({
      geometry: new LineString(coords),
    });
    lineFeature.setStyle(new Style({
      stroke: new Stroke({
        color: '#157fcc',
        width: 3,
      }),
    }));
    source.addFeature(lineFeature);

    // Точки начала и конца
    const startFeature = new Feature({
      geometry: new Point(coords[0]),
    });
    startFeature.setStyle(new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: '#5fa339' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
    }));
    source.addFeature(startFeature);

    const endFeature = new Feature({
      geometry: new Point(coords[coords.length - 1]),
    });
    endFeature.setStyle(new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: '#cc4b37' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
    }));
    source.addFeature(endFeature);

    // Центрируем на трек
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getView().fit(source.getExtent(), {
        padding: [50, 50, 50, 50],
        duration: 500,
      });
    }
  }, [trackData]);

  // Анимация текущей позиции
  useEffect(() => {
    if (!trackLayerRef.current || trackData.length === 0) return;
    
    const source = trackLayerRef.current.getSource();
    if (!source) return;

    // Удаляем старый маркер позиции
    const oldMarker = source.getFeatureById('currentPos');
    if (oldMarker) source.removeFeature(oldMarker);

    if (currentIndex < trackData.length) {
      const pos = trackData[currentIndex];
      const marker = new Feature({
        geometry: new Point(fromLonLat([pos.lon, pos.lat])),
      });
      marker.setId('currentPos');
      marker.setStyle(new Style({
        image: new CircleStyle({
          radius: 10,
          fill: new Fill({ color: '#ff6600' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
      }));
      source.addFeature(marker);
    }
  }, [currentIndex, trackData]);

  // Логика воспроизведения
  useEffect(() => {
    if (isPlaying && trackData.length > 0) {
      animationRef.current = window.setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= trackData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 100);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, trackData.length]);

  const handleLoadTrack = async () => {
    if (!selectedVehicleId) return;
    
    setLoading(true);
    setIsPlaying(false);
    setCurrentIndex(0);
    
    try {
      const data = await mockApi.fetchTrackPositions(
        selectedVehicleId,
        new Date(dateFrom).getTime(),
        new Date(dateTo).getTime() + 86400000
      );
      setTrackData(data);
    } finally {
      setLoading(false);
    }
  };

  const currentPoint = trackData[currentIndex];

  return (
    <Modal title="Отображение трека" onClose={onClose} width={900}>
      <div className="flex flex-col h-[550px]">
        {/* Параметры */}
        <div className="p-3 border-b border-gray-200 flex items-end gap-3 flex-wrap">
          <div className="form-group mb-0">
            <label className="form-label">Объект</label>
            <select
              className="form-input"
              value={selectedVehicleId || ''}
              onChange={e => setSelectedVehicleId(Number(e.target.value) || null)}
            >
              <option value="">Выберите объект</option>
              {selectedVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
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
            onClick={handleLoadTrack}
            disabled={loading || !selectedVehicleId}
          >
            <Route size={14} />
            Загрузить трек
          </button>
        </div>

        {/* Карта */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          
          {trackData.length === 0 && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 text-gray-500">
              <Route size={48} className="text-gray-300 mb-2" />
              <span>Выберите объект и период для загрузки трека</span>
            </div>
          )}
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              Загрузка трека...
            </div>
          )}
        </div>

        {/* Панель управления */}
        {trackData.length > 0 && (
          <div className="p-3 border-t border-gray-200 flex items-center gap-4">
            <div className="flex gap-1">
              <button
                className="btn btn-sm"
                onClick={() => setCurrentIndex(0)}
                disabled={isPlaying}
              >
                <SkipBack size={14} />
              </button>
              <button
                className="btn btn-sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button
                className="btn btn-sm"
                onClick={() => setCurrentIndex(trackData.length - 1)}
                disabled={isPlaying}
              >
                <SkipForward size={14} />
              </button>
            </div>

            <input
              type="range"
              className="flex-1"
              min={0}
              max={trackData.length - 1}
              value={currentIndex}
              onChange={e => {
                setIsPlaying(false);
                setCurrentIndex(Number(e.target.value));
              }}
            />

            <div className="text-sm text-gray-600 min-w-[200px]">
              {currentPoint && (
                <>
                  <div>{new Date(currentPoint.timestamp).toLocaleString('ru')}</div>
                  <div className="text-xs">
                    {currentPoint.speed} км/ч | Точка {currentIndex + 1} / {trackData.length}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
