'use client';

import React from 'react';
import {
  MapPin,
  Building,
  Trees,
  Shield,
  Sprout,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Copy,
  Check,
  Percent,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ScreeningResult } from '@/lib/types';

interface SpatialCheckerModalProps {
  result: ScreeningResult | null;
  onClose: () => void;
}

export const SpatialCheckerModal: React.FC<SpatialCheckerModalProps> = ({ result, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!result) return null;

  const poly = result.polygonBreakdown;

  const handleCopy = () => {
    let text = `=== RESUME INFORMASI GEOSPASIAL KOTA CIMAHI (PERDA 4/2024) ===
Koordinat Centroid: ${result.coordinate.lat}, ${result.coordinate.lng}
UTM 48S: X=${result.coordinate.utmX}, Y=${result.coordinate.utmY}
TM-3 BPN 48.2: X=${result.coordinate.tm3X}, Y=${result.coordinate.tm3Y}
Wilayah Administrasi: ${result.admin.kelurahan}, ${result.admin.kecamatan}`;

    if (poly) {
      text += `\nLuas Total Bidang: ${poly.totalAreaM2.toLocaleString('id-ID')} m² (${poly.totalAreaHa.toFixed(4)} Ha)
Keliling Bidang: ${poly.perimeterM.toFixed(2)} m

[TATA RUANG RTRW 2024-2044]`;
      poly.rtrwBreakdown.forEach((r) => {
        text += `\n- ${r.zoneName}: ${r.percentage}% (${r.areaM2.toLocaleString('id-ID')} m²)`;
      });

      text += `\n\n[KAWASAN BANDUNG UTARA (KBU)]`;
      poly.kbuBreakdown.forEach((k) => {
        text += `\n- ${k.zona}: ${k.percentage}% (${k.keterangan})`;
      });

      text += `\n\n[LAHAN SAWAH DILINDUNGI (LSD)]\n- Status: ${
        poly.lsdOverlap.isOverlap
          ? `Beririsan LSD ${poly.lsdOverlap.overlapPercentage}% (${poly.lsdOverlap.overlapAreaM2} m²)`
          : 'Bebas LSD (Aman)'
      }`;
    } else {
      text += `\nPola Ruang RTRW: ${result.rtrw?.polaRuang || 'Luar Perencanaan'}
Zonasi KBU: ${result.kbu ? `${result.kbu.zona} (${result.kbu.keterangan})` : 'Luar KBU'}
Status LSD: ${result.lsd ? `${result.lsd.kesesuaian}` : 'Bukan LSD'}
Status LBS: ${result.lbs ? `${result.lbs.namaObjek} (${result.lbs.jenisSawah})` : 'Bukan LBS'}`;
    }

    text += `\nWaktu Telaah: ${result.screenedAt}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:max-w-none print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Printable Header (Clean & Neutral) */}
        <div className="hidden print:block p-6 border-b-2 border-gray-400 text-center space-y-1">
          <h1 className="text-base font-bold tracking-wider uppercase text-slate-900">MENTRANG KOTA CIMAHI</h1>
          <h2 className="text-xs text-gray-600 font-medium">
            Resume Informasi Geospasial & Telaah Tata Ruang (Perda No. 4/2024)
          </h2>
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Resume Telaah Tata Ruang
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50 font-mono">
                  {poly ? 'Analisis Poligon PKKPR' : 'Titik Koordinat'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Kajian Spasial RTRW 2024–2044, KBU, LSD & LBS Kota Cimahi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm text-slate-300 print:text-black print:overflow-visible">
          
          {/* Coordinates Bar */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2 print:border print:border-gray-300 print:bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 print:text-gray-700">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Koordinat & Lokasi Administrasi
              </span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold print:text-black">
                {result.admin.kelurahan} • {result.admin.kecamatan}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 print:bg-white print:border-gray-200">
                <span className="text-[10px] text-slate-400 block font-mono">WGS 84 (Lat, Long)</span>
                <span className="font-mono text-slate-200 font-medium print:text-black">
                  {result.coordinate.lat}, {result.coordinate.lng}
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 print:bg-white print:border-gray-200">
                <span className="text-[10px] text-slate-400 block font-mono">UTM Zona 48S (X, Y)</span>
                <span className="font-mono text-slate-200 font-medium print:text-black">
                  {result.coordinate.utmX}, {result.coordinate.utmY}
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 print:bg-white print:border-gray-200">
                <span className="text-[10px] text-slate-400 block font-mono">TM-3° BPN 48.2 (X, Y)</span>
                <span className="font-mono text-slate-200 font-medium print:text-black">
                  {result.coordinate.tm3X}, {result.coordinate.tm3Y}
                </span>
              </div>
            </div>

            {poly && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 print:border-gray-300">
                <div>
                  <span className="text-[10px] text-slate-400">Luas Total Bidang:</span>
                  <div className="text-sm font-bold text-emerald-400 font-mono print:text-black">
                    {poly.totalAreaM2.toLocaleString('id-ID')} m²{' '}
                    <span className="text-xs font-normal text-slate-400 print:text-gray-600">
                      ({poly.totalAreaHa.toFixed(4)} Ha)
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Keliling Bidang:</span>
                  <div className="text-sm font-bold text-emerald-400 font-mono print:text-black">
                    {poly.perimeterM.toFixed(2)} m
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 1: RTRW Pola Ruang (With Multi-Polygon Breakdown if available) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs uppercase tracking-wider print:text-black">
              <Building className="w-4 h-4 text-emerald-400" />
              <span>Rencana Pola Ruang RTRW 2024–2044 (Perda No. 4/2024)</span>
            </div>

            {poly && poly.rtrwBreakdown.length > 0 ? (
              <div className="space-y-2">
                {poly.rtrwBreakdown.map((r) => (
                  <div
                    key={r.zoneName}
                    className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2 print:bg-white print:border-gray-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/40"
                          style={{ backgroundColor: r.color }}
                        />
                        <span className="font-bold text-slate-100 print:text-black">{r.zoneName}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-400 print:text-black">
                        {r.percentage}% ({r.areaM2.toLocaleString('id-ID')} m²)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden print:bg-gray-200">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${r.percentage}%`, backgroundColor: r.color }}
                      />
                    </div>

                    {r.ketentuanUmum && (
                      <p className="text-[11px] text-slate-400 print:text-gray-700 leading-relaxed">
                        {r.ketentuanUmum}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : result.rtrw ? (
              <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-1.5 print:bg-white print:border-gray-300">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: result.rtrw.color }}
                  />
                  <span className="font-bold text-slate-100 print:text-black">{result.rtrw.polaRuang}</span>
                </div>
                {result.rtrw.ketentuanUmum && (
                  <p className="text-[11px] text-slate-400 print:text-gray-700">{result.rtrw.ketentuanUmum}</p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-slate-500 text-xs">
                Tidak terindikasi dalam zonasi pola ruang perkotaan.
              </div>
            )}
          </div>

          {/* Section 2: KBU Zonasi Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs uppercase tracking-wider print:text-black">
              <Trees className="w-4 h-4 text-emerald-400" />
              <span>Zonasi Kawasan Bandung Utara (Perda Prov. Jabar No. 2/2016)</span>
            </div>

            {poly && poly.kbuBreakdown.length > 0 ? (
              <div className="space-y-2">
                {poly.kbuBreakdown.map((k) => (
                  <div
                    key={k.zona}
                    className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2 print:bg-white print:border-gray-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/40"
                          style={{ backgroundColor: k.color }}
                        />
                        <span className="font-bold text-slate-100 print:text-black">{k.zona}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-400 print:text-black">
                        {k.percentage}% ({k.areaM2.toLocaleString('id-ID')} m²)
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 print:text-gray-700">{k.keterangan}</p>

                    {k.koefisien && (
                      <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                        <div className="bg-slate-900 p-2 rounded-xl text-center border border-slate-800 print:bg-gray-100">
                          <span className="text-[9px] text-slate-500 block">KDB Maks</span>
                          <span className="font-bold text-emerald-400 print:text-black">{k.koefisien.kdb}</span>
                        </div>
                        <div className="bg-slate-900 p-2 rounded-xl text-center border border-slate-800 print:bg-gray-100">
                          <span className="text-[9px] text-slate-500 block">KLB Maks</span>
                          <span className="font-bold text-emerald-400 print:text-black">{k.koefisien.klb}</span>
                        </div>
                        <div className="bg-slate-900 p-2 rounded-xl text-center border border-slate-800 print:bg-gray-100">
                          <span className="text-[9px] text-slate-500 block">KDH Min</span>
                          <span className="font-bold text-emerald-400 print:text-black">{k.koefisien.kdh}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : result.kbu ? (
              <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2 print:bg-white print:border-gray-300">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: result.kbu.color }}
                  />
                  <span className="font-bold text-slate-100 print:text-black">{result.kbu.zona}</span>
                </div>
                <p className="text-[11px] text-slate-400 print:text-gray-700">{result.kbu.keterangan}</p>
                {result.kbu.koefisien && (
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                    <div className="bg-slate-900 p-2 rounded-xl text-center border border-slate-800 print:bg-gray-100">
                      <span className="text-[9px] text-slate-500 block">KDB Maks</span>
                      <span className="font-bold text-emerald-400 print:text-black">{result.kbu.koefisien.kdb}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl text-center border border-slate-800 print:bg-gray-100">
                      <span className="text-[9px] text-slate-500 block">KLB Maks</span>
                      <span className="font-bold text-emerald-400 print:text-black">{result.kbu.koefisien.klb}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl text-center border border-slate-800 print:bg-gray-100">
                      <span className="text-[9px] text-slate-500 block">KDH Min</span>
                      <span className="font-bold text-emerald-400 print:text-black">{result.kbu.koefisien.kdh}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-slate-500 text-xs">
                Lokasi berada di luar cakupan Kawasan Bandung Utara (KBU).
              </div>
            )}
          </div>

          {/* Section 3: LSD & LBS Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* LSD */}
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-1.5 print:bg-white print:border-gray-300">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 print:text-black">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lahan Sawah Dilindungi (LSD)</span>
              </div>
              {poly ? (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                    {poly.lsdOverlap.isOverlap ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Beririsan {poly.lsdOverlap.overlapPercentage}% ({poly.lsdOverlap.overlapAreaM2} m²)
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Bebas LSD (100% Aman)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{poly.lsdOverlap.rekomendasi}</p>
                </div>
              ) : result.lsd ? (
                <div>
                  <span className="font-bold text-xs text-emerald-400">{result.lsd.kesesuaian}</span>
                  <p className="text-[10px] text-slate-400 mt-1">{result.lsd.rekomendasi}</p>
                </div>
              ) : (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Bebas Lahan Sawah Dilindungi
                </span>
              )}
            </div>

            {/* LBS */}
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-1.5 print:bg-white print:border-gray-300">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 print:text-black">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lahan Baku Sawah (LBS)</span>
              </div>
              {poly ? (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                    {poly.lbsOverlap.isOverlap ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Beririsan {poly.lbsOverlap.overlapPercentage}% ({poly.lbsOverlap.jenisSawah})
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Bukan Lahan Baku Sawah
                      </span>
                    )}
                  </div>
                </div>
              ) : result.lbs ? (
                <div>
                  <span className="font-bold text-xs text-amber-400">
                    {result.lbs.namaObjek} ({result.lbs.jenisSawah})
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Bukan Lahan Baku Sawah</span>
              )}
            </div>
          </div>

          {/* Timestamp footer */}
          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800 print:border-gray-300 print:text-gray-500">
            <span>Dihasilkan oleh MENTRANG Kota Cimahi WebGIS</span>
            <span>{result.screenedAt}</span>
          </div>

          {/* Print Disclaimer (Neutral & Non-Official) */}
          <div className="hidden print:block pt-6 border-t border-gray-300 text-[10px] text-gray-500 text-center italic">
            * Catatan: Resume informasi geospasial ini dihasilkan secara otomatis oleh aplikasi MENTRANG sebagai referensi telaah mandiri berdasarkan data spasial publik dan Peraturan Daerah Kota Cimahi No. 4 Tahun 2024.
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/60 print:hidden">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Salin Resume'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
