import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { localStorage } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: VideoRouteParams) {
  const id = params.id;
  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      assets: {
        select: {
          id: true,
          type: true,
          format: true,
          width: true,
          height: true,
          durationSec: true,
          timeOffsetMs: true,
          isDefault: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!video) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

  return NextResponse.json({
    id: video.id,
    title: video.title,
    status: video.status,
    durationSec: video.durationSec ?? undefined,
    width: video.width ?? undefined,
    height: video.height ?? undefined,
    assets: video.assets,
  });
}

export async function DELETE(_req: Request, { params }: VideoRouteParams) {
  const id = params.id;

  const video = await prisma.video.findUnique({
    where: { id },
    include: { assets: true },
  });

  if (!video) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const storage = localStorage();

  // Delete all asset files from filesystem
  for (const asset of video.assets) {
    try {
      await storage.delete(asset.path);
    } catch (error) {
      // Ignore errors if file doesn't exist
      console.error(`Failed to delete asset file ${asset.path}:`, error);
    }
  }

  // Delete video from database (assets will be cascade deleted)
  await prisma.video.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

type VideoRouteParams = {
  params: {
    id: string;
  };
};


