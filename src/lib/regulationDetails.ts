// Detailed permitted / conditional / prohibited activities per RTRW Pola Ruang zone
// and general directives per KBU zone.
//
// Source: Peraturan Daerah Kota Cimahi No. 4 Tahun 2024 tentang RTRW Kota Cimahi
// 2024-2044 ("Ketentuan Umum Zonasi Rencana Pola Ruang", Pasal 60-72) and
// Peraturan Daerah Provinsi Jawa Barat No. 2 Tahun 2016 tentang Pengendalian KBU
// ("Arahan Umum Zona", Pasal 22-28). Content below is condensed from the enacted
// legal text (see /regulation folder) for readability - always verify against the
// original Perda for anything with legal or financial consequences.

export interface ZoneRegulationDetail {
  /** Article this is sourced from, for traceability */
  pasal: string;
  diperbolehkan: string[];
  bersyarat: string[];
  dilarang: string[];
}

export const RTRW_ZONE_REGULATIONS: Record<string, ZoneRegulationDetail> = {
  'Badan Air': {
    pasal: 'Pasal 60',
    diperbolehkan: [
      'Bangunan prasarana sumber daya air',
      'Bangunan sistem mitigasi bencana / peringatan dini',
      'Bangunan pengontrol atau pengukur debit air',
    ],
    bersyarat: [
      'Pariwisata alam yang tidak merusak ekosistem badan air',
      'Perikanan budi daya (jaring apung) sesuai daya tampung perairan',
      'Pemancangan tiang/pondasi jalan dan jembatan sesuai syarat teknis',
      'Penangkapan ikan dengan sistem tradisional',
      'Pengambilan air untuk penyediaan air bersih',
    ],
    dilarang: [
      'Mendirikan bangunan selain jaringan prasarana wilayah',
      'Mengurangi dimensi badan air',
      'Kegiatan yang berpotensi mencemari badan air dan ekosistemnya',
      'Kegiatan pertambangan',
    ],
  },
  'Kawasan Perlindungan Setempat': {
    pasal: 'Pasal 61',
    diperbolehkan: [
      'Bangunan prasarana sumber daya air',
      'Bangunan sistem mitigasi bencana / peringatan dini',
      'Instalasi telekomunikasi, listrik, air minum (rentangan kabel)',
      'RTH',
    ],
    bersyarat: [
      'Konstruksi jalan/jembatan yang mendukung sarana publik',
      'Pariwisata alam yang tidak merusak ekosistem sungai',
      'RTH dengan tanaman keras/perdu pelindung sungai',
      'Penimbunan sementara hasil galian golongan C (tidak mengganggu fungsi sungai)',
      'Bangunan yang sudah ada sebelum Perda ini berlaku',
    ],
    dilarang: [
      'Mendirikan bangunan selain jaringan prasarana kota',
      'Mengurangi dimensi tanggul',
      'Menanam tanaman selain rumput pada badan tanggul',
      'Kegiatan yang mencemari sungai atau mengurangi kualitas/luasan/kedalamannya',
      'Merusak atau menutup sumber air',
      'Menghalangi atau menutup jalur evakuasi banjir',
    ],
  },
  'Rimba Kota': {
    pasal: 'Pasal 62 ayat (2)',
    diperbolehkan: ['RTH, utilitas, rekreasi terbuka, olahraga', 'Penanaman tanaman hias/peneduh', 'Aktivitas sosial budaya'],
    bersyarat: [
      'Bangunan penunjang pariwisata dan rekreasi',
      'Tempat pedagang',
      'Papan reklame/pengumuman',
      'Jaringan transmisi (tidak mengganggu fungsi kawasan)',
    ],
    dilarang: ['Kegiatan yang mengurangi luas Rimba Kota', 'Kegiatan budi daya yang mengganggu fungsi kawasan'],
  },
  'Taman Kota': {
    pasal: 'Pasal 62 ayat (3)',
    diperbolehkan: ['Penanaman tanaman, rekreasi, dan olahraga'],
    bersyarat: [
      'Bangunan penunjang pariwisata/rekreasi dan prasarana kota',
      'Papan reklame/informasi kota',
      'Jaringan infrastruktur kota (tidak mengganggu fungsi utama & jalur evakuasi)',
    ],
    dilarang: ['Kegiatan yang mengurangi luas Taman Kota', 'Kegiatan budi daya yang mengganggu fungsinya'],
  },
  'Taman Kecamatan': {
    pasal: 'Pasal 62 ayat (4)',
    diperbolehkan: ['Penanaman tanaman, rekreasi, dan olahraga'],
    bersyarat: ['Bangunan penunjang rekreasi/prasarana kota', 'Papan reklame/informasi kota', 'Jaringan infrastruktur kota'],
    dilarang: ['Kegiatan yang mengurangi luas Taman Kecamatan', 'Kegiatan budi daya yang mengganggu fungsinya'],
  },
  'Taman Kelurahan': {
    pasal: 'Pasal 62 ayat (5)',
    diperbolehkan: ['Penanaman tanaman, rekreasi, dan olahraga'],
    bersyarat: ['Bangunan penunjang rekreasi/prasarana kota', 'Papan reklame/informasi kota', 'Jaringan infrastruktur kota'],
    dilarang: ['Kegiatan yang mengurangi luas Taman Kelurahan', 'Kegiatan budi daya yang mengganggu fungsinya'],
  },
  'Taman RW': {
    pasal: 'Pasal 62 ayat (6)',
    diperbolehkan: ['Penanaman tanaman, rekreasi, dan olahraga'],
    bersyarat: ['Bangunan penunjang rekreasi/prasarana kota', 'Papan reklame/informasi kota', 'Jaringan infrastruktur kota'],
    dilarang: ['Kegiatan yang mengurangi luas Taman RW', 'Kegiatan budi daya yang mengganggu fungsinya'],
  },
  'Pemakaman': {
    pasal: 'Pasal 62 ayat (7)',
    diperbolehkan: ['Kegiatan pemakaman dan penanaman tanaman'],
    bersyarat: ['Bangunan penunjang pemakaman', 'Papan reklame/informasi kota', 'Jaringan infrastruktur kota'],
    dilarang: ['Kegiatan budi daya yang mengganggu fungsi kawasan pemakaman'],
  },
  'Jalur Hijau': {
    pasal: 'Pasal 62 ayat (8)',
    diperbolehkan: ['Kawasan RTH dan jaringan utilitas'],
    bersyarat: [
      'Bangunan penunjang rekreasi/olahraga terbatas',
      'Papan reklame/informasi kota',
      'Jaringan infrastruktur kota',
    ],
    dilarang: ['Kegiatan yang mengurangi luas Jalur Hijau', 'Kegiatan budi daya yang mengganggu fungsinya'],
  },
  'Badan Jalan': {
    pasal: 'Pasal 63',
    diperbolehkan: ['Pemanfaatan untuk keamanan/keselamatan pengguna jalan (marka, zebra cross)'],
    bersyarat: [
      'Halte bus sesuai peraturan',
      'Parkir on-street (memperhatikan keamanan & kelancaran lalu lintas)',
      'Jalur sepeda bermarka',
      'Utilitas, kelengkapan jalan, dan reklame (tidak mengganggu fungsi jalan)',
    ],
    dilarang: [
      'Kegiatan yang menghambat lalu lintas regional di jalan Nasional/Provinsi',
      'Pemanfaatan yang mengganggu kelancaran & keselamatan lalu lintas',
      'Muatan/dimensi kendaraan melebihi ketentuan',
      'Penutupan jalan tanpa izin instansi berwenang',
    ],
  },
  'Kawasan Tanaman Pangan': {
    pasal: 'Pasal 64 ayat (2)',
    diperbolehkan: ['Peningkatan produksi/produktivitas tanaman pangan', 'Kegiatan operasional & penunjang kawasan'],
    bersyarat: [
      'Permukiman/usaha eksisting sebelum Perda ini',
      'Rumah tinggal tunggal baru (di luar Kawasan Pertanian Pangan Berkelanjutan/KP2B)',
      'Penelitian yang tidak mengganggu fungsi pertanian',
      'Perkebunan & industri pengolahan hasil pertanian',
      'Pertambangan dengan kajian keselamatan & reklamasi pasca-tambang',
      'Pariwisata yang tidak mengganggu fungsi kawasan',
    ],
    dilarang: [
      'Pengolahan tanah yang tidak memperhatikan daya dukung tanah',
      'Kegiatan yang mengganggu fungsi KP2B',
    ],
  },
  'Kawasan Hortikultura': {
    pasal: 'Pasal 64 ayat (3)',
    diperbolehkan: [
      'Pertanian tanaman pangan & hortikultura beserta prasarana penunjang',
      'Distribusi, perdagangan, dan pemasaran hasil pertanian',
      'Penelitian pertanian dan konservasi kawasan',
    ],
    bersyarat: [
      'Jaringan jalan/listrik/telekomunikasi/air minum/sanitasi',
      'Rumah tinggal petani/pemilik lahan',
      'Pariwisata alam & wisata tanpa merusak fungsi kawasan',
      'Peternakan (termasuk penggembalaan) tanpa merusak fungsi kawasan',
      'Industri kecil-menengah tanpa mencemari lingkungan',
    ],
    dilarang: [
      'Kegiatan yang merusak kesuburan tanah',
      'Pengelolaan lahan yang mengabaikan kelestarian lingkungan',
      'Alih fungsi ke lahan budi daya non-pertanian (kecuali jaringan prasarana utama)',
    ],
  },
  'Kawasan Peruntukan Pertambangan Batuan': {
    pasal: 'Pasal 65',
    diperbolehkan: ['Fasilitas pendukung pembangkit tenaga listrik', 'Jaringan telekomunikasi'],
    bersyarat: ['Sarana prasarana sumber daya air', 'Hal teknis pertambangan & energi sesuai peraturan berlaku'],
    dilarang: ['Kegiatan yang mengganggu fungsi kawasan dan merusak lingkungan'],
  },
  'Kawasan Peruntukan Industri': {
    pasal: 'Pasal 66',
    diperbolehkan: [
      'Kegiatan industri besar/sedang/kecil beserta infrastruktur dasar',
      'Sentra industri, pergudangan, jasa, SPBU penunjang industri',
      'RTH',
      'Bangunan pengolahan limbah',
    ],
    bersyarat: [
      'Industri rumah tangga/kecil/sedang (wajib pengolahan limbah)',
      'Permukiman & perdagangan pendukung industri',
      'Fasilitas sosial umum (pendidikan, kesehatan, ibadah, olahraga)',
    ],
    dilarang: [
      'Industri yang mengganggu fungsi kawasan',
      'Membuang limbah ke air permukaan atau tanah secara langsung',
      'Kegiatan yang merusak lingkungan',
    ],
  },
  'Kawasan Pariwisata': {
    pasal: 'Pasal 67',
    diperbolehkan: ['Akomodasi dan sarana prasarana pendukung pariwisata'],
    bersyarat: [
      'Budi daya pertanian',
      'Permukiman/perkantoran penunjang pariwisata (sesuai daya dukung)',
      'Bangunan komersial skala daya tarik wisata',
      'Industri rumah tangga/kecil tanpa mencemari lingkungan',
    ],
    dilarang: [
      'Kegiatan berdampak negatif terhadap lingkungan',
      'Merusak kondisi alam objek wisata alam',
      'Permukiman & industri yang tidak terkait pariwisata',
    ],
  },
  'Kawasan Infrastruktur Perkotaan': {
    pasal: 'Pasal 68 ayat (4)',
    diperbolehkan: [
      'RTH',
      'Sarana prasarana penunjang infrastruktur perkotaan',
      'Pengelolaan TPST dan TPS3R',
    ],
    bersyarat: [
      'Pertanian non-pangan & permukiman berjarak aman dari dampak pengelolaan sampah/limbah',
      'Pariwisata/edukasi berbasis pengelolaan sampah',
    ],
    dilarang: ['Kegiatan yang mengganggu fungsi kawasan pengelolaan persampahan/limbah'],
  },
  'Kawasan Fasilitas Umum dan Fasilitas Sosial': {
    pasal: 'Pasal 68 ayat (3)',
    diperbolehkan: ['RTH', 'Pendidikan, kesehatan, peribadatan, olahraga', 'Cagar budaya'],
    bersyarat: ['Sarana pejalan kaki, olahraga, parkir, kuliner, transportasi umum penunjang'],
    dilarang: ['Pemanfaatan ruang yang bertentangan dengan fungsi fasilitas umum dan sosial'],
  },
  'Kawasan Perumahan': {
    pasal: 'Pasal 68 ayat (2)',
    diperbolehkan: [
      'RTH',
      'Perumahan kepadatan sangat rendah hingga sangat tinggi',
      'Sumur resapan air',
      'Jalur/ruang evakuasi bencana',
    ],
    bersyarat: [
      'Perdagangan & jasa skala lingkungan',
      'Industri rumah tangga/kreatif non-polutif',
      'Fasilitas pendidikan, kesehatan, olahraga skala lingkungan',
      'Perumahan di kawasan rawan bencana sedang/tinggi (intensitas rendah)',
    ],
    dilarang: ['Kegiatan selain yang termasuk kategori diperbolehkan/bersyarat di atas'],
  },
  'Kawasan Perdagangan dan Jasa': {
    pasal: 'Pasal 69',
    diperbolehkan: [
      'RTH',
      'Perdagangan & jasa, perkantoran, pendidikan tinggi, kesehatan, olahraga, wisata',
      'Sarana pejalan kaki, peribadatan, parkir, transportasi umum',
    ],
    bersyarat: [
      'Perdagangan & jasa skala regional/kota/lokal',
      'Hunian',
      'Industri kecil/menengah non-polutif',
    ],
    dilarang: ['Kegiatan selain yang termasuk kategori diperbolehkan/bersyarat di atas'],
  },
  'Kawasan Perkantoran': {
    pasal: 'Pasal 70',
    diperbolehkan: ['RTH', 'Perkantoran pemerintahan, BUMD/BUMN, swasta, dan masyarakat'],
    bersyarat: ['Fasilitas umum & sosial', 'Fasilitas perdagangan & jasa'],
    dilarang: ['Kegiatan yang bertentangan/mengganggu fungsi utama kawasan perkantoran'],
  },
  'Kawasan Transportasi': {
    pasal: 'Pasal 71',
    diperbolehkan: [
      'Operasional & pengembangan kawasan transportasi (pergerakan orang/barang)',
      'Operasional angkutan penumpang',
      'RTH',
    ],
    bersyarat: ['Perdagangan & jasa', 'Pergudangan pendukung operasi transportasi'],
    dilarang: [
      'Kegiatan yang mengganggu operasional transportasi',
      'Kegiatan yang mengganggu keamanan/keselamatan lalu lintas',
      'Kegiatan yang mengganggu fungsi fasilitas utama/penunjang',
    ],
  },
  'Kawasan Pertahanan dan Keamanan': {
    pasal: 'Pasal 72',
    diperbolehkan: [
      'Di dalam kawasan: sarana prasarana jalan/jembatan, jaringan listrik/air/telekomunikasi',
      'Di sekitar kawasan: jalan/jembatan berkekuatan tinggi, jaringan utilitas, bufferzone 500 m, pertanian/perkebunan/perikanan',
    ],
    bersyarat: [
      'Kerjasama pemanfaatan sesuai peraturan perundangan',
      'Kegiatan di sekitar kawasan wajib izin dari Hankam/pejabat berwenang & tidak mengganggu fungsi pertahanan',
    ],
    dilarang: [
      'Pengembangan jaringan pipa migas, SUTET, kabel bawah tanah (di dalam kawasan)',
      'Bangunan/lokasi untuk kegiatan sabotase',
      'Kawasan industri bahan peledak & eksplorasi migas',
      'Permukiman padat penduduk di sekitar lapangan tembak',
    ],
  },
};

