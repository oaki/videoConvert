import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: VideoRetryRouteParams) {
  const id = params.id;
  const url = new URL(request.url);
  const force = url.searchParams.get('force') === 'true';

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

  if (!force) {
    if (video.status !== 'FAILED') return NextResponse.json({ error: 'Not FAILED' }, { status: 400 });
    if (video.retryCount >= video.maxRetries) return NextResponse.json({ error: 'Max retries reached' }, { status: 400 });
  }

  const updated = await prisma.video.update({
    where: { id },
    data: {
      status: 'QUEUED',
      retryCount: video.retryCount + 1,
      errorMessage: null,
      errorCode: null,
      lastFailedAt: null,
    },
  });

  return NextResponse.json({ id: updated.id, status: updated.status, retryCount: updated.retryCount });
}

type VideoRetryRouteParams = {
  params: {
    id: string;
  };
};


