'use client';

import React, { useState } from 'react';
import { BookOpen, Building, Trees, Shield, ChevronDown, ChevronRight, Check, AlertTriangle, X } from 'lucide-react';
import { KBU_REGULATIONS, RTRW_COLORS } from '@/lib/layerConfig';
import { RTRW_ZONE_REGULATIONS, KBU_ZONE_DIRECTIVES } from '@/lib/regulationDetails';

// Grouped to mirror Pasal 53 ayat (4) & (5) of Perda 4/2024
const KAWASAN_LINDUNG = [
  'Badan Air',
  'Kawasan Perlindungan Setempat',
  'Rimba Kota',
  'Taman Kota',
  'Taman Kecamatan',
  'Taman Kelurahan',
  'Taman RW',
  'Pemakaman',
  'Jalur Hijau',
];

const KAWASAN_BUDIDAYA = [
  'Badan Jalan',
  'Kawasan Tanaman Pangan',
  'Kawasan Hortikultura',
  'Kawasan Peruntukan Pertambangan Batuan',
  'Kawasan Peruntukan Industri',
  'Kawasan Pariwisata',
  'Kawasan Perumahan',
  'Kawasan Fasilitas Umum dan Fasilitas Sosial',
  'Kawasan Infrastruktur Perkotaan',
  'Kawasan Perdagangan dan Jasa',
  'Kawasan Perkantoran',
  'Kawasan Transportasi',
  'Kawasan Pertahanan dan Keamanan',
];

