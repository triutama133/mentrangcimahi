import { NextRequest, NextResponse } from 'next/server';

// Proxies "Peta Dasar" tiles same-origin. The upstream (petadasar.meritech.cloud)
// sends no Access-Control-Allow-Origin header, so browsers refuse to use the
// tiles as WebGL textures when loaded cross-origin - MapLibre's raster layer
// renders as blank/black even though the HTTP request itself succeeds. Serving
// the same bytes from our own origin sidesteps that entirely.
export async function GET(_request: NextRequest, { params }: { params: { z: string; x: string; y: string } }) {
  const { z, x, y } = params;
  if (![z, x, y].every((v) => /^\d+$/.test(v))) {
    return new NextResponse(null, { status: 400 });
  }

  const upstreamUrl = `https://petadasar.meritech.cloud/tile/${z}/${x}/${y}.jpg`;

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      headers: { 'User-Agent': 'MENTRANG-Cimahi-WebGIS/1.0' },
      next: { revalidate: 604800 },
    });

    if (!upstreamRes.ok) {
      return new NextResponse(null, { status: upstreamRes.status });
    }

    const buffer = await upstreamRes.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    console.error('Peta Dasar tile proxy failed', e);
    return new NextResponse(null, { status: 502 });
  }
}
