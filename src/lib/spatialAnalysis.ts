import * as turf from '@turf/turf';
import { ScreeningResult, PolygonScreeningResult, CoordinatePoint } from './types';
import { fromWgs84, toDms } from './crsDefinitions';
import { RTRW_COLORS, KBU_COLORS, KBU_REGULATIONS } from './layerConfig';

// In-memory dataset cache for client-side spatial query
let datasetCache: {
  rtrw?: any;
  kbu?: any;
  lsd?: any;
  lbs?: any;
  adm?: any;
  ks?: any;
} = {};

export async function loadAllDatasets() {
  if (datasetCache.rtrw && datasetCache.kbu && datasetCache.lsd && datasetCache.lbs && datasetCache.adm) {
    return datasetCache;
  }

  try {
    const [rtrwRes, kbuRes, lsdRes, lbsRes, admRes, ksRes] = await Promise.all([
      fetch('/data/rtrw_pola_ruang.geojson').then((r) => r.json()),
      fetch('/data/kbu_zonasi.geojson').then((r) => r.json()),
      fetch('/data/lsd_cimahi.geojson').then((r) => r.json()),
      fetch('/data/lbs_cimahi.geojson').then((r) => r.json()),
      fetch('/data/batas_kelurahan.geojson').then((r) => r.json()),
      fetch('/data/kawasan_strategis.geojson').then((r) => r.json()),
    ]);

    datasetCache = {
      rtrw: rtrwRes,
      kbu: kbuRes,
      lsd: lsdRes,
      lbs: lbsRes,
      adm: admRes,
      ks: ksRes,
    };
    return datasetCache;
  } catch (err) {
    console.error('Error loading GIS datasets:', err);
    return datasetCache;
  }
}

// Spatial Screening for a Single Point (Coordinate / Click on map)
export async function screenCoordinate(lng: number, lat: number): Promise<ScreeningResult> {
  const datasets = await loadAllDatasets();
  const point = turf.point([lng, lat]);

  // Coordinates in various systems
  const [utmX, utmY] = fromWgs84(lng, lat, 'EPSG:32748');
  const [tm3X, tm3Y] = fromWgs84(lng, lat, 'EPSG:23888');
  const dmsStr = `${toDms(lat, true)}, ${toDms(lng, false)}`;

  // 1. Admin (Kelurahan / Kecamatan)
  let kelurahan = '-';
  let kecamatan = '-';
  if (datasets.adm?.features) {
    for (const f of datasets.adm.features) {
      if (turf.booleanPointInPolygon(point, f)) {
        kelurahan = f.properties.KELURAHAN || '-';
        kecamatan = f.properties.KECAMATAN || '-';
        break;
      }
    }
  }

  // 2. RTRW Pola Ruang
  let rtrwResult: ScreeningResult['rtrw'] = null;
  if (datasets.rtrw?.features) {
    for (const f of datasets.rtrw.features) {
      if (turf.booleanPointInPolygon(point, f)) {
        const namobj = f.properties.NAMOBJ || 'Kawasan Tidak Terdefinisi';
        rtrwResult = {
          polaRuang: namobj,
          orde01: f.properties.ORDE01,
          orde02: f.properties.ORDE02,
          orde03: f.properties.ORDE03,
          orde04: f.properties.ORDE04,
          jnsrpr: f.properties.JNSRPR,
          color: RTRW_COLORS[namobj] || '#94a3b8',
          ketentuanUmum: getKetentuanPolaRuang(namobj),
        };
        break;
      }
    }
  }

  // 3. KBU (Kawasan Bandung Utara)
  let kbuResult: ScreeningResult['kbu'] = null;
  if (datasets.kbu?.features) {
    for (const f of datasets.kbu.features) {
      if (turf.booleanPointInPolygon(point, f)) {
        const zona = f.properties.Zona || 'Zona KBU';
        const reg = KBU_REGULATIONS[zona];
        kbuResult = {
          zona: zona,
          namaZona: f.properties.Zona_1 || zona,
          keterangan: reg?.desc || 'Kawasan Pengendalian Ketat KBU',
          color: KBU_COLORS[zona] || '#64748b',
          koefisien: reg
            ? {
                kdb: reg.kdb,
                klb: reg.klb,
                kdh: reg.kdh,
              }
            : undefined,
        };
        break;
      }
    }
  }

  // 4. LSD (Lahan Sawah Dilindungi)
  let lsdResult: ScreeningResult['lsd'] = null;
  if (datasets.lsd?.features) {
    for (const f of datasets.lsd.features) {
      if (turf.booleanPointInPolygon(point, f)) {
        const kesesuaian = f.properties.Kesesuaian || 'Terindikasi LSD';
        const hasil = f.properties.HASIL || '-';
        lsdResult = {
          kesesuaian,
          hasilValidasi: hasil,
          diPupr: f.properties.DI_PUPR || 'Non Irigasi',
          luas: f.properties.LUAS ? parseFloat(f.properties.LUAS) : undefined,
          rekomendasi: getRekomendasiLsd(kesesuaian, hasil),
        };
        break;
      }
    }
  }

  // 5. LBS (Lahan Baku Sawah)
  let lbsResult: ScreeningResult['lbs'] = null;
  if (datasets.lbs?.features) {
    for (const f of datasets.lbs.features) {
      if (turf.booleanPointInPolygon(point, f)) {
        lbsResult = {
          namaObjek: f.properties.NAMOBJ || 'Sawah',
          jenisSawah: f.properties.JSWH || 'Sawah Baku',
          luasHa: f.properties.LUASHA ? parseFloat(f.properties.LUASHA) : undefined,
        };
        break;
      }
    }
  }

  // 6. Kawasan Strategis
  let ksResult: ScreeningResult['kawasanStrategis'] = null;
  if (datasets.ks?.features) {
    for (const f of datasets.ks.features) {
      if (turf.booleanPointInPolygon(point, f)) {
        ksResult = {
          nama: f.properties.NAMOBJ || 'Kawasan Strategis Kota',
        };
        break;
      }
    }
  }

  return {
    coordinate: {
      lng: Number(lng.toFixed(6)),
      lat: Number(lat.toFixed(6)),
      utmX: Math.round(utmX * 100) / 100,
      utmY: Math.round(utmY * 100) / 100,
      tm3X: Math.round(tm3X * 100) / 100,
      tm3Y: Math.round(tm3Y * 100) / 100,
      dms: dmsStr,
    },
    admin: {
      kelurahan,
      kecamatan,
    },
    rtrw: rtrwResult,
    kbu: kbuResult,
    lsd: lsdResult,
    lbs: lbsResult,
    kawasanStrategis: ksResult,
    screenedAt: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
  };
}

