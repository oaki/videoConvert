import { NextRequest, NextResponse } from 'next/server';
import { processVideo } from '@/lib/video-processor';

export const maxDuration = 300; // 5 minutes for video processing

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    console.log('[PROCESS] Starting video processing for:', videoId);

    // Process video asynchronously without blocking the response
    // This runs in the background and errors are logged
    processVideo(videoId).catch((error) => {
      console.error('[PROCESS] Fatal error processing video:', videoId, error);
    });

    return NextResponse.json({
      status: 'processing',
      videoId,
      message: 'Video processing started'
    });
  } catch (error) {
    console.error('[PROCESS] Error starting video processing:', error);
    return NextResponse.json(
      { error: 'Failed to start processing' },
      { status: 500 }
    );
  }
}

