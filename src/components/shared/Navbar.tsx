'use client';

import React from 'react';
import {
  Map as MapIcon,
  BarChart3,
  BookOpen,
  Compass,
  MapPin,
} from 'lucide-react';
import { TabType } from '@/lib/types';
import { SearchBar } from './SearchBar';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  kelurahanList?: { kelurahan: string; kecamatan: string; center: [number, number] }[];
  onSelectKelurahan?: (center: [number, number]) => void;
  onStartPinScreening?: () => void;
  isScreeningActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  kelurahanList = [],
  onSelectKelurahan,
  onStartPinScreening,
  isScreeningActive = false,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('map')}>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-emerald-400">
                  MENTRANG
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                  CIMAHI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none hidden sm:block">
                Melek Informasi Tata Ruang &middot; Perda 4/2024
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'map'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Peta WebGIS
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Statistik Spasial
            </button>

            <button
              onClick={() => setActiveTab('regulations')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'regulations'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Regulasi
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Location Search: place/address, coordinate, or kelurahan */}
            <div className="hidden lg:block w-64 xl:w-80">
              <SearchBar
                kelurahanList={kelurahanList}
                onSelectLocation={(center) => {
                  setActiveTab('map');
                  if (onSelectKelurahan) onSelectKelurahan(center);
                }}
              />
            </div>

            {/* Quick Cek Lokasi / Pin Screening Button */}
            <button
              onClick={() => {
                setActiveTab('map');
                if (onStartPinScreening) onStartPinScreening();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isScreeningActive
                  ? 'bg-amber-500 text-slate-950 font-semibold ring-2 ring-amber-400 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{isScreeningActive ? 'Klik Titik di Peta...' : 'Cek Tata Ruang'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-slate-800/60 gap-2">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs whitespace-nowrap ${
              activeTab === 'map' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            <MapIcon className="w-3 h-3" /> Peta
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs whitespace-nowrap ${
              activeTab === 'analytics' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-3 h-3" /> Statistik
          </button>
          <button
            onClick={() => setActiveTab('regulations')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs whitespace-nowrap ${
              activeTab === 'regulations' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-3 h-3" /> Regulasi
          </button>
        </div>
      </div>
    </header>
  );
};

