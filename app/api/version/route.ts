import { NextResponse } from 'next/server';
import packageJson from '../../../package.json';

export const runtime = 'nodejs';

export async function GET() {
  const version = process.env.DEPLOYMENT_VERSION || packageJson.version || '0.1.0';
  return NextResponse.json({ version });
}


