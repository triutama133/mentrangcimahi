import proj4 from 'proj4';
import { CrsOption, CoordinatePoint } from './types';

// Define Proj4 strings
export const CRS_LIST: CrsOption[] = [
  // 1. WGS 84
  {
    code: 'EPSG:4326',
    name: 'WGS 84 (Latitude, Longitude) - Standar GPS / WebGIS',
    category: 'Geographic (WGS84)',
    proj4: '+proj=longlat +datum=WGS84 +no_defs',
    unit: 'degrees',
    isDefault: false,
  },
  // 2. UTM Zones
  {
    code: 'EPSG:32748',
    name: 'UTM Zone 48S (WGS 84) - Jawa Barat / Cimahi / Bandung',
    category: 'UTM (Jawa & Indonesia)',
    proj4: '+proj=utm +zone=48 +south +datum=WGS84 +units=m +no_defs',
    unit: 'meters',
    isDefault: true,
  },
  {
    code: 'EPSG:32749',
    name: 'UTM Zone 49S (WGS 84) - Jawa Tengah & Jawa Timur',
    category: 'UTM (Jawa & Indonesia)',
    proj4: '+proj=utm +zone=49 +south +datum=WGS84 +units=m +no_defs',
    unit: 'meters',
  },
  {
    code: 'EPSG:32747',
    name: 'UTM Zone 47S (WGS 84) - Sumatera Bagian Selatan',
    category: 'UTM (Jawa & Indonesia)',
    proj4: '+proj=utm +zone=47 +south +datum=WGS84 +units=m +no_defs',
    unit: 'meters',
  },
  {
    code: 'EPSG:32750',
    name: 'UTM Zone 50S (WGS 84) - Bali, NTB, NTT',
    category: 'UTM (Jawa & Indonesia)',
    proj4: '+proj=utm +zone=50 +south +datum=WGS84 +units=m +no_defs',
    unit: 'meters',
  },
  // 3. TM-3° BPN (Indonesia Transverse Mercator 3 Degree)
  {
    code: 'EPSG:23888',
    name: 'DGN95 / Indonesia TM-3° Zona 48.2 (BPN Kota Cimahi & Kab. Bandung)',
    category: 'TM-3° BPN Pertanahan',
    proj4: '+proj=tmerc +lat_0=0 +lon_0=106.5 +k=0.9999 +x_0=200000 +y_0=1500000 +ellps=WGS84 +units=m +no_defs',
    unit: 'meters',
  },
  {
    code: 'EPSG:23838',
    name: 'DGN95 / Indonesia TM-3° Zona 48.1 (BPN Jawa Barat Bagian Barat)',
    category: 'TM-3° BPN Pertanahan',
    proj4: '+proj=tmerc +lat_0=0 +lon_0=103.5 +k=0.9999 +x_0=200000 +y_0=1500000 +ellps=WGS84 +units=m +no_defs',
    unit: 'meters',
  },
  {
    code: 'EPSG:23889',
    name: 'DGN95 / Indonesia TM-3° Zona 49.1 (BPN Jawa Tengah & Pantura)',
    category: 'TM-3° BPN Pertanahan',
    proj4: '+proj=tmerc +lat_0=0 +lon_0=109.5 +k=0.9999 +x_0=200000 +y_0=1500000 +ellps=WGS84 +units=m +no_defs',
    unit: 'meters',
  },
  {
    code: 'EPSG:23890',
    name: 'DGN95 / Indonesia TM-3° Zona 49.2 (BPN DIY & Jawa Timur Barat)',
    category: 'TM-3° BPN Pertanahan',
    proj4: '+proj=tmerc +lat_0=0 +lon_0=112.5 +k=0.9999 +x_0=200000 +y_0=1500000 +ellps=WGS84 +units=m +no_defs',
    unit: 'meters',
  },
  // 4. Web Mercator Auxiliary Sphere (used by Google/Bing/OSM web tiles)
  {
    code: 'EPSG:3857',
    name: 'WGS 1984 Web Mercator (Auxiliary Sphere) - Google/Bing/OSM Tiles',
    category: 'Web Mercator (Auxiliary Sphere)',
    proj4: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs',
    unit: 'meters',
  },
];

// Register custom proj4 definitions
CRS_LIST.forEach((crs) => {
  try {
    proj4.defs(crs.code, crs.proj4);
  } catch (e) {
    console.error(`Failed to register ${crs.code}`, e);
  }
});

// Helper: Convert any point from specific CRS to WGS84 [lng, lat]
export function toWgs84(x: number, y: number, fromCrsCode: string): [number, number] {
  if (fromCrsCode === 'EPSG:4326') {
    return [x, y];
  }
  try {
    const result = proj4(fromCrsCode, 'EPSG:4326', [x, y]);
    return [result[0], result[1]];
  } catch (e) {
    console.error(`Error converting ${fromCrsCode} to WGS84`, e);
    return [x, y];
  }
}

// Helper: Convert from WGS84 [lng, lat] to target CRS [x, y]
export function fromWgs84(lng: number, lat: number, toCrsCode: string): [number, number] {
  if (toCrsCode === 'EPSG:4326') {
    return [lng, lat];
  }
  try {
    const result = proj4('EPSG:4326', toCrsCode, [lng, lat]);
    return [result[0], result[1]];
  } catch (e) {
    console.error(`Error converting WGS84 to ${toCrsCode}`, e);
    return [lng, lat];
  }
}

