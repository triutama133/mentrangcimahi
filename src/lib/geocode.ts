import { parseDms, toWgs84 } from './crsDefinitions';

export interface GeocodeResult {
  id: string;
  label: string;
  sublabel?: string;
  center: [number, number]; // [lng, lat]
  source: 'coordinate' | 'kelurahan' | 'nominatim';
}

// Left,top,right,bottom - biases Nominatim results toward Cimahi without excluding elsewhere
const CIMAHI_VIEWBOX = '107.510434,-6.831498,107.576126,-6.932873';

/**
 * Parses a pasted/typed coordinate pair as "lat, lng" - either plain decimal
 * degrees (with optional N/S/E/W suffix) or DMS (e.g. 6°53'12.6"S 107°32'37.3"E).
 * Returns [lng, lat] for direct use with MapLibre, or null if it doesn't look
 * like a coordinate at all.
 */
export function parseCoordinateQuery(query: string): [number, number] | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // DMS pair: two DMS-looking tokens separated by a comma or semicolon
  if (/[°'"]/.test(trimmed)) {
    const parts = trimmed.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      const lat = parseDms(parts[0]);
      const lng = parseDms(parts[1]);
      if (lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return [lng, lat];
      }
    }
    return null;
  }

  // Plain decimal degree pair: "lat, lng" / "lat lng", optional N/S/E/W suffix
  const decRegex = /^(-?\d{1,3}(?:\.\d+)?)\s*([NSns])?\s*[,\s]+\s*(-?\d{1,3}(?:\.\d+)?)\s*([EWew])?$/;
  const m = trimmed.match(decRegex);
  if (m) {
    let lat = parseFloat(m[1]);
    let lng = parseFloat(m[3]);
    const latDir = m[2]?.toUpperCase();
    const lngDir = m[4]?.toUpperCase();
    if (latDir === 'S') lat = -Math.abs(lat);
    if (latDir === 'N') lat = Math.abs(lat);
    if (lngDir === 'W') lng = -Math.abs(lng);
    if (lngDir === 'E') lng = Math.abs(lng);

    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return [lng, lat];
    }
  }

  // Projected coordinate pair (UTM 48S or TM-3 BPN 48.2), e.g. "792000, 9240000"
  const projRegex = /^(-?\d+(?:\.\d+)?)\s*[,\s]+\s*(-?\d+(?:\.\d+)?)$/;
  const pm = trimmed.match(projRegex);
  if (pm) {
    const v1 = parseFloat(pm[1]);
    const v2 = parseFloat(pm[2]);

    // UTM 48S: Easting ~500k..900k, Northing ~9.0M..9.5M
    if (v1 > 500000 && v1 < 900000 && v2 > 9000000 && v2 < 9500000) {
      return toWgs84(v1, v2, 'EPSG:32748');
    }

    // TM-3 BPN 48.2: Easting ~100k..400k, Northing ~1.3M..1.7M
    if (v1 > 100000 && v1 < 400000 && v2 > 1300000 && v2 < 1700000) {
      return toWgs84(v1, v2, 'EPSG:23888');
    }
  }

  return null;
}

/**
 * Place/address search via OpenStreetMap Nominatim (free, no API key) - the
 * closest free equivalent to a "Google Maps search box". Results are biased
 * toward Cimahi via viewbox but not restricted to it.
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    format: 'jsonv2',
    q: trimmed,
    limit: '6',
    countrycodes: 'id',
    viewbox: CIMAHI_VIEWBOX,
    bounded: '0',
  });

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ place_id: number; display_name: string; lat: string; lon: string }>;
    return data.map((item) => ({
      id: `nominatim-${item.place_id}`,
      label: item.display_name.split(',')[0],
      sublabel: item.display_name,
      center: [parseFloat(item.lon), parseFloat(item.lat)] as [number, number],
      source: 'nominatim' as const,
    }));
  } catch (e) {
    if ((e as Error).name !== 'AbortError') {
      console.error('Nominatim search failed', e);
    }
    return [];
  }
}
