'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { Map as MapLibreMap, Marker, Popup, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  LayerConfig,
  BasemapType,
  ScreeningResult,
  CoordinatePoint,
  DigitasiMode,
  DigitasiProperty,
} from '@/lib/types';
import { screenCoordinate, screenPolygonArea } from '@/lib/spatialAnalysis';
import { RTRW_COLORS, KBU_COLORS, KS_COLORS, LSD_COLOR, LBS_COLOR } from '@/lib/layerConfig';
import { toWgs84, fromWgs84 } from '@/lib/crsDefinitions';
import { LayerPanel } from './LayerPanel';
import { BasemapSwitcher } from './BasemapSwitcher';
import { MeasurementTool, MeasureMode } from './MeasurementTool';
import { SpatialCheckerModal } from './SpatialCheckerModal';
import { DigitasiPanel } from './DigitasiPanel';
import {
  Hexagon,
  Spline,
  Locate,
  RotateCcw,
  Crosshair,
  MapPin,
  HelpCircle,
  Upload,
  Check,
} from 'lucide-react';

interface MapViewProps {
  layers: LayerConfig[];
  onToggleLayer: (layerId: string) => void;
  onChangeOpacity: (layerId: string, opacity: number) => void;
  highlightedPolygon?: CoordinatePoint[] | null;
  polygonName?: string;
  isPinScreeningMode?: boolean;
  setIsPinScreeningMode?: (active: boolean) => void;
  activeScreeningResult?: ScreeningResult | null;
  setActiveScreeningResult?: (res: ScreeningResult | null) => void;
  targetFlyTo?: [number, number] | null;
}

const CIMAHI_CENTER: [number, number] = [107.5437, -6.886892];
const CIMAHI_BOUNDS: [number, number, number, number] = [107.510434, -6.932873, 107.576126, -6.831498];

