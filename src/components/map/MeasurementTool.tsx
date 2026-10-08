'use client';

import React from 'react';
import { Ruler, Square, Trash2, X } from 'lucide-react';
import * as turf from '@turf/turf';

export type MeasureMode = 'none' | 'distance' | 'area';

type MeasurementResult =
  | { type: 'distance'; m: number; km: number }
  | { type: 'area'; m2: number; ha: number }
  | null;

interface MeasurementToolProps {
  measureMode: MeasureMode;
  setMeasureMode: (mode: MeasureMode) => void;
  measurePoints: [number, number][];
  onClearMeasure: () => void;
}

export const MeasurementTool: React.FC<MeasurementToolProps> = ({
  measureMode,
  setMeasureMode,
  measurePoints,
  onClearMeasure,
}) => {
  // Calculate real-time measurements
  const calculateResult = (): MeasurementResult => {
    if (measureMode === 'distance' && measurePoints.length >= 2) {
      const line = turf.lineString(measurePoints);
      const km = turf.length(line, { units: 'kilometers' });
      const m = km * 1000;
      return {
        type: 'distance',
        m: Math.round(m * 100) / 100,
        km: Math.round(km * 1000) / 1000,
      };
    }
    if (measureMode === 'area' && measurePoints.length >= 3) {
      const ring = [...measurePoints, measurePoints[0]];
      const poly = turf.polygon([ring]);
      const m2 = turf.area(poly);
      const ha = m2 / 10000;
      return {
        type: 'area',
        m2: Math.round(m2 * 100) / 100,
        ha: Math.round(ha * 10000) / 10000,
      };
    }
    return null;
  };

  const result = calculateResult();

  return (
    <div className="relative">
      <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl">
        <button
          onClick={() => {
            if (measureMode === 'distance') {
              setMeasureMode('none');
              onClearMeasure();
            } else {
              setMeasureMode('distance');
              onClearMeasure();
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            measureMode === 'distance'
              ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Ukur Jarak Garis (Meter / Km)"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ukur Jarak</span>
        </button>

        <button
          onClick={() => {
            if (measureMode === 'area') {
              setMeasureMode('none');
              onClearMeasure();
            } else {
              setMeasureMode('area');
              onClearMeasure();
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            measureMode === 'area'
              ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Ukur Luas Poligon (m² / Ha)"
        >
          <Square className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ukur Luas</span>
        </button>

        {measureMode !== 'none' && (
          <button
            onClick={() => {
              setMeasureMode('none');
              onClearMeasure();
            }}
            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 transition-colors"
            title="Batal Pengukuran"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Measurement Result Floating Bubble */}
      {measureMode !== 'none' && (
        <div className="absolute left-0 bottom-12 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-semibold text-slate-200">
              {measureMode === 'distance' ? 'Pengukuran Jarak' : 'Pengukuran Luas'}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              {measurePoints.length} titik
            </span>
          </div>

          <div className="py-2 space-y-1 text-slate-300">
            {measurePoints.length === 0 && (
              <p className="text-[11px] text-slate-400 italic">
                Klik pada peta untuk mulai menambahkan titik ukur...
              </p>
            )}

            {measureMode === 'distance' && (
              <div>
                {result && result.type === 'distance' ? (
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-emerald-400 font-mono">
                      {result.m >= 1000 ? `${result.km} km` : `${result.m} meter`}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Total: {result.m} m ({result.km} km)
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    Tambahkan minimal 2 titik untuk melihat jarak.
                  </span>
                )}
              </div>
            )}

            {measureMode === 'area' && (
              <div>
                {result && result.type === 'area' ? (
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-emerald-400 font-mono">
                      {result.ha >= 1 ? `${result.ha} Ha` : `${result.m2} m²`}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {result.m2.toLocaleString('id-ID')} m² ({result.ha} Hektar)
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    Tambahkan minimal 3 titik untuk membentuk poligon luas.
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={onClearMeasure}
              className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300"
            >
              <Trash2 className="w-3 h-3" /> Reset Titik
            </button>
            <button
              onClick={() => setMeasureMode('none')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-[11px] hover:bg-slate-700"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

