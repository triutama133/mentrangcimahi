'use client';

import React from 'react';
import { PtpFormData } from '@/lib/ptpReport';

interface LegendRow {
  label: string;
  color: string;
  areaM2?: number;
  percentage?: number;
  sublabel?: string;
}

interface PtpPageFrameProps {
  sectionLabel: string; // e.g. "1.  Petunjuk Letak Lokasi"
  titleLines: string[]; // e.g. ["PETA 1 : PETUNJUK LETAK LOKASI", "Risalah PTP Nomor .. Tanggal .."]
  mapDataUrl: string | null;
  scaleDenominator: number;
  insetDataUrl: string | null;
  kelurahanName: string;
  legendRows: LegendRow[];
  legendHeading?: string;
  outlineColor: string;
  form: PtpFormData;
  luasDimohon: number;
  footerRight?: React.ReactNode; // overrides the default Ditinjau/Digambar/Diperiksa block for page 8
  footerMiddle?: React.ReactNode; // overrides the default Sumber block for page 8
}

const fmtArea = (m2: number) => `${m2.toLocaleString('id-ID', { maximumFractionDigits: 0 })} m²`;

export const PtpPageFrame: React.FC<PtpPageFrameProps> = ({
  sectionLabel,
  titleLines,
  mapDataUrl,
  scaleDenominator,
  insetDataUrl,
  kelurahanName,
  legendRows,
  legendHeading = 'Rencana Pola Ruang:',
  outlineColor,
  form,
  luasDimohon,
  footerRight,
  footerMiddle,
}) => {
  return (
    <div className="ptp-page bg-white text-black w-[210mm] min-h-[297mm] mx-auto p-[8mm] text-[10px] leading-snug">
      <p className="text-[11px] font-semibold mb-1">{sectionLabel}</p>

      <div className="border border-black">
        {/* Header row */}
        <div className="grid grid-cols-[2fr_1.6fr_1.6fr] border-b border-black">
          <div className="flex items-center gap-2 p-2 border-r border-black">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex-shrink-0" />
            <div className="text-[11px] leading-tight">
              <div className="font-bold">Kantor Pertanahan</div>
              <div className="font-bold">Kota Cimahi</div>
              <div>Provinsi Jawa Barat</div>
            </div>
          </div>
          <div className="p-2 border-r border-black text-[10px] space-y-0.5">
            <div>Nama Pemohon : {form.namaPemohon || '-'}</div>
            <div>NIB{' '.repeat(13)}: {form.nib || '-'}</div>
            <div>No: Berkas{' '.repeat(6)}: {form.noBerkas || '-'}</div>
          </div>
          <div className="p-2 text-[10px] space-y-0.5">
            <div>Lokasi : {form.lokasiText || '-'}</div>
            <div>Luas dimohon : {fmtArea(luasDimohon)}</div>
            <div>Rencana kegiatan : {form.rencanaKegiatan || '-'}</div>
            <div>Kode &amp; nama KBLI : {form.kodeKbli || '-'}</div>
          </div>
        </div>

        {/* Title block */}
        <div className="border-b border-black text-center py-2 px-2">
          {titleLines.map((line, i) => (
            <p key={i} className={i === 0 ? 'text-[13px] font-bold' : 'text-[11px]'}>
              {line}
            </p>
          ))}
        </div>

        {/* Map */}
        <div className="relative border-b border-black bg-slate-100" style={{ height: '150mm' }}>
          {mapDataUrl ? (
            <img src={mapDataUrl} alt="Peta" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Memuat peta...</div>
          )}
          <div className="absolute top-2 right-2 bg-white border border-black px-2 py-1 text-[10px] font-semibold shadow">
            Skala 1:{scaleDenominator.toLocaleString('id-ID')}
          </div>
          <div className="absolute top-2 right-2 -translate-y-9 flex flex-col items-center">
            <span className="text-[14px] font-bold">U</span>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>&#9650;</span>
          </div>
        </div>

        {/* Petunjuk Lokasi + Legenda */}
        <div className="grid grid-cols-[1fr_1.6fr] border-b border-black">
          <div className="border-r border-black">
            <p className="text-center font-semibold border-b border-black py-1 text-[10px]">PETUNJUK LOKASI</p>
            <div className="p-1 h-[28mm] flex items-center justify-center overflow-hidden">
              {insetDataUrl ? (
                <img src={insetDataUrl} alt={kelurahanName} className="max-h-full" />
              ) : (
                <span className="text-slate-400 text-[9px]">...</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 border-t border-black text-[9px]">
              <span className="w-3 h-3 border border-black inline-block flex-shrink-0" />
              <span>Lokasi yang Dimohon</span>
            </div>
          </div>
          <div className="p-2">
            <p className="font-semibold text-[10px] mb-1">KETERANGAN/LEGENDA</p>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-4 h-3 inline-block flex-shrink-0 border-2" style={{ borderColor: outlineColor }} />
              <span>Lokasi yang dimohon</span>
            </div>
            {legendRows.length > 0 && <p className="text-[9px] mt-1">{legendHeading}</p>}
            {legendRows.map((row, i) => (
              <div key={i} className="flex items-start gap-1.5 mt-0.5">
                <span className="w-4 h-3 inline-block flex-shrink-0 mt-0.5" style={{ backgroundColor: row.color }} />
                <span>
                  {row.label}
                  {row.percentage !== undefined ? ` (±${fmtArea(row.areaM2 ?? 0)}/${row.percentage}%)` : ''}
                  {row.sublabel ? ` — ${row.sublabel}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: projection info / reviewers / signature */}
        <div className="grid grid-cols-[1.3fr_1.6fr_1.4fr]">
          <div className="border-r border-black p-2 space-y-2">
            <div>
              <div>Sistem Proyeksi : Transverse Mercator</div>
              <div>Sistem Koordinat : UTM</div>
              <div>Datum &amp; Zona : WGS 1984 &amp; 48 S</div>
            </div>
            <div className="pt-2 border-t border-black">
              <div className="font-semibold">SUMBER :</div>
              <div>- Peta Administrasi {kelurahanName} 2019</div>
            </div>
          </div>
          <div className="border-r border-black p-2">
            {footerMiddle ?? (
              <div className="space-y-0.5">
                <div>Ditinjau oleh : {form.ditinjauOleh}</div>
                <div>Tanggal : {form.tanggalDitinjau || '-'}</div>
                <div>Digambar oleh : {form.digambarOleh}</div>
                <div>Diperiksa oleh : {form.diperiksaOleh.name}</div>
              </div>
            )}
          </div>
          <div className="p-2 flex flex-col justify-between">
            {footerRight ?? (
              <>
                <div className="text-center whitespace-pre-line text-[9px]">{form.diperiksaOleh.title}</div>
                <div className="text-center mt-6">
                  <div className="font-semibold">{form.diperiksaOleh.name}</div>
                  <div>NIP : {form.diperiksaOleh.nip}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
