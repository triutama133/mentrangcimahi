import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MENTRANG CIMAHI - Melek Informasi Tata Ruang',
  description:
    'WebGIS Geoportal Kota Cimahi: Rencana Tata Ruang Wilayah (RTRW 2024–2044), Zonasi Kawasan Bandung Utara (KBU), Lahan Sawah Dilindungi (LSD), Lahan Baku Sawah (LBS), dan Digitasi Peta.',
  keywords: [
    'MENTRANG',
    'Kota Cimahi',
    'RTRW Cimahi 2024',
    'Kawasan Bandung Utara',
    'KBU Cimahi',
    'Lahan Sawah Dilindungi',
    'LSD Cimahi',
    'LBS Cimahi',
    'Digitasi Peta',
    'WebGIS Cimahi',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}