// True Spatial Polygon Intersection Analysis (Automated PKKPR Screening Engine)
export async function screenPolygonArea(points: CoordinatePoint[]): Promise<PolygonScreeningResult | null> {
  if (points.length < 3) return null;

  const datasets = await loadAllDatasets();
  const coords = points.map((p) => [p.lng ?? p.x, p.lat ?? p.y]);
  if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
    coords.push([...coords[0]]);
  }

  let userPolygon: any;
  try {
    userPolygon = turf.polygon([coords]);
  } catch (err) {
    console.error('Invalid polygon geometry:', err);
    return null;
  }

  const totalAreaM2 = turf.area(userPolygon);
  const totalAreaHa = totalAreaM2 / 10000;
  const line = turf.polygonToLine(userPolygon);
  const perimeterKm = turf.length(line, { units: 'kilometers' });
  const perimeterM = perimeterKm * 1000;

  // Calculate Centroid
  const centroidPoint = turf.centroid(userPolygon);
  const cLng = centroidPoint.geometry.coordinates[0];
  const cLat = centroidPoint.geometry.coordinates[1];
  const [utmX, utmY] = fromWgs84(cLng, cLat, 'EPSG:32748');
  const [tm3X, tm3Y] = fromWgs84(cLng, cLat, 'EPSG:23888');

  // 1. RTRW Pola Ruang Breakdown
  const rtrwMap: Record<string, number> = {};
  if (datasets.rtrw?.features) {
    for (const f of datasets.rtrw.features) {
      try {
        if (turf.booleanIntersects(userPolygon, f)) {
          const intersection = turf.intersect(turf.featureCollection([userPolygon, f]));
          if (intersection) {
            const intArea = turf.area(intersection);
            const zone = f.properties.NAMOBJ || 'Kawasan Lainnya';
            rtrwMap[zone] = (rtrwMap[zone] || 0) + intArea;
          }
        }
      } catch (e) {
        // Fallback to point check if intersection geometry encounters self-intersection
        if (turf.booleanPointInPolygon(centroidPoint, f)) {
          const zone = f.properties.NAMOBJ || 'Kawasan Lainnya';
          rtrwMap[zone] = totalAreaM2;
        }
      }
    }
  }

  const rtrwBreakdown = Object.entries(rtrwMap).map(([zoneName, areaM2]) => ({
    zoneName,
    color: RTRW_COLORS[zoneName] || '#94a3b8',
    areaM2: Math.round(areaM2 * 100) / 100,
    areaHa: Math.round((areaM2 / 10000) * 10000) / 10000,
    percentage: Math.min(100, Math.round((areaM2 / (totalAreaM2 || 1)) * 1000) / 10),
    ketentuanUmum: getKetentuanPolaRuang(zoneName),
  }));

  // 2. KBU Breakdown
  const kbuMap: Record<string, number> = {};
  if (datasets.kbu?.features) {
    for (const f of datasets.kbu.features) {
      try {
        if (turf.booleanIntersects(userPolygon, f)) {
          const intersection = turf.intersect(turf.featureCollection([userPolygon, f]));
          if (intersection) {
            const intArea = turf.area(intersection);
            const zona = f.properties.Zona || 'Zona KBU';
            kbuMap[zona] = (kbuMap[zona] || 0) + intArea;
          }
        }
      } catch (e) {
        if (turf.booleanPointInPolygon(centroidPoint, f)) {
          const zona = f.properties.Zona || 'Zona KBU';
          kbuMap[zona] = totalAreaM2;
        }
      }
    }
  }

  const kbuBreakdown = Object.entries(kbuMap).map(([zona, areaM2]) => {
    const reg = KBU_REGULATIONS[zona];
    return {
      zona,
      color: KBU_COLORS[zona] || '#64748b',
      keterangan: reg?.desc || 'Kawasan Pengendalian Kawasan Bandung Utara',
      koefisien: reg ? { kdb: reg.kdb, klb: reg.klb, kdh: reg.kdh } : undefined,
      areaM2: Math.round(areaM2 * 100) / 100,
      percentage: Math.min(100, Math.round((areaM2 / (totalAreaM2 || 1)) * 1000) / 10),
    };
  });

  // 3. LSD Overlap
  let lsdOverlapArea = 0;
  let lsdKesesuaian = 'Bebas LSD (Aman)';
  let lsdHasil = '-';
  if (datasets.lsd?.features) {
    for (const f of datasets.lsd.features) {
      try {
        if (turf.booleanIntersects(userPolygon, f)) {
          const intersection = turf.intersect(turf.featureCollection([userPolygon, f]));
          if (intersection) {
            lsdOverlapArea += turf.area(intersection);
            lsdKesesuaian = f.properties.Kesesuaian || 'Terindikasi LSD';
            lsdHasil = f.properties.HASIL || '-';
          }
        }
      } catch (e) {
        // Ignore topology glitch
      }
    }
  }

  const lsdOverlap = {
    isOverlap: lsdOverlapArea > 1,
    overlapAreaM2: Math.round(lsdOverlapArea * 100) / 100,
    overlapPercentage: Math.min(100, Math.round((lsdOverlapArea / (totalAreaM2 || 1)) * 1000) / 10),
    kesesuaian: lsdKesesuaian,
    hasilValidasi: lsdHasil,
    rekomendasi: getRekomendasiLsd(lsdKesesuaian, lsdHasil),
  };

  // 4. LBS Overlap
  let lbsOverlapArea = 0;
  let lbsJenisSawah = 'Bukan LBS';
  if (datasets.lbs?.features) {
    for (const f of datasets.lbs.features) {
      try {
        if (turf.booleanIntersects(userPolygon, f)) {
          const intersection = turf.intersect(turf.featureCollection([userPolygon, f]));
          if (intersection) {
            lbsOverlapArea += turf.area(intersection);
            lbsJenisSawah = f.properties.JSWH || 'Sawah Baku';
          }
        }
      } catch (e) {}
    }
  }

  const lbsOverlap = {
    isOverlap: lbsOverlapArea > 1,
    overlapAreaM2: Math.round(lbsOverlapArea * 100) / 100,
    overlapPercentage: Math.min(100, Math.round((lbsOverlapArea / (totalAreaM2 || 1)) * 1000) / 10),
    jenisSawah: lbsJenisSawah,
  };

  // 5. Admin Breakdown
  const adminMap: Record<string, { kecamatan: string; areaM2: number }> = {};
  if (datasets.adm?.features) {
    for (const f of datasets.adm.features) {
      try {
        if (turf.booleanIntersects(userPolygon, f)) {
          const intersection = turf.intersect(turf.featureCollection([userPolygon, f]));
          if (intersection) {
            const intArea = turf.area(intersection);
            const kel = f.properties.KELURAHAN || 'Kelurahan Cimahi';
            const kec = f.properties.KECAMATAN || 'Cimahi';
            if (!adminMap[kel]) adminMap[kel] = { kecamatan: kec, areaM2: 0 };
            adminMap[kel].areaM2 += intArea;
          }
        }
      } catch (e) {}
    }
  }

  const adminBreakdown = Object.entries(adminMap).map(([kelurahan, val]) => ({
    kelurahan,
    kecamatan: val.kecamatan,
    areaM2: Math.round(val.areaM2 * 100) / 100,
    percentage: Math.min(100, Math.round((val.areaM2 / (totalAreaM2 || 1)) * 1000) / 10),
  }));

  return {
    totalAreaM2: Math.round(totalAreaM2 * 100) / 100,
    totalAreaHa: Math.round(totalAreaHa * 10000) / 10000,
    perimeterM: Math.round(perimeterM * 100) / 100,
    centroid: {
      lng: Number(cLng.toFixed(6)),
      lat: Number(cLat.toFixed(6)),
      utmX: Math.round(utmX * 100) / 100,
      utmY: Math.round(utmY * 100) / 100,
      tm3X: Math.round(tm3X * 100) / 100,
      tm3Y: Math.round(tm3Y * 100) / 100,
      dms: `${toDms(cLat, true)}, ${toDms(cLng, false)}`,
    },
    adminBreakdown,
    rtrwBreakdown,
    kbuBreakdown,
    lsdOverlap,
    lbsOverlap,
    screenedAt: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
  };
}

