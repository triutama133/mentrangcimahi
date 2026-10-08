import { LayerConfig } from './types';

// Color map based strictly on RTRW CIMAHI.sld
export const RTRW_COLORS: Record<string, string> = {
  'Badan Air': '#97dbf2',
  'Kawasan Perlindungan Setempat': '#05d7d7',
  'Rimba Kota': '#37550a',
  'Taman Kota': '#416900',
  'Taman Kecamatan': '#468700',
  'Taman Kelurahan': '#4ba500',
  'Taman RW': '#50c300',
  'Pemakaman': '#5aff00',
  'Jalur Hijau': '#0ff500',
  'Badan Jalan': '#eb1e1e',
  'Kawasan Tanaman Pangan': '#c8f546',
  'Kawasan Hortikultura': '#e6ff4b',
  'Kawasan Peruntukan Pertambangan Batuan': '#5f7391',
  'Kawasan Peruntukan Industri': '#690000',
  'Kawasan Pariwisata': '#ffa5ff',
  'Kawasan Infrastruktur Perkotaan': '#ebb455',
  'Kawasan Fasilitas Umum dan Fasilitas Sosial': '#5f005f',
  'Kawasan Perumahan': '#ffa000',
  'Kawasan Perdagangan dan Jasa': '#ff4646',
  'Kawasan Perkantoran': '#9b9b9b',
  'Kawasan Transportasi': '#d73700',
  'Kawasan Pertahanan dan Keamanan': '#9b00ff',
};

// Color map based strictly on KBU Layer.sld
export const KBU_COLORS: Record<string, string> = {
  'Zona B1': '#bfce6b',
  'Zona B2': '#cd804c',
  'Zona B3': '#5139c8',
  'Zona B4': '#fdbf6f',
  'Zona B5': '#fdd773',
  'Zona L1': '#33a02c',
  'Zona L2': '#063f00',
};

// Coefficient guidelines for KBU based on Perda Prov Jawa Barat No. 2/2016
export const KBU_REGULATIONS: Record<string, { desc: string; kdb: string; klb: string; kdh: string }> = {
  'Zona B1': {
    desc: 'Kawasan Permukiman Kepadatan Sangat Rendah / Resapan Air Tinggi',
    kdb: 'Maks. 20%',
    klb: 'Maks. 0.4',
    kdh: 'Min. 80%',
  },
  'Zona B2': {
    desc: 'Kawasan Permukiman Kepadatan Rendah',
    kdb: 'Maks. 30%',
    klb: 'Maks. 0.6',
    kdh: 'Min. 70%',
  },
  'Zona B3': {
    desc: 'Kawasan Permukiman Kepadatan Sedang / Perkotaan Tertata',
    kdb: 'Maks. 50%',
    klb: 'Maks. 1.0',
    kdh: 'Min. 50%',
  },
  'Zona B4': {
    desc: 'Kawasan Permukiman Kepadatan Sedang-Tinggi / Koridor Perkotaan',
    kdb: 'Maks. 60%',
    klb: 'Maks. 1.2',
    kdh: 'Min. 40%',
  },
  'Zona B5': {
    desc: 'Kawasan Permukiman Kepadatan Tinggi Eksisting Perkotaan Cimahi',
    kdb: 'Maks. 70%',
    klb: 'Maks. 1.4',
    kdh: 'Min. 30%',
  },
  'Zona L1': {
    desc: 'Kawasan Lindung Mutlak / Hutan Lindung & Resapan Utama',
    kdb: 'Maks. 5%',
    klb: 'Maks. 0.1',
    kdh: 'Min. 95%',
  },
  'Zona L2': {
    desc: 'Kawasan Lindung Terbatas / Sempadan Sungai, Mata Air, & Lereng Curam',
    kdb: 'Maks. 10%',
    klb: 'Maks. 0.2',
    kdh: 'Min. 90%',
  },
};

// LSD Colors
export const LSD_COLORS: Record<string, string> = {
  'LSD SESUAI TANAMAN PANGAN': '#16a34a', // Green
  'LSD TIDAK SESUAI TANAMAN PANGAN': '#dc2626', // Red
  'KOREKSI': '#f59e0b', // Amber
};

// Single representative swatch color for the LSD layer (green)
export const LSD_COLOR = '#16a34a';

// LBS Colors
export const LBS_COLORS: Record<string, string> = {
  'Irigasi': '#0284c7', // Sky Blue
  'Non Irigasi': '#eab308', // Yellow
  'Tadah Hujan': '#06b6d4', // Cyan
  'Rawa/Lebak': '#14b8a6', // Teal
};

