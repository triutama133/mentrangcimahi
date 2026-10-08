'use client';

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { scaleToZoom } from '@/lib/ptpReport';

export type MapBackground =
  | { type: 'satellite' }
  | { type: 'blank' }
  | { type: 'zone'; data: any; colorField: string; colorMap: Record<string, string>; defaultColor: string };

export interface CaptureJob {
  id: string;
  center: [number, number];
  scaleDenominator: number;
  polygon: [number, number][];
  polygonStroke: string;
  polygonFill: string | null;
  background: MapBackground;
  widthPx?: number;
  heightPx?: number;
  contentWidthMm?: number;
}

interface Props {
  job: CaptureJob;
  onCaptured: (id: string, dataUrl: string, bounds: { getWest: () => number; getEast: () => number; getNorth: () => number; getSouth: () => number }) => void;
}

export const ReportMapCapture: React.FC<Props> = ({ job, onCaptured }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let captured = false;
    let cancelled = false;

    const widthPx = job.widthPx ?? 900;
    const heightPx = job.heightPx ?? 640;

    let style: any;
    if (job.background.type === 'satellite') {
      style = {
        version: 8,
        sources: {
          sat: { type: 'raster', tiles: ['https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'], tileSize: 256, maxzoom: 19 },
        },
        layers: [{ id: 'sat', type: 'raster', source: 'sat' }],
      };
    } else if (job.background.type === 'zone') {
      const { data, colorField, colorMap, defaultColor } = job.background;
      style = {
        version: 8,
        sources: { zone: { type: 'geojson', data } },
        layers: [
          { id: 'bg', type: 'background', paint: { 'background-color': '#ffffff' } },
          {
            id: 'zone-fill',
            type: 'fill',
            source: 'zone',
            paint: {
              'fill-color': ['match', ['get', colorField], ...Object.entries(colorMap).flatMap(([k, v]) => [k, v]), defaultColor],
              'fill-opacity': 1,
            },
          },
        ],
      };
    } else {
      style = {
        version: 8,
        sources: {},
        layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#ffffff' } }],
      };
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: job.center,
      zoom: scaleToZoom(job.scaleDenominator, job.center[1], widthPx, job.contentWidthMm ?? 170),
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
    });

    const doCapture = () => {
      if (captured || cancelled) return;
      captured = true;

      if (job.polygon.length > 2) {
        map.addSource('polygon', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [job.polygon] } },
        });
        if (job.polygonFill) {
          map.addLayer({ id: 'polygon-fill', type: 'fill', source: 'polygon', paint: { 'fill-color': job.polygonFill, 'fill-opacity': 0.85 } });
        }
        map.addLayer({ id: 'polygon-line', type: 'line', source: 'polygon', paint: { 'line-color': job.polygonStroke, 'line-width': 3 } });
      }

      let settled = false;
      const finish = () => {
        if (settled || cancelled) return;
        settled = true;
        const dataUrl = map.getCanvas().toDataURL('image/jpeg', 0.92);
        onCaptured(job.id, dataUrl, map.getBounds());
      };

      map.once('idle', finish);
      // Safety net: a stalled/missing tile source should never block the whole
      // report. Capture whatever has rendered so far if idle never fires.
      setTimeout(finish, 12000);
      map.triggerRepaint();
    };

    map.on('load', doCapture);

    return () => {
      cancelled = true;
      map.remove();
    };
  }, [job, onCaptured]);

  return (
    <div
      ref={containerRef}
      style={{ width: job.widthPx ?? 900, height: job.heightPx ?? 640, position: 'fixed', top: -99999, left: -99999, pointerEvents: 'none' }}
    />
  );
};
