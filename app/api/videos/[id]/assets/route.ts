import dayjs from 'dayjs';

import { NextResponse } from 'next/server';

import { loadConfig } from '@/lib/config';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/tokens';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: VideoAssetsRouteParams) {
  const cfg = loadConfig();
  const id = params.id;
  const video = await prisma.video.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!video) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

  const assets = await prisma.asset.findMany({
    where: { videoId: id },
    orderBy: { createdAt: 'asc' },
  });

  const ttlSec = Math.max(60, cfg.signedUrlTtlSec);
  const expiresAt = dayjs().add(ttlSec, 'second').toISOString();

  const payloads: TokenPayload[] = [];
  for (const a of assets) {
    const { token, hash } = generateToken();
    await prisma.downloadToken.create({
      data: {
        assetId: a.id,
        tokenHash: hash,
        expiresAt: new Date(expiresAt),
      },
    });
    payloads.push({ assetId: a.id, token, expiresAt });
  }

  return NextResponse.json(payloads);
}

type VideoAssetsRouteParams = {
  params: {
    id: string;
  };
};

type TokenPayload = {
  assetId: string;
  token: string;
  expiresAt: string;
};


