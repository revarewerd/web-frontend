/**
 * MapView — карта OpenLayers (center region)
 *
 * Legacy: OpenLayers 2.x + Ext.panel.Panel (region: 'center')
 * Новый: OpenLayers 10 (ol пакет)
 *
 * Слои карты:
 *   - OSM (OpenStreetMap) — базовый слой
 *   - Legacy также поддерживал Google Maps и Яндекс Карты
 *   - Маркеры объектов (Vehicle[]) — иконки авто с поворотом
 *   - Треки (polyline из GPS-точек)
 *   - Геозоны (polygon с цветной заливкой)
 *
 * API для маркеров: mapObjects.getLonLat(uids)
 * API для треков: /pathdata?data=speedgraph (сервлет)
 */
import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { Style, Icon, Fill, Stroke, Text, Circle as CircleStyle } from 'ol/style';
import Overlay from 'ol/Overlay';
import { useAppStore } from '@/store/appStore';
import type { Vehicle, Geozone } from '@/types';
import 'ol/ol.css';

export function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vehicleLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const geozoneLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<Overlay | null>(null);

  const { vehicles, geozones, selectedVehicleUids, targetedVehicleUids } = useAppStore();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Инициализация карты
  useEffect(() => {
    if (!mapRef.current) return;

    // Слой геозон
    const geozoneSource = new VectorSource();
    const geozoneLayer = new VectorLayer({
      source: geozoneSource,
      style: (feature) => {
        const color = feature.get('color') || '#3388ff';
        return new Style({
          fill: new Fill({
            color: hexToRgba(color, 0.3),
          }),
          stroke: new Stroke({
            color: color,
            width: 2,
          }),
          text: new Text({
            text: feature.get('name'),
            font: '12px sans-serif',
            fill: new Fill({ color: '#333' }),
            stroke: new Stroke({ color: '#fff', width: 3 }),
          }),
        });
      },
    });
    geozoneLayerRef.current = geozoneLayer;

    // Слой объектов
    const vehicleSource = new VectorSource();
    const vehicleLayer = new VectorLayer({
      source: vehicleSource,
      style: (feature) => {
        const vehicle = feature.get('vehicle') as Vehicle;
        const isOnline = Date.now() - vehicle.time < 300000;
        const isMoving = vehicle.speed > 2;
        
        // Цвет маркера
        let color = '#999'; // offline
        if (isOnline) {
          color = isMoving ? '#157fcc' : '#5fa339'; // moving / stopped
        }
        if (vehicle.blocked) {
          color = '#cc4b37'; // blocked
        }
        
        return new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
          }),
          text: new Text({
            text: vehicle.name,
            offsetY: -15,
            font: '11px sans-serif',
            fill: new Fill({ color: '#333' }),
            stroke: new Stroke({ color: '#fff', width: 3 }),
          }),
        });
      },
    });
    vehicleLayerRef.current = vehicleLayer;

    // Popup overlay
    if (popupRef.current) {
      overlayRef.current = new Overlay({
        element: popupRef.current,
        autoPan: true,
      });
    }

    // Создаём карту
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        geozoneLayer,
        vehicleLayer,
      ],
      view: new View({
        center: fromLonLat([37.6156, 55.7522]), // Москва
        zoom: 11,
      }),
      overlays: overlayRef.current ? [overlayRef.current] : [],
    });

    mapInstanceRef.current = map;

    // Клик на карте
    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      
      if (feature && feature.get('vehicle')) {
        const vehicle = feature.get('vehicle') as Vehicle;
        setSelectedVehicle(vehicle);
        
        if (overlayRef.current) {
          overlayRef.current.setPosition(evt.coordinate);
        }
      } else {
        setSelectedVehicle(null);
        if (overlayRef.current) {
          overlayRef.current.setPosition(undefined);
        }
      }
    });

    // Cursor на объектах
    map.on('pointermove', (evt) => {
      const hit = map.hasFeatureAtPixel(evt.pixel);
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  // Обновление объектов на карте
  useEffect(() => {
    if (!vehicleLayerRef.current) return;
    const source = vehicleLayerRef.current.getSource();
    if (!source) return;

    source.clear();

    // Показываем только выбранные объекты
    const visibleVehicles = vehicles.filter(v => v.checked && !v.hidden);

    visibleVehicles.forEach((vehicle) => {
      if (vehicle.lon && vehicle.lat) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([vehicle.lon, vehicle.lat])),
          vehicle,
        });
        feature.setId(vehicle.uid);
        source.addFeature(feature);
      }
    });

    // Центрируем на targeted объектах
    if (targetedVehicleUids.length > 0) {
      const targetedVehicle = vehicles.find(v => targetedVehicleUids.includes(v.uid));
      if (targetedVehicle && targetedVehicle.lon && targetedVehicle.lat) {
        mapInstanceRef.current?.getView().animate({
          center: fromLonLat([targetedVehicle.lon, targetedVehicle.lat]),
          duration: 500,
        });
      }
    }
  }, [vehicles, selectedVehicleUids, targetedVehicleUids]);

  // Обновление геозон на карте
  useEffect(() => {
    if (!geozoneLayerRef.current) return;
    const source = geozoneLayerRef.current.getSource();
    if (!source) return;

    source.clear();

    geozones.forEach((geozone) => {
      if (geozone.points && geozone.points.length >= 3) {
        const coords = geozone.points.map(p => fromLonLat([p.x, p.y]));
        coords.push(coords[0]); // Замыкаем полигон
        
        const feature = new Feature({
          geometry: new Polygon([coords]),
          name: geozone.name,
          color: geozone.ftColor,
        });
        feature.setId(`geozone-${geozone.id}`);
        source.addFeature(feature);
      }
    });
  }, [geozones]);

  return (
    <div className="map-container">
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Popup */}
      <div ref={popupRef} style={{ background: '#fff', border: '1px solid #b5b8c8', borderRadius: 4, boxShadow: '2px 2px 6px rgba(0,0,0,0.2)', minWidth: 200 }}>
        {selectedVehicle && (
          <VehiclePopup vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
        )}
      </div>

      {/* Map controls overlay */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <button
          className="btn bg-white"
          onClick={() => {
            // Zoom to all vehicles
            const coords = vehicles
              .filter(v => v.checked && v.lon && v.lat)
              .map(v => fromLonLat([v.lon, v.lat]));
            
            if (coords.length > 0 && mapInstanceRef.current) {
              const view = mapInstanceRef.current.getView();
              if (coords.length === 1) {
                view.animate({ center: coords[0], zoom: 15, duration: 500 });
              } else {
                // Fit to extent
                const source = vehicleLayerRef.current?.getSource();
                if (source) {
                  view.fit(source.getExtent(), { padding: [50, 50, 50, 50], duration: 500 });
                }
              }
            }
          }}
          title="Показать все объекты"
        >
          📍
        </button>
      </div>
    </div>
  );
}

