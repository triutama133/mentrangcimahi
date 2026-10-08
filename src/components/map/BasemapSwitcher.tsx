'use client';

import React, { useState } from 'react';
import { Layers, Globe2, Mountain, MapPinned } from 'lucide-react';
import { BasemapType } from '@/lib/types';

interface BasemapSwitcherProps {
  currentBasemap: BasemapType;
  onSelectBasemap: (type: BasemapType) => void;
}

const BASEMAP_OPTIONS: { id: BasemapType; name: string; icon: React.ReactNode }[] = [
  {
    id: 'google-hybrid',
    name: 'Google Satellite Hybrid',
    icon: <Globe2 className="w-4 h-4 text-emerald-400" />,
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    icon: <Layers className="w-4 h-4 text-emerald-400" />,
  },
  {
    id: 'topo',
    name: 'Topografi / Relief',
    icon: <Mountain className="w-4 h-4 text-emerald-400" />,
  },
  {
    id: 'peta-dasar',
    name: 'Peta Dasar ATR/BPN',
    icon: <MapPinned className="w-4 h-4 text-emerald-400" />,
  },
];

export const BasemapSwitcher: React.FC<BasemapSwitcherProps> = ({ currentBasemap, onSelectBasemap }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 px-3 py-2 rounded-xl text-xs font-medium border border-slate-700 shadow-xl backdrop-blur-md transition-all hover:border-slate-500"
        title="Ganti Peta Dasar (Basemap)"
      >
        <Globe2 className="w-4 h-4 text-emerald-400" />
        <span className="hidden sm:inline">Peta Dasar</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-12 w-56 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-2.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Pilih Basemap</span>
            <span className="text-[10px] text-emerald-400 font-mono">Live</span>
          </div>

          <div className="space-y-1.5">
            {BASEMAP_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  onSelectBasemap(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-all ${
                  currentBasemap === opt.id
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/50 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-lg bg-slate-800">{opt.icon}</div>
                  <span>{opt.name}</span>
                </div>
                {currentBasemap === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

