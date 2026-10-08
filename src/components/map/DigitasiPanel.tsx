'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Hexagon,
  Spline,
  Trash2,
  Edit3,
  Check,
  Download,
  Upload,
  RotateCcw,
  Globe2,
  Layers,
  FileCode2,
  FileSpreadsheet,
  HelpCircle,
  X,
  Search,
  CheckCircle,
  Compass,
  FileBox,
  Save,
  FolderOpen,
  ArrowLeft,
} from 'lucide-react';
import { DigitasiMode, DigitasiProperty, CoordinatePoint } from '@/lib/types';
import { CRS_LIST, fromWgs84 } from '@/lib/crsDefinitions';
import { calculatePolygonMetrics } from '@/lib/spatialAnalysis';
import { generateShapefileZip, generateKml, generateGeoJson, generateCsv, generateDxf } from '@/lib/shapefileExport';
import { parseImportedFile, ImportedPolygonData } from '@/lib/shapefileImport';
import { SavedDigitasiFeature, loadSavedFeatures, persistSavedFeatures } from '@/lib/digitasiStorage';

interface DigitasiPanelProps {
  digitasiMode: DigitasiMode;
  setDigitasiMode: (mode: DigitasiMode) => void;
  layerName: string;
  setLayerName: (name: string) => void;
  selectedCrs: string;
  setSelectedCrs: (crs: string) => void;
  points: CoordinatePoint[];
  setPoints: React.Dispatch<React.SetStateAction<CoordinatePoint[]>>;
  properties: DigitasiProperty[];
  setProperties: React.Dispatch<React.SetStateAction<DigitasiProperty[]>>;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  isFinished: boolean;
  onFinishDrawing: () => void;
  onResetDrawing: () => void;
  onCheckKajianTataRuang: () => void;
  onImportSuccess?: (bounds: [number, number, number, number]) => void;
  onBackToList: () => void;
  onClose: () => void;
}

