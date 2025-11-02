import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse<HealthResponse>> {
  return NextResponse.json({ ok: true });
}

type HealthResponse = {
  ok: boolean;
};