// Single representative swatch color for the LBS layer (blue)
export const LBS_COLOR = '#0284c7';

// Kawasan Strategis Colors
export const KS_COLORS: Record<string, string> = {
  'Pertumbuhan Ekonomi': '#f97316', // Orange
  'Fungsi dan Daya Dukung Lingkungan Hidup': '#10b981', // Emerald
  'Sosial dan Budaya': '#8b5cf6', // Purple
};

export const DEFAULT_LAYERS: LayerConfig[] = [
  {
    id: 'rtrw-pola-ruang',
    name: 'RTRW 2024–2044 (Pola Ruang)',
    category: 'rtrw',
    url: '/data/rtrw_pola_ruang.geojson',
    visible: true,
    opacity: 0.75,
    colorField: 'NAMOBJ',
    colorMap: RTRW_COLORS,
    defaultColor: '#94a3b8',
    borderColor: '#ffffff',
    borderWidth: 0.5,
    description: 'Rencana Pola Ruang Kota Cimahi berdasarkan Peraturan Daerah No. 4 Tahun 2024.',
    legalBasis: 'Perda Kota Cimahi No. 4 Tahun 2024 tentang RTRW Kota Cimahi Tahun 2024-2044',
  },
  {
    id: 'kbu-zonasi',
    name: 'Zonasi Kawasan Bandung Utara (KBU)',
    category: 'kbu',
    url: '/data/kbu_zonasi.geojson',
    visible: false,
    opacity: 0.7,
    colorField: 'Zona',
    colorMap: KBU_COLORS,
    defaultColor: '#64748b',
    borderColor: '#1e293b',
    borderWidth: 1.2,
    description: 'Zonasi Pemanfaatan Ruang KBU di Kota Cimahi sesuai Perda Provinsi Jawa Barat No. 2 Tahun 2016.',
    legalBasis: 'Perda Prov. Jawa Barat No. 2 Tahun 2016 tentang Pedoman Pengendalian Kawasan Bandung Utara',
  },
  {
    id: 'lsd-cimahi',
    name: 'Lahan Sawah Dilindungi (LSD)',
    category: 'lsd',
    url: '/data/lsd_cimahi.geojson',
    visible: false,
    opacity: 0.8,
    colorField: 'Kesesuaian',
    colorMap: LSD_COLORS,
    defaultColor: '#22c55e',
    borderColor: '#15803d',
    borderWidth: 0.8,
    description: 'Peta Lahan Sawah Dilindungi (LSD) berdasarkan Berita Acara Walikota Cimahi & Kepmen ATR/BPN.',
    legalBasis: 'Kepmen ATR/BPN No. 1589/SK-HK.02.01/XII/2021 & Berita Acara Kesepakatan Verifikasi Faktual 2022',
  },
  {
    id: 'lbs-cimahi',
    name: 'Lahan Baku Sawah (LBS)',
    category: 'lbs',
    url: '/data/lbs_cimahi.geojson',
    visible: false,
    opacity: 0.75,
    colorField: 'JSWH',
    colorMap: LBS_COLORS,
    defaultColor: '#0ea5e9',
    borderColor: '#0369a1',
    borderWidth: 0.8,
    description: 'Sebaran Lahan Baku Sawah Kota Cimahi per jenis irigasi.',
    legalBasis: 'Kepmen ATR/BPN tentang Penetapan Luas Lahan Baku Sawah Nasional',
  },
  {
    id: 'kawasan-strategis',
    name: 'Kawasan Strategis Kota',
    category: 'ks',
    url: '/data/kawasan_strategis.geojson',
    visible: false,
    opacity: 0.65,
    colorField: 'NAMOBJ',
    colorMap: KS_COLORS,
    defaultColor: '#a855f7',
    borderColor: '#6b21a8',
    borderWidth: 1.5,
    description: 'Penetapan Kawasan Strategis Kota Cimahi dari sudut kepentingan ekonomi, lingkungan hidup, dan sosial budaya.',
    legalBasis: 'Perda Kota Cimahi No. 4 Tahun 2024',
  },
  {
    id: 'batas-kelurahan',
    name: 'Batas Administrasi Kelurahan',
    category: 'admin',
    url: '/data/batas_kelurahan.geojson',
    visible: true,
    opacity: 0.25,
    colorMap: {
      'Garis Batas Kelurahan': '#0284c7',
    },
    defaultColor: '#f1f5f9',
    borderColor: '#0284c7',
    borderWidth: 2.0,
    description: 'Batas wilayah 15 Kelurahan dan 3 Kecamatan di Kota Cimahi.',
    legalBasis: 'Data Administrasi Wilayah Kota Cimahi',
  },
];

