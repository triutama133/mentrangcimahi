import shp from 'shpjs';
import JSZip from 'jszip';
import proj4 from 'proj4';
import { CoordinatePoint, DigitasiProperty } from './types';
import { calculatePolygonMetrics } from './spatialAnalysis';
import { fromWgs84 } from './crsDefinitions';

export interface ImportedPolygonData {
  id: string;
  name: string;
  mode: 'polygon' | 'polyline';
  points: CoordinatePoint[];
  properties: DigitasiProperty[];
  detectedCrs: string;
  areaM2: number;
  areaHa: number;
  perimeterM: number;
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export interface ImportResult {
  mainParcel: ImportedPolygonData;
  allParcels: ImportedPolygonData[];
}

/**
 * Parses uploaded ZIP (Shapefile / GeoJSON / KML) or direct GeoJSON/KML file
 */
export async function parseImportedFile(file: File, activeCrs: string = 'EPSG:32748'): Promise<ImportResult> {
  const fileName = file.name.toLowerCase();
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  let geojson: any = null;

  if (fileName.endsWith('.zip')) {
    const arrayBuffer = await file.arrayBuffer();
    
    // First try using shpjs for Shapefile in ZIP
    try {
      geojson = await shp(arrayBuffer);
    } catch (shpErr) {
      console.warn('shpjs failed, attempting manual zip extraction...', shpErr);
      const zip = await JSZip.loadAsync(arrayBuffer);
      let foundJson = false;

      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (relativePath.toLowerCase().endsWith('.geojson') || relativePath.toLowerCase().endsWith('.json')) {
          const jsonText = await zipEntry.async('text');
          geojson = JSON.parse(jsonText);
          foundJson = true;
          break;
        }
      }

      if (!foundJson) {
        throw new Error('File ZIP harus berisi file Shapefile (.shp, .dbf, .prj) atau .geojson valid.');
      }
    }
  } else if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
    const text = await file.text();
    geojson = JSON.parse(text);
  } else {
    throw new Error('Format file tidak didukung. Silakan gunakan .zip (Shapefile), .geojson, atau .json.');
  }

  // Handle single FeatureCollection or array of FeatureCollections
  const featureCollection = Array.isArray(geojson) ? geojson[0] : geojson;
  if (!featureCollection || !featureCollection.features || featureCollection.features.length === 0) {
    throw new Error('Tidak ditemukan objek geometri spasial (Polygon/Polyline) di dalam file.');
  }

  const validFeatures = featureCollection.features.filter((f: any) =>
    f.geometry && ['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString'].includes(f.geometry.type)
  );

  if (validFeatures.length === 0) {
    throw new Error('Tidak ditemukan poligon atau garis valid dalam berkas.');
  }

  const allParcels: ImportedPolygonData[] = [];

  for (let i = 0; i < validFeatures.length; i++) {
    const feature = validFeatures[i];
    const geomType = feature.geometry.type;
    const isPolygon = geomType.includes('Polygon');

    let rawCoords: number[][] = [];
    if (geomType === 'Polygon') {
      rawCoords = feature.geometry.coordinates[0];
    } else if (geomType === 'MultiPolygon') {
      rawCoords = feature.geometry.coordinates[0][0];
    } else if (geomType === 'LineString') {
      rawCoords = feature.geometry.coordinates;
    } else if (geomType === 'MultiLineString') {
      rawCoords = feature.geometry.coordinates[0];
    }

    // Filter duplicate closing point
    let filteredCoords = [...rawCoords];
    if (isPolygon && filteredCoords.length > 3) {
      const first = filteredCoords[0];
      const last = filteredCoords[filteredCoords.length - 1];
      if (first[0] === last[0] && first[1] === last[1]) {
        filteredCoords.pop();
      }
    }

    // Check if coordinates are WGS84 or Projected
    let isAlreadyWgs84 = true;
    for (const [c0, c1] of filteredCoords) {
      if (Math.abs(c0) > 180 || Math.abs(c1) > 90) {
        isAlreadyWgs84 = false;
        break;
      }
    }

    let wgs84Coords: [number, number][] = [];
    let detectedCrs = isAlreadyWgs84 ? 'EPSG:4326' : activeCrs;

    if (!isAlreadyWgs84) {
      try {
        wgs84Coords = filteredCoords.map(([x, y]) => {
          const [lng, lat] = proj4(activeCrs, 'EPSG:4326', [x, y]);
          return [lng, lat];
        });
      } catch (e) {
        wgs84Coords = filteredCoords as [number, number][];
      }
    } else {
      wgs84Coords = filteredCoords as [number, number][];
    }

    // Calculate Bounds
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;

    const points: CoordinatePoint[] = wgs84Coords.map(([lng, lat], idx) => {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;

      const [xVal, yVal] = fromWgs84(lng, lat, activeCrs);

      return {
        id: `imported-p-${Date.now()}-${i}-${idx + 1}`,
        no: idx + 1,
        name: `P${idx + 1}`,
        x: Math.round(xVal * 100) / 100,
        y: Math.round(yVal * 100) / 100,
        lng: Number(lng.toFixed(6)),
        lat: Number(lat.toFixed(6)),
      };
    });

    const metrics = calculatePolygonMetrics(points);
    const rawProps = feature.properties || {};
    const parcelName =
      rawProps.NAMA || rawProps.Nama || rawProps.NAME || rawProps.NIB || `${baseName}_Bidang_${i + 1}`;

    const properties: DigitasiProperty[] = [
      {
        id: `p-id-${i}`,
        key: 'ID',
        value: String(rawProps.ID || rawProps.id || rawProps.OBJECTID || `ID-${Date.now().toString().slice(-6)}-${i + 1}`),
      },
    ];

    Object.entries(rawProps).forEach(([k, v]) => {
      const upperKey = k.toUpperCase().replace(/[^a-zA-Z0-9_]/g, '');
      if (!['ID', 'OBJECTID', 'FID', 'GEOMETRY', 'SHAPE'].includes(upperKey) && v !== null && v !== undefined) {
        properties.push({
          id: `prop-${i}-${k}`,
          key: upperKey.substring(0, 15),
          value: String(v),
          type: typeof v === 'number' ? 'number' : 'text',
        });
      }
    });

    allParcels.push({
      id: `parcel-${i + 1}`,
      name: parcelName,
      mode: isPolygon ? 'polygon' : 'polyline',
      points,
      properties,
      detectedCrs,
      areaM2: metrics.areaM2,
      areaHa: metrics.areaHa,
      perimeterM: metrics.perimeterM,
      bounds: [minLng, minLat, maxLng, maxLat],
    });
  }

  return {
    mainParcel: allParcels[0],
    allParcels,
  };
}