// Popup для объекта
interface VehiclePopupProps {
  vehicle: Vehicle;
  onClose: () => void;
}

function VehiclePopup({ vehicle, onClose }: VehiclePopupProps) {
  const isOnline = Date.now() - vehicle.time < 300000;
  const isMoving = vehicle.speed > 2;

  return (
    <div>
      <div className="panel-header text-sm">
        <span>{vehicle.name}</span>
        <button onClick={onClose} className="text-white hover:bg-white/20 px-1">×</button>
      </div>
      <div className="p-2 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Статус:</span>
          <span className={isOnline ? (isMoving ? 'text-blue-600' : 'text-green-600') : 'text-gray-500'}>
            {isOnline ? (isMoving ? 'Движение' : 'Стоянка') : 'Нет связи'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Скорость:</span>
          <span>{vehicle.speed} км/ч</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Курс:</span>
          <span>{vehicle.course}°</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Координаты:</span>
          <span>{vehicle.lat.toFixed(5)}, {vehicle.lon.toFixed(5)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Последнее сообщение:</span>
          <span>{new Date(vehicle.time).toLocaleString('ru')}</span>
        </div>
        {vehicle.blocked && (
          <div className="text-red-600 font-medium">🔒 Заблокирован</div>
        )}
      </div>
    </div>
  );
}

// Хелпер для конвертации hex в rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
