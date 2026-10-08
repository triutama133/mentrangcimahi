'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, MapPin, Navigation, Loader2, X } from 'lucide-react';
import { GeocodeResult, parseCoordinateQuery, searchPlaces } from '@/lib/geocode';

interface KelurahanEntry {
  kelurahan: string;
  kecamatan: string;
  center: [number, number];
}

interface SearchBarProps {
  kelurahanList: KelurahanEntry[];
  onSelectLocation: (center: [number, number]) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ kelurahanList, onSelectLocation }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [remoteResults, setRemoteResults] = useState<GeocodeResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = query.trim();
    if (trimmed.length < 3 || parseCoordinateQuery(trimmed)) {
      setRemoteResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      const results = await searchPlaces(trimmed, controller.signal);
      setRemoteResults(results);
      setIsLoading(false);
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const coordMatch = parseCoordinateQuery(query.trim());
  const coordResult: GeocodeResult | null = coordMatch
    ? {
        id: 'coordinate',
        label: `Koordinat: ${coordMatch[1].toFixed(6)}, ${coordMatch[0].toFixed(6)}`,
        sublabel: 'Lat, Long (WGS84) — mendukung input WGS84, UTM 48S, dan TM-3 BPN 48.2',
        center: coordMatch,
        source: 'coordinate',
      }
    : null;

  const kelurahanMatches: GeocodeResult[] =
    query.trim().length >= 2
      ? kelurahanList
          .filter((k) => k.kelurahan.toLowerCase().includes(query.trim().toLowerCase()))
          .slice(0, 5)
          .map((k) => ({
            id: `kel-${k.kelurahan}`,
            label: k.kelurahan,
            sublabel: k.kecamatan,
            center: k.center,
            source: 'kelurahan' as const,
          }))
      : [];

  const allResults = [...(coordResult ? [coordResult] : []), ...kelurahanMatches, ...remoteResults];

  const handleSelect = (result: GeocodeResult) => {
    onSelectLocation(result.center);
    setQuery('');
    setRemoteResults([]);
    setIsOpen(false);
  };

  const iconFor = (source: GeocodeResult['source']) => {
    if (source === 'coordinate') return <Navigation className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;
    return <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Cari alamat, tempat, atau koordinat (lat, long)..."
          aria-label="Cari lokasi"
          className="w-full bg-slate-800/90 text-slate-200 text-xs rounded-lg pl-9 pr-8 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {isLoading && <Loader2 className="w-3.5 h-3.5 text-emerald-400 absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin" />}
        {!isLoading && query && (
          <button
            onClick={() => {
              setQuery('');
              setRemoteResults([]);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            title="Bersihkan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 w-full min-w-[280px] bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
          {allResults.length === 0 && !isLoading && (
            <div className="p-3 text-[11px] text-slate-500 text-center">Tidak ada hasil ditemukan.</div>
          )}
          {allResults.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-slate-800/80 transition-colors border-b border-slate-800/60 last:border-b-0"
            >
              {iconFor(result.source)}
              <div className="min-w-0">
                <div className="text-xs text-slate-200 font-medium truncate">{result.label}</div>
                {result.sublabel && <div className="text-[10px] text-slate-500 truncate">{result.sublabel}</div>}
              </div>
            </button>
          ))}
          {remoteResults.length > 0 && (
            <div className="px-3 py-1.5 text-[9px] text-slate-600 border-t border-slate-800/60">
              Pencarian tempat oleh OpenStreetMap Nominatim
            </div>
          )}
        </div>
      )}
    </div>
  );
};
