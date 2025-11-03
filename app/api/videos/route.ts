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
  console.log('[UPLOAD] POST request received');
  const cfg = loadConfig();
  console.log('[UPLOAD] Config loaded - maxUploadMb:', cfg.maxUploadMb);

  const contentType = request.headers.get('content-type') || '';
  console.log('[UPLOAD] Content-Type:', contentType);

  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    console.log('[UPLOAD] ERROR: Invalid content type');
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  console.log('[UPLOAD] Initializing storage...');
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
    console.log('[UPLOAD] File event triggered');

    if (handled) {
      console.log('[UPLOAD] File already handled, skipping');
      fileStream.resume();
      return;
    }
    handled = true;

    const originalName = info.filename || 'upload';
    const mimeType = info.mimeType || 'application/octet-stream';
    const title = path.parse(originalName).name || 'Video';
    console.log('[UPLOAD] File info - name:', originalName, 'mime:', mimeType, 'title:', title);

    let videoId = '';
    let byteSize = 0;
    let failed = false;

    try {
      console.log('[UPLOAD] Creating video record in database...');
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
      console.log('[UPLOAD] Video record created with ID:', videoId);

      const destKey = `videos/${videoId}/original/${encodeURIComponent(originalName)}`;
      console.log('[UPLOAD] Destination path:', destKey);

      fileStream.on('limit', async () => {
        console.log('[UPLOAD] ERROR: File size limit exceeded');
        failed = true;
        try {
          await storage.delete(destKey);
        } catch {}
        resolveDone!(NextResponse.json({ error: 'File too large' }, { status: 413 }));
      });

      let lastLoggedMB = 0;
      fileStream.on('data', (chunk: Buffer) => {
        byteSize += chunk.length;
        const currentMB = Math.floor(byteSize / (1024 * 1024));
        if (currentMB > lastLoggedMB && currentMB % 10 === 0) {
          console.log('[UPLOAD] Progress:', currentMB, 'MB');
          lastLoggedMB = currentMB;
        }
      });

      console.log('[UPLOAD] Starting file upload to storage...');
      await storage.putStream(destKey, fileStream);
      console.log('[UPLOAD] File upload complete. Total size:', byteSize, 'bytes');

      if (failed) {
        console.log('[UPLOAD] Upload failed (size limit)');
        return; // already responded
      }

      console.log('[UPLOAD] Updating video record and creating asset...');
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
      console.log('[UPLOAD] Database transaction complete');

      // Trigger video processing asynchronously
      console.log('[UPLOAD] Triggering video processing...');
      fetch(`${request.url.split('/api/')[0]}/api/process-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      }).catch((error) => {
        console.error('[UPLOAD] Failed to trigger video processing:', error);
      });

      console.log('[UPLOAD] SUCCESS: Video queued for processing');
      resolveDone!(NextResponse.json({ id: videoId, status: 'QUEUED' }));
    } catch (e: unknown) {
      console.log('[UPLOAD] ERROR during upload:', e);
      console.error('[UPLOAD] Error stack:', (e as Error).stack);
      try {
        if (videoId) {
          console.log('[UPLOAD] Marking video as failed in database');
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
    console.log('[UPLOAD] ERROR: Too many parts');
    resolveDone!(NextResponse.json({ error: 'Too many parts' }, { status: 400 }));
  });

  bb.on('filesLimit', () => {
    console.log('[UPLOAD] ERROR: Too many files');
    resolveDone!(NextResponse.json({ error: 'Too many files' }, { status: 400 }));
  });

  bb.on('field', (name: string, value: string) => {
    console.log('[UPLOAD] Form field received:', name, '=', value);
  });

  bb.on('close', () => {
    console.log('[UPLOAD] Busboy close event');
    if (!handled) {
      console.log('[UPLOAD] ERROR: No file was uploaded');
      resolveDone!(NextResponse.json({ error: 'No file provided' }, { status: 400 }));
    }
  });

  bb.on('error', (err: Error) => {
    console.log('[UPLOAD] Busboy error:', err);
    console.error('[UPLOAD] Busboy error stack:', err.stack);
  });

  console.log('[UPLOAD] Piping request stream to busboy...');
  nodeStream.pipe(bb);

  try {
    console.log('[UPLOAD] Waiting for upload to complete...');
    const response = await done;
    console.log('[UPLOAD] Request complete, returning response');
    return response;
  } catch (e: unknown) {
    console.log('[UPLOAD] FATAL ERROR:', e);
    console.error('[UPLOAD] Fatal error stack:', (e as Error).stack);
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



