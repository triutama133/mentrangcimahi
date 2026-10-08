import JSZip from 'jszip';
import { CoordinatePoint } from './types';
import { toDms } from './crsDefinitions';

// WKT string dictionary for PRJ files
const PRJ_WKT: Record<string, string> = {
  'EPSG:4326':
    'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]',
  'EPSG:32748':
    'PROJCS["WGS_1984_UTM_Zone_48S",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",500000.0],PARAMETER["False_Northing",10000000.0],PARAMETER["Central_Meridian",105.0],PARAMETER["Scale_Factor",0.9996],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]',
  'EPSG:32749':
    'PROJCS["WGS_1984_UTM_Zone_49S",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",500000.0],PARAMETER["False_Northing",10000000.0],PARAMETER["Central_Meridian",111.0],PARAMETER["Scale_Factor",0.9996],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]',
  'EPSG:23888':
    'PROJCS["DGN95_Indonesia_TM3_Zone_48_2",GEOGCS["GCS_DGN_1995",DATUM["D_DGN_1995",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",200000.0],PARAMETER["False_Northing",1500000.0],PARAMETER["Central_Meridian",106.5],PARAMETER["Scale_Factor",0.9999],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]',
  'EPSG:23838':
    'PROJCS["DGN95_Indonesia_TM3_Zone_48_1",GEOGCS["GCS_DGN_1995",DATUM["D_DGN_1995",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",200000.0],PARAMETER["False_Northing",1500000.0],PARAMETER["Central_Meridian",103.5],PARAMETER["Scale_Factor",0.9999],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]',
  'EPSG:32747':
    'PROJCS["WGS_1984_UTM_Zone_47S",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",500000.0],PARAMETER["False_Northing",10000000.0],PARAMETER["Central_Meridian",99.0],PARAMETER["Scale_Factor",0.9996],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]',
  'EPSG:32750':
    'PROJCS["WGS_1984_UTM_Zone_50S",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",500000.0],PARAMETER["False_Northing",10000000.0],PARAMETER["Central_Meridian",117.0],PARAMETER["Scale_Factor",0.9996],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]',
  'EPSG:23889':
    'PROJCS["DGN95_Indonesia_TM3_Zone_49_1",GEOGCS["GCS_DGN_1995",DATUM["D_DGN_1995",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",200000.0],PARAMETER["False_Northing",1500000.0],PARAMETER["Central_Meridian",109.5],PARAMETER["Scale_Factor",0.9999],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]',
  'EPSG:23890':
    'PROJCS["DGN95_Indonesia_TM3_Zone_49_2",GEOGCS["GCS_DGN_1995",DATUM["D_DGN_1995",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",200000.0],PARAMETER["False_Northing",1500000.0],PARAMETER["Central_Meridian",112.5],PARAMETER["Scale_Factor",0.9999],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]',
  'EPSG:3857':
    'PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]',
};

export interface ExportOptions {
  polygonName: string;
  crsCode: string;
  points: CoordinatePoint[];
  mode?: 'polygon' | 'polyline';
  areaM2?: number;
  areaHa?: number;
  perimeterM?: number;
  useNativeCoordinates?: boolean;
  customProperties?: Record<string, string | number>;
}