// Helper: Calculate polygon geometric properties
export function calculatePolygonMetrics(points: CoordinatePoint[]) {
  if (points.length < 3) {
    return { areaM2: 0, areaHa: 0, perimeterM: 0 };
  }

  const coords = points.map((p) => [p.lng ?? p.x, p.lat ?? p.y]);
  // Ensure closed ring
  if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
    coords.push([...coords[0]]);
  }

  try {
    const polygon = turf.polygon([coords]);
    const areaM2 = turf.area(polygon);
    const areaHa = areaM2 / 10000;
    const line = turf.polygonToLine(polygon);
    const perimeterKm = turf.length(line, { units: 'kilometers' });
    const perimeterM = perimeterKm * 1000;

    return {
      areaM2: Math.round(areaM2 * 1000) / 1000,
      areaHa: Math.round(areaHa * 10000) / 10000,
      perimeterM: Math.round(perimeterM * 100) / 100,
    };
  } catch (err) {
    console.error('Error calculating polygon metrics:', err);
    return { areaM2: 0, areaHa: 0, perimeterM: 0 };
  }
}

// Helper: Guidance / Rekomendasi LSD
function getRekomendasiLsd(kesesuaian: string, hasil: string): string {
  if (kesesuaian.includes('SESUAI TANAMAN PANGAN')) {
    return 'Lahan dilindungi mutlak sebagai sawah abadi. Pemanfaatan non-pertanian dibatasi ketat sesuai ketentuan LP2B/LSD nasional.';
  }
  if (hasil.includes('DIPERTAHANKAN PERUMAHAN') || hasil.includes('PENGURANG')) {
    return 'Tercatat dalam Berita Acara Faktual dapat disesuaikan untuk fungsi permukiman/infrastruktur perkotaan sesuai izin teknis terkait.';
  }
  if (kesesuaian.includes('KOREKSI')) {
    return 'Kawasan dalam proses koreksi verifikasi faktual lapangan BPN/PUPR.';
  }
  return 'Kawasan di luar deliniasi Lahan Sawah Dilindungi (LSD) prioritas.';
}

