type OutputFmt = 'mp4' | 'webm' | 'av1';

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true' || value === '1';
}

function parseNumber(value: string | undefined, fallback: number): number {
  const n = value ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function parseFormats(value: string | undefined): OutputFmt[] {
  const defaults: OutputFmt[] = ['mp4', 'webm', 'av1'];
  if (!value) return defaults.slice(0, 3);
  const parts = value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0) as OutputFmt[];
  const valid = parts.filter((p) => ['mp4', 'webm', 'av1'].includes(p));
  if (valid.length === 0) return ['mp4', 'webm'];
  return valid.slice(0, 3);
}

export type AppConfig = {
  databaseUrl: string;
  localRoot: string;
  outputFormats: OutputFmt[];
  maxUploadMb: number;
  deleteOnFail: boolean;
  maxRetries: number;
  signedUrlTtlSec: number;
  nodeEnv: 'development' | 'production' | 'test';
  pollIntervalMs: number;
};

export function loadConfig(): AppConfig {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  const localRoot = process.env.LOCAL_STORAGE_ROOT ?? '';
  if (!databaseUrl) throw new Error('Missing env DATABASE_URL');
  if (!localRoot) throw new Error('Missing env LOCAL_STORAGE_ROOT');

  return {
    databaseUrl,
    localRoot,
    outputFormats: parseFormats(process.env.OUTPUT_FORMATS),
    maxUploadMb: parseNumber(process.env.MAX_UPLOAD_MB, 1024),
    deleteOnFail: parseBoolean(process.env.DELETE_ON_FAIL, false),
    maxRetries: parseNumber(process.env.MAX_RETRIES, 3),
    signedUrlTtlSec: parseNumber(process.env.SIGNED_URL_TTL_SEC, 900),
    nodeEnv: (process.env.NODE_ENV as AppConfig['nodeEnv']) ?? 'development',
    pollIntervalMs: parseNumber(process.env.POLL_INTERVAL_MS, 2000),
  };
}

export type { OutputFmt };



