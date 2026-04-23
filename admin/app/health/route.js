import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'qadsiah-admin',
    version: '0.1.0'
  });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
