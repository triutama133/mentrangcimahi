import { CoordinatePoint, DigitasiMode, DigitasiProperty } from './types';

export interface SavedDigitasiFeature {
  id: string;
  name: string;
  mode: DigitasiMode;
  crs: string;
  points: CoordinatePoint[];
  properties: DigitasiProperty[];
  strokeColor: string;
  fillColor: string;
  areaM2: number;
  perimeterM: number;
  savedAt: string;
}

const STORAGE_KEY = 'simentrang-digitasi-saved-v1';

// Browser-cache (localStorage) persistence for digitized features, so a saved
// bidang survives a page reload instead of living only in React state.
export function loadSavedFeatures(): SavedDigitasiFeature[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to read saved digitasi features from localStorage', e);
    return [];
  }
}

export function persistSavedFeatures(features: SavedDigitasiFeature[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
  } catch (e) {
    console.error('Failed to persist digitasi features to localStorage', e);
  }
}
