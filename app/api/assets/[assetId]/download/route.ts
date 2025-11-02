import fs from 'node:fs';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { localStorage } from '@/lib/storage';
import { isExpired } from '@/lib/tokens';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: AssetDownloadRouteParams) {
  const assetId = params.assetId;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') || '';
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 });

  const crypto = await import('node:crypto');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const record = await prisma.downloadToken.findFirst({
    where: { assetId, tokenHash },
  });

  if (!record) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  if (isExpired(record.expiresAt.toISOString()))
    return NextResponse.json({ error: 'Expired token' }, { status: 401 });

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

  const storage = localStorage();
  const absPath = storage.resolve(asset.path);
  const ext = path.extname(asset.path).toLowerCase();
  const contentType =
    ext === '.mp4'
      ? 'video/mp4'
      : ext === '.webm'
        ? 'video/webm'
        : ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : 'application/octet-stream';

  // For ORIGINAL and TRANSCODED, always use filesystem (no DB fallback)
  if (asset.type === 'ORIGINAL' || asset.type === 'TRANSCODED') {
    try {
      const stat = await fs.promises.stat(absPath);
      const stream = fs.createReadStream(absPath);

      return new NextResponse(stream as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(stat.size),
          'Cache-Control': 'private, max-age=0, must-revalidate',
          'Content-Disposition': `inline; filename="${path.basename(absPath)}"`,
        },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Asset file not found' }, { status: 404 });
    }
  }

  // For PREVIEW_CLIP and POSTER: cache-first with DB fallback
  let fileExists = false;
  try {
    await fs.promises.access(absPath);
    fileExists = true;
  } catch {
    // File doesn't exist in cache
  }

  // If not in cache and we have DB data, write to cache
  if (!fileExists && asset.data) {
    try {
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      await fs.promises.writeFile(absPath, Buffer.from(asset.data));
      fileExists = true;
    } catch (error) {
      console.error('Failed to cache from DB:', error);
    }
  }

  // Serve from cache if available
  if (fileExists) {
    try {
      const stat = await fs.promises.stat(absPath);
      const stream = fs.createReadStream(absPath);

      return new NextResponse(stream as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(stat.size),
          'Cache-Control': 'private, max-age=0, must-revalidate',
          'Content-Disposition': `inline; filename="${path.basename(absPath)}"`,
        },
      });
    } catch (error) {
      console.error('Failed to read cached file:', error);
    }
  }

  // Fallback: serve directly from DB blob
  if (asset.data) {
    const buffer = Buffer.from(asset.data);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(asset.byteSize || buffer.length),
        'Cache-Control': 'private, max-age=0, must-revalidate',
        'Content-Disposition': `inline; filename="${path.basename(asset.path)}"`,
      },
    });
  }

  return NextResponse.json({ error: 'Asset data not found' }, { status: 404 });
}

type AssetDownloadRouteParams = {
  params: {
    assetId: string;
  };
};


