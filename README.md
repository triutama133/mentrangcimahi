# 🗺️ MENTRANG CIMAHI - Melek Informasi Tata Ruang Kota Cimahi

Aplikasi WebGIS Geoportal modern berbasis **Next.js (React + TypeScript + Tailwind CSS)** yang siap dideploy di **Vercel**, dirancang untuk visualisasi, analisis spasial mandiri, serta pembuatan data Shapefile geospasial di Kota Cimahi.

---

## 🌟 Fitur Utama

### 1. 🗺️ Peta WebGIS Interaktif (MapLibre GL GPU Accelerated)
- Visualisasi layer resmi dengan palet warna sesuai file **SLD (Styled Layer Descriptor)**:
  - **RTRW Kota Cimahi 2024–2044 (Perda No. 4 Tahun 2024)**: Pola Ruang (Kawasan Budidaya & Kawasan Lindung - 22 kategori zona).
  - **Zonasi Kawasan Bandung Utara / KBU (Perda Jabar No. 2 Tahun 2016)**: Zona B1, B2, B3, B4, B5, L1, L2.
  - **Lahan Sawah Dilindungi / LSD (Kepmen ATR/BPN & Berita Acara Walikota 2022)**: Status kesesuaian & rekomendasi teknis.
  - **Lahan Baku Sawah / LBS**: Sawah irigasi, non-irigasi, tadah hujan.
  - **Kawasan Strategis Kota**: Kepentingan ekonomi, lingkungan hidup, dan sosial budaya.
  - **Batas Administrasi Kelurahan**: 15 Kelurahan di 3 Kecamatan.
- Kontrol layer dengan **Slider Opacity (0–100%)** dan legenda dinamis.
- Pilihan Basemap: **Google Satellite Hybrid**, Carto Positron Light, Dark Matter, OpenStreetMap, Topografi.
- Alat Ukur Jarak (m/km) dan Luas Bidang Tanah ($m^2$/Ha).

### 2. 🛠️ Digitasi Peta ala BHUMI ATR/BPN (Fitur Unggulan)
- Gambar poligon atau garis langsung di atas peta; klik untuk menambah titik, klik 2x untuk menyelesaikan bentuk secara otomatis.
- Dukungan berbagai Sistem Koordinat (CRS) untuk input/ekspor titik:
  - **WGS 84 (EPSG:4326)**: Lat/Long Decimal Degrees.
  - **UTM Zone 48S (EPSG:32748)** & Zona UTM se-Indonesia.
  - **DGN95 / Indonesia TM-3° BPN Zona 48.2 (EPSG:23888)** & seluruh zona TM-3.
  - **WGS 1984 Web Mercator (Auxiliary Sphere) (EPSG:3857)**.
  - **Hasil digitasi tersimpan otomatis** (cache browser) dalam daftar di panel Digitasi — dapat **ditambah, diedit** (geser titik langsung di peta), **atau dihapus** kapan saja.
- Luas ditampilkan dalam **m² presisi 3 desimal**, lengkap dengan atribut bidang yang dapat disesuaikan.
- Ekspor **ESRI Shapefile (.zip)** lengkap dengan `.shp`, `.shx`, `.dbf`, `.prj`, `.cpg` untuk tiap hasil digitasi.

### 3. 🔍 Cek Tata Ruang Mandiri (Point Spatial Screening)
- Cukup klik titik di peta atau masukkan koordinat.
- Sistem secara instan memeriksa: Pola Ruang RTRW, Zonasi KBU (+ KDB, KLB, KDH), Status LSD (+ Rekomendasi), Status LBS, Kelurahan & Kecamatan.
- Cetak / Simpan resume kesesuaian spasial dalam format PDF.

### 4. 📊 Dashboard Analitik & Statistik
- Diagram distribusi luas Pola Ruang terbesar (Hektar).
- Grafik proporsi zonasi KBU dan status kesesuaian LSD.
- Rincian tabel per Kecamatan (Cimahi Selatan, Cimahi Tengah, Cimahi Utara).

### 5. 📑 Regulasi
- Rujukan hukum Perda 4/2024, Perda 2/2016, dan Kepmen LSD, lengkap dengan ketentuan diperbolehkan/bersyarat/dilarang per zona Pola Ruang & KBU.

---

## 🚀 Cara Menjalankan Aplikasi Secara Lokal

1. **Install Dependensi:**
   ```bash
   npm install
   ```

2. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser.

3. **Build untuk Produksi:**
   ```bash
   npm run build
   npm run start
   ```

---

## ☁️ Cara Deploy ke Vercel

Proyek ini telah dikonfigurasi dan dioptimasi penuh untuk Vercel:
1. Hubungkan repositori GitHub ke akun [Vercel](https://vercel.com).
2. Framework Preset: **Next.js**.
3. Klik **Deploy** — Vercel akan otomatis menjalankan `npm run build` dan mendistribusikannya ke Global Edge Network.

---

## 📂 Struktur Direktori

```
Cimahi Simentrang/
├── public/
│   └── data/                       # GeoJSON teroptimasi & summary statistik
│       ├── rtrw_pola_ruang.geojson
│       ├── kbu_zonasi.geojson
│       ├── lsd_cimahi.geojson
│       ├── lbs_cimahi.geojson
│       ├── kawasan_strategis.geojson
│       ├── batas_kelurahan.geojson
│       └── spatial_summary.json
├── scripts/
│   └── process_gis_data.py         # Skrip Python pemrosesan data SHP/GDB
├── src/
│   ├── app/
│   │   ├── globals.css             # MapLibre GL CSS & Tailwind styles
│   │   ├── layout.tsx
│   │   └── page.tsx                # Shell utama aplikasi
│   ├── components/
│   │   ├── analytics/              # Dashboard statistik (Recharts)
│   │   ├── map/                    # MapLibre GL, LayerPanel, Basemap, Measure, Screening
│   │   ├── regulations/            # Rujukan dasar hukum
│   │   └── shared/                 # Navbar & header
│   └── lib/
│       ├── crsDefinitions.ts       # Definisi Proj4 & CRS Parser
│       ├── layerConfig.ts          # Warna SLD resmi & metadata layer
│       ├── shapefileExport.ts      # Generator Shapefile ZIP client-side
│       ├── spatialAnalysis.ts      # Turf.js Spatial Point/Polygon Screening
│       └── types.ts                # TypeScript Interfaces
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

# mentrangcimahi
