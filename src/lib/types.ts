export type TabType = 'map' | 'shp-creator' | 'screening' | 'analytics' | 'catalog' | 'regulations';

export type BasemapType = 'google-hybrid' | 'osm' | 'topo' | 'peta-dasar';

export type DigitasiMode = 'none' | 'polygon' | 'polyline';

export interface DigitasiProperty {
  id: string;
  key: string;
  value: string;
  type?: 'text' | 'color' | 'number';
}

export interface DigitasiFeature {
  id: string;
  name: string;
  mode: 'polygon' | 'polyline';
  points: CoordinatePoint[];
  crsCode: string;
  properties: DigitasiProperty[];
  strokeColor: string;
  fillColor: string;
  isFinished: boolean;
  areaM2: number;
  areaHa: number;
  perimeterM: number;
  createdAt: string;
}

export interface LayerConfig {
  id: string;
  name: string;
  category: 'rtrw' | 'kbu' | 'lsd' | 'lbs' | 'admin' | 'ks';
  url: string;
  visible: boolean;
  opacity: number;
  colorField?: string;
  colorMap?: Record<string, string>;
  defaultColor: string;
  borderColor?: string;
  borderWidth?: number;
  description: string;
  legalBasis: string;
  minZoom?: number;
  maxZoom?: number;
}

export interface SpatialSummary {
  city_name: string;
  province: string;
  total_area_ha: number;
  city_center: [number, number];
  city_bounds: [number, number, number, number];
  kelurahan_list: {
    kelurahan: string;
    kecamatan: string;
    center: [number, number];
    bounds: [number, number, number, number];
  }[];
  rtrw: {
    title: string;
    total_features: number;
    pola_ruang: { namobj: string; count: number; area_ha: number }[];
    by_kecamatan: Record<string, { NAMOBJ: string; area_ha: number }[]>;
  };
  kbu: {
    title: string;
    total_features: number;
    zonasi: { zona: string; count: number; area_ha: number }[];
  };
  lbs: {
    title: string;
    total_features: number;
    total_area_ha: number;
    by_type: { jenis_sawah: string; count: number; area_ha: number }[];
  };
  lsd: {
    title: string;
    total_features: number;
    total_area_ha: number;
    by_kesesuaian: { kesesuaian: string; count: number; area_ha: number }[];
    by_hasil: { hasil: string; count: number; area_ha: number }[];
  };
}

export interface ScreeningResult {
  coordinate: {
    lng: number;
    lat: number;
    utmX?: number;
    utmY?: number;
    tm3X?: number;
    tm3Y?: number;
    dms?: string;
  };
  admin: {
    kelurahan: string;
    kecamatan: string;
  };
  rtrw: {
    polaRuang: string;
    orde01?: string;
    orde02?: string;
    orde03?: string;
    orde04?: string;
    jnsrpr?: string;
    color: string;
    ketentuanUmum?: string;
  } | null;
  kbu: {
    zona: string;
    namaZona?: string;
    keterangan?: string;
    color: string;
    koefisien?: {
      kdb?: string;
      klb?: string;
      kdh?: string;
    };
  } | null;
  lsd: {
    kesesuaian: string;
    hasilValidasi: string;
    diPupr?: string;
    luas?: number;
    rekomendasi?: string;
  } | null;
  lbs: {
    namaObjek: string;
    jenisSawah: string;
    luasHa?: number;
  } | null;
  kawasanStrategis: {
    nama: string;
  } | null;
  screenedAt: string;
  polygonBreakdown?: PolygonScreeningResult | null;
}

export interface PolygonScreeningResult {
  totalAreaM2: number;
  totalAreaHa: number;
  perimeterM: number;
  centroid: {
    lng: number;
    lat: number;
    utmX: number;
    utmY: number;
    tm3X: number;
    tm3Y: number;
    dms: string;
  };
  adminBreakdown: {
    kelurahan: string;
    kecamatan: string;
    areaM2: number;
    percentage: number;
  }[];
  rtrwBreakdown: {
    zoneName: string;
    color: string;
    areaM2: number;
    areaHa: number;
    percentage: number;
    ketentuanUmum?: string;
  }[];
  kbuBreakdown: {
    zona: string;
    color: string;
    keterangan: string;
    koefisien?: { kdb?: string; klb?: string; kdh?: string };
    areaM2: number;
    percentage: number;
  }[];
  lsdOverlap: {
    isOverlap: boolean;
    overlapAreaM2: number;
    overlapPercentage: number;
    kesesuaian: string;
    hasilValidasi: string;
    rekomendasi: string;
  };
  lbsOverlap: {
    isOverlap: boolean;
    overlapAreaM2: number;
    overlapPercentage: number;
    jenisSawah: string;
  };
  screenedAt: string;
}

export interface CoordinatePoint {
  id: string;
  no: number;
  name: string;
  x: number; // Easting / Longitude
  y: number; // Northing / Latitude
  lng?: number; // Converted WGS84 Longitude
  lat?: number; // Converted WGS84 Latitude
}

export interface CrsOption {
  code: string;
  name: string;
  category: 'Geographic (WGS84)' | 'UTM (Jawa & Indonesia)' | 'TM-3° BPN Pertanahan' | 'Web Mercator (Auxiliary Sphere)' | 'Custom';
  proj4: string;
  unit: 'degrees' | 'meters';
  isDefault?: boolean;
}

export interface ShpCreatorState {
  crs: string;
  points: CoordinatePoint[];
  polygonName: string;
  description: string;
  isClosed: boolean;
  areaM2: number;
  areaHa: number;
  perimeterM: number;
}
