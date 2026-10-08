'use client';

import React, { useState, useEffect } from 'react';
import { TabType, LayerConfig, ScreeningResult, SpatialSummary } from '@/lib/types';
import { DEFAULT_LAYERS } from '@/lib/layerConfig';
import { Navbar } from '@/components/shared/Navbar';
import { MapView } from '@/components/map/MapView';
import { StatisticsDashboard } from '@/components/analytics/StatisticsDashboard';
import { RegulationsView } from '@/components/regulations/RegulationsView';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [layers, setLayers] = useState<LayerConfig[]>(DEFAULT_LAYERS);
  const [isPinScreeningMode, setIsPinScreeningMode] = useState<boolean>(false);
  const [activeScreeningResult, setActiveScreeningResult] = useState<ScreeningResult | null>(null);
  const [targetFlyTo, setTargetFlyTo] = useState<[number, number] | null>(null);
  const [summary, setSummary] = useState<SpatialSummary | null>(null);

  useEffect(() => {
    fetch('/data/spatial_summary.json')
      .then((res) => res.json())
      .then((data) => setSummary(data))
      .catch((err) => console.error('Failed to load spatial summary:', err));
  }, []);

  // Layer toggle handler
  const handleToggleLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  };

  // Layer opacity handler
  const handleChangeOpacity = (layerId: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, opacity } : l))
    );
  };

  // Select kelurahan from header or dashboard
  const handleSelectKelurahan = (center: [number, number]) => {
    setTargetFlyTo(center);
    setActiveTab('map');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        kelurahanList={summary?.kelurahan_list}
        onSelectKelurahan={handleSelectKelurahan}
        onStartPinScreening={() => setIsPinScreeningMode(true)}
        isScreeningActive={isPinScreeningMode}
      />

      {/* Main Tab Content */}
      <main className="flex-1 w-full relative">
        {activeTab === 'map' && (
          <MapView
            layers={layers}
            onToggleLayer={handleToggleLayer}
            onChangeOpacity={handleChangeOpacity}
            isPinScreeningMode={isPinScreeningMode}
            setIsPinScreeningMode={setIsPinScreeningMode}
            activeScreeningResult={activeScreeningResult}
            setActiveScreeningResult={setActiveScreeningResult}
            targetFlyTo={targetFlyTo}
          />
        )}

        {activeTab === 'analytics' && (
          <StatisticsDashboard onSelectKelurahan={handleSelectKelurahan} />
        )}

        {activeTab === 'regulations' && <RegulationsView />}
      </main>
    </div>
  );
}