// Helper: Format Decimal Degrees to DMS string (e.g. 06°53'12.34" S)
export function toDms(degrees: number, isLat: boolean): string {
  const absolute = Math.abs(degrees);
  const deg = Math.floor(absolute);
  const minNotTruncated = (absolute - deg) * 60;
  const min = Math.floor(minNotTruncated);
  const sec = ((minNotTruncated - min) * 60).toFixed(2);

  let direction = '';
  if (isLat) {
    direction = degrees >= 0 ? 'N' : 'S';
  } else {
    direction = degrees >= 0 ? 'E' : 'W';
  }

  return `${deg}°${min}'${sec}" ${direction}`;
}

// Parser: Parse DMS text to decimal degrees
export function parseDms(dmsStr: string): number | null {
  const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+([\d.]+)"?\s*([NSEWnsew])?/;
  const match = dmsStr.match(dmsRegex);
  if (!match) return null;

  const deg = parseFloat(match[1]);
  const min = parseFloat(match[2]);
  const sec = parseFloat(match[3]);
  const dir = match[4]?.toUpperCase();

  let decimal = deg + min / 60 + sec / 3600;
  if (dir === 'S' || dir === 'W') {
    decimal = -decimal;
  }
  return decimal;
}

// Parser: Parse raw multiline text into coordinate points
export function parseCoordinateText(text: string, crsCode: string): CoordinatePoint[] {
  const lines = text.trim().split(/\r?\n/);
  const points: CoordinatePoint[] = [];
  let counter = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

    // Check if line contains DMS
    if (trimmed.includes('°') || trimmed.includes("'") || trimmed.includes('"')) {
      const parts = trimmed.split(/[,;\t|]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const lat = parseDms(parts[0]);
        const lng = parseDms(parts[1]);
        if (lat !== null && lng !== null) {
          const wgs = [lng, lat] as [number, number];
          points.push({
            id: `p-${counter}`,
            no: counter,
            name: `Titik ${counter}`,
            x: lng,
            y: lat,
            lng: wgs[0],
            lat: wgs[1],
          });
          counter++;
          continue;
        }
      }
    }

    // Split by comma, semicolon, tab, or whitespace
    // Clean out labels like "P1", "1", "Titik 1" if present at start
    const cleanTokens = trimmed
      .replace(/^[a-zA-Z0-9_-]+\s*[:=]\s*/, '')
      .split(/[\s,;\t|]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (cleanTokens.length >= 2) {
      let xVal = 0;
      let yVal = 0;

      // If token 0 is a point label (e.g. 'P1', '1', 'Patok_A')
      if (isNaN(Number(cleanTokens[0])) && !isNaN(Number(cleanTokens[1])) && !isNaN(Number(cleanTokens[2]))) {
        xVal = parseFloat(cleanTokens[1]);
        yVal = parseFloat(cleanTokens[2]);
      } else if (!isNaN(Number(cleanTokens[0])) && !isNaN(Number(cleanTokens[1]))) {
        // If there's 3 numbers and first is integer index (1 784000 9235000)
        if (
          cleanTokens.length >= 3 &&
          !isNaN(Number(cleanTokens[2])) &&
          Number.isInteger(Number(cleanTokens[0])) &&
          Number(cleanTokens[0]) < 1000 &&
          Math.abs(Number(cleanTokens[1])) > 1000
        ) {
          xVal = parseFloat(cleanTokens[1]);
          yVal = parseFloat(cleanTokens[2]);
        } else {
          xVal = parseFloat(cleanTokens[0]);
          yVal = parseFloat(cleanTokens[1]);
        }
      }

      if (!isNaN(xVal) && !isNaN(yVal) && (xVal !== 0 || yVal !== 0)) {
        const [wgsLng, wgsLat] = toWgs84(xVal, yVal, crsCode);
        points.push({
          id: `p-${counter}`,
          no: counter,
          name: `P${counter}`,
          x: xVal,
          y: yVal,
          lng: wgsLng,
          lat: wgsLat,
        });
        counter++;
      }
    }
  }

  return points;
}

// Preset Sample Coordinate Datasets for Cimahi
export const PRESET_SAMPLES = [
  {
    name: 'Contoh Poligon Persil Cimahi (UTM 48S)',
    crs: 'EPSG:32748',
    description: 'Bidang persil tanah di wilayah Cimahi Tengah (Sistem Koordinat UTM Zone 48S)',
    text: `P1  780650.25  9238420.10
P2  780780.40  9238435.50
P3  780810.15  9238290.80
P4  780675.60  9238275.20`,
  },
  {
    name: 'Contoh Sertifikat Tanah BPN Cimahi (TM-3° 48.2)',
    crs: 'EPSG:23888',
    description: 'Batas bidang tanah sesuai Surat Ukur BPN (Sistem Proyeksi TM-3° Zona 48.2)',
    text: `1  204520.30  1504310.20
2  204640.80  1504325.60
3  204660.10  1504190.40
4  204535.50  1504175.80`,
  },
  {
    name: 'Contoh Koordinat Geografis (WGS84 Lat/Long)',
    crs: 'EPSG:4326',
    description: 'Koordinat lintang dan bujur desimal (WGS 84)',
    text: `107.541200  -6.884500
107.543500  -6.884350
107.543700  -6.886200
107.541400  -6.886300`,
  },
  {
    name: 'Contoh Format DMS (Derajat Menit Detik)',
    crs: 'EPSG:4326',
    description: 'Format derajat, menit, detik dari dokumen ukur manual',
    text: `06°53'04.20" S, 107°32'28.32" E
06°53'03.66" S, 107°32'36.60" E
06°53'10.32" S, 107°32'37.32" E
06°53'10.68" S, 107°32'29.04" E`,
  },
];