export const DigitasiPanel: React.FC<DigitasiPanelProps> = ({
  digitasiMode,
  setDigitasiMode,
  layerName,
  setLayerName,
  selectedCrs,
  setSelectedCrs,
  points,
  setPoints,
  properties,
  setProperties,
  strokeColor,
  setStrokeColor,
  fillColor,
  setFillColor,
  isFinished,
  onFinishDrawing,
  onResetDrawing,
  onCheckKajianTataRuang,
  onImportSuccess,
  onBackToList,
  onClose,
}) => {
  const [isEditingProperty, setIsEditingProperty] = useState<boolean>(false);
  const [newColumnKey, setNewColumnKey] = useState<string>('');
  const [newColumnVal, setNewColumnVal] = useState<string>('');
  const [showAddColumnModal, setShowAddColumnModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Multi-parcel list if ZIP has multiple features
  const [importedParcels, setImportedParcels] = useState<ImportedPolygonData[]>([]);
  const [activeParcelId, setActiveParcelId] = useState<string>('');

  // Saved digitasi features, persisted to localStorage so they survive a reload
  const [savedFeatures, setSavedFeatures] = useState<SavedDigitasiFeature[]>([]);
  const [editingSavedId, setEditingSavedId] = useState<string | null>(null);

  useEffect(() => {
    setSavedFeatures(loadSavedFeatures());
  }, []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const metrics = calculatePolygonMetrics(points);

  // Points may have been drawn under a CRS the user has since changed; re-derive
  // native x/y fresh from the authoritative WGS84 lng/lat using the currently
  // selected CRS so exports never ship coordinates from a stale projection.
  const getNativePoints = (): CoordinatePoint[] =>
    points.map((p) => {
      const lng = p.lng ?? p.x;
      const lat = p.lat ?? p.y;
      const [x, y] = fromWgs84(lng, lat, selectedCrs);
      return { ...p, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
    });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Add custom property column
  const handleAddProperty = () => {
    if (!newColumnKey.trim()) return;
    const cleanKey = newColumnKey.trim().toUpperCase().replace(/[^a-zA-Z0-9_]/g, '');
    const newProp: DigitasiProperty = {
      id: `prop-${Date.now()}`,
      key: cleanKey,
      value: newColumnVal,
      type: 'text',
    };
    setProperties((prev) => [...prev, newProp]);
    setNewColumnKey('');
    setNewColumnVal('');
    setShowAddColumnModal(false);
  };

  // Update property value
  const handleUpdateProperty = (id: string, value: string) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, value } : p))
    );
  };

  // Delete property
  const handleDeleteProperty = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  // Compile all properties into dictionary
  const getPropertiesDict = () => {
    const dict: Record<string, string | number> = {
      stroke: strokeColor,
      fill: fillColor,
      LUAS_M2: metrics.areaM2,
      LUAS_HA: metrics.areaHa,
      PANJANG_M: metrics.perimeterM,
      CRS: selectedCrs,
    };
    properties.forEach((p) => {
      dict[p.key] = p.value;
    });
    return dict;
  };

  // Handle File Import (Shapefile ZIP, GeoJSON, KML)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const result = await parseImportedFile(file, selectedCrs);
      setImportedParcels(result.allParcels);
      setActiveParcelId(result.mainParcel.id);

      setLayerName(result.mainParcel.name);
      setDigitasiMode(result.mainParcel.mode);
      setPoints(result.mainParcel.points);
      setProperties(result.mainParcel.properties);

      showToast(
        `Berhasil mengimpor ${result.allParcels.length} bidang persil (${result.mainParcel.points.length} titik)!`
      );

      if (onImportSuccess && result.mainParcel.bounds) {
        onImportSuccess(result.mainParcel.bounds);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      showToast(err.message || 'Gagal mengimpor file.', 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Switch between multiple imported parcels
  const handleSelectParcel = (parcel: ImportedPolygonData) => {
    setActiveParcelId(parcel.id);
    setLayerName(parcel.name);
    setDigitasiMode(parcel.mode);
    setPoints(parcel.points);
    setProperties(parcel.properties);
    if (onImportSuccess && parcel.bounds) {
      onImportSuccess(parcel.bounds);
    }
  };

  // Save current editor state into the persisted saved-features list
  const handleSaveToList = () => {
    if (points.length < (digitasiMode === 'polyline' ? 2 : 3)) {
      showToast('Titik digitasi belum lengkap untuk disimpan.', 'error');
      return;
    }
    const id = editingSavedId || `feat-${Date.now()}`;
    const feature: SavedDigitasiFeature = {
      id,
      name: layerName || 'Digitasi Tanpa Nama',
      mode: digitasiMode,
      crs: selectedCrs,
      points,
      properties,
      strokeColor,
      fillColor,
      areaM2: metrics.areaM2,
      perimeterM: metrics.perimeterM,
      savedAt: new Date().toISOString(),
    };
    setSavedFeatures((prev) => {
      const next = editingSavedId ? prev.map((f) => (f.id === id ? feature : f)) : [...prev, feature];
      persistSavedFeatures(next);
      return next;
    });
    setEditingSavedId(id);
    showToast(editingSavedId ? 'Perubahan tersimpan di daftar.' : 'Bidang disimpan ke daftar tersimpan.');
  };

  // Load a saved feature back into the editor
  const handleLoadSaved = (feature: SavedDigitasiFeature) => {
    setEditingSavedId(feature.id);
    setLayerName(feature.name);
    setDigitasiMode(feature.mode);
    setSelectedCrs(feature.crs);
    setPoints(feature.points);
    setProperties(feature.properties);
    setStrokeColor(feature.strokeColor);
    setFillColor(feature.fillColor);

    if (onImportSuccess && feature.points.length > 0) {
      const lngs = feature.points.map((p) => p.lng ?? p.x);
      const lats = feature.points.map((p) => p.lat ?? p.y);
      onImportSuccess([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]);
    }
  };

  // Remove a saved feature from the list
  const handleDeleteSaved = (id: string) => {
    setSavedFeatures((prev) => {
      const next = prev.filter((f) => f.id !== id);
      persistSavedFeatures(next);
      return next;
    });
    if (editingSavedId === id) setEditingSavedId(null);
    showToast('Dihapus dari daftar tersimpan.');
  };

  // Start digitizing a fresh feature from the landing (saved-list) view
  const handleStartNew = (mode: DigitasiMode) => {
    setEditingSavedId(null);
    setLayerName('');
    setProperties([]);
    setImportedParcels([]);
    setActiveParcelId('');
    setDigitasiMode(mode);
  };

  // Leave the editor and return to the landing (saved-list) view
  const handleBackToList = () => {
    setEditingSavedId(null);
    setLayerName('');
    setProperties([]);
    setImportedParcels([]);
    setActiveParcelId('');
    onBackToList();
  };

  // Export handlers
  const handleExportShapefile = async () => {
    if (points.length < (digitasiMode === 'polyline' ? 2 : 3)) {
      showToast('Titik digitasi belum lengkap untuk membuat Shapefile.', 'error');
      return;
    }
    try {
      setIsExporting(true);
      const zipBlob = await generateShapefileZip({
        polygonName: layerName || 'digitasi_cimahi',
        crsCode: selectedCrs,
        points: getNativePoints(),
        mode: digitasiMode === 'polyline' ? 'polyline' : 'polygon',
        areaM2: metrics.areaM2,
        areaHa: metrics.areaHa,
        perimeterM: metrics.perimeterM,
        useNativeCoordinates: true,
        customProperties: getPropertiesDict(),
      });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${layerName || 'digitasi'}_${selectedCrs.replace(':', '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Shapefile (.zip) berhasil diunduh!');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat Shapefile.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDxf = () => {
    if (points.length < (digitasiMode === 'polyline' ? 2 : 3)) return;
    const dxf = generateDxf({
      polygonName: layerName || 'digitasi_cimahi',
      crsCode: selectedCrs,
      points: getNativePoints(),
      mode: digitasiMode === 'polyline' ? 'polyline' : 'polygon',
      areaM2: metrics.areaM2,
      perimeterM: metrics.perimeterM,
    });
    const blob = new Blob([dxf], { type: 'application/dxf;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layerName || 'digitasi'}_AutoCAD.dxf`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Berkas AutoCAD DXF (.dxf) berhasil diunduh!');
  };

  const handleExportKml = () => {
    if (points.length < (digitasiMode === 'polyline' ? 2 : 3)) return;
    const kml = generateKml({
      polygonName: layerName || 'digitasi_cimahi',
      crsCode: selectedCrs,
      points,
      mode: digitasiMode === 'polyline' ? 'polyline' : 'polygon',
      areaHa: metrics.areaHa,
      perimeterM: metrics.perimeterM,
      customProperties: getPropertiesDict(),
    });
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layerName || 'digitasi'}.kml`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('KML Google Earth berhasil diunduh!');
  };

  const handleExportGeoJson = () => {
    if (points.length < (digitasiMode === 'polyline' ? 2 : 3)) return;
    const geojson = generateGeoJson({
      polygonName: layerName || 'digitasi_cimahi',
      crsCode: selectedCrs,
      points,
      mode: digitasiMode === 'polyline' ? 'polyline' : 'polygon',
      areaM2: metrics.areaM2,
      areaHa: metrics.areaHa,
      perimeterM: metrics.perimeterM,
      customProperties: getPropertiesDict(),
    });
    const blob = new Blob([geojson], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layerName || 'digitasi'}.geojson`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('GeoJSON berhasil diunduh!');
  };

  const handleExportCsv = () => {
    if (points.length === 0) return;
    const csv = generateCsv({
      polygonName: layerName || 'digitasi_cimahi',
      crsCode: selectedCrs,
      points: getNativePoints(),
      customProperties: getPropertiesDict(),
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layerName || 'digitasi'}_koordinat.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Tabel CSV berhasil diunduh!');
  };

  return (
    <div className="w-80 sm:w-[400px] max-h-[88vh] flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-40 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
      
      {/* Hidden File Input for ZIP Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".zip,.geojson,.json,.kml"
        className="hidden"
      />

      {/* Header BHUMI Style */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Hexagon className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-100 tracking-wide">Digitasi</h2>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors"
        >
          <span>Tutup</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">

        {digitasiMode === 'none' ? (
          <>
            {/* Landing View: saved list first, then start-new / import */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                Daftar Tersimpan ({savedFeatures.length})
              </label>
              {savedFeatures.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-[11px] bg-slate-950/60 rounded-xl border border-dashed border-slate-800">
                  Belum ada bidang tersimpan. Mulai digitasi baru atau impor file di bawah.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {savedFeatures.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border bg-slate-900 border-slate-800 hover:bg-slate-800/80 transition-colors"
                    >
                      <button
                        onClick={() => handleLoadSaved(f)}
                        className="flex-1 min-w-0 text-left"
                        title="Muat bidang ini ke editor"
                      >
                        <span className="text-slate-100 font-semibold truncate block">{f.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {f.mode === 'polyline' ? `${f.perimeterM.toFixed(1)} m` : `${f.areaM2.toLocaleString('id-ID')} m²`}
                        </span>
                      </button>
                      <button
                        onClick={() => handleLoadSaved(f)}
                        className="p-1 text-slate-400 hover:text-emerald-400 flex-shrink-0"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(f.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 flex-shrink-0"
                        title="Hapus dari daftar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="text-xs font-bold text-slate-200 block">Mulai Baru</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStartNew('polygon')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-emerald-500 hover:text-emerald-300 text-slate-300 text-xs font-semibold transition-all"
                >
                  <Hexagon className="w-4 h-4" />
                  <span>Digitasi Polygon</span>
                </button>
                <button
                  onClick={() => handleStartNew('polyline')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-emerald-500 hover:text-emerald-300 text-slate-300 text-xs font-semibold transition-all"
                >
                  <Spline className="w-4 h-4" />
                  <span>Digitasi Polyline</span>
                </button>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs transition-colors"
                title="Unggah Shapefile ZIP (.shp, .dbf, .prj) atau GeoJSON"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isImporting ? 'Memproses...' : 'Import ZIP / SHP / GeoJSON'}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Editor View */}
            <button
              onClick={handleBackToList}
              className="text-[11px] text-slate-400 hover:text-emerald-400 font-semibold flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Daftar</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDigitasiMode('polygon')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  digitasiMode === 'polygon'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Hexagon className="w-4 h-4" />
                <span>Digitasi Polygon</span>
              </button>

              <button
                onClick={() => setDigitasiMode('polyline')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  digitasiMode === 'polyline'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Spline className="w-4 h-4" />
                <span>Digitasi Polyline</span>
              </button>
            </div>

            {/* Multi-Parcel Selector (If multiple parcels in imported ZIP) */}
            {importedParcels.length > 1 && (
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-emerald-800/40 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-emerald-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <FileBox className="w-3.5 h-3.5" />
                    Daftar Bidang Terdeteksi ({importedParcels.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Pilih Bidang</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {importedParcels.map((parcel, idx) => (
                    <button
                      key={parcel.id}
                      onClick={() => handleSelectParcel(parcel)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap border transition-all ${
                        activeParcelId === parcel.id
                          ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {parcel.name || `Bidang ${idx + 1}`} ({parcel.points.length} pt)
                    </button>
                  ))}
                </div>
              </div>
            )}

        {/* Section 2: Layer Digitasi */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <label className="text-xs font-bold text-slate-200 block">Layer Digitasi</label>
          <p className="text-[11px] text-slate-400">
            Atur nama layer digitasi untuk menyimpan hasil digitasi.
          </p>
          <input
            type="text"
            value={layerName}
            onChange={(e) => setLayerName(e.target.value)}
            placeholder="Nama Layer Dibuat Otomatis Apabila Kosong"
            className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl p-2.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <span className="text-[10px] text-slate-500 block">
            Nama Layer Dibuat Otomatis Apabila Kosong
          </span>
        </div>

        {/* Section 3: CRS Selector */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-emerald-400" /> Sistem Koordinat (CRS)
          </label>
          <select
            value={selectedCrs}
            onChange={(e) => setSelectedCrs(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl p-2.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
          >
            {CRS_LIST.map((crs) => (
              <option key={crs.code} value={crs.code}>
                {crs.name}
              </option>
            ))}
          </select>
        </div>

        {/* Section 4: Data Property (Atribut DBF) */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200">Data Property</label>
            <button
              onClick={() => setIsEditingProperty(!isEditingProperty)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold transition-colors flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditingProperty ? 'Selesai Edit' : 'Edit Properti'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Klik gambar digitasi pada peta untuk menampilkan ID dan menambahkan isi value/atribut masing-masing. Klik <b>Edit Properti</b> lalu klik tombol <b>(+)</b> pada Tabel untuk menambahkan kolom baru dan nilai.
          </p>

          {/* Properties Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="p-2 border-b border-slate-800 w-8 text-center">
                    {isEditingProperty ? (
                      <button
                        onClick={() => setShowAddColumnModal(true)}
                        className="w-5 h-5 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold"
                        title="Tambah Kolom Atribut Baru"
                      >
                        +
                      </button>
                    ) : (
                      '+'
                    )}
                  </th>
                  <th className="p-2 border-b border-slate-800">Nama Kolom</th>
                  <th className="p-2 border-b border-slate-800">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {/* ID row */}
                <tr>
                  <td className="p-2 text-center text-slate-500"></td>
                  <td className="p-2 text-slate-400 font-semibold">ID</td>
                  <td className="p-2 text-slate-300 truncate max-w-[150px]">
                    {properties.find((p) => p.key === 'ID')?.value || 'auto-generated-id'}
                  </td>
                </tr>

                {/* Stroke row */}
                <tr>
                  <td className="p-2 text-center text-slate-500"></td>
                  <td className="p-2 text-slate-400 font-semibold">stroke</td>
                  <td className="p-2 flex items-center gap-2">
                    <input
                      type="color"
                      value={strokeColor}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
                    />
                    <span className="text-slate-300 font-mono">{strokeColor}</span>
                  </td>
                </tr>

                {/* Fill row */}
                {digitasiMode === 'polygon' && (
                  <tr>
                    <td className="p-2 text-center text-slate-500"></td>
                    <td className="p-2 text-slate-400 font-semibold">fill</td>
                    <td className="p-2 flex items-center gap-2">
                      <input
                        type="color"
                        value={fillColor}
                        onChange={(e) => setFillColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
                      />
                      <span className="text-slate-300 font-mono">{fillColor}</span>
                    </td>
                  </tr>
                )}

                {/* Dynamic User Columns */}
                {properties
                  .filter((p) => p.key !== 'ID')
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/60">
                      <td className="p-2 text-center">
                        {isEditingProperty && (
                          <button
                            onClick={() => handleDeleteProperty(p.id)}
                            className="text-rose-400 hover:text-rose-300 p-0.5"
                            title="Hapus Kolom"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                      <td className="p-2 text-slate-300 font-semibold">{p.key}</td>
                      <td className="p-2">
                        {isEditingProperty ? (
                          <input
                            type="text"
                            value={p.value}
                            onChange={(e) => handleUpdateProperty(p.id, e.target.value)}
                            className="w-full bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                          />
                        ) : (
                          <span className="text-slate-300">{p.value || '-'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Add Column Popup Form */}
          {showAddColumnModal && (
            <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/50 space-y-2 animate-in fade-in">
              <span className="text-[11px] font-bold text-emerald-400 block">
                Tambah Kolom Atribut Baru
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nama Kolom (e.g. NIB)"
                  value={newColumnKey}
                  onChange={(e) => setNewColumnKey(e.target.value)}
                  className="bg-slate-900 text-slate-200 text-xs p-1.5 rounded border border-slate-700 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Nilai Default"
                  value={newColumnVal}
                  onChange={(e) => setNewColumnVal(e.target.value)}
                  className="bg-slate-900 text-slate-200 text-xs p-1.5 rounded border border-slate-700 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowAddColumnModal(false)}
                  className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-[10px]"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddProperty}
                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px]"
                >
                  Simpan Kolom
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Instruction Guide Box (Ala BHUMI) */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-[11px]">
          <span className="font-bold text-slate-200 block">
            Digitasi {digitasiMode === 'polyline' ? 'Polyline' : 'Polygon'}
          </span>
          <p className="text-slate-400 leading-relaxed">
            <b>Klik</b> pada area peta untuk mulai, dan <b>Klik Dua Kali (atau Tekan Enter)</b> untuk selesai menggambar digitasi {digitasiMode === 'polyline' ? 'garis' : 'polygon'}.
          </p>
          <p className="text-slate-400 leading-relaxed">
            <b>Klik dan Tahan</b> untuk menggeser peta saat melakukan digitasi.
          </p>
          <p className="text-slate-400 leading-relaxed">
            <b>Klik Reset</b> untuk mengulang seluruh proses. <b>Klik Tambah</b> untuk membuat poligon baru dalam satu digitasi.
          </p>

          {/* Live Dimension Result Box */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            {digitasiMode === 'polygon' && (
              <div>
                <span className="text-slate-400">Luas:</span>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {metrics.areaM2.toLocaleString('id-ID')} m²{' '}
                  <span className="text-xs font-normal text-slate-400">
                    ({metrics.areaHa.toFixed(4)} Ha)
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block italic">
                  ℹ️ Luas Digitasi dihitung berdasarkan polygon Anda
                </span>
              </div>
            )}

            <div>
              <span className="text-slate-400">
                {digitasiMode === 'polygon' ? 'Keliling:' : 'Panjang Garis:'}
              </span>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                {metrics.perimeterM.toFixed(2)} m{' '}
                <span className="text-xs font-normal text-slate-400">
                  ({(metrics.perimeterM / 1000).toFixed(3)} km)
                </span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono pt-1">
              Jumlah Titik: <b className="text-slate-200">{points.length} Titik</b>
            </div>
          </div>
        </div>

        {/* Section: Automated Spatial Screening Button for Polygon */}
        {points.length >= 3 && (
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-700/50 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-emerald-300">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                Telaah Tata Ruang PKKPR
              </span>
              <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded-full font-mono text-emerald-300 border border-emerald-700">
                1-Klik Analisis
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Analisis persentase irisan geometris sebenarnya terhadap RTRW 2024–2044, KBU, LSD, dan LBS Kota Cimahi.
            </p>
            <button
              onClick={onCheckKajianTataRuang}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all border border-emerald-400/30"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cek Kesesuaian Tata Ruang Bidang Ini</span>
            </button>
          </div>
        )}

        {/* Notification Alert */}
        {notification && (
          <div
            className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                : 'bg-rose-950/80 border-rose-700 text-rose-300'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            ) : (
              <X className="w-4 h-4 flex-shrink-0 text-rose-400" />
            )}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Section 6: Action Buttons (Reset & Tambah / Selesai) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onResetDrawing}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>

          <button
            onClick={onFinishDrawing}
            disabled={points.length < (digitasiMode === 'polyline' ? 2 : 3)}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-900/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isFinished ? 'Selesai' : 'Kunci Bidang (Enter)'}</span>
          </button>
        </div>

        <button
          onClick={handleSaveToList}
          disabled={points.length < (digitasiMode === 'polyline' ? 2 : 3)}
          className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{editingSavedId ? 'Simpan Perubahan ke Daftar' : 'Simpan ke Daftar Tersimpan'}</span>
        </button>

        {/* Section 7: Export Shapefile, DXF, Multi-Format */}
        <div className="space-y-2 pt-3 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-200 block">Ekspor Hasil Digitasi (Pilih Format)</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportShapefile}
              disabled={points.length < (digitasiMode === 'polyline' ? 2 : 3) || isExporting}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-all shadow-md shadow-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Shapefile (.zip)</span>
            </button>

            <button
              onClick={handleExportDxf}
              disabled={points.length < (digitasiMode === 'polyline' ? 2 : 3)}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Unduh format CAD DXF untuk AutoCAD / Civil 3D"
            >
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span>AutoCAD (.dxf)</span>
            </button>

            <button
              onClick={handleExportKml}
              disabled={points.length < (digitasiMode === 'polyline' ? 2 : 3)}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Globe2 className="w-3.5 h-3.5 text-slate-400" />
              <span>KML (Earth)</span>
            </button>

            <button
              onClick={handleExportGeoJson}
              disabled={points.length < (digitasiMode === 'polyline' ? 2 : 3)}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>GeoJSON</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={points.length === 0}
              className="col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span>Tabel Koordinat (CSV)</span>
            </button>
          </div>
        </div>
          </>
        )}

      </div>

    </div>
  );
};
