'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Building,
  Trees,
  Shield,
  Sprout,
  MapPin,
} from 'lucide-react';
import { SpatialSummary } from '@/lib/types';
import { RTRW_COLORS, KBU_COLORS, LSD_COLOR } from '@/lib/layerConfig';

interface StatisticsDashboardProps {
  onSelectKelurahan?: (center: [number, number]) => void;
}

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ onSelectKelurahan }) => {
  const [summary, setSummary] = useState<SpatialSummary | null>(null);
  const [activeKecamatan, setActiveKecamatan] = useState<string>('Kecamatan Cimahi Tengah');

  useEffect(() => {
    fetch('/data/spatial_summary.json')
      .then((res) => res.json())
      .then((data: SpatialSummary) => setSummary(data))
      .catch((err) => console.error('Failed to load spatial summary:', err));
  }, []);

  if (!summary) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Memuat Data Statistik Geospasial Cimahi...</span>
        </div>
      </div>
    );
  }

  // Top Pola Ruang data for chart
  const topPolaRuang = summary.rtrw.pola_ruang.slice(0, 10);

  // KBU Zonasi chart data
  const kbuData = summary.kbu.zonasi.map((z) => ({
    name: z.zona,
    value: z.area_ha,
    color: KBU_COLORS[z.zona] || '#64748b',
  }));

  // LSD Kesesuaian chart data
  const lsdColorMap: Record<string, string> = {
    'LSD SESUAI TANAMAN PANGAN': '#16a34a',
    'LSD TIDAK SESUAI TANAMAN PANGAN': '#dc2626',
    'KOREKSI': '#f59e0b',
  };
  const lsdData = summary.lsd.by_kesesuaian.map((k) => ({
    name: k.kesesuaian,
    value: k.area_ha,
    color: lsdColorMap[k.kesesuaian] || LSD_COLOR,
  }));

  // Kecamatans list
  const kecamatans = Object.keys(summary.rtrw.by_kecamatan);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100">
                  Dashboard Analitik & Statistik Geospasial
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
                  Perda 4/2024
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ringkasan komprehensif luas Pola Ruang, Kawasan Bandung Utara (KBU), Lahan Sawah Dilindungi (LSD), dan Lahan Baku Sawah (LBS) Kota Cimahi.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-xs bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800">
            <span className="text-slate-400">Total Luas Wilayah Kota:</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {summary.total_area_ha.toLocaleString('id-ID')} Ha
            </span>
          </div>
        </div>

        {/* 4 Metric Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: RTRW */}
          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Pola Ruang RTRW (Perda 4/2024)
              </span>
              <span className="text-2xl font-bold text-slate-100 font-mono">
                {summary.rtrw.total_features}
              </span>
              <span className="text-[11px] text-slate-500 block">Poligon Kawasan Terpetakan</span>
            </div>
          </div>

          {/* Card 2: KBU */}
          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Trees className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Kawasan Bandung Utara (KBU)
              </span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                {summary.kbu.zonasi.reduce((acc, z) => acc + z.area_ha, 0).toFixed(1)} Ha
              </span>
              <span className="text-[11px] text-slate-500 block">Zona B1 s/d B5 & L1, L2</span>
            </div>
          </div>

          {/* Card 3: LSD */}
          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Lahan Sawah Dilindungi (LSD)
              </span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                {summary.lsd.total_area_ha.toFixed(2)} Ha
              </span>
              <span className="text-[11px] text-slate-500 block">
                {summary.lsd.total_features.toLocaleString('id-ID')} Persil Terverifikasi
              </span>
            </div>
          </div>

          {/* Card 4: LBS */}
          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Lahan Baku Sawah (LBS)
              </span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                {summary.lbs.total_area_ha.toFixed(2)} Ha
              </span>
              <span className="text-[11px] text-slate-500 block">
                {summary.lbs.total_features} Hamparan Sawah Aktif
              </span>
            </div>
          </div>

        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Top Pola Ruang Bar Chart (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Distribusi Luas Pola Ruang Terbesar (Hektar)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Top 10 Kawasan</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPolaRuang} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `${v} Ha`} />
                  <YAxis type="category" dataKey="namobj" stroke="#94a3b8" fontSize={10} width={130} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(value: any) => [`${value} Ha`, 'Luas']}
                  />
                  <Bar dataKey="area_ha" radius={[0, 8, 8, 0]}>
                    {topPolaRuang.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RTRW_COLORS[entry.namobj] || '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KBU & LSD Donut Charts (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* KBU Zonasi */}
            <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Trees className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Proporsi Zonasi KBU
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400">Perda Jabar 2/2016</span>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={kbuData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3}>
                      {kbuData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(v: any) => [`${v} Ha`, 'Luas']}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* LSD Kesesuaian */}
            <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Status Kesesuaian LSD
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400">Validasi Walikota</span>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={lsdData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3}>
                      {lsdData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(v: any) => [`${v} Ha`, 'Luas']}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>

        {/* Per-Kecamatan Analysis Breakdown */}
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Rincian Pola Ruang per Kecamatan di Kota Cimahi
              </h3>
            </div>

            {/* Kecamatan Tab Pills */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {kecamatans.map((kec) => (
                <button
                  key={kec}
                  onClick={() => setActiveKecamatan(kec)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeKecamatan === kec
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {kec.replace('Kecamatan ', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Table for Selected Kecamatan */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="p-3 border-b border-slate-800 w-12 text-center">No</th>
                  <th className="p-3 border-b border-slate-800">Nama Kawasan Pola Ruang (RTRW 2024-2044)</th>
                  <th className="p-3 border-b border-slate-800 text-right">Luas Kawasan (Ha)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {summary.rtrw.by_kecamatan[activeKecamatan]?.map((row, idx) => (
                  <tr key={row.NAMOBJ} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="p-3 flex items-center gap-2 text-slate-200 font-sans">
                      <span
                        className="w-3.5 h-3.5 rounded flex-shrink-0 border border-slate-700 shadow-sm"
                        style={{ backgroundColor: RTRW_COLORS[row.NAMOBJ] || '#94a3b8' }}
                      />
                      <span>{row.NAMOBJ}</span>
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-400">
                      {row.area_ha.toFixed(2)} Ha
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 15 Kelurahan Quick Navigator */}
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              15 Kelurahan di Kota Cimahi
            </span>
            <span className="text-[10px] text-slate-400">Klik kelurahan untuk zoom di peta</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {summary.kelurahan_list.map((k) => (
              <button
                key={k.kelurahan}
                onClick={() => onSelectKelurahan && onSelectKelurahan(k.center)}
                className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group"
              >
                <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 block truncate">
                  {k.kelurahan}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  {k.kecamatan.replace('Kecamatan ', '')}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