// Generate Shapefile Binary Buffers (.shp, .shx, .dbf, .prj, .cpg)
export function createShapefileBuffers(options: ExportOptions) {
  const {
    polygonName,
    crsCode,
    points,
    mode = 'polygon',
    areaM2 = 0,
    areaHa = 0,
    perimeterM = 0,
    useNativeCoordinates = true,
    customProperties = {},
  } = options;

  const isPolygon = mode === 'polygon';
  const shapeType = isPolygon ? 5 : 3; // 5 = Polygon, 3 = PolyLine

  // Prepare coordinate list
  let coords = points.map((p) => (useNativeCoordinates ? [p.x, p.y] : [p.lng ?? p.x, p.lat ?? p.y]));
  if (isPolygon && coords.length > 2) {
    if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
      coords.push([...coords[0]]);
    }
  }

  // Calculate Bounding Box
  let xMin = Infinity,
    yMin = Infinity,
    xMax = -Infinity,
    yMax = -Infinity;
  coords.forEach(([x, y]) => {
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  });

  const numPoints = coords.length;
  // Size calculations
  const contentBytes = 44 + 4 + numPoints * 16;
  const contentWords = contentBytes / 2;

  // Total SHP bytes = 100 header + 8 record header + contentBytes
  const shpTotalBytes = 100 + 8 + contentBytes;
  const shpBuffer = new ArrayBuffer(shpTotalBytes);
  const shpView = new DataView(shpBuffer);

  // 1. SHP Header (100 bytes)
  shpView.setInt32(0, 9994, false); // File Code (Big Endian)
  shpView.setInt32(24, shpTotalBytes / 2, false); // File length in 16-bit words (Big Endian)
  shpView.setInt32(28, 1000, true); // Version 1000 (Little Endian)
  shpView.setInt32(32, shapeType, true); // Shape Type (5=Polygon, 3=Polyline)
  shpView.setFloat64(36, xMin, true); // Xmin
  shpView.setFloat64(44, yMin, true); // Ymin
  shpView.setFloat64(52, xMax, true); // Xmax
  shpView.setFloat64(60, yMax, true); // Ymax

  // Record Header (8 bytes)
  shpView.setInt32(100, 1, false); // Record 1 (Big Endian)
  shpView.setInt32(104, contentWords, false); // Content Length (Big Endian)

  // Record Content
  shpView.setInt32(108, shapeType, true);
  shpView.setFloat64(112, xMin, true);
  shpView.setFloat64(120, yMin, true);
  shpView.setFloat64(128, xMax, true);
  shpView.setFloat64(136, yMax, true);
  shpView.setInt32(144, 1, true); // NumParts = 1
  shpView.setInt32(148, numPoints, true); // NumPoints
  shpView.setInt32(152, 0, true); // Parts[0] = index 0

  let offset = 156;
  coords.forEach(([x, y]) => {
    shpView.setFloat64(offset, x, true);
    shpView.setFloat64(offset + 8, y, true);
    offset += 16;
  });

  // 2. SHX (Index File - 100 header + 8 bytes)
  const shxTotalBytes = 100 + 8;
  const shxBuffer = new ArrayBuffer(shxTotalBytes);
  const shxView = new DataView(shxBuffer);

  shxView.setInt32(0, 9994, false);
  shxView.setInt32(24, shxTotalBytes / 2, false);
  shxView.setInt32(28, 1000, true);
  shxView.setInt32(32, shapeType, true);
  shxView.setFloat64(36, xMin, true);
  shxView.setFloat64(44, yMin, true);
  shxView.setFloat64(52, xMax, true);
  shxView.setFloat64(60, yMax, true);

  shxView.setInt32(100, 50, false); // Offset in words: 100 bytes / 2 = 50
  shxView.setInt32(104, contentWords, false);

  // 3. DBF (dBASE III table)
  interface DbfField {
    name: string;
    type: string;
    length: number;
    decimal: number;
    value: string;
  }

  const baseFields: DbfField[] = [
    { name: 'ID', type: 'C', length: 36, decimal: 0, value: (customProperties['ID'] as string) || '1' },
    { name: 'NAMA', type: 'C', length: 50, decimal: 0, value: (polygonName || 'Digitasi').substring(0, 50) },
    { name: 'TIPE', type: 'C', length: 20, decimal: 0, value: isPolygon ? 'Polygon' : 'Polyline' },
    { name: 'LUAS_M2', type: 'N', length: 14, decimal: 2, value: areaM2.toFixed(2) },
    { name: 'LUAS_HA', type: 'N', length: 12, decimal: 4, value: areaHa.toFixed(4) },
    { name: 'PANJANG_M', type: 'N', length: 12, decimal: 2, value: perimeterM.toFixed(2) },
    { name: 'CRS', type: 'C', length: 20, decimal: 0, value: crsCode },
  ];

  // Append user custom properties
  const customFieldKeys = Object.keys(customProperties).filter(
    (k) => !['ID', 'NAMA', 'TIPE', 'LUAS_M2', 'LUAS_HA', 'PANJANG_M', 'CRS'].includes(k)
  );

  customFieldKeys.forEach((k) => {
    const cleanKey = k.replace(/[^a-zA-Z0-9_]/g, '').toUpperCase().substring(0, 10);
    const val = String(customProperties[k]);
    const isNum = !isNaN(Number(val)) && val.trim() !== '';
    if (isNum) {
      baseFields.push({
        name: cleanKey,
        type: 'N',
        length: 14,
        decimal: 2,
        value: Number(val).toFixed(2),
      });
    } else {
      baseFields.push({
        name: cleanKey,
        type: 'C',
        length: 50,
        decimal: 0,
        value: val.substring(0, 50),
      });
    }
  });

  const headerLength = 32 + baseFields.length * 32 + 1;
  const recordLength = 1 + baseFields.reduce((sum, f) => sum + f.length, 0);
  const dbfTotalBytes = headerLength + recordLength + 1;
  const dbfBuffer = new ArrayBuffer(dbfTotalBytes);
  const dbfView = new DataView(dbfBuffer);
  const dbfBytes = new Uint8Array(dbfBuffer);

  const now = new Date();
  dbfBytes[0] = 0x03; // dBASE III
  dbfBytes[1] = now.getFullYear() - 1900;
  dbfBytes[2] = now.getMonth() + 1;
  dbfBytes[3] = now.getDate();
  dbfView.setInt32(4, 1, true); // 1 record
  dbfView.setInt16(8, headerLength, true);
  dbfView.setInt16(10, recordLength, true);

  // Write Field Descriptors
  let fieldOffset = 32;
  for (const f of baseFields) {
    for (let i = 0; i < f.name.length && i < 11; i++) {
      dbfBytes[fieldOffset + i] = f.name.charCodeAt(i);
    }
    dbfBytes[fieldOffset + 11] = f.type.charCodeAt(0);
    dbfBytes[fieldOffset + 16] = f.length;
    dbfBytes[fieldOffset + 17] = f.decimal;
    fieldOffset += 32;
  }
  dbfBytes[headerLength - 1] = 0x0d; // Header terminator

  // Write Record Data
  let recOffset = headerLength;
  dbfBytes[recOffset] = 0x20; // Deletion flag: ' '
  recOffset += 1;

  for (const f of baseFields) {
    const formatted =
      f.type === 'N'
        ? f.value.padStart(f.length, ' ')
        : f.value.padEnd(f.length, ' ');
    for (let i = 0; i < f.length; i++) {
      dbfBytes[recOffset + i] = (formatted[i] || ' ').charCodeAt(0);
    }
    recOffset += f.length;
  }
  dbfBytes[dbfTotalBytes - 1] = 0x1a; // EOF

  // 4. PRJ
  const targetCrs = useNativeCoordinates ? crsCode : 'EPSG:4326';
  const prjContent = PRJ_WKT[targetCrs] || PRJ_WKT['EPSG:4326'];

  return {
    shp: shpBuffer,
    shx: shxBuffer,
    dbf: dbfBuffer,
    prj: prjContent,
    cpg: 'UTF-8',
  };
}

