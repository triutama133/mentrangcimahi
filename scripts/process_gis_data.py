#!/usr/bin/env python3
"""
GIS Data Processor for SIMENTRANG Cimahi
Extracts, cleans, reprojects, and optimizes all spatial layers to GeoJSON.
"""

import json
import os
import geopandas as gpd
import pandas as pd
import shapely
from shapely.geometry import mapping

def round_coords(geom, precision=6):
    if geom is None or geom.is_empty:
        return geom
    geojson = mapping(geom)
    def _round(coords):
        if isinstance(coords[0], (int, float)):
            return [round(c, precision) for c in coords]
        return [_round(c) for c in coords]
    geojson['coordinates'] = _round(geojson['coordinates'])
    return shapely.geometry.shape(geojson)

def main():
    print("=== STARTING GIS DATA PROCESSING FOR CIMAHI ===")
    os.makedirs("public/data", exist_ok=True)
    
    gdb_path = "/Users/triutama/Documents/Shared VM/Peta Cimahi/Perda No 4 Thn 2024 ttg RTRW Kota Cimahi 2024-2044/3) Album Peta-20241029T051252Z-001/3) Album Peta/04 GDB/Standar Basis Data Peta RTRW Kota Cimahi 2024_klinik_15_07_2024_Pascalinsek.gdb"
    
    # 1. Batas Administrasi Kelurahan & Kecamatan
    print("\n1. Processing Batas Kelurahan & Kecamatan...")
    adm_path = "/Users/triutama/Documents/Peta Cimahi/MONITORING/MONITORING/shp 2018/adm kota cimahi.shp"
    gdf_adm = gpd.read_file(adm_path).to_crs(epsg=4326)
    gdf_adm['geometry'] = gdf_adm['geometry'].make_valid()
    
    # Clean column names and format
    gdf_adm['KECAMATAN'] = gdf_adm['KECAMATAN'].str.strip()
    gdf_adm['KELURAHAN'] = gdf_adm['KELURAHAN'].str.strip()
    gdf_adm['geometry'] = gdf_adm['geometry'].apply(lambda g: round_coords(g, 6))
    gdf_adm.to_file("public/data/batas_kelurahan.geojson", driver="GeoJSON")
    print(f"-> Saved batas_kelurahan.geojson: {len(gdf_adm)} kelurahan")
    
    cimahi_geom = shapely.make_valid(gdf_adm.union_all())
    
    # 2. RTRW 2024-2044 Pola Ruang from GDB
    print("\n2. Processing RTRW 2024-2044 Pola Ruang from GDB...")
    gdf_rtrw = gpd.read_file(gdb_path, layer="_3277_25KT_AR_PR_KOTACIMAHI_2024").to_crs(epsg=4326)
    gdf_rtrw['geometry'] = gdf_rtrw['geometry'].make_valid()
    
    # Filter out anomalous coordinates outside Cimahi
    gdf_rtrw = gdf_rtrw[
        (gdf_rtrw.geometry.bounds["minx"] >= 107.4) &
        (gdf_rtrw.geometry.bounds["miny"] >= -7.1) &
        (gdf_rtrw.geometry.bounds["maxx"] <= 107.7) &
        (gdf_rtrw.geometry.bounds["maxy"] <= -6.7)
    ].copy()
    
    # Select important columns
    keep_cols_rtrw = ['NAMOBJ', 'ORDE01', 'ORDE02', 'ORDE03', 'ORDE04', 'KODKWS', 'JNSRPR', 'WADMPR', 'WADMKK', 'WADMKC', 'LUASHA', 'geometry']
    avail_cols_rtrw = [c for c in keep_cols_rtrw if c in gdf_rtrw.columns]
    gdf_rtrw = gdf_rtrw[avail_cols_rtrw].copy()
    gdf_rtrw['geometry'] = gdf_rtrw['geometry'].simplify(0.000005, preserve_topology=True)
    gdf_rtrw['geometry'] = gdf_rtrw['geometry'].apply(lambda g: round_coords(g, 6))
    gdf_rtrw.to_file("public/data/rtrw_pola_ruang.geojson", driver="GeoJSON")
    print(f"-> Saved rtrw_pola_ruang.geojson: {len(gdf_rtrw)} features")
    
    # 3. Kawasan Strategis Kota Cimahi from GDB
    print("\n3. Processing Kawasan Strategis...")
    gdf_ks = gpd.read_file(gdb_path, layer="_3277_25KT_AR_KS_KOTACIMAHI_2024").to_crs(epsg=4326)
    gdf_ks['geometry'] = gdf_ks['geometry'].make_valid()
    gdf_ks['geometry'] = gdf_ks['geometry'].apply(lambda g: round_coords(g, 6))
    gdf_ks.to_file("public/data/kawasan_strategis.geojson", driver="GeoJSON")
    print(f"-> Saved kawasan_strategis.geojson: {len(gdf_ks)} features")

    # 4. Zonasi KBU (Perda No. 2/2016)
    print("\n4. Processing Zonasi KBU...")
    kbu_path = "ZONASI PERDA 2-2016/ZONASI PERDA 2-2016/Zonasi Pemanfaatan KBU.shp"
    gdf_kbu = gpd.read_file(kbu_path).to_crs(epsg=4326)
    gdf_kbu['geometry'] = gdf_kbu['geometry'].make_valid()
    # Filter to Cimahi intersection
    gdf_kbu_c = gdf_kbu[gdf_kbu.intersects(cimahi_geom.buffer(0.005))].copy()
    gdf_kbu_c['geometry'] = gdf_kbu_c['geometry'].intersection(cimahi_geom.buffer(0.002))
    gdf_kbu_c['geometry'] = gdf_kbu_c['geometry'].simplify(0.00001, preserve_topology=True)
    gdf_kbu_c['geometry'] = gdf_kbu_c['geometry'].apply(lambda g: round_coords(g, 6))
    keep_cols_kbu = ['Zona', 'Zona_1', 'geometry']
    avail_cols_kbu = [c for c in keep_cols_kbu if c in gdf_kbu_c.columns]
    gdf_kbu_c = gdf_kbu_c[avail_cols_kbu].copy()
    gdf_kbu_c.to_file("public/data/kbu_zonasi.geojson", driver="GeoJSON")
    print(f"-> Saved kbu_zonasi.geojson: {len(gdf_kbu_c)} features")

    # 5. LBS (Lahan Baku Sawah)
    print("\n5. Processing Lahan Baku Sawah (LBS)...")
    lbs_path = "LBS Cimahi/Kota Cimahi/Kota_Cimahi.shp"
    gdf_lbs = gpd.read_file(lbs_path).to_crs(epsg=4326)
    gdf_lbs['geometry'] = gdf_lbs['geometry'].make_valid()
    gdf_lbs['geometry'] = gdf_lbs['geometry'].simplify(0.000005, preserve_topology=True)
    gdf_lbs['geometry'] = gdf_lbs['geometry'].apply(lambda g: round_coords(g, 6))
    keep_cols_lbs = ['NAMOBJ', 'JSWH', 'CTKSWH', 'LUASHA', 'WADMKK', 'geometry']
    avail_cols_lbs = [c for c in keep_cols_lbs if c in gdf_lbs.columns]
    gdf_lbs = gdf_lbs[avail_cols_lbs].copy()
    gdf_lbs.to_file("public/data/lbs_cimahi.geojson", driver="GeoJSON")
    print(f"-> Saved lbs_cimahi.geojson: {len(gdf_lbs)} features")

    # 6. LSD (Lahan Sawah Dilindungi)
    print("\n6. Processing Lahan Sawah Dilindungi (LSD)...")
    lsd_path = "LSD_REVISI/VA_CIMAHI_02112022.shp"
    gdf_lsd = gpd.read_file(lsd_path).to_crs(epsg=4326)
    gdf_lsd['geometry'] = gdf_lsd['geometry'].make_valid()
    gdf_lsd['geometry'] = gdf_lsd['geometry'].simplify(0.000005, preserve_topology=True)
    gdf_lsd['geometry'] = gdf_lsd['geometry'].apply(lambda g: round_coords(g, 6))
    keep_cols_lsd = ['LUAS', 'DI_PUPR', 'NAMOBJ', 'Kesesuaian', 'HASIL', 'geometry']
    avail_cols_lsd = [c for c in keep_cols_lsd if c in gdf_lsd.columns]
    gdf_lsd = gdf_lsd[avail_cols_lsd].copy()
    gdf_lsd.to_file("public/data/lsd_cimahi.geojson", driver="GeoJSON")
    print(f"-> Saved lsd_cimahi.geojson: {len(gdf_lsd)} features")

    # 7. Generate Pre-calculated Spatial Summary
    print("\n7. Generating Pre-calculated Spatial Summary JSON...")
    
    # Calculate area in hectares using projected UTM 48S
    gdf_rtrw_utm = gdf_rtrw.to_crs(epsg=32748)
    gdf_rtrw_utm['area_ha'] = gdf_rtrw_utm.geometry.area / 10000.0
    rtrw_summary = gdf_rtrw_utm.groupby('NAMOBJ')['area_ha'].agg(['count', 'sum']).reset_index()
    rtrw_summary.columns = ['namobj', 'count', 'area_ha']
    rtrw_summary['area_ha'] = rtrw_summary['area_ha'].round(2)
    rtrw_summary = rtrw_summary.sort_values(by='area_ha', ascending=False).to_dict(orient='records')
    
    rtrw_by_kec = gdf_rtrw_utm.groupby(['WADMKC', 'NAMOBJ'])['area_ha'].sum().reset_index()
    rtrw_by_kec['area_ha'] = rtrw_by_kec['area_ha'].round(2)
    rtrw_by_kec_dict = {}
    for kec, group in rtrw_by_kec.groupby('WADMKC'):
        rtrw_by_kec_dict[kec] = group[['NAMOBJ', 'area_ha']].sort_values(by='area_ha', ascending=False).to_dict(orient='records')
    
    gdf_kbu_utm = gdf_kbu_c.to_crs(epsg=32748)
    gdf_kbu_utm['area_ha'] = gdf_kbu_utm.geometry.area / 10000.0
    kbu_summary = gdf_kbu_utm.groupby('Zona')['area_ha'].agg(['count', 'sum']).reset_index()
    kbu_summary.columns = ['zona', 'count', 'area_ha']
    kbu_summary['area_ha'] = kbu_summary['area_ha'].round(2)
    kbu_summary = kbu_summary.sort_values(by='area_ha', ascending=False).to_dict(orient='records')
    
    gdf_lbs_utm = gdf_lbs.to_crs(epsg=32748)
    gdf_lbs_utm['area_ha'] = gdf_lbs_utm.geometry.area / 10000.0
    lbs_summary = gdf_lbs_utm.groupby('JSWH')['area_ha'].agg(['count', 'sum']).reset_index()
    lbs_summary.columns = ['jenis_sawah', 'count', 'area_ha']
    lbs_summary['area_ha'] = lbs_summary['area_ha'].round(2)
    lbs_summary = lbs_summary.to_dict(orient='records')
    
    gdf_lsd_utm = gdf_lsd.to_crs(epsg=32748)
    gdf_lsd_utm['area_ha'] = gdf_lsd_utm.geometry.area / 10000.0
    lsd_kesesuaian_summary = gdf_lsd_utm.groupby('Kesesuaian')['area_ha'].agg(['count', 'sum']).reset_index()
    lsd_kesesuaian_summary.columns = ['kesesuaian', 'count', 'area_ha']
    lsd_kesesuaian_summary['area_ha'] = lsd_kesesuaian_summary['area_ha'].round(2)
    lsd_kesesuaian_summary = lsd_kesesuaian_summary.to_dict(orient='records')
    
    lsd_hasil_summary = gdf_lsd_utm.groupby('HASIL')['area_ha'].agg(['count', 'sum']).reset_index()
    lsd_hasil_summary.columns = ['hasil', 'count', 'area_ha']
    lsd_hasil_summary['area_ha'] = lsd_hasil_summary['area_ha'].round(2)
    lsd_hasil_summary = lsd_hasil_summary.sort_values(by='area_ha', ascending=False).to_dict(orient='records')
    
    # Kelurahan list with center and bounding box
    kelurahan_list = []
    for idx, row in gdf_adm.iterrows():
        b = row.geometry.bounds
        c = row.geometry.centroid
        kelurahan_list.append({
            "kelurahan": row['KELURAHAN'],
            "kecamatan": row['KECAMATAN'],
            "center": [round(c.x, 6), round(c.y, 6)],
            "bounds": [round(b[0], 6), round(b[1], 6), round(b[2], 6), round(b[3], 6)]
        })
    
    city_bounds = [round(b, 6) for b in gdf_adm.total_bounds]
    city_center = [round(gdf_adm.union_all().centroid.x, 6), round(gdf_adm.union_all().centroid.y, 6)]
    
    total_area_ha = round(gdf_adm.to_crs(epsg=32748).geometry.area.sum() / 10000.0, 2)
    
    summary_data = {
        "city_name": "Kota Cimahi",
        "province": "Jawa Barat",
        "total_area_ha": total_area_ha,
        "city_center": city_center,
        "city_bounds": city_bounds,
        "kelurahan_list": kelurahan_list,
        "rtrw": {
            "title": "RTRW Kota Cimahi 2024-2044 (Perda No. 4/2024)",
            "total_features": len(gdf_rtrw),
            "pola_ruang": rtrw_summary,
            "by_kecamatan": rtrw_by_kec_dict
        },
        "kbu": {
            "title": "Zonasi KBU (Perda No. 2/2016)",
            "total_features": len(gdf_kbu_c),
            "zonasi": kbu_summary
        },
        "lbs": {
            "title": "Lahan Baku Sawah (LBS)",
            "total_features": len(gdf_lbs),
            "total_area_ha": round(gdf_lbs_utm['area_ha'].sum(), 2),
            "by_type": lbs_summary
        },
        "lsd": {
            "title": "Lahan Sawah Dilindungi (LSD)",
            "total_features": len(gdf_lsd),
            "total_area_ha": round(gdf_lsd_utm['area_ha'].sum(), 2),
            "by_kesesuaian": lsd_kesesuaian_summary,
            "by_hasil": lsd_hasil_summary
        }
    }
    
    with open("public/data/spatial_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary_data, f, ensure_ascii=False, indent=2)
    print("-> Saved spatial_summary.json")
    
    print("\n=== DATA PROCESSING COMPLETED SUCCESSFULLY! ===")
    for f in sorted(os.listdir("public/data")):
        size_kb = os.path.getsize(os.path.join("public/data", f)) / 1024
        print(f"  {f}: {size_kb:.1f} KB")

if __name__ == "__main__":
    main()

