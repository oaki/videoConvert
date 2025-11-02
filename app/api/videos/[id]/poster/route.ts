import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { localStorage } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: VideoPosterRouteParams) {
  const videoId = params.id;
  const body = (await request.json().catch(() => null)) as PosterRequestBody;
  const assetId = body?.assetId || '';
  if (!assetId) return NextResponse.json({ error: 'assetId required' }, { status: 400 });

  const frame = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!frame || frame.videoId !== videoId || frame.type !== 'FRAME')
    return NextResponse.json({ error: 'Invalid frame' }, { status: 400 });

  const storage = localStorage();
  const srcAbs = storage.resolve(frame.path);

  const posterKey = `videos/${videoId}/poster/poster.jpg`;
  const posterAbs = storage.resolve(posterKey);
  fs.mkdirSync(path.dirname(posterAbs), { recursive: true });

  // Resize selected frame to max 400x400 while preserving aspect ratio
  await new Promise<void>((resolve, reject) => {
    const p = spawn('ffmpeg', [
      '-y',
      '-i', srcAbs,
      '-vf', 'scale=w=400:h=400:force_original_aspect_ratio=decrease:flags=lanczos',
      '-frames:v', '1',
      '-q:v', '2',
      '-update', '1',
      posterAbs,
    ], { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
  });

  // Read poster and save to DB
  const posterBuffer = await fs.promises.readFile(posterAbs);
  const posterStat = await fs.promises.stat(posterAbs);

  await prisma.$transaction([
    prisma.asset.updateMany({ where: { videoId, type: 'POSTER' }, data: { isDefault: false } }),
    prisma.asset.create({
      data: {
        videoId,
        type: 'POSTER',
        path: posterKey,
        data: posterBuffer, // Save poster to DB
        byteSize: posterStat.size,
        isDefault: true,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

type VideoPosterRouteParams = {
  params: {
    id: string;
  };
};

type PosterRequestBody = {
  assetId?: string;
} | null;


