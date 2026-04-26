import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