export interface KbuZoneDirective {
  pasal: string;
  arahan: string[];
  dilarang: string[];
}

export const KBU_ZONE_DIRECTIVES: Record<string, KbuZoneDirective> = {
  'Zona L1': {
    pasal: 'Pasal 22 (Zona L-1: Lindung Utama)',
    arahan: [
      'Diarahkan untuk konservasi air, tanah, keanekaragaman hayati, dan mencegah dampak bencana alam',
      'Kegiatan yang menjamin fungsi lindung, keutuhan kawasan & ekosistem tetap terjaga',
      'Ekowisata/wanawisata yang tidak mengganggu fungsi lindung',
      'Pengecualian: sarana vital pemerintah/kepentingan strategis negara, KDB maks. 10% dengan kajian daya dukung',
    ],
    dilarang: [
      'Mendirikan bangunan atau menambah kawasan terbangun',
      'Permohonan izin baru untuk hunian di daerah rawan longsor, koridor Sesar Lembang, atau rawan letusan gunung api',
      'Kegiatan yang merusak/mencemari lingkungan atau mengganggu ekosistem',
      'Kegiatan yang merusak kualitas air, tepi sungai, mata air, atau aliran air',
    ],
  },
  'Zona L2': {
    pasal: 'Pasal 23 (Zona L-2: Lindung Tambahan)',
    arahan: [
      'Fungsi lindung tambahan & penyangga Zona L-1; konservasi air, tanah, dan mitigasi bencana',
      'Diutamakan untuk kehutanan, perkebunan, pertanian, wisata alam/ekowisata, instalasi strategis pemerintah',
      'Permukiman perdesaan terbatas, diarahkan di kontur < 1.000 mdpl',
      'Hunian di atas 1.000 mdpl hanya untuk masyarakat asli/lokal dengan pembatasan luas',
      'Ketinggian bangunan maks. 4 lantai; KDB maks. 20% dengan ruang terbuka min. 80%',
    ],
    dilarang: [
      'Pembangunan tanpa dokumen kajian lingkungan (untuk kegiatan berdampak penting)',
      'Pembangunan di sekitar risiko bencana (khususnya Sesar Lembang) tanpa kajian mendalam',
    ],
  },
  'Zona B1': {
    pasal: 'Pasal 24 (Zona B-1: Pemanfaatan Perdesaan)',
    arahan: [
      'Pembangunan/pengembangan kawasan secara terkendali, mendukung perbaikan lingkungan',
      'Diarahkan untuk permukiman perdesaan, perumahan kepadatan rendah, wisata, pertanian, perkebunan',
      'Permukiman/perumahan baru di kontur < 1.000 mdpl',
      'KDB maks. 40% dengan ruang terbuka min. 60% (ketentuan khusus untuk lahan ≤ 90 m²)',
      'Wajib kajian lingkungan (hidrologi & mitigasi bencana) untuk setiap pembangunan',
    ],
    dilarang: [
      'Pemecahan lahan (splitsing) dari 1 sertifikat induk tanpa pertimbangan teknis instansi berwenang',
      'Pembangunan horizontal yang menambah luas kawasan terbangun secara berlebihan',
    ],
  },
  'Zona B2': {
    pasal: 'Pasal 25 (Zona B-2: Pemanfaatan Perkotaan)',
    arahan: [
      'Pembangunan/pengembangan kawasan secara terkendali, mendukung perbaikan lingkungan',
      'Diarahkan untuk permukiman perkotaan, perumahan kepadatan rendah-sedang, wisata, pertanian',
      'KDB maks. 40% dengan ruang terbuka min. 60% (ketentuan khusus untuk lahan ≤ 90 m²)',
      'Wajib kajian lingkungan (hidrologi & mitigasi bencana)',
      'Bangunan eksisting yang tak memenuhi KDB/KDH wajib rekayasa teknis atau lahan pengganti di Zona L',
    ],
    dilarang: [
      'Pemecahan lahan (splitsing) dari 1 sertifikat induk tanpa pertimbangan teknis instansi berwenang',
      'Pembangunan horizontal yang menambah luas kawasan terbangun secara berlebihan',
    ],
  },
  'Zona B3': {
    pasal: 'Pasal 26 (Zona B-3: Pemanfaatan Terbatas Perdesaan)',
    arahan: [
      'Mencegah penurunan daya dukung lingkungan perdesaan & memulihkan fungsi resapan air',
      'Diarahkan untuk kehutanan, perkebunan, pertanian, wisata alam/ekowisata, permukiman perdesaan, perumahan kepadatan rendah',
      'Permukiman/perumahan baru di kontur < 1.000 mdpl',
      'KDB maks. 30% dengan ruang terbuka min. 70% (ketentuan khusus untuk lahan ≤ 120 m²)',
      'Wajib kajian lingkungan (hidrologi, pencemaran, konservasi tanah) untuk pembangunan berdampak penting',
    ],
    dilarang: [
      'Pemecahan lahan (splitsing) dari 1 sertifikat induk tanpa pertimbangan teknis instansi berwenang',
      'Pembangunan horizontal yang menambah luas kawasan terbangun secara berlebihan',
    ],
  },
  'Zona B4': {
    pasal: 'Pasal 27 (Zona B-4: Pemanfaatan Terbatas Perkotaan)',
    arahan: [
      'Mencegah penurunan daya dukung lingkungan perkotaan',
      'Permukiman/perumahan baru hanya untuk tingkat kepadatan sedang',
      'Pembangunan gedung diarahkan bersifat vertikal, ramah lingkungan, meminimalkan air larian',
      'Penataan kawasan untuk menambah luas RTH dan mengurangi koefisien wilayah terbangun (KWT)',
      'KDB maks. 30% dengan ruang terbuka min. 70% (ketentuan khusus untuk lahan ≤ 120 m²)',
    ],
    dilarang: [
      'Pemecahan lahan (splitsing) dari 1 sertifikat induk tanpa pertimbangan teknis instansi berwenang',
      'Kegiatan yang berpotensi mengambil air dalam skala besar, mencemari, atau merusak lingkungan',
    ],
  },
  'Zona B5': {
    pasal: 'Pasal 28 (Zona B-5: Pemanfaatan Sangat Terbatas Perkotaan)',
    arahan: [
      'Pengendalian paling ketat; mencegah penurunan daya dukung lingkungan perkotaan',
      'Pembangunan diprioritaskan renovasi/perbaikan lingkungan, bukan pembangunan baru',
      'Pembangunan gedung diarahkan bersifat vertikal, ramah lingkungan',
      'Ketinggian bangunan di kontur > 1.000 mdpl maks. 4 lantai',
      'KDB maks. 20% dengan ruang terbuka min. 80% (ketentuan khusus untuk lahan ≤ 180 m²)',
    ],
    dilarang: [
      'Pemecahan lahan (splitsing) dari 1 sertifikat induk tanpa pertimbangan teknis instansi berwenang',
      'Kegiatan yang berpotensi mengambil air dalam skala besar, mencemari, atau merusak lingkungan',
    ],
  },
};
