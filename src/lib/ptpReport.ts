import { CoordinatePoint, PolygonScreeningResult } from './types';

export interface PtpSigner {
  name: string;
  title: string;
  nip: string;
}

export interface PtpFormData {
  // Header / applicant
  namaPemohon: string;
  nib: string;
  noBerkas: string;
  lokasiText: string;
  rencanaKegiatan: string;
  kodeKbli: string;

  // Risalah
  risalahNomor: string;
  risalahTanggal: string;

  // Peta 2: Penggunaan Tanah
  penggunaanTanahSaatIni: string;

  // Peta 3: Penguasaan Tanah
  statusPenguasaan: 'hak-milik' | 'belum-bersertifikat';
  hakMilikNomor: string;
  suNomor: string;
  hakMilikAtasNama: string;

  // Peta 4: Kemampuan Tanah
  kodeKemampuanTanah: string; // e.g. "C2aT"

  // Ketentuan khusus toggle (Kawasan Resapan Air overlay seen on RTRW zones)
  termasukResapanAir: boolean;

  // Peta 6: Kesesuaian Penggunaan Tanah
  kesesuaianPenggunaan: 'sesuai' | 'tidak-sesuai';

  // Peta 7: Ketersediaan Tanah
  ketersediaanTanah: 'tersedia' | 'tidak-tersedia';

  // Reviewers (same team almost every time, kept editable)
  ditinjauOleh: string;
  tanggalDitinjau: string;
  digambarOleh: string;
  diperiksaOleh: PtpSigner;
  kepalaKantor: PtpSigner;
}

export const DEFAULT_PTP_FORM: PtpFormData = {
  namaPemohon: '',
  nib: '-',
  noBerkas: '',
  lokasiText: '',
  rencanaKegiatan: 'Rumah Tinggal',
  kodeKbli: '-',

  risalahNomor: '',
  risalahTanggal: '',

  penggunaanTanahSaatIni: 'Rumah Tinggal',

  statusPenguasaan: 'hak-milik',
  hakMilikNomor: '',
  suNomor: '',
  hakMilikAtasNama: '',

  kodeKemampuanTanah: 'C2aT',

  termasukResapanAir: true,

  kesesuaianPenggunaan: 'sesuai',
  ketersediaanTanah: 'tersedia',

  ditinjauOleh: 'Trianka Priya Utama, S.K.Pm.',
  tanggalDitinjau: '',
  digambarOleh: 'Trianka Priya Utama, S.K.Pm.',
  diperiksaOleh: { name: 'Fitria, S.T., M.T.', title: 'Kepala Seksi Penataan dan Pemberdayaan\nKantor Pertanahan Kota Cimahi', nip: '19820803 200604 2 005' },
  kepalaKantor: { name: 'Wikantadi Kasumbogo, S.Si', title: 'Kepala Kantor Pertanahan Kota Cimahi', nip: '19810618 200604 1 007' },
};

export interface PtpZonePage {
  kind: 'rtrw' | 'kbu' | 'lsd' | 'lbs';
  title: string;
  legalBasis: string;
  rows: { label: string; color: string; areaM2: number; percentage: number; sublabel?: string }[];
}

// Decide which Peta 5.x sub-pages apply, mirroring the Contoh Peta examples:
// RTRW is always shown; KBU/LSD/LBS only when the parcel actually overlaps them.
export function buildZonePages(screening: PolygonScreeningResult): PtpZonePage[] {
  const pages: PtpZonePage[] = [];

  if (screening.rtrwBreakdown.length > 0) {
    pages.push({
      kind: 'rtrw',
      title: 'RENCANA TATA RUANG',
      legalBasis: 'Sesuai Peraturan Daerah Nomor 04 Tahun 2024 Tentang RTRW Kota Cimahi Tahun 2024-2044',
      rows: screening.rtrwBreakdown.map((r) => ({
        label: r.zoneName,
        color: r.color,
        areaM2: r.areaM2,
        percentage: r.percentage,
      })),
    });
  }

  if (screening.kbuBreakdown.length > 0) {
    pages.push({
      kind: 'kbu',
      title: 'RENCANA TATA RUANG',
      legalBasis: 'Sesuai Peraturan Daerah Provinsi Jawa Barat Nomor 02 Tahun 2016 Tentang Pedoman Pengendalian Kawasan Bandung Utara Sebagai Kawasan Strategis Provinsi Jawa Barat',
      rows: screening.kbuBreakdown.map((k) => ({
        label: `Kawasan Bandung Utara Zona ${k.zona.replace('Zona ', '')}`,
        color: k.color,
        areaM2: k.areaM2,
        percentage: k.percentage,
      })),
    });
  }

  if (screening.lsdOverlap.isOverlap) {
    pages.push({
      kind: 'lsd',
      title: 'LAHAN SAWAH DILINDUNGI',
      legalBasis: 'Kepmen ATR/BPN No. 1589/SK-HK.02/01/XII/2021 tanggal 16 Desember 2021',
      rows: [
        {
          label: 'Lahan Sawah Dilindungi',
          color: '#16a34a',
          areaM2: screening.lsdOverlap.overlapAreaM2,
          percentage: screening.lsdOverlap.overlapPercentage,
        },
      ],
    });
  }

  if (screening.lbsOverlap.isOverlap) {
    pages.push({
      kind: 'lbs',
      title: 'RENCANA TATA RUANG',
      legalBasis: 'Berdasarkan Peta Lahan Baku Sawah',
      rows: [
        {
          label: 'Lahan Baku Sawah',
          color: '#22c55e',
          areaM2: screening.lbsOverlap.overlapAreaM2,
          percentage: screening.lbsOverlap.overlapPercentage,
          sublabel: screening.lbsOverlap.jenisSawah,
        },
      ],
    });
  }

  return pages;
}

// Target print scale per page type, matching the denominators seen in the
// reference documents (small parcels get a tighter scale than the locator page).
export function pickScaleForArea(areaM2: number): number {
  if (areaM2 < 300) return 300;
  if (areaM2 < 800) return 500;
  if (areaM2 < 2000) return 800;
  return 1000;
}

export function pickLocatorScale(areaM2: number): number {
  if (areaM2 < 2000) return 1000;
  return 2500;
}

// MapLibre zoom level that renders `scaleDenominator` (e.g. 300 for 1:300) at
// `capturePxWidth` pixels across `contentWidthMm` of physical paper width.
export function scaleToZoom(scaleDenominator: number, latDeg: number, capturePxWidth: number, contentWidthMm = 170): number {
  const groundWidthMeters = scaleDenominator * (contentWidthMm / 1000);
  const metersPerPixel = groundWidthMeters / capturePxWidth;
  const latRad = (latDeg * Math.PI) / 180;
  const zoom = Math.log2((156543.03392804097 * Math.cos(latRad)) / metersPerPixel);
  return zoom;
}

export function pointsToPolygonCoords(points: CoordinatePoint[]): [number, number][] {
  const coords = points.map((p) => [p.lng ?? p.x, p.lat ?? p.y] as [number, number]);
  if (coords.length > 2 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
    coords.push(coords[0]);
  }
  return coords;
}