// Generate ESRI Shapefile ZIP Blob
export async function generateShapefileZip(options: ExportOptions): Promise<Blob> {
  const buffers = createShapefileBuffers(options);
  const zip = new JSZip();
  const baseName = (options.polygonName || 'digitasi_cimahi').replace(/[^a-zA-Z0-9_-]/g, '_');

  zip.file(`${baseName}.shp`, buffers.shp);
  zip.file(`${baseName}.shx`, buffers.shx);
  zip.file(`${baseName}.dbf`, buffers.dbf);
  zip.file(`${baseName}.prj`, buffers.prj);
  zip.file(`${baseName}.cpg`, buffers.cpg);

  return await zip.generateAsync({ type: 'blob' });
}

// Generate KML Document for Google Earth
export function generateKml(options: ExportOptions): string {
  const { polygonName, points, mode = 'polygon', areaHa = 0, perimeterM = 0, customProperties = {} } = options;
  const isPolygon = mode === 'polygon';
  const coords = points.map((p) => [p.lng ?? p.x, p.lat ?? p.y]);

  if (isPolygon && coords.length > 2) {
    coords.push([...coords[0]]);
  }

  const coordinatesStr = coords.map((c) => `${c[0]},${c[1]},0`).join(' ');

  const propRows = Object.entries(customProperties)
    .map(([k, v]) => `<tr><td><b>${k}</b></td><td>${v}</td></tr>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${polygonName || 'Digitasi_MENTRANG'}</name>
    <description>Dihasilkan melalui MENTRANG Kota Cimahi WebGIS (Digitasi Peta)</description>
    <Style id="customStyle">
      <LineStyle>
        <color>ff00aaff</color>
        <width>3</width>
      </LineStyle>
      <PolyStyle>
        <color>7f00ffaa</color>
      </PolyStyle>
    </Style>
    <Placemark>
      <name>${polygonName || 'Hasil Digitasi'}</name>
      <description><![CDATA[
        <h3>MENTRANG CIMAHI - Hasil Digitasi</h3>
        <table border="1" cellpadding="4" style="border-collapse:collapse;">
          ${isPolygon ? `<tr><td><b>Luas</b></td><td>${areaHa.toFixed(4)} Ha</td></tr>` : ''}
          <tr><td><b>Panjang/Keliling</b></td><td>${perimeterM.toFixed(2)} m</td></tr>
          <tr><td><b>Jumlah Titik</b></td><td>${points.length}</td></tr>
          ${propRows}
        </table>
      ]]></description>
      <styleUrl>#customStyle</styleUrl>
      ${
        isPolygon
          ? `<Polygon>
              <extrude>1</extrude>
              <altitudeMode>clampToGround</altitudeMode>
              <outerBoundaryIs>
                <LinearRing>
                  <coordinates>${coordinatesStr}</coordinates>
                </LinearRing>
              </outerBoundaryIs>
            </Polygon>`
          : `<LineString>
              <extrude>1</extrude>
              <altitudeMode>clampToGround</altitudeMode>
              <coordinates>${coordinatesStr}</coordinates>
            </LineString>`
      }
    </Placemark>
  </Document>
</kml>`;
}

// Generate GeoJSON FeatureCollection
export function generateGeoJson(options: ExportOptions): string {
  const {
    polygonName,
    crsCode,
    points,
    mode = 'polygon',
    areaM2 = 0,
    areaHa = 0,
    perimeterM = 0,
    customProperties = {},
  } = options;

  const isPolygon = mode === 'polygon';
  const coords = points.map((p) => [p.lng ?? p.x, p.lat ?? p.y]);

  if (isPolygon && coords.length > 2) {
    coords.push([...coords[0]]);
  }

  const featureCollection = {
    type: 'FeatureCollection',
    name: polygonName || 'digitasi_cimahi',
    features: [
      {
        type: 'Feature',
        properties: {
          id: customProperties['ID'] || '1',
          nama: polygonName || 'Hasil Digitasi',
          tipe: isPolygon ? 'Polygon' : 'Polyline',
          crs_asal: crsCode,
          luas_m2: isPolygon ? areaM2 : undefined,
          luas_ha: isPolygon ? areaHa : undefined,
          panjang_m: perimeterM,
          jumlah_titik: points.length,
          ...customProperties,
          created_at: new Date().toISOString(),
        },
        geometry: isPolygon
          ? {
              type: 'Polygon',
              coordinates: [coords],
            }
          : {
              type: 'LineString',
              coordinates: coords,
            },
      },
    ],
  };

  return JSON.stringify(featureCollection, null, 2);
}

// Generate CSV Coordinate Table
export function generateCsv(options: ExportOptions): string {
  const { points, crsCode } = options;
  const header = [
    'No',
    'Label',
    `X (${crsCode})`,
    `Y (${crsCode})`,
    'Longitude (WGS84)',
    'Latitude (WGS84)',
    'DMS Latitude',
    'DMS Longitude',
  ];
  const rows = points.map((p) => [
    p.no,
    `"${p.name}"`,
    p.x,
    p.y,
    p.lng ?? p.x,
    p.lat ?? p.y,
    `"${toDms(p.lat ?? p.y, true)}"`,
    `"${toDms(p.lng ?? p.x, false)}"`,
  ]);

  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// Generate AutoCAD DXF (.dxf) Document
export function generateDxf(options: ExportOptions): string {
  const { polygonName, crsCode, points, mode = 'polygon', areaM2 = 0 } = options;
  const isPolygon = mode === 'polygon';

  let coords = points.map((p) => [p.x, p.y]);
  if (isPolygon && coords.length > 2) {
    if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
      coords.push([...coords[0]]);
    }
  }

  const lines: string[] = [
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$ACADVER',
    '1', 'AC1009',
    '9', '$INSBASE',
    '10', '0.0',
    '20', '0.0',
    '30', '0.0',
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'TABLES',
    '0', 'TABLE',
    '2', 'LAYER',
    '70', '3',
    '0', 'LAYER',
    '2', 'BIDANG_TANAH',
    '70', '0',
    '62', '4',
    '6', 'CONTINUOUS',
    '0', 'LAYER',
    '2', 'TITIK_PATOK',
    '70', '0',
    '62', '1',
    '6', 'CONTINUOUS',
    '0', 'LAYER',
    '2', 'TEKS_INFORMASI',
    '70', '0',
    '62', '7',
    '6', 'CONTINUOUS',
    '0', 'ENDTAB',
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'ENTITIES',
  ];

  // 1. Polyline Entity for the boundary
  lines.push('0', 'POLYLINE', '8', 'BIDANG_TANAH', '66', '1', '70', isPolygon ? '1' : '0');
  coords.forEach(([x, y]) => {
    lines.push('0', 'VERTEX', '8', 'BIDANG_TANAH', '10', x.toFixed(3), '20', y.toFixed(3), '30', '0.0');
  });
  lines.push('0', 'SEQEND');

  // 2. Vertex Points & Text Labels
  points.forEach((p) => {
    lines.push(
      '0', 'POINT',
      '8', 'TITIK_PATOK',
      '10', p.x.toFixed(3),
      '20', p.y.toFixed(3),
      '30', '0.0',
      '0', 'TEXT',
      '8', 'TEKS_INFORMASI',
      '10', (p.x + 1.5).toFixed(3),
      '20', (p.y + 1.5).toFixed(3),
      '30', '0.0',
      '40', '2.5',
      '1', `${p.name} (X=${p.x.toFixed(2)}, Y=${p.y.toFixed(2)})`
    );
  });

  // 3. Information Text at centroid
  if (points.length > 0) {
    const avgX = points.reduce((s, p) => s + p.x, 0) / points.length;
    const avgY = points.reduce((s, p) => s + p.y, 0) / points.length;
    lines.push(
      '0', 'TEXT',
      '8', 'TEKS_INFORMASI',
      '10', avgX.toFixed(3),
      '20', avgY.toFixed(3),
      '30', '0.0',
      '40', '4.0',
      '1', `${polygonName || 'Bidang_Tanah'} | Luas = ${areaM2.toFixed(2)} m2 (${crsCode})`
    );
  }

  lines.push('0', 'ENDSEC', '0', 'EOF');
  return lines.join('\n');
}
