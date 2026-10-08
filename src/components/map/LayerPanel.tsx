'use client';

import React, { useState } from 'react';
import {
  Layers,
  Sliders,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  Shield,
  Sprout,
  Building,
  Trees,
  MapPin,
  Locate,
  Hexagon,
  Ruler,
  Info,
} from 'lucide-react';
import { LayerConfig } from '@/lib/types';
import {
  RTRW_COLORS,
  KBU_COLORS,
  KBU_REGULATIONS,
  LSD_COLORS,
  LBS_COLORS,
  KS_COLORS,
  LSD_COLOR,
  LBS_COLOR,
} from '@/lib/layerConfig';

interface LayerPanelProps {
  layers: LayerConfig[];
  onToggleLayer: (layerId: string) => void;
  onChangeOpacity: (layerId: string, opacity: number) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({ layers, onToggleLayer, onChangeOpacity }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isSymbolsOpen, setIsSymbolsOpen] = useState(true);
  const [expandedLegends, setExpandedLegends] = useState<Record<string, boolean>>({
    'rtrw-pola-ruang': true,
    'kbu-zonasi': true,
    'lsd-cimahi': true,
    'lbs-cimahi': true,
    'kawasan-strategis': true,
    'batas-kelurahan': true,
  });

  const toggleLegend = (layerId: string) => {
    setExpandedLegends((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  const getLayerIcon = (category: LayerConfig['category']) => {
    switch (category) {
      case 'rtrw':
        return <Building className="w-4 h-4 text-emerald-400" />;
      case 'kbu':
        return <Trees className="w-4 h-4 text-emerald-400" />;
      case 'lsd':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'lbs':
        return <Sprout className="w-4 h-4 text-emerald-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const renderLegendItems = (layer: LayerConfig) => {
    // 1. Batas Administrasi Kelurahan
    if (layer.id === 'batas-kelurahan') {
      return (
        <div className="pt-2 px-1 text-[11px] space-y-2">
          <div className="flex items-center gap-2.5 py-1">
            <div className="w-7 h-0 border-t-2 border-dashed border-sky-400 flex-shrink-0" />
            <span className="text-slate-200 font-semibold">Garis Batas Kelurahan & Kecamatan</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[10px] space-y-1.5 text-slate-300">
            <div>
              <span className="font-bold text-sky-400">Kec. Cimahi Utara (4 Kel):</span>{' '}
              <span className="text-slate-400">Cipageran, Citeureup, Cibabat, Pasirkaliki</span>
            </div>
            <div>
              <span className="font-bold text-sky-400">Kec. Cimahi Tengah (6 Kel):</span>{' '}
              <span className="text-slate-400">Baros, Cigugur Tengah, Karangmekar, Setiamanah, Padasuka, Cimahi</span>
            </div>
            <div>
              <span className="font-bold text-sky-400">Kec. Cimahi Selatan (5 Kel):</span>{' '}
              <span className="text-slate-400">Cibeber, Cibeureum, Leuwigajah, Melong, Utama</span>
            </div>
          </div>
        </div>
      );
    }

    // 2. KBU Zonasi dengan Panduan Koefisien Ruang (KDB & KLB)
    if (layer.id === 'kbu-zonasi') {
      return (
        <div className="space-y-1.5 pt-2 px-1 text-[11px] max-h-60 overflow-y-auto pr-1">
          {Object.entries(KBU_COLORS).map(([zona, color]) => {
            const reg = KBU_REGULATIONS[zona];
            return (
              <div key={zona} className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-sm flex-shrink-0 border border-slate-700/80 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-bold text-slate-200">{zona}</span>
                  </div>
                  {reg && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                      KDB {reg.kdb} | KLB {reg.klb}
                    </span>
                  )}
                </div>
                {reg && <span className="text-[10px] text-slate-400 pl-5 leading-tight">{reg.desc}</span>}
              </div>
            );
          })}
        </div>
      );
    }

    // 3. Single color legend for LSD
    if (layer.id === 'lsd-cimahi') {
      return (
        <div className="pt-2 px-1 text-[11px] space-y-1.5">
          <div className="flex items-center gap-2 py-0.5">
            <span
              className="w-3.5 h-3.5 rounded-sm flex-shrink-0 border border-slate-700/80 shadow-sm"
              style={{ backgroundColor: LSD_COLOR }}
            />
            <span className="text-slate-200 font-semibold">Lahan Sawah Dilindungi (LSD) - Hijau</span>
          </div>
          <p className="text-[10px] text-slate-400 pl-5 leading-relaxed">
            Kawasan sawah yang dipertahankan dan dilindungi secara ketat berdasarkan Kepmen ATR/BPN No. 1589/2021 & Berita Acara Walikota Cimahi.
          </p>
        </div>
      );
    }

    // 4. Single color legend for LBS
    if (layer.id === 'lbs-cimahi') {
      return (
        <div className="pt-2 px-1 text-[11px] space-y-1.5">
          <div className="flex items-center gap-2 py-0.5">
            <span
              className="w-3.5 h-3.5 rounded-sm flex-shrink-0 border border-slate-700/80 shadow-sm"
              style={{ backgroundColor: LBS_COLOR }}
            />
            <span className="text-slate-200 font-semibold">Lahan Baku Sawah (LBS) - Biru</span>
          </div>
          <p className="text-[10px] text-slate-400 pl-5 leading-relaxed">
            Sebaran data spasial baku sawah eksisting di Kota Cimahi per ketetapan data spasial Kementerian ATR/BPN.
          </p>
        </div>
      );
    }

    // 5. General classification color maps (RTRW & Kawasan Strategis)
    let colorMap: Record<string, string> = {};
    if (layer.id === 'rtrw-pola-ruang') colorMap = RTRW_COLORS;
    else if (layer.id === 'kawasan-strategis') colorMap = KS_COLORS;

    const entries = Object.entries(colorMap);
    if (entries.length === 0) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 px-1 text-[11px] max-h-56 overflow-y-auto pr-1">
        {entries.map(([label, color]) => (
          <div key={label} className="flex items-center gap-2 py-0.5">
            <span
              className="w-3.5 h-3.5 rounded-sm flex-shrink-0 border border-slate-700/80 shadow-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-slate-300 truncate font-medium" title={label}>
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Trigger button when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium border border-slate-700 shadow-xl backdrop-blur-md transition-all hover:border-emerald-500"
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Daftar Lapisan & Legenda</span>
        </button>
      )}

      {/* Main Floating Drawer */}
      {isOpen && (
        <div className="w-80 sm:w-96 max-h-[80vh] flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-40">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Daftar Lapisan Spasial
                </h3>
                <p className="text-[10px] text-slate-400">Kota Cimahi (Perda 4/2024)</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Layer List Scrollable */}
          <div className="p-3 space-y-3 overflow-y-auto flex-1 divide-y divide-slate-800/60">
            {layers.map((layer) => (
              <div key={layer.id} className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleLayer(layer.id)}
                      className="text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      {layer.visible ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {getLayerIcon(layer.category)}
                      <span
                        onClick={() => onToggleLayer(layer.id)}
                        className={`text-xs font-medium cursor-pointer truncate ${
                          layer.visible ? 'text-slate-200 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        {layer.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {layer.colorMap && (
                      <button
                        onClick={() => toggleLegend(layer.id)}
                        className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
                        title="Tampilkan Legenda"
                      >
                        {expandedLegends[layer.id] ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Opacity Slider if visible */}
                {layer.visible && (
                  <div className="flex items-center gap-2 px-6 py-1 bg-slate-950/40 rounded-lg border border-slate-800/40">
                    <Sliders className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] text-slate-400 w-12">
                      Transparansi: {Math.round(layer.opacity * 100)}%
                    </span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      aria-label={`Transparansi layer ${layer.name}`}
                      value={layer.opacity}
                      onChange={(e) => onChangeOpacity(layer.id, parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                )}

                {/* Description & Legal Basis */}
                <div className="pl-6 text-[10px] text-slate-400">
                  <p>{layer.description}</p>
                </div>

                {/* Expandable Legend */}
                {layer.visible && expandedLegends[layer.id] && layer.colorMap && (
                  <div className="pl-6 pb-1 border-t border-slate-800/40 mt-1">
                    {renderLegendItems(layer)}
                  </div>
                )}
              </div>
            ))}
            {/* Map Symbols & Pin Guide */}
            <div className="pt-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Simbol & Marker Peta
                  </span>
                </div>
                <button
                  onClick={() => setIsSymbolsOpen(!isSymbolsOpen)}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
                  title="Toggle Panduan Simbol"
                >
                  {isSymbolsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {isSymbolsOpen && (
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-2 text-[11px]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-6 flex items-center justify-center flex-shrink-0">
                      <svg width="18" height="22" viewBox="0 0 34 42" fill="none">
                        <path d="M17 0C7.6 0 0 7.6 0 17C0 27.2 14.5 40.5 16.1 41.9C16.6 42.3 17.4 42.3 17.9 41.9C19.5 40.5 34 27.2 34 17C34 7.6 26.4 0 17 0Z" fill="#EA4335"/>
                        <circle cx="17" cy="16" r="6.5" fill="#FFFFFF"/>
                        <circle cx="17" cy="16" r="3.5" fill="#B91C1C"/>
                      </svg>
                    </div>
                    <span className="text-slate-300">
                      <b>Pin Merah:</b> Titik Pencarian / Hasil Telaah Koordinat
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-6 flex items-center justify-center flex-shrink-0">
                      <svg width="18" height="22" viewBox="0 0 34 42" fill="none">
                        <path d="M17 0C7.6 0 0 7.6 0 17C0 27.2 14.5 40.5 16.1 41.9C16.6 42.3 17.4 42.3 17.9 41.9C19.5 40.5 34 27.2 34 17C34 7.6 26.4 0 17 0Z" fill="#1A73E8"/>
                        <circle cx="17" cy="16" r="6.5" fill="#FFFFFF"/>
                        <circle cx="17" cy="16" r="3.5" fill="#1A73E8"/>
                      </svg>
                    </div>
                    <span className="text-slate-300">
                      <b>Pin Biru + Radar:</b> Posisi GPS Pengguna (<i>Lokasi Saya</i>)
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-5 flex items-center justify-center flex-shrink-0">
                      <div className="w-5 h-3 border-2 border-dashed border-sky-400 bg-sky-500/20 rounded-sm" />
                    </div>
                    <span className="text-slate-300">
                      <b>Poligon Biru:</b> Bidang Hasil Digitasi (BHUMI ATR/BPN)
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-5 flex items-center justify-center flex-shrink-0">
                      <div className="w-5 h-0.5 border-t-2 border-dashed border-emerald-400" />
                    </div>
                    <span className="text-slate-300">
                      <b>Garis Hijau:</b> Alat Ukur Jarak / Dimensi
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer quick toggle */}
          <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 text-center">
            <span className="text-[10px] text-emerald-400 font-medium">
              💡 Tip: Klik poligon mana saja di peta untuk melihat detail atribut
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