const BASEMAP_STYLES: Record<BasemapType, any> = {
  'google-hybrid': {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      'google-satellite': {
        type: 'raster',
        tiles: ['https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'],
        tileSize: 256,
        attribution: '&copy; Google Maps',
      },
    },
    layers: [
      {
        id: 'google-satellite-layer',
        type: 'raster',
        source: 'google-satellite',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  },
  'osm': {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'osm-layer',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
  'topo': {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      'opentopo-tiles': {
        type: 'raster',
        tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenTopoMap contributors',
      },
    },
    layers: [
      {
        id: 'opentopo-layer',
        type: 'raster',
        source: 'opentopo-tiles',
        minzoom: 0,
        maxzoom: 17,
      },
    ],
  },
  'peta-dasar': {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      'peta-dasar-tiles': {
        type: 'raster',
        tiles: ['/api/tiles/peta-dasar/{z}/{x}/{y}'],
        tileSize: 256,
        attribution: '&copy; Peta Dasar Pertanahan & BIG',
      },
    },
    layers: [
      {
        id: 'peta-dasar-layer',
        type: 'raster',
        source: 'peta-dasar-tiles',
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  },
};

export const MapView: React.FC<MapViewProps> = ({
  layers,
  onToggleLayer,
  onChangeOpacity,
  highlightedPolygon,
  polygonName: initialPolygonName = 'Bidang_Persil_Cimahi',
  isPinScreeningMode = false,
  setIsPinScreeningMode,
  activeScreeningResult,
  setActiveScreeningResult,
  targetFlyTo,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const screeningMarkerRef = useRef<Marker | null>(null);
  const gpsMarkerRef = useRef<Marker | null>(null);
  const digitasiMarkersRef = useRef<Marker[]>([]);
  const activePopupRef = useRef<Popup | null>(null);

  const [basemap, setBasemap] = useState<BasemapType>('google-hybrid');
  const [measureMode, setMeasureMode] = useState<MeasureMode>('none');
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [isScreeningModalOpen, setIsScreeningModalOpen] = useState(false);
  const [coordsHover, setCoordsHover] = useState<{ lng: number; lat: number } | null>(null);

  // BHUMI ATR/BPN Digitasi State
  const [isDigitasiPanelOpen, setIsDigitasiPanelOpen] = useState<boolean>(false);
  const [digitasiMode, setDigitasiMode] = useState<DigitasiMode>('none');
  const [digitasiPoints, setDigitasiPoints] = useState<CoordinatePoint[]>(highlightedPolygon || []);
  const [selectedCrs, setSelectedCrs] = useState<string>('EPSG:32748');
  const [layerName, setLayerName] = useState<string>(initialPolygonName);
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [fillColor, setFillColor] = useState<string>('#3b82f6');
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const [properties, setProperties] = useState<DigitasiProperty[]>([
    { id: 'p-id', key: 'ID', value: '0ea1ad18-e8d3-4e4e-8622-cbe8e469d41d' },
    { id: 'p-1', key: 'NAMA_BIDANG', value: 'Bidang Persil' },
    { id: 'p-2', key: 'PENGGUNAAN', value: 'Permukiman' },
  ]);

  // Click timing tracking for rapid double-click detection
  const lastClickTimeRef = useRef<number>(0);
  const lastClickPosRef = useRef<{ x: number; y: number } | null>(null);

  // References to keep event handlers fresh
  const digitasiPointsRef = useRef(digitasiPoints);
  digitasiPointsRef.current = digitasiPoints;

  const digitasiModeRef = useRef(digitasiMode);
  digitasiModeRef.current = digitasiMode;

  const isFinishedRef = useRef(isFinished);
  isFinishedRef.current = isFinished;

  const selectedCrsRef = useRef(selectedCrs);
  selectedCrsRef.current = selectedCrs;

  // Handle Finish Digitasi
  const handleFinishDigitasi = useCallback(() => {
    if (digitasiPointsRef.current.length < (digitasiModeRef.current === 'polyline' ? 2 : 3)) {
      return;
    }

    let pts = [...digitasiPointsRef.current];
    if (pts.length > 2) {
      const pLast = pts[pts.length - 1];
      const pPrev = pts[pts.length - 2];
      if (Math.abs(pLast.x - pPrev.x) < 0.001 && Math.abs(pLast.y - pPrev.y) < 0.001) {
        pts.pop();
      }
    }

    setDigitasiPoints(pts);
    setIsFinished(true);
    if (mapRef.current) {
      updateDigitasiGeometry(mapRef.current, pts, digitasiModeRef.current, null, true);
      mapRef.current.getCanvas().style.cursor = 'default';
    }
  }, []);

  // Handle Reset Digitasi
  const handleResetDigitasi = useCallback(() => {
    setDigitasiPoints([]);
    setIsFinished(false);
    if (mapRef.current) {
      updateDigitasiGeometry(mapRef.current, [], digitasiModeRef.current, null, false);
      if (digitasiModeRef.current !== 'none') {
        mapRef.current.getCanvas().style.cursor = 'crosshair';
      }
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLES[basemap],
      center: CIMAHI_CENTER,
      zoom: 13,
      minZoom: 10,
      maxZoom: 20,
      doubleClickZoom: false, // Disabled so double-click finishes digitizing cleanly
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      mapRef.current = map;
      loadVectorLayers(map);
      map.fitBounds(
        [
          [CIMAHI_BOUNDS[0], CIMAHI_BOUNDS[1]],
          [CIMAHI_BOUNDS[2], CIMAHI_BOUNDS[3]],
        ],
        { padding: 40 }
      );
      if (digitasiPointsRef.current.length > 0) {
        updateDigitasiGeometry(map, digitasiPointsRef.current, digitasiModeRef.current, null, true);
      }
    });

    // Mouse move: update coordinates HUD and live rubberband line
    map.on('mousemove', (e) => {
      const lng = Number(e.lngLat.lng.toFixed(6));
      const lat = Number(e.lngLat.lat.toFixed(6));
      setCoordsHover({ lng, lat });

      if (digitasiModeRef.current !== 'none' && !isFinishedRef.current) {
        map.getCanvas().style.cursor = 'crosshair';
        if (digitasiPointsRef.current.length > 0) {
          updateDigitasiGeometry(map, digitasiPointsRef.current, digitasiModeRef.current, [lng, lat], false);
        }
      }
    });

    // Single Click handler
    map.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      const now = Date.now();
      const clickPoint = e.point;

      // Check for rapid double click
      if (
        digitasiModeRef.current !== 'none' &&
        !isFinishedRef.current &&
        lastClickPosRef.current &&
        now - lastClickTimeRef.current < 350
      ) {
        const dx = Math.abs(clickPoint.x - lastClickPosRef.current.x);
        const dy = Math.abs(clickPoint.y - lastClickPosRef.current.y);
        if (dx < 20 && dy < 20) {
          handleFinishDigitasi();
          lastClickTimeRef.current = 0;
          lastClickPosRef.current = null;
          return;
        }
      }

      lastClickTimeRef.current = now;
      lastClickPosRef.current = clickPoint;

      // 1. Digitasi Mode
      if (digitasiModeRef.current !== 'none' && !isFinishedRef.current) {
        const curCrs = selectedCrsRef.current;
        const [xVal, yVal] = fromWgs84(lng, lat, curCrs);
        const newNo = digitasiPointsRef.current.length + 1;
        const newPoint: CoordinatePoint = {
          id: `p-${Date.now()}-${newNo}`,
          no: newNo,
          name: `P${newNo}`,
          x: Math.round(xVal * 100) / 100,
          y: Math.round(yVal * 100) / 100,
          lng: Number(lng.toFixed(6)),
          lat: Number(lat.toFixed(6)),
        };

        const updated = [...digitasiPointsRef.current, newPoint];
        setDigitasiPoints(updated);
        updateDigitasiGeometry(map, updated, digitasiModeRef.current, null, false);
        return;
      }

      // 2. Measurement mode
      if (measureMode !== 'none') {
        const newPts = [...measurePoints, [lng, lat] as [number, number]];
        setMeasurePoints(newPts);
        updateMeasurementGeometry(map, newPts, measureMode);
        return;
      }

      // 3. Check for Vector Feature Click Popup (RTRW / KBU / LSD / LBS)
      const vectorLayers = ['rtrw-pola-ruang-fill', 'kbu-zonasi-fill', 'lsd-cimahi-fill', 'lbs-cimahi-fill'];
      const activeVectorLayers = vectorLayers.filter((l) => map.getLayer(l) && map.getLayoutProperty(l, 'visibility') !== 'none');
      const clickedFeatures = map.queryRenderedFeatures(e.point, { layers: activeVectorLayers });

      if (clickedFeatures.length > 0 && !isPinScreeningMode) {
        const feat = clickedFeatures[0];
        const props = feat.properties;
        const layerId = feat.layer.id;

        let title = 'Informasi Poligon';
        let detail = '';
        let badgeColor = 'bg-slate-700 text-white';

        if (layerId.includes('rtrw')) {
          title = props.NAMOBJ || 'RTRW Pola Ruang';
          detail = `<b>Pola Ruang:</b> ${props.NAMOBJ}<br/><b>Orde 1:</b> ${props.ORDE01 || '-'}`;
          badgeColor = 'bg-emerald-600 text-white';
        } else if (layerId.includes('kbu')) {
          title = props.Zona || 'Zonasi KBU';
          detail = `<b>Zona:</b> ${props.Zona}<br/><b>Keterangan:</b> ${props.Zona_1 || '-'}`;
          badgeColor = 'bg-emerald-600 text-white';
        } else if (layerId.includes('lsd')) {
          title = 'Lahan Sawah Dilindungi';
          detail = `<b>Status:</b> ${props.Kesesuaian || 'LSD'}<br/><b>Hasil:</b> ${props.HASIL || '-'}`;
          badgeColor = 'bg-emerald-600 text-white';
        } else if (layerId.includes('lbs')) {
          title = 'Lahan Baku Sawah';
          detail = `<b>Objek:</b> ${props.NAMOBJ || 'Sawah'}<br/><b>Jenis:</b> ${props.JSWH || '-'}`;
          badgeColor = 'bg-emerald-600 text-white';
        }

        if (activePopupRef.current) activePopupRef.current.remove();

        const popupHtml = `
          <div class="space-y-1.5 text-xs text-slate-100 font-sans">
            <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-1">
              <span class="font-bold text-slate-100">${title}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded font-mono ${badgeColor}">Info Lapisan</span>
            </div>
            <div class="text-[11px] text-slate-300 leading-relaxed">${detail}</div>
            <div class="pt-1.5 text-right">
              <button id="popup-screen-btn" class="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded font-semibold transition-colors">
                Telaah Detail Titik Ini &rarr;
              </button>
            </div>
          </div>
        `;

        const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat([lng, lat])
          .setHTML(popupHtml)
          .addTo(map);

        activePopupRef.current = popup;

        setTimeout(() => {
          const btn = document.getElementById('popup-screen-btn');
          if (btn) {
            btn.addEventListener('click', () => {
              popup.remove();
              handleMapCoordinateIdentify(lng, lat);
            });
          }
        }, 100);

        return;
      }

      // 4. Normal Coordinate Screening / Identify
      handleMapCoordinateIdentify(lng, lat);
    });

    // Double Click handler
    map.on('dblclick', (e) => {
      if (digitasiModeRef.current !== 'none' && !isFinishedRef.current) {
        e.preventDefault();
        handleFinishDigitasi();
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [handleFinishDigitasi, isPinScreeningMode]);

  // Keyboard shortcuts: Enter (Finish), Escape (Reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (digitasiMode !== 'none' && !isFinished) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleFinishDigitasi();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleResetDigitasi();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [digitasiMode, isFinished, handleFinishDigitasi, handleResetDigitasi]);

  // Update cursor on mode switch
  useEffect(() => {
    if (!mapRef.current) return;
    const canvas = mapRef.current.getCanvas();
    if (digitasiMode !== 'none' && !isFinished) {
      canvas.style.cursor = 'crosshair';
    } else {
      canvas.style.cursor = 'default';
    }
  }, [digitasiMode, isFinished]);

  // Handle Basemap Switch
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    map.setStyle(BASEMAP_STYLES[basemap]);

    // 'style.load' fires unreliably right after setStyle() in some MapLibre
    // versions, silently dropping the re-added vector layers. Poll
    // isStyleLoaded() instead, which reflects the real readiness state.
    let cancelled = false;
    const waitForStyle = () => {
      if (cancelled || !mapRef.current) return;
      if (map.isStyleLoaded()) {
        loadVectorLayers(map);
        if (digitasiPoints.length > 0) {
          updateDigitasiGeometry(map, digitasiPoints, digitasiMode, null, isFinished);
        }
        if (measurePoints.length > 0) {
          updateMeasurementGeometry(map, measurePoints, measureMode);
        }
        // A raster layer loaded immediately after setStyle() sometimes loads
        // its tiles but doesn't paint them until a distinct zoom change.
        if (basemap === 'peta-dasar') {
          const z = map.getZoom();
          map.once('idle', () => map.jumpTo({ zoom: z + 0.01 }));
        }
      } else {
        requestAnimationFrame(waitForStyle);
      }
    };
    requestAnimationFrame(waitForStyle);

    return () => {
      cancelled = true;
    };
  }, [basemap]);

  // Update Digitasi vertex markers on the map
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    digitasiMarkersRef.current.forEach((m) => m.remove());
    digitasiMarkersRef.current = [];

    if (digitasiMode !== 'none' && digitasiPoints.length > 0) {
      digitasiPoints.forEach((p, idx) => {
        const isFirstPoint = idx === 0;

        const el = document.createElement('div');
        el.className = `w-4 h-4 rounded-full bg-white border-2 ${
          isFirstPoint && !isFinished ? 'border-amber-500 animate-pulse ring-2 ring-amber-400/50' : 'border-slate-900'
        } shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-150 transition-transform`;
        el.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${
          isFirstPoint && !isFinished ? 'bg-amber-500' : 'bg-emerald-500'
        }"></span>`;
        el.title = isFirstPoint && !isFinished && digitasiPoints.length >= 3
          ? `Titik 1 (Klik untuk menutup dan mengunci poligon)`
          : `Titik ${p.no}: X=${p.x}, Y=${p.y}`;

        if (isFirstPoint && !isFinished) {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (digitasiPointsRef.current.length >= 3) {
              handleFinishDigitasi();
            }
          });
        }

        const marker = new maplibregl.Marker({ element: el, draggable: true })
          .setLngLat([p.lng ?? p.x, p.lat ?? p.y])
          .addTo(map);

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          const [newX, newY] = fromWgs84(lngLat.lng, lngLat.lat, selectedCrs);
          const updated = [...digitasiPointsRef.current];
          updated[idx] = {
            ...updated[idx],
            x: Math.round(newX * 100) / 100,
            y: Math.round(newY * 100) / 100,
            lng: Number(lngLat.lng.toFixed(6)),
            lat: Number(lngLat.lat.toFixed(6)),
          };
          setDigitasiPoints(updated);
          updateDigitasiGeometry(map, updated, digitasiModeRef.current, null, isFinishedRef.current);
        });

        digitasiMarkersRef.current.push(marker);
      });
    }
  }, [digitasiPoints, digitasiMode, selectedCrs, isFinished, handleFinishDigitasi]);

  // Handle Layer Colors / Opacities / Visibility
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    const map = mapRef.current;

    layers.forEach((layer) => {
      const fillLayerId = `${layer.id}-fill`;
      const lineLayerId = `${layer.id}-line`;
      const labelLayerId = `${layer.id}-label`;

      if (map.getLayer(fillLayerId)) {
        map.setLayoutProperty(fillLayerId, 'visibility', layer.visible ? 'visible' : 'none');
        map.setPaintProperty(fillLayerId, 'fill-opacity', layer.opacity);
      }
      if (map.getLayer(lineLayerId)) {
        map.setLayoutProperty(lineLayerId, 'visibility', layer.visible ? 'visible' : 'none');
      }
      if (map.getLayer(labelLayerId)) {
        map.setLayoutProperty(labelLayerId, 'visibility', layer.visible ? 'visible' : 'none');
      }
    });

    if (map.getLayer('digitasi-fill')) {
      map.setPaintProperty('digitasi-fill', 'fill-color', fillColor);
    }
    if (map.getLayer('digitasi-line')) {
      map.setPaintProperty('digitasi-line', 'line-color', strokeColor);
    }
  }, [layers, strokeColor, fillColor]);

  // Smooth Zoom to Imported Polygon Bounds
  const handleImportSuccess = (bounds: [number, number, number, number]) => {
    if (!mapRef.current) return;
    mapRef.current.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      { padding: 60, maxZoom: 17, duration: 1200 }
    );
    setIsFinished(true);
  };

  // Run True Polygon Intersection Analysis (PKKPR Engine)
  const handleCheckPolygonScreening = async () => {
    if (digitasiPoints.length < 3) return;

    // Calculate Polygon breakdown
    const polyBreakdown = await screenPolygonArea(digitasiPoints);
    if (!polyBreakdown) return;

    // Also get centroid point screening
    const pointResult = await screenCoordinate(polyBreakdown.centroid.lng, polyBreakdown.centroid.lat);

    const mergedResult: ScreeningResult = {
      ...pointResult,
      polygonBreakdown: polyBreakdown,
    };

    if (setActiveScreeningResult) {
      setActiveScreeningResult(mergedResult);
    }
    setIsScreeningModalOpen(true);
  };

  // Helper: Update Digitasi Geometry on Map
  const updateDigitasiGeometry = (
    map: MapLibreMap,
    points: CoordinatePoint[],
    mode: DigitasiMode,
    rubberband: [number, number] | null,
    closed: boolean
  ) => {
    const src = map.getSource('digitasi-src') as GeoJSONSource;
    if (!src) return;

    if (points.length === 0) {
      src.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const coords = points.map((p) => [p.lng ?? p.x, p.lat ?? p.y]);
    if (rubberband && !closed) {
      coords.push(rubberband);
    }

    const isPoly = mode === 'polygon';

    if (isPoly && (closed || coords.length >= 3)) {
      const closedCoords = [...coords];
      if (
        closedCoords[0][0] !== closedCoords[closedCoords.length - 1][0] ||
        closedCoords[0][1] !== closedCoords[closedCoords.length - 1][1]
      ) {
        closedCoords.push([...closedCoords[0]]);
      }

      src.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: layerName || 'Hasil Digitasi' },
            geometry: {
              type: 'Polygon',
              coordinates: [closedCoords],
            },
          },
        ],
      });
    } else {
      src.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coords,
            },
          },
        ],
      });
    }
  };

  // Helper: Load all vector data sources and style layers into MapLibre
  const loadVectorLayers = (map: MapLibreMap) => {
    // 1. RTRW Pola Ruang
    if (!map.getSource('rtrw-pola-ruang-src')) {
      map.addSource('rtrw-pola-ruang-src', {
        type: 'geojson',
        data: '/data/rtrw_pola_ruang.geojson',
      });

      const rtrwColorMatch: any = ['match', ['get', 'NAMOBJ']];
      Object.entries(RTRW_COLORS).forEach(([k, v]) => {
        rtrwColorMatch.push(k, v);
      });
      rtrwColorMatch.push('#94a3b8');

      const rtrwConfig = layers.find((l) => l.id === 'rtrw-pola-ruang');
      map.addLayer({
        id: 'rtrw-pola-ruang-fill',
        type: 'fill',
        source: 'rtrw-pola-ruang-src',
        layout: { visibility: rtrwConfig?.visible ? 'visible' : 'none' },
        paint: {
          'fill-color': rtrwColorMatch,
          'fill-opacity': rtrwConfig?.opacity ?? 0.75,
        },
      });
    }

    // 2. KBU Zonasi
    if (!map.getSource('kbu-zonasi-src')) {
      map.addSource('kbu-zonasi-src', {
        type: 'geojson',
        data: '/data/kbu_zonasi.geojson',
      });

      const kbuColorMatch: any = ['match', ['get', 'Zona']];
      Object.entries(KBU_COLORS).forEach(([k, v]) => {
        kbuColorMatch.push(k, v);
      });
      kbuColorMatch.push('#64748b');

      const kbuConfig = layers.find((l) => l.id === 'kbu-zonasi');
      map.addLayer({
        id: 'kbu-zonasi-fill',
        type: 'fill',
        source: 'kbu-zonasi-src',
        layout: { visibility: kbuConfig?.visible ? 'visible' : 'none' },
        paint: {
          'fill-color': kbuColorMatch,
          'fill-opacity': kbuConfig?.opacity ?? 0.7,
        },
      });

      map.addLayer({
        id: 'kbu-zonasi-line',
        type: 'line',
        source: 'kbu-zonasi-src',
        layout: { visibility: kbuConfig?.visible ? 'visible' : 'none' },
        paint: {
          'line-color': '#1e293b',
          'line-width': 1.2,
        },
      });
    }

    // 3. LSD Cimahi
    if (!map.getSource('lsd-cimahi-src')) {
      map.addSource('lsd-cimahi-src', {
        type: 'geojson',
        data: '/data/lsd_cimahi.geojson',
      });

      const lsdConfig = layers.find((l) => l.id === 'lsd-cimahi');
      map.addLayer({
        id: 'lsd-cimahi-fill',
        type: 'fill',
        source: 'lsd-cimahi-src',
        layout: { visibility: lsdConfig?.visible ? 'visible' : 'none' },
        paint: {
          'fill-color': LSD_COLOR,
          'fill-opacity': lsdConfig?.opacity ?? 0.8,
        },
      });

      map.addLayer({
        id: 'lsd-cimahi-line',
        type: 'line',
        source: 'lsd-cimahi-src',
        layout: { visibility: lsdConfig?.visible ? 'visible' : 'none' },
        paint: {
          'line-color': '#15803d',
          'line-width': 1.0,
        },
      });
    }

    // 4. LBS Cimahi
    if (!map.getSource('lbs-cimahi-src')) {
      map.addSource('lbs-cimahi-src', {
        type: 'geojson',
        data: '/data/lbs_cimahi.geojson',
      });

      const lbsConfig = layers.find((l) => l.id === 'lbs-cimahi');
      map.addLayer({
        id: 'lbs-cimahi-fill',
        type: 'fill',
        source: 'lbs-cimahi-src',
        layout: { visibility: lbsConfig?.visible ? 'visible' : 'none' },
        paint: {
          'fill-color': LBS_COLOR,
          'fill-opacity': lbsConfig?.opacity ?? 0.75,
        },
      });

      map.addLayer({
        id: 'lbs-cimahi-line',
        type: 'line',
        source: 'lbs-cimahi-src',
        layout: { visibility: lbsConfig?.visible ? 'visible' : 'none' },
        paint: {
          'line-color': '#0369a1',
          'line-width': 1.0,
        },
      });
    }

    // 5. Kawasan Strategis
    if (!map.getSource('kawasan-strategis-src')) {
      map.addSource('kawasan-strategis-src', {
        type: 'geojson',
        data: '/data/kawasan_strategis.geojson',
      });

      const ksColorMatch: any = ['match', ['get', 'NAMOBJ']];
      Object.entries(KS_COLORS).forEach(([k, v]) => {
        ksColorMatch.push(k, v);
      });
      ksColorMatch.push('#a855f7');

      const ksConfig = layers.find((l) => l.id === 'kawasan-strategis');
      map.addLayer({
        id: 'kawasan-strategis-fill',
        type: 'fill',
        source: 'kawasan-strategis-src',
        layout: { visibility: ksConfig?.visible ? 'visible' : 'none' },
        paint: {
          'fill-color': ksColorMatch,
          'fill-opacity': ksConfig?.opacity ?? 0.65,
        },
      });

      map.addLayer({
        id: 'kawasan-strategis-line',
        type: 'line',
        source: 'kawasan-strategis-src',
        layout: { visibility: ksConfig?.visible ? 'visible' : 'none' },
        paint: {
          'line-color': '#6b21a8',
          'line-width': 1.5,
        },
      });
    }

    // 6. Batas Kelurahan & Kecamatan
    if (!map.getSource('batas-kelurahan-src')) {
      map.addSource('batas-kelurahan-src', {
        type: 'geojson',
        data: '/data/batas_kelurahan.geojson',
      });

      const admConfig = layers.find((l) => l.id === 'batas-kelurahan');
      map.addLayer({
        id: 'batas-kelurahan-fill',
        type: 'fill',
        source: 'batas-kelurahan-src',
        layout: { visibility: admConfig?.visible ? 'visible' : 'none' },
        paint: {
          'fill-color': '#f1f5f9',
          'fill-opacity': admConfig?.opacity ?? 0.1,
        },
      });

      map.addLayer({
        id: 'batas-kelurahan-line',
        type: 'line',
        source: 'batas-kelurahan-src',
        layout: { visibility: admConfig?.visible ? 'visible' : 'none' },
        paint: {
          'line-color': '#0284c7',
          'line-width': 2.0,
          'line-dasharray': [2, 1],
        },
      });

      map.addLayer({
        id: 'batas-kelurahan-label',
        type: 'symbol',
        source: 'batas-kelurahan-src',
        layout: {
          visibility: admConfig?.visible ? 'visible' : 'none',
          'text-field': ['get', 'KELURAHAN'],
          'text-size': 11,
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-anchor': 'center',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#0369a1',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2.0,
        },
      });
    }

    // 7. BHUMI ATR/BPN Digitasi Source & Layers
    if (!map.getSource('digitasi-src')) {
      map.addSource('digitasi-src', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'digitasi-fill',
        type: 'fill',
        source: 'digitasi-src',
        paint: {
          'fill-color': fillColor,
          'fill-opacity': 0.45,
        },
      });

      map.addLayer({
        id: 'digitasi-line',
        type: 'line',
        source: 'digitasi-src',
        paint: {
          'line-color': strokeColor,
          'line-width': 2.5,
          'line-dasharray': [2, 1],
        },
      });
    }

    // 8. Measurement Source & Layers
    if (!map.getSource('measurement-src')) {
      map.addSource('measurement-src', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'measurement-fill',
        type: 'fill',
        source: 'measurement-src',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.35,
        },
      });

      map.addLayer({
        id: 'measurement-line',
        type: 'line',
        source: 'measurement-src',
        paint: {
          'line-color': '#10b981',
          'line-width': 2.5,
          'line-dasharray': [2, 1.5],
        },
      });
    }
  };

  // Helper: Update Measurement geometry
  const updateMeasurementGeometry = (map: MapLibreMap, points: [number, number][], mode: MeasureMode) => {
    const src = map.getSource('measurement-src') as GeoJSONSource;
    if (!src) return;

    if (points.length < 2) {
      src.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    if (mode === 'distance') {
      src.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: points,
            },
          },
        ],
      });
    } else if (mode === 'area') {
      const ring = [...points, points[0]];
      src.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [ring],
            },
          },
        ],
      });
    }
  };

  // Helper: Perform Spatial Screening analysis without modifying markers
  const handlePerformScreeningAnalysis = async (lng: number, lat: number) => {
    const screeningRes = await screenCoordinate(lng, lat);
    if (setActiveScreeningResult) {
      setActiveScreeningResult(screeningRes);
    }
    setIsScreeningModalOpen(true);
    if (setIsPinScreeningMode) {
      setIsPinScreeningMode(false);
    }
  };

  // Helper: Google Maps Classic Red Pin Marker
  const createSearchRedPinElement = (label?: string, onClick?: () => void) => {
    const wrapper = document.createElement('div');
    // MapLibre will set transform: translate(...) on wrapper. DO NOT add animate-bounce or CSS transform on wrapper directly!
    wrapper.className = 'cursor-pointer group select-none pointer-events-auto';

    wrapper.innerHTML = `
      <div class="relative flex flex-col items-center">
        ${
          label
            ? `<div class="absolute -top-7 whitespace-nowrap bg-slate-900/95 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-lg shadow-lg border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
                ${label}
              </div>`
            : ''
        }
        <div class="relative flex flex-col items-center animate-bounce">
          <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg" class="transition-transform group-hover:scale-110 drop-shadow-md">
            <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.2 14.5 40.5 16.1 41.9C16.6 42.3 17.4 42.3 17.9 41.9C19.5 40.5 34 27.2 34 17C34 7.61116 26.3888 0 17 0Z" fill="#EA4335"/>
            <path d="M17 0.5C7.8873 0.5 0.5 7.8873 0.5 17C0.5 21.6 4.2 28.1 9.4 34.2C12.3 37.6 15.3 40.3 17 41.7C18.7 40.3 21.7 37.6 24.6 34.2C29.8 28.1 33.5 21.6 33.5 17C33.5 7.8873 26.1127 0.5 17 0.5Z" stroke="#B91C1C" stroke-width="1"/>
            <circle cx="17" cy="16" r="6.5" fill="#FFFFFF"/>
            <circle cx="17" cy="16" r="3.5" fill="#B91C1C"/>
          </svg>
          <div class="w-3.5 h-1.5 bg-black/50 rounded-full blur-[1px] -mt-1"></div>
        </div>
      </div>
    `;

    if (onClick) {
      wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });
    }

    return wrapper;
  };

  // Helper: Google Maps Blue GPS Location Pin Marker with Pulsing Radar
  const createGpsBluePinElement = (onClick?: () => void) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'cursor-pointer group select-none pointer-events-auto';

    wrapper.innerHTML = `
      <div class="relative flex flex-col items-center">
        <!-- Radar Pulsing Wave Effect -->
        <div class="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-12 bg-blue-500/35 rounded-full animate-ping pointer-events-none"></div>
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-sky-400/30 rounded-full animate-pulse pointer-events-none"></div>
        
        <!-- Tooltip -->
        <div class="absolute -top-7 whitespace-nowrap bg-blue-900/95 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-lg shadow-lg border border-blue-500 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
          Lokasi Saya (GPS)
        </div>

        <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg" class="relative z-10 transition-transform group-hover:scale-110 drop-shadow-md">
          <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.2 14.5 40.5 16.1 41.9C16.6 42.3 17.4 42.3 17.9 41.9C19.5 40.5 34 27.2 34 17C34 7.61116 26.3888 0 17 0Z" fill="#1A73E8"/>
          <path d="M17 0.5C7.8873 0.5 0.5 7.8873 0.5 17C0.5 21.6 4.2 28.1 9.4 34.2C12.3 37.6 15.3 40.3 17 41.7C18.7 40.3 21.7 37.6 24.6 34.2C29.8 28.1 33.5 21.6 33.5 17C33.5 7.8873 26.1127 0.5 17 0.5Z" stroke="#1E40AF" stroke-width="1"/>
          <circle cx="17" cy="16" r="6.5" fill="#FFFFFF"/>
          <circle cx="17" cy="16" r="3.5" fill="#1A73E8"/>
        </svg>
        <div class="w-3.5 h-1.5 bg-blue-950/60 rounded-full blur-[1px] -mt-1 relative z-10"></div>
      </div>
    `;

    if (onClick) {
      wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });
    }

    return wrapper;
  };

  // Identify / Point Spatial Screening with Red Google Maps Teardrop Pin
  const handleMapCoordinateIdentify = async (lng: number, lat: number, label?: string) => {
    if (!mapRef.current) return;

    if (screeningMarkerRef.current) {
      screeningMarkerRef.current.remove();
      screeningMarkerRef.current = null;
    }

    const el = createSearchRedPinElement(label, () => handlePerformScreeningAnalysis(lng, lat));
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);
    screeningMarkerRef.current = marker;

    await handlePerformScreeningAnalysis(lng, lat);
  };

  // Handle external flyTo requests (e.g. from Kelurahan selector in navbar or dashboard)
  useEffect(() => {
    if (!targetFlyTo || !mapRef.current) return;
    mapRef.current.flyTo({ center: targetFlyTo, zoom: 15.5, essential: true });
    handleMapCoordinateIdentify(targetFlyTo[0], targetFlyTo[1], 'Lokasi Terpilih');
  }, [targetFlyTo]);

  // Reset Cimahi View
  const handleResetView = () => {
    if (!mapRef.current) return;
    mapRef.current.fitBounds(
      [
        [CIMAHI_BOUNDS[0], CIMAHI_BOUNDS[1]],
        [CIMAHI_BOUNDS[2], CIMAHI_BOUNDS[3]],
      ],
      { padding: 40 }
    );
  };

  // User Geolocation with Blue Maps Pin and Radar Halo
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapRef.current) {
      alert('Fitur Geolocation tidak didukung atau belum diizinkan pada browser Anda.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lng = Number(pos.coords.longitude.toFixed(6));
        const lat = Number(pos.coords.latitude.toFixed(6));
        if (!mapRef.current) return;

        mapRef.current.flyTo({ center: [lng, lat], zoom: 16.5, essential: true });

        // Clean up previous screening red marker so only the blue GPS pin is shown
        if (screeningMarkerRef.current) {
          screeningMarkerRef.current.remove();
          screeningMarkerRef.current = null;
        }

        if (gpsMarkerRef.current) {
          gpsMarkerRef.current.remove();
        }

        const el = createGpsBluePinElement(() => handlePerformScreeningAnalysis(lng, lat));
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);
        gpsMarkerRef.current = marker;

        // Perform screening analysis directly without spawning a red marker on top of the blue pin
        await handlePerformScreeningAnalysis(lng, lat);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Tidak dapat mendeteksi lokasi GPS. Pastikan izin akses lokasi telah aktif.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div
      className={`relative w-full h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden ${
        digitasiMode !== 'none' && !isFinished ? 'digitasi-active-canvas cursor-gis-digitasi' : ''
      }`}
    >
      {/* MapLibre Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Left: Floating Layer Panel */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <LayerPanel
          layers={layers}
          onToggleLayer={onToggleLayer}
          onChangeOpacity={onChangeOpacity}
        />
      </div>

      {/* Top Right: BHUMI ATR/BPN Style Digitasi Panel */}
      {isDigitasiPanelOpen && (
        <div className="absolute top-4 right-4 z-30">
          <DigitasiPanel
            digitasiMode={digitasiMode}
            setDigitasiMode={setDigitasiMode}
            layerName={layerName}
            setLayerName={setLayerName}
            selectedCrs={selectedCrs}
            setSelectedCrs={setSelectedCrs}
            points={digitasiPoints}
            setPoints={setDigitasiPoints}
            properties={properties}
            setProperties={setProperties}
            strokeColor={strokeColor}
            setStrokeColor={setStrokeColor}
            fillColor={fillColor}
            setFillColor={setFillColor}
            isFinished={isFinished}
            onFinishDrawing={handleFinishDigitasi}
            onResetDrawing={handleResetDigitasi}
            onCheckKajianTataRuang={handleCheckPolygonScreening}
            onImportSuccess={handleImportSuccess}
            onBackToList={() => {
              setDigitasiMode('none');
              handleResetDigitasi();
            }}
            onClose={() => {
              setIsDigitasiPanelOpen(false);
              setDigitasiMode('none');
              handleResetDigitasi();
            }}
          />
        </div>
      )}

      {/* Top Center: Digitasi / Screening Status Prompts */}
      {digitasiMode !== 'none' && !isFinished && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-600/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl font-semibold text-xs shadow-2xl flex items-center gap-2.5 border border-emerald-400">
          <div className="w-3 h-3 rounded-full bg-white animate-ping" />
          <span>
            Mode Digitasi Aktif: <b>Klik di peta</b> untuk menambah titik patok, <b>Klik 2x (atau Enter)</b> untuk selesai.
          </span>
          <button
            onClick={handleFinishDigitasi}
            disabled={digitasiPoints.length < (digitasiMode === 'polyline' ? 2 : 3)}
            className="ml-2 bg-white text-slate-900 px-3 py-1 rounded-xl text-xs font-bold hover:bg-slate-100 disabled:opacity-50 transition-all shadow-sm"
          >
            Selesai (Enter)
          </button>
        </div>
      )}

      {isPinScreeningMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-slate-950 px-4 py-2 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2 border border-amber-300 animate-bounce">
          <Crosshair className="w-4 h-4 animate-spin" />
          <span>Mode Cek Aktif: Klik pada lokasi mana saja di Kota Cimahi</span>
          <button
            onClick={() => setIsPinScreeningMode && setIsPinScreeningMode(false)}
            className="ml-2 bg-slate-950/20 hover:bg-slate-950/40 p-1 rounded-md text-xs"
          >
            Batal
          </button>
        </div>
      )}

      {/* Bottom Floating Action Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <button
          onClick={() => {
            if (isDigitasiPanelOpen) {
              setIsDigitasiPanelOpen(false);
              setDigitasiMode('none');
              handleResetDigitasi();
            } else {
              setIsDigitasiPanelOpen(true);
              if (measureMode !== 'none') setMeasureMode('none');
            }
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xl backdrop-blur-md transition-all border ${
            isDigitasiPanelOpen
              ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/50'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-emerald-500'
          }`}
          title="Buka Alat Digitasi Peta ala BHUMI ATR/BPN"
        >
          <Hexagon className="w-4 h-4 text-emerald-400" />
          <span>{isDigitasiPanelOpen ? 'Panel Digitasi Aktif' : 'Digitasi Peta'}</span>
        </button>

        <BasemapSwitcher currentBasemap={basemap} onSelectBasemap={setBasemap} />

        <MeasurementTool
          measureMode={measureMode}
          setMeasureMode={(mode) => {
            setMeasureMode(mode);
            if (mode !== 'none') {
              setDigitasiMode('none');
              handleResetDigitasi();
            }
          }}
          measurePoints={measurePoints}
          onClearMeasure={() => {
            setMeasurePoints([]);
            if (mapRef.current) updateMeasurementGeometry(mapRef.current, [], 'none');
          }}
        />

        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl">
          <button
            onClick={handleResetView}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Reset Peta ke Batas Kota Cimahi"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleLocateMe}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Lokasi Saya (GPS)"
          >
            <Locate className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Right: Live Coordinates HUD */}
      {coordsHover && (
        <div className="absolute bottom-6 right-4 z-20 hidden md:flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 shadow-lg">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>Lng: {coordsHover.lng}</span>
          <span className="text-slate-600">|</span>
          <span>Lat: {coordsHover.lat}</span>
        </div>
      )}

      {/* Spatial Screening Modal */}
      {isScreeningModalOpen && activeScreeningResult && (
        <SpatialCheckerModal
          result={activeScreeningResult}
          onClose={() => setIsScreeningModalOpen(false)}
        />
      )}
    </div>
  );
};
