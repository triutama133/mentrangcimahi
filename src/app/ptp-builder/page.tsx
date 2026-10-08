'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as turf from '@turf/turf';
import { Printer, LogOut, FolderOpen, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SavedDigitasiFeature, loadSavedFeatures } from '@/lib/digitasiStorage';
import { screenPolygonArea, loadAllDatasets } from '@/lib/spatialAnalysis';
import { PolygonScreeningResult } from '@/lib/types';
import {
  PtpFormData,
  DEFAULT_PTP_FORM,
  buildZonePages,
  PtpZonePage,
  pickScaleForArea,
  pickLocatorScale,
  pointsToPolygonCoords,
} from '@/lib/ptpReport';
import { RTRW_COLORS, KBU_COLORS, LSD_COLORS, LBS_COLORS } from '@/lib/layerConfig';
import { ReportMapCapture, CaptureJob } from '@/components/ptp/ReportMapCapture';
import { PtpPageFrame } from '@/components/ptp/PtpPageFrame';

const OUTLINE_COLOR = '#c026d3';
const FINAL_OUTLINE_COLOR = '#dc2626';
const SESUAI_COLOR = '#22c55e';
const TIDAK_SESUAI_COLOR = '#f43f5e';

export default function PtpBuilderPage() {
  const router = useRouter();
  const [savedFeatures, setSavedFeatures] = useState<SavedDigitasiFeature[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [screening, setScreening] = useState<PolygonScreeningResult | null>(null);
  const [kelurahanFeature, setKelurahanFeature] = useState<any>(null);
  const [zoneDatasets, setZoneDatasets] = useState<{ rtrw?: any; kbu?: any; lsd?: any; lbs?: any }>({});
  const [form, setForm] = useState<PtpFormData>(DEFAULT_PTP_FORM);
  const [isScreening, setIsScreening] = useState(false);
  const [captures, setCaptures] = useState<Record<string, string>>({});

  useEffect(() => {
    setSavedFeatures(loadSavedFeatures());
  }, []);

  const selectedFeature = savedFeatures.find((f) => f.id === selectedId) || null;

  const handleSelectFeature = async (id: string) => {
    setSelectedId(id);
    setCaptures({});
    setScreening(null);
    const feature = savedFeatures.find((f) => f.id === id);
    if (!feature) return;
    setIsScreening(true);
    try {
      const [result, datasets] = await Promise.all([screenPolygonArea(feature.points), loadAllDatasets()]);
      setScreening(result);
      setZoneDatasets({ rtrw: datasets.rtrw, kbu: datasets.kbu, lsd: datasets.lsd, lbs: datasets.lbs });
      const kelName = result?.adminBreakdown[0]?.kelurahan;
      const match = datasets.adm?.features?.find((f: any) => f.properties?.KELURAHAN === kelName);
      setKelurahanFeature(match || null);
      setForm((prev) => ({ ...prev, lokasiText: prev.lokasiText || feature.name }));
    } finally {
      setIsScreening(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/ptp-auth', { method: 'DELETE' });
    router.push('/ptp-builder/login');
  };

  const polygon = selectedFeature ? pointsToPolygonCoords(selectedFeature.points) : [];
  const center: [number, number] = screening ? [screening.centroid.lng, screening.centroid.lat] : [107.5437, -6.886892];
  const zonePages: PtpZonePage[] = useMemo(() => (screening ? buildZonePages(screening) : []), [screening]);

  const jobs: CaptureJob[] = useMemo(() => {
    if (!screening || polygon.length < 3) return [];
    const areaScale = pickScaleForArea(screening.totalAreaM2);
    const locatorScale = pickLocatorScale(screening.totalAreaM2);
    const list: CaptureJob[] = [];

    list.push({
      id: 'locator',
      center,
      scaleDenominator: locatorScale,
      polygon,
      polygonStroke: OUTLINE_COLOR,
      polygonFill: null,
      background: { type: 'satellite' },
      widthPx: 1000,
      heightPx: 760,
    });

    if (kelurahanFeature) {
      const bbox = turf.bbox(kelurahanFeature);
      const widthKm = turf.distance([bbox[0], (bbox[1] + bbox[3]) / 2], [bbox[2], (bbox[1] + bbox[3]) / 2], { units: 'kilometers' });
      const heightKm = turf.distance([(bbox[0] + bbox[2]) / 2, bbox[1]], [(bbox[0] + bbox[2]) / 2, bbox[3]], { units: 'kilometers' });
      const kelWidthM = Math.max(widthKm, heightKm) * 1000 * 1.3;
      const insetScale = (kelWidthM * 1000) / 28;
      const dotRadiusKm = Math.max((kelWidthM * 0.018) / 1000, 0.015);
      const dot = turf.circle(center, dotRadiusKm, { steps: 16, units: 'kilometers' });

      list.push({
        id: 'inset',
        center,
        scaleDenominator: insetScale,
        contentWidthMm: 28,
        polygon: dot.geometry.coordinates[0] as [number, number][],
        polygonStroke: '#dc2626',
        polygonFill: '#dc2626',
        background: {
          type: 'zone',
          data: { type: 'FeatureCollection', features: [kelurahanFeature] },
          colorField: 'KELURAHAN',
          colorMap: { [kelurahanFeature.properties.KELURAHAN]: '#f59e0b' },
          defaultColor: '#ffffff',
        },
        widthPx: 260,
        heightPx: 260,
      });
    }

    list.push({ id: 'penggunaan', center, scaleDenominator: areaScale, polygon, polygonStroke: OUTLINE_COLOR, polygonFill: '#facc15', background: { type: 'satellite' }, widthPx: 1000, heightPx: 760 });
    list.push({ id: 'penguasaan', center, scaleDenominator: areaScale, polygon, polygonStroke: OUTLINE_COLOR, polygonFill: '#f4a5a5', background: { type: 'satellite' }, widthPx: 1000, heightPx: 760 });
    list.push({ id: 'kemampuan', center, scaleDenominator: areaScale, polygon, polygonStroke: OUTLINE_COLOR, polygonFill: null, background: { type: 'blank' }, widthPx: 1000, heightPx: 760 });

    const datasetFor: Record<PtpZonePage['kind'], { data: any; colorField: string; colorMap: Record<string, string> }> = {
      rtrw: { data: zoneDatasets.rtrw, colorField: 'NAMOBJ', colorMap: RTRW_COLORS },
      kbu: { data: zoneDatasets.kbu, colorField: 'Zona', colorMap: KBU_COLORS },
      lsd: { data: zoneDatasets.lsd, colorField: 'Kesesuaian', colorMap: LSD_COLORS },
      lbs: { data: zoneDatasets.lbs, colorField: 'JSWH', colorMap: LBS_COLORS },
    };

    zonePages.forEach((zp, i) => {
      const cfg = datasetFor[zp.kind];
      if (!cfg?.data) return;
      list.push({
        id: `zone-${i}`,
        center,
        scaleDenominator: areaScale,
        polygon,
        polygonStroke: OUTLINE_COLOR,
        polygonFill: null,
        background: { type: 'zone', data: cfg.data, colorField: cfg.colorField, colorMap: cfg.colorMap, defaultColor: '#e2e8f0' },
        widthPx: 1000,
        heightPx: 760,
      });
    });

    list.push({
      id: 'kesesuaian',
      center,
      scaleDenominator: areaScale,
      polygon,
      polygonStroke: OUTLINE_COLOR,
      polygonFill: form.kesesuaianPenggunaan === 'sesuai' ? SESUAI_COLOR : TIDAK_SESUAI_COLOR,
      background: { type: 'satellite' },
      widthPx: 1000,
      heightPx: 760,
    });
    list.push({
      id: 'ketersediaan',
      center,
      scaleDenominator: areaScale,
      polygon,
      polygonStroke: OUTLINE_COLOR,
      polygonFill: form.ketersediaanTanah === 'tersedia' ? SESUAI_COLOR : TIDAK_SESUAI_COLOR,
      background: { type: 'satellite' },
      widthPx: 1000,
      heightPx: 760,
    });
    list.push({
      id: 'final',
      center,
      scaleDenominator: areaScale,
      polygon,
      polygonStroke: FINAL_OUTLINE_COLOR,
      polygonFill: form.kesesuaianPenggunaan === 'sesuai' ? '#facc15' : TIDAK_SESUAI_COLOR,
      background: { type: 'satellite' },
      widthPx: 1000,
      heightPx: 760,
    });

    return list;
  }, [screening, polygon, center, kelurahanFeature, zonePages, zoneDatasets, form.kesesuaianPenggunaan, form.ketersediaanTanah]);

  const allCaptured = jobs.length > 0 && jobs.every((j) => captures[j.id]);

  const update = (patch: Partial<PtpFormData>) => setForm((prev) => ({ ...prev, ...patch }));

  const luasDimohon = screening?.totalAreaM2 ?? 0;
  const areaScale = screening ? pickScaleForArea(screening.totalAreaM2) : 300;
  const kelurahanName = screening?.adminBreakdown[0]?.kelurahan ?? '-';
  const bareKelurahanName = kelurahanName.replace(/^Kel\.\s*/i, '');
  const risalahLine2 = `Risalah PTP Nomor ${form.risalahNomor || '...'} Tanggal ${form.risalahTanggal || '...'}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-30 bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold">Peta Pertimbangan Teknis Pertanahan &mdash; Builder</h1>
          <p className="text-[11px] text-slate-500">Alat internal &middot; tidak ditautkan dari menu publik</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            disabled={!allCaptured}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / Simpan PDF</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium">
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      <div className="no-print flex flex-col lg:flex-row">
        {/* Form sidebar */}
        <div className="w-full lg:w-96 flex-shrink-0 border-r border-slate-800 p-5 space-y-5 text-xs">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
              Pilih Bidang Tersimpan
            </label>
            {savedFeatures.length === 0 ? (
              <p className="text-slate-500 text-[11px]">
                Belum ada bidang tersimpan. Digitasi dan simpan bidang terlebih dahulu di Peta WebGIS.
              </p>
            ) : (
              <select
                value={selectedId}
                onChange={(e) => handleSelectFeature(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 rounded-xl p-2.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- Pilih bidang --</option>
                {savedFeatures.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.areaM2.toLocaleString('id-ID')} m²)
                  </option>
                ))}
              </select>
            )}
            {isScreening && (
              <p className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <Loader2 className="w-3 h-3 animate-spin" /> Menganalisis bidang...
              </p>
            )}
            {screening && (
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 space-y-0.5">
                <div>Luas: {screening.totalAreaM2.toLocaleString('id-ID')} m²</div>
                <div>Kelurahan: {kelurahanName}</div>
                <div>Zona RTRW: {screening.rtrwBreakdown.map((r) => r.zoneName).join(', ') || '-'}</div>
                <div>Halaman yang dihasilkan: {4 + zonePages.length + 4} halaman</div>
              </div>
            )}
          </div>

          <FormSection title="Data Pemohon">
            <Field label="Nama Pemohon"><input className="input" value={form.namaPemohon} onChange={(e) => update({ namaPemohon: e.target.value })} /></Field>
            <Field label="NIB"><input className="input" value={form.nib} onChange={(e) => update({ nib: e.target.value })} /></Field>
            <Field label="No. Berkas"><input className="input" value={form.noBerkas} onChange={(e) => update({ noBerkas: e.target.value })} /></Field>
            <Field label="Lokasi (teks alamat)"><input className="input" value={form.lokasiText} onChange={(e) => update({ lokasiText: e.target.value })} /></Field>
            <Field label="Rencana Kegiatan"><input className="input" value={form.rencanaKegiatan} onChange={(e) => update({ rencanaKegiatan: e.target.value })} /></Field>
            <Field label="Kode & Nama KBLI"><input className="input" value={form.kodeKbli} onChange={(e) => update({ kodeKbli: e.target.value })} /></Field>
          </FormSection>

          <FormSection title="Risalah PTP">
            <Field label="Nomor Risalah"><input className="input" value={form.risalahNomor} onChange={(e) => update({ risalahNomor: e.target.value })} /></Field>
            <Field label="Tanggal Risalah"><input className="input" value={form.risalahTanggal} onChange={(e) => update({ risalahTanggal: e.target.value })} placeholder="05 Agustus 2026" /></Field>
          </FormSection>

          <FormSection title="Penggunaan & Penguasaan Tanah">
            <Field label="Penggunaan Tanah Saat Ini"><input className="input" value={form.penggunaanTanahSaatIni} onChange={(e) => update({ penggunaanTanahSaatIni: e.target.value })} /></Field>
            <Field label="Status Penguasaan">
              <select className="input" value={form.statusPenguasaan} onChange={(e) => update({ statusPenguasaan: e.target.value as PtpFormData['statusPenguasaan'] })}>
                <option value="hak-milik">Hak Milik Perorangan</option>
                <option value="belum-bersertifikat">Belum Bersertifikat</option>
              </select>
            </Field>
            {form.statusPenguasaan === 'hak-milik' && (
              <>
                <Field label="No. Hak Milik"><input className="input" value={form.hakMilikNomor} onChange={(e) => update({ hakMilikNomor: e.target.value })} /></Field>
                <Field label="No. SU"><input className="input" value={form.suNomor} onChange={(e) => update({ suNomor: e.target.value })} /></Field>
                <Field label="Atas Nama"><input className="input" value={form.hakMilikAtasNama} onChange={(e) => update({ hakMilikAtasNama: e.target.value })} /></Field>
              </>
            )}
          </FormSection>

          <FormSection title="Kemampuan Tanah">
            <Field label="Kode Kemampuan Tanah"><input className="input" value={form.kodeKemampuanTanah} onChange={(e) => update({ kodeKemampuanTanah: e.target.value })} placeholder="C2aT" /></Field>
            <label className="flex items-center gap-2 text-[11px] text-slate-300">
              <input type="checkbox" checked={form.termasukResapanAir} onChange={(e) => update({ termasukResapanAir: e.target.checked })} />
              Termasuk Kawasan Resapan Air
            </label>
          </FormSection>

          <FormSection title="Kesimpulan">
            <Field label="Kesesuaian Penggunaan">
              <select className="input" value={form.kesesuaianPenggunaan} onChange={(e) => update({ kesesuaianPenggunaan: e.target.value as PtpFormData['kesesuaianPenggunaan'] })}>
                <option value="sesuai">Sesuai</option>
                <option value="tidak-sesuai">Tidak Sesuai</option>
              </select>
            </Field>
            <Field label="Ketersediaan Tanah">
              <select className="input" value={form.ketersediaanTanah} onChange={(e) => update({ ketersediaanTanah: e.target.value as PtpFormData['ketersediaanTanah'] })}>
                <option value="tersedia">Tersedia</option>
                <option value="tidak-tersedia">Tidak Tersedia</option>
              </select>
            </Field>
          </FormSection>

          <FormSection title="Peninjau & Penandatangan">
            <Field label="Ditinjau / Digambar oleh"><input className="input" value={form.ditinjauOleh} onChange={(e) => update({ ditinjauOleh: e.target.value, digambarOleh: e.target.value })} /></Field>
            <Field label="Tanggal Ditinjau"><input className="input" value={form.tanggalDitinjau} onChange={(e) => update({ tanggalDitinjau: e.target.value })} placeholder="30 Juli 2026" /></Field>
            <Field label="Diperiksa oleh"><input className="input" value={form.diperiksaOleh.name} onChange={(e) => update({ diperiksaOleh: { ...form.diperiksaOleh, name: e.target.value } })} /></Field>
            <Field label="NIP Pemeriksa"><input className="input" value={form.diperiksaOleh.nip} onChange={(e) => update({ diperiksaOleh: { ...form.diperiksaOleh, nip: e.target.value } })} /></Field>
            <Field label="Kepala Kantor"><input className="input" value={form.kepalaKantor.name} onChange={(e) => update({ kepalaKantor: { ...form.kepalaKantor, name: e.target.value } })} /></Field>
            <Field label="NIP Kepala Kantor"><input className="input" value={form.kepalaKantor.nip} onChange={(e) => update({ kepalaKantor: { ...form.kepalaKantor, nip: e.target.value } })} /></Field>
          </FormSection>
        </div>

        {/* Preview */}
        <div className="flex-1 bg-slate-800/40 p-6 overflow-x-auto">
          {!screening ? (
            <p className="text-slate-500 text-sm">Pilih bidang tersimpan di panel kiri untuk membuat Peta Pertimbangan Teknis Pertanahan.</p>
          ) : (
            <p className="text-slate-500 text-xs mb-3">
              {allCaptured ? 'Semua peta siap. Klik "Cetak / Simpan PDF".' : `Merender peta... (${Object.keys(captures).length}/${jobs.length})`}
            </p>
          )}
        </div>
      </div>

      {/* Hidden capture rigs */}
      {jobs.map((job) => (
        <ReportMapCapture key={job.id} job={job} onCaptured={(id, dataUrl) => setCaptures((prev) => ({ ...prev, [id]: dataUrl }))} />
      ))}

      {/* Printable report */}
      {screening && (
        <div>
          <PtpPageFrame
            sectionLabel="B. Lampiran Peta Risalah Pertimbangan Teknis Pertanahan — 1. Petunjuk Letak Lokasi"
            titleLines={['PETA 1 : PETUNJUK LETAK LOKASI', risalahLine2]}
            mapDataUrl={captures['locator'] || null}
            scaleDenominator={pickLocatorScale(screening.totalAreaM2)}
            insetDataUrl={captures['inset'] || null}
            kelurahanName={kelurahanName}
            legendRows={[]}
            outlineColor={OUTLINE_COLOR}
            form={form}
            luasDimohon={luasDimohon}
          />

          <PtpPageFrame
            sectionLabel="2.  Penggunaan Tanah"
            titleLines={['PETA 2 : PENGUNAAN TANAH', risalahLine2]}
            mapDataUrl={captures['penggunaan'] || null}
            scaleDenominator={areaScale}
            insetDataUrl={captures['inset'] || null}
            kelurahanName={kelurahanName}
            legendRows={[{ label: form.penggunaanTanahSaatIni, color: '#facc15' }]}
            legendHeading="Penggunaan Tanah"
            outlineColor={OUTLINE_COLOR}
            form={form}
            luasDimohon={luasDimohon}
          />

          <PtpPageFrame
            sectionLabel="3.  Penguasaan Tanah"
            titleLines={['PETA 3: PENGUASAAN TANAH', risalahLine2]}
            mapDataUrl={captures['penguasaan'] || null}
            scaleDenominator={areaScale}
            insetDataUrl={captures['inset'] || null}
            kelurahanName={kelurahanName}
            legendRows={
              form.statusPenguasaan === 'hak-milik'
                ? [{ label: `Hak Milik Perorangan\nHak Milik No. ${form.hakMilikNomor}/${bareKelurahanName}, SU No. ${form.suNomor}/${bareKelurahanName} luas ${luasDimohon.toLocaleString('id-ID')} m² a.n ${form.hakMilikAtasNama}`, color: '#f4a5a5' }]
                : [{ label: 'Belum Bersertifikat', color: '#f4a5a5' }]
            }
            legendHeading=""
            outlineColor={OUTLINE_COLOR}
            form={form}
            luasDimohon={luasDimohon}
          />

          <PtpPageFrame
            sectionLabel="4.  Peta Kemampuan Tanah"
            titleLines={['PETA 4: KEMAMPUAN TANAH', risalahLine2]}
            mapDataUrl={captures['kemampuan'] || null}
            scaleDenominator={areaScale}
            insetDataUrl={captures['inset'] || null}
            kelurahanName={kelurahanName}
            legendRows={[]}
            legendHeading=""
            outlineColor={OUTLINE_COLOR}
            form={form}
            luasDimohon={luasDimohon}
          />

          {zonePages.map((zp, i) => (
            <PtpPageFrame
              key={i}
              sectionLabel="5.  Peta Rencana Tata Ruang"
              titleLines={zp.kind === 'lsd' ? ['PETA 5 : LAHAN SAWAH DILINDUNGI', risalahLine2, zp.legalBasis] : ['PETA 5 : RENCANA TATA RUANG', risalahLine2, zp.legalBasis]}
              mapDataUrl={captures[`zone-${i}`] || null}
              scaleDenominator={areaScale}
              insetDataUrl={captures['inset'] || null}
              kelurahanName={kelurahanName}
              legendRows={zp.rows}
              outlineColor={OUTLINE_COLOR}
              form={form}
              luasDimohon={luasDimohon}
            />
          ))}

          <PtpPageFrame
            sectionLabel="6.  Peta Kesesuaian Penggunaan Tanah"
            titleLines={['PETA 6 : PETA KESESUAIAN PENGGUNAAN TANAH', risalahLine2]}
            mapDataUrl={captures['kesesuaian'] || null}
            scaleDenominator={areaScale}
            insetDataUrl={captures['inset'] || null}
            kelurahanName={kelurahanName}
            legendRows={[{ label: form.kesesuaianPenggunaan === 'sesuai' ? 'Sesuai' : 'Tidak Sesuai', color: form.kesesuaianPenggunaan === 'sesuai' ? SESUAI_COLOR : TIDAK_SESUAI_COLOR }]}
            legendHeading="Kesesuaian:"
            outlineColor={OUTLINE_COLOR}
            form={form}
            luasDimohon={luasDimohon}
          />

          <PtpPageFrame
            sectionLabel="7.  Peta Ketersediaan Tanah"
            titleLines={['PETA 7 : PETA KETERSEDIAAN TANAH', risalahLine2]}
            mapDataUrl={captures['ketersediaan'] || null}
            scaleDenominator={areaScale}
            insetDataUrl={captures['inset'] || null}
            kelurahanName={kelurahanName}
            legendRows={[{ label: form.ketersediaanTanah === 'tersedia' ? 'Tersedia' : 'Tidak Tersedia', color: form.ketersediaanTanah === 'tersedia' ? SESUAI_COLOR : TIDAK_SESUAI_COLOR }]}
            legendHeading="Ketersediaan:"
            outlineColor={OUTLINE_COLOR}
            form={form}
            luasDimohon={luasDimohon}
          />

          <PtpPageFrame
            sectionLabel="8  Peta Pertimbangan Teknis Pertanahan"
            titleLines={[
              'PETA PERTIMBANGAN TEKNIS PERTANAHAN UNTUK',
              'PERSETUJUAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG' + (form.statusPenguasaan === 'hak-milik' ? ' NON BERUSAHA' : ''),
              `Nomor ${form.risalahNomor || '...'} Tanggal ${form.risalahTanggal || '...'}`,
            ]}
            mapDataUrl={captures['final'] || null}
            scaleDenominator={areaScale}
            insetDataUrl={captures['inset'] || null}
            kelurahanName={kelurahanName}
            legendRows={[{ label: form.kesesuaianPenggunaan === 'sesuai' ? `Sesuai (${luasDimohon.toLocaleString('id-ID')} m²)` : 'Tidak Sesuai', color: form.kesesuaianPenggunaan === 'sesuai' ? '#facc15' : TIDAK_SESUAI_COLOR }]}
            legendHeading=""
            outlineColor={FINAL_OUTLINE_COLOR}
            form={form}
            luasDimohon={luasDimohon}
            footerMiddle={
              <div className="space-y-1.5">
                <div>
                  <div className="font-semibold">Penggunaan Tanah Saat Ini :</div>
                  <div>{form.penggunaanTanahSaatIni}</div>
                </div>
                <div>
                  <div className="font-semibold">Ketentuan dan syarat menggunakan dan memanfaatkan tanah :</div>
                  <div>
                    Berdasarkan Peraturan Daerah Kota Cimahi No.4 Tahun 2024 Tentang RTRW Kota Cimahi pada BAB VIII Bagian Kedua mengenai Ketentuan Umum Zonasi
                  </div>
                </div>
                <div>
                  <div className="font-semibold">Arahan Fungsi Kawasan :</div>
                  {screening.rtrwBreakdown.map((r, i) => (
                    <div key={i}>
                      {String.fromCharCode(97 + i)}. {r.zoneName} (&plusmn;{r.areaM2.toLocaleString('id-ID')} m&sup2;/{r.percentage}%)
                    </div>
                  ))}
                  {form.termasukResapanAir && (
                    <div>
                      {String.fromCharCode(97 + screening.rtrwBreakdown.length)}. Ketentuan Khusus: Kawasan Resapan Air (&plusmn;{luasDimohon.toLocaleString('id-ID')} m&sup2;/100%)
                    </div>
                  )}
                </div>
              </div>
            }
            footerRight={
              <>
                <div className="text-center text-[9px]">{form.kepalaKantor.title}</div>
                <div className="text-center mt-10">
                  <div className="font-semibold">{form.kepalaKantor.name}</div>
                  <div>NIP : {form.kepalaKantor.nip}</div>
                </div>
              </>
            }
          />
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          background: rgb(2 6 23);
          color: rgb(226 232 240);
          border-radius: 0.75rem;
          padding: 0.5rem 0.65rem;
          border: 1px solid rgb(51 65 85);
          font-size: 11px;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 1px rgb(16 185 129);
        }
      `}</style>
    </div>
  );
}

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2 pt-3 border-t border-slate-800/80">
    <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-[10px] text-slate-500 block mb-1">{label}</label>
    {children}
  </div>
);