const ZoneAccordion: React.FC<{ zoneNames: string[] }> = ({ zoneNames }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {zoneNames.map((name) => {
        const detail = RTRW_ZONE_REGULATIONS[name];
        const isOpen = expanded === name;
        return (
          <div key={name} className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : name)}
              className="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-slate-900/60 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0 border border-slate-700"
                  style={{ backgroundColor: RTRW_COLORS[name] || '#94a3b8' }}
                />
                <span className="text-xs font-semibold text-slate-200 truncate">{name}</span>
                {detail && <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">{detail.pasal}</span>}
              </div>
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
            </button>

            {isOpen && detail && (
              <div className="px-3 pb-3 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
                <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold uppercase tracking-wide text-[10px]">
                    <Check className="w-3 h-3" /> Diperbolehkan
                  </div>
                  <ul className="space-y-1 text-slate-300 list-disc pl-3.5">
                    {detail.diperbolehkan.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold uppercase tracking-wide text-[10px]">
                    <AlertTriangle className="w-3 h-3" /> Bersyarat
                  </div>
                  <ul className="space-y-1 text-slate-300 list-disc pl-3.5">
                    {detail.bersyarat.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-400 font-semibold uppercase tracking-wide text-[10px]">
                    <X className="w-3 h-3" /> Dilarang
                  </div>
                  <ul className="space-y-1 text-slate-300 list-disc pl-3.5">
                    {detail.dilarang.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const KbuAccordion: React.FC = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Object.entries(KBU_REGULATIONS).map(([zona, info]) => {
        const directive = KBU_ZONE_DIRECTIVES[zona];
        const isOpen = expanded === zona;
        return (
          <div key={zona} className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 text-xs">{zona}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  KBU
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{info.desc}</p>
              <div className="text-[10px] text-slate-300 font-mono pt-1 space-y-0.5 border-t border-slate-900">
                <div>KDB: <b>{info.kdb}</b></div>
                <div>KLB: <b>{info.klb}</b></div>
                <div>KDH: <b>{info.kdh}</b></div>
              </div>
              {directive && (
                <button
                  onClick={() => setExpanded(isOpen ? null : zona)}
                  className="w-full flex items-center justify-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 pt-1"
                >
                  {isOpen ? 'Sembunyikan Arahan' : 'Lihat Arahan Lengkap'}
                  {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              )}
            </div>

            {isOpen && directive && (
              <div className="px-4 pb-4 space-y-2.5 text-[11px]">
                <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-2.5 space-y-1.5">
                  <div className="text-emerald-400 font-semibold uppercase tracking-wide text-[10px]">
                    Arahan Umum ({directive.pasal})
                  </div>
                  <ul className="space-y-1 text-slate-300 list-disc pl-3.5">
                    {directive.arahan.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-400 font-semibold uppercase tracking-wide text-[10px]">
                    <X className="w-3 h-3" /> Dilarang
                  </div>
                  <ul className="space-y-1 text-slate-300 list-disc pl-3.5">
                    {directive.dilarang.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const RegulationsView: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100">Dasar Hukum & Ketentuan Tata Ruang</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
                  Regulasi Resmi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Landasan hukum tata ruang wilayah, pengendalian KBU, serta perlindungan lahan sawah di Kota Cimahi.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Perda No 4 Tahun 2024 (RTRW Kota Cimahi) */}
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Peraturan Daerah Kota Cimahi Nomor 4 Tahun 2024
              </h2>
              <p className="text-xs text-slate-400">
                Tentang Rencana Tata Ruang Wilayah (RTRW) Kota Cimahi Tahun 2024–2044
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <p>
              RTRW Kota Cimahi 2024–2044 menetapkan arah kebijakan penataan ruang kota untuk jangka waktu 20 tahun ke depan, mewujudkan Kota Cimahi yang berdaya saing, berketahanan lingkungan, dan berbasis pada integrasi industri ramah lingkungan, perdagangan dan jasa, pertahanan, serta permukiman layak huni. Ketentuan kegiatan yang diperbolehkan, bersyarat, dan dilarang per zona Pola Ruang bersumber dari Ketentuan Umum Zonasi (Pasal 60–72).
            </p>

            <div>
              <span className="font-bold text-emerald-400 block text-xs mb-2">🌿 Kawasan Lindung</span>
              <ZoneAccordion zoneNames={KAWASAN_LINDUNG} />
            </div>

            <div>
              <span className="font-bold text-emerald-400 block text-xs mb-2">🏗️ Kawasan Budidaya</span>
              <ZoneAccordion zoneNames={KAWASAN_BUDIDAYA} />
            </div>
          </div>
        </div>

        {/* Section 2: Perda Jabar No 2 Tahun 2016 (Zonasi KBU) */}
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Peraturan Daerah Provinsi Jawa Barat Nomor 2 Tahun 2016
              </h2>
              <p className="text-xs text-slate-400">
                Tentang Pedoman Pengendalian Kawasan Bandung Utara (KBU)
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-300">
            <p>
              Kawasan Bandung Utara (KBU) di wilayah Kota Cimahi mencakup sebagian Kecamatan Cimahi Utara dan Cimahi Tengah yang berfungsi sebagai daerah resapan air (recharge area) bagi Cekungan Bandung. Pemanfaatan ruang di KBU diatur sangat ketat berdasarkan zonasi dan koefisien intensitas bangunan; arahan umum tiap zona bersumber dari Pasal 22–28.
            </p>

            <KbuAccordion />
          </div>
        </div>

        {/* Section 3: LSD & LBS (Lahan Sawah) */}
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Kebijakan Lahan Sawah Dilindungi (LSD) & Lahan Baku Sawah (LBS)
              </h2>
              <p className="text-xs text-slate-400">
                Keputusan Menteri ATR/BPN No. 1589/2021 & Berita Acara Walikota Cimahi 2022
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              Penetapan Lahan Sawah Dilindungi (LSD) merupakan mandat Perpres No. 59 Tahun 2019 guna menjaga ketahanan pangan nasional. Di Kota Cimahi, proses sinkronisasi dan verifikasi faktual telah dilaksanakan bersama Kementerian ATR/BPN dan Dinas PUPR, menghasilkan Berita Acara Kesepakatan:
            </p>

            <ul className="space-y-2 pl-4 list-disc text-slate-400 text-xs">
              <li>
                <b>LSD Sesuai Tanaman Pangan:</b> Wajib dipertahankan sebagai areal persawahan dan tidak diizinkan untuk alih fungsi non-pertanian.
              </li>
              <li>
                <b>Koreksi / Penyesuaian RTRW:</b> Lahan sawah yang telah memiliki persetujuan izin teknis / telah terbangun secara faktual dialokasikan sesuai ketentuan transisi yang disepakati.
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};
