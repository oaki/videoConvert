import { Readable, type Readable as ReadableStream } from 'node:stream';
import path from 'node:path';

import busboy from '@fastify/busboy';
import { NextResponse } from 'next/server';

import { loadConfig } from '@/lib/config';
import { prisma } from '@/lib/prisma';
import { localStorage } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      assets: {
        select: { id: true, type: true, isDefault: true },
      },
    },
  });
  return NextResponse.json(
    videos.map((v: VideoListItem) => ({
      id: v.id,
      title: v.title,
      status: v.status,
      createdAt: v.createdAt,
      posterAssetId: v.assets.find((a: AssetListItem) => a.type === 'POSTER' && a.isDefault)?.id || null,
    })),
  );
}

export async function POST(request: Request) {
  const cfg = loadConfig();

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const storage = localStorage();

  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });

  const maxBytes = cfg.maxUploadMb * 1024 * 1024;
  const bb = busboy({ headers: headers as BusboyHeaders, limits: { files: 1, fileSize: maxBytes } });

  let nodeStream: NodeJS.ReadableStream;
  const body = request.body as unknown;
  // Use Readable.fromWeb if available (Node.js 18+), otherwise use Readable.from
  try {
    const ReadableClass = Readable as typeof Readable & { fromWeb?: (stream: unknown) => NodeJS.ReadableStream };
    if (ReadableClass.fromWeb && body && typeof body === 'object' && 'pipeTo' in body) {
      nodeStream = ReadableClass.fromWeb(body);
    } else {
      nodeStream = Readable.from(body as NodeJS.ReadableStream);
    }
  } catch {
    nodeStream = Readable.from(body as NodeJS.ReadableStream);
  }

  let resolveDone: (v: Response) => void;
  let rejectDone: (e: unknown) => void;
  const done = new Promise<Response>((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  let handled = false;

  bb.on('file', async (_name: string, fileStream: ReadableStream, info: BusboyFileInfo) => {
    if (handled) {
      fileStream.resume();
      return;
    }
    handled = true;

    const originalName = info.filename || 'upload';
    const mimeType = info.mimeType || 'application/octet-stream';
    const title = path.parse(originalName).name || 'Video';

    let videoId = '';
    let byteSize = 0;
    let failed = false;

    try {
      const created = await prisma.video.create({
        data: {
          title,
          originalName,
          mimeType,
          byteSize: 0,
          status: 'UPLOADED',
          maxRetries: cfg.maxRetries,
        },
        select: { id: true },
      });
      videoId = created.id;

      const destKey = `videos/${videoId}/original/${encodeURIComponent(originalName)}`;

      fileStream.on('limit', async () => {
        failed = true;
        try {
          await storage.delete(destKey);
        } catch {}
        resolveDone!(NextResponse.json({ error: 'File too large' }, { status: 413 }));
      });

      fileStream.on('data', (chunk: Buffer) => {
        byteSize += chunk.length;
      });

      await storage.putStream(destKey, fileStream);

      if (failed) return; // already responded

      await prisma.$transaction([
        prisma.video.update({
          where: { id: videoId },
          data: { byteSize, status: 'QUEUED' },
        }),
        prisma.asset.create({
          data: {
            videoId,
            type: 'ORIGINAL',
            path: destKey,
            isDefault: true,
            byteSize,
          },
        }),
      ]);

      resolveDone!(NextResponse.json({ id: videoId, status: 'QUEUED' }));
    } catch (e: unknown) {
      try {
        if (videoId) {
          await prisma.video.update({
            where: { id: videoId },
            data: { status: 'FAILED', errorMessage: (e as Error).message },
          });
        }
      } catch {}
      rejectDone!(e);
    }
  });

  bb.on('partsLimit', () => {
    resolveDone!(NextResponse.json({ error: 'Too many parts' }, { status: 400 }));
  });

  bb.on('filesLimit', () => {
    resolveDone!(NextResponse.json({ error: 'Too many files' }, { status: 400 }));
  });

  bb.on('field', () => {
    // ignore extra fields for now
  });

  bb.on('close', () => {
    if (!handled) {
      resolveDone!(NextResponse.json({ error: 'No file provided' }, { status: 400 }));
    }
  });

  nodeStream.pipe(bb);

  try {
    return await done;
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

type VideoListItem = {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  assets: AssetListItem[];
};

type AssetListItem = {
  id: string;
  type: string;
  isDefault: boolean | null;
};

type BusboyHeaders = {
  'content-type': string;
} & Record<string, string>;

type BusboyFileInfo = {
  filename?: string;
  mimeType?: string;
};



