export type VideoStatus = 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED';
export type AssetType = 'ORIGINAL' | 'TRANSCODED' | 'PREVIEW_CLIP' | 'POSTER' | 'FRAME';
export type Format = 'MP4' | 'WEBM' | 'AV1';

export type VideoSummary = {
  id: string;
  title: string;
  status: VideoStatus;
  durationSec?: number;
  width?: number;
  height?: number;
  assets: Array<{
    id: string;
    type: AssetType;
    format?: Format;
    width?: number;
    height?: number;
    durationSec?: number;
    timeOffsetMs?: number;
    isDefault?: boolean;
  }>;
};

export type UploadResponse = { id: string; status: 'QUEUED' | 'FAILED' };
export type ProcessJobData = { videoId: string };

export type DownloadTokenPayload = {
  assetId: string;
  token: string;
  expiresAt: string; // ISO string
};