// Helper: General provisions for RTRW Pola Ruang
function getKetentuanPolaRuang(polaRuang: string): string {
  const map: Record<string, string> = {
    'Kawasan Perumahan': 'Diperuntukkan bagi perumahan dan permukiman dengan sarana prasarana lingkungan pendukung.',
    'Kawasan Perdagangan dan Jasa': 'Diperuntukkan bagi kegiatan komersial, pertokoan, mall, perkantoran swasta, dan jasa komersial perkotaan.',
    'Kawasan Peruntukan Industri': 'Diperuntukkan bagi sentra industri manufaktur, tekstil, dan industri pengolahan dengan AMDAL/UKL-UPL.',
    'Kawasan Fasilitas Umum dan Fasilitas Sosial': 'Diperuntukkan bagi sarana pendidikan, kesehatan, peribadatan, dan pelayanan sosial masyarakat.',
    'Kawasan Perlindungan Setempat': 'Kawasan sempadan sungai, mata air, dan buffer lindung yang wajib dipertahankan fungsinya.',
    'Rimba Kota': 'RTH Kawasan perlindungan vegetasi pohon untuk konservasi air dan iklim mikro kota.',
    'Taman Kota': 'Ruang Terbuka Hijau publik untuk rekreasi dan estetika perkotaan.',
    'Kawasan Tanaman Pangan': 'Kawasan budidaya pertanian pangan, padi sawah, dan hortikultura berkelanjutan.',
    'Kawasan Transportasi': 'Kawasan simpul transportasi seperti stasiun kereta api, terminal, dan depo.',
    'Kawasan Pertahanan dan Keamanan': 'Kawasan instalasi militer, pangkalan pertahanan, dan fasilitas TNI/Polri.',
  };
  return map[polaRuang] || 'Ketentuan pemanfaatan ruang mengacu pada Perda Kota Cimahi No. 4 Tahun 2024 tentang RTRW.';
}
