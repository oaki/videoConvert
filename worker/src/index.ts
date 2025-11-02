import fs from 'node:fs';
import path from 'node:path';

import { spawn } from 'node:child_process';

import type { Asset } from '@prisma/client';

import { loadConfig } from '../../lib/config';
import { prisma } from '../../lib/prisma';
import { localStorage } from '../../lib/storage';

async function run(cmd: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

const cfg = loadConfig();
const storage = localStorage();

let isProcessing = false;

async function processVideo(videoId: string): Promise<void> {
  console.log('Processing video', videoId);

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { assets: true },
  });
  if (!video) {
    console.warn('Video not found', videoId);
    return;
  }

  await prisma.video.update({ where: { id: videoId }, data: { status: 'PROCESSING' } });

  try {
    const original = video.assets.find((a: Asset) => a.type === 'ORIGINAL');
    if (!original) throw new Error('Original asset missing');

    const originalAbs = storage.resolve(original.path);

    // Prototype: simulate transcodes by copying the original to per-format outputs
    for (const fmt of cfg.outputFormats) {
      const outName = `${path.parse(originalAbs).name}.${fmt}`;
      const key = `videos/${videoId}/transcoded/${outName}`;
      await storage.putFile(key, originalAbs);
      await prisma.asset.create({
        data: {
          videoId,
          type: 'TRANSCODED',
          format: fmt.toUpperCase() as 'MP4' | 'WEBM' | 'AV1',
          path: key,
          isDefault: fmt === cfg.outputFormats[0],
        },
      });
    }

    // Preview clip (10s) scaled to max 400x400
    {
      const previewKey = `videos/${videoId}/preview/clip-10s.mp4`;
      const previewAbs = storage.resolve(previewKey);
      fs.mkdirSync(path.dirname(previewAbs), { recursive: true });
      await run('ffmpeg', [
        '-y',
        '-ss',
        '0',
        '-i',
        originalAbs,
        '-t',
        '10',
        '-vf',
        'scale=w=400:h=400:force_original_aspect_ratio=decrease:flags=lanczos,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p,setsar=1',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '24',
        '-movflags',
        '+faststart',
        '-c:a',
        'aac',
        '-b:a',
        '96k',
        previewAbs,
      ]);
      
      // Read preview clip and save to DB
      const previewBuffer = await fs.promises.readFile(previewAbs);
      const previewStat = await fs.promises.stat(previewAbs);
      
      await prisma.asset.create({
        data: {
          videoId,
          type: 'PREVIEW_CLIP',
          path: previewKey,
          data: previewBuffer, // Save 10s clip to DB
          byteSize: previewStat.size,
          isDefault: false,
        },
      });
    }

    // Frames (10 frames across first 10s) and poster
    {
      const framesDirKey = `videos/${videoId}/frames`;
      for (let i = 0; i < 10; i++) {
        const ts = (i * 1000).toString();
        const frameKey = `${framesDirKey}/frame-${i}.jpg`;
        const frameAbs = storage.resolve(frameKey);
        fs.mkdirSync(path.dirname(frameAbs), { recursive: true });
        await run('ffmpeg', ['-y', '-ss', `${i}`, '-i', originalAbs, '-frames:v', '1', frameAbs]);
        await prisma.asset.create({
          data: { videoId, type: 'FRAME', path: frameKey, timeOffsetMs: Number(ts), isDefault: false },
        });
      }

      // Poster from first frame, scaled to max 400x400
      const posterKey = `videos/${videoId}/poster/poster.jpg`;
      const posterAbs = storage.resolve(posterKey);
      fs.mkdirSync(path.dirname(posterAbs), { recursive: true });
      const firstFrameAbs = storage.resolve(`${framesDirKey}/frame-0.jpg`);
      await run('ffmpeg', [
        '-y',
        '-i',
        firstFrameAbs,
        '-vf',
        'scale=w=400:h=400:force_original_aspect_ratio=decrease:flags=lanczos',
        '-frames:v',
        '1',
        '-q:v',
        '2',
        '-update',
        '1',
        posterAbs,
      ]);
      
      // Read poster and save to DB
      const posterBuffer = await fs.promises.readFile(posterAbs);
      const posterStat = await fs.promises.stat(posterAbs);
      
      await prisma.asset.create({
        data: {
          videoId,
          type: 'POSTER',
          path: posterKey,
          data: posterBuffer, // Save poster to DB
          byteSize: posterStat.size,
          isDefault: true,
        },
      });
    }

    await prisma.video.update({ where: { id: videoId }, data: { status: 'READY' } });
    console.log('Video processed successfully', videoId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const retryCount = video.retryCount + 1;
    const shouldRetry = retryCount < video.maxRetries;

    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: shouldRetry ? 'QUEUED' : 'FAILED',
        errorMessage,
        retryCount,
        lastFailedAt: new Date(),
      },
    });

    if (shouldRetry) {
      console.warn(`Video processing failed, will retry (${retryCount}/${video.maxRetries}):`, videoId, errorMessage);
    } else {
      console.error('Video processing failed after max retries:', videoId, errorMessage);
      if (cfg.deleteOnFail) {
        try {
          // Clean up assets on failure
          for (const asset of video.assets) {
            try {
              await storage.delete(asset.path);
            } catch {}
          }
        } catch {}
      }
    }
  }
}

async function pollQueue(): Promise<void> {
  if (isProcessing) return;

  try {
    const queuedVideo = await prisma.video.findFirst({
      where: { status: 'QUEUED' },
      orderBy: { createdAt: 'asc' },
    });

    if (queuedVideo) {
      // Atomically claim the video by updating status from QUEUED to PROCESSING
      // This prevents race conditions when multiple workers are running
      const updated = await prisma.video.updateMany({
        where: {
          id: queuedVideo.id,
          status: 'QUEUED',
        },
        data: { status: 'PROCESSING' },
      });

      // Only process if we successfully claimed it (updateMany count > 0)
      if (updated.count > 0) {
        isProcessing = true;
        await processVideo(queuedVideo.id);
        isProcessing = false;
      }
    }
  } catch (error) {
    isProcessing = false;
    console.error('Error polling queue:', error);
  }
}

// Start polling
console.log(`Worker started, polling every ${cfg.pollIntervalMs}ms`);
pollQueue(); // Process immediately on start
setInterval(pollQueue, cfg.pollIntervalMs);


