'use client';

import { useEffect, useState, useCallback } from 'react';

import type { VideoSummary, DownloadTokenPayload } from '@/types/dto';

export default function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { id } = params;
  const [summary, setSummary] = useState<VideoSummary | null>(null);
  const [tokens, setTokens] = useState<Record<string, DownloadTokenPayload>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const sRes = await fetch(`/api/videos/${id}`, { cache: 'no-store' });
      if (!sRes.ok) throw new Error('Failed to load video');
      const sJson = (await sRes.json()) as VideoSummary;
      setSummary(sJson);
      const aRes = await fetch(`/api/videos/${id}/assets`, { cache: 'no-store' });
      if (aRes.ok) {
        const arr = (await aRes.json()) as DownloadTokenPayload[];
        const map: Record<string, DownloadTokenPayload> = {};
        for (const t of arr) map[t.assetId] = t;
        setTokens(map);
      }
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, [load]);

  async function setPoster(frameId: string): Promise<void> {
    await fetch(`/api/videos/${id}/poster`, { method: 'POST', body: JSON.stringify({ assetId: frameId }) });
    await load();
  }

  function urlFor(assetId: string): string {
    const t = tokens[assetId];
    return t ? `/api/assets/${assetId}/download?token=${encodeURIComponent(t.token)}` : '#';
  }

  if (loading && !summary) return <main>Loading...</main>;
  if (error) return <main>Error: {error}</main>;
  if (!summary) return <main>Not found</main>;

  const poster = summary.assets.find((a) => a.type === 'POSTER' && a.isDefault);
  const frames = summary.assets.filter((a) => a.type === 'FRAME');
  const transcodes = summary.assets.filter((a) => a.type === 'TRANSCODED');
  const preview = summary.assets.find((a) => a.type === 'PREVIEW_CLIP');

  return (
    <main>
      <h1>{summary.title || summary.id}</h1>
      <div>Status: {summary.status}</div>

      {poster ? (
        <div style={{ marginTop: 12 }}>
          <img src={urlFor(poster.id)} alt="Poster" style={{ maxWidth: 360, height: 'auto', border: '1px solid #ddd' }} />
        </div>
      ) : null}

      {transcodes.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <video controls style={{ width: '100%', maxWidth: 720 }} poster={poster ? urlFor(poster.id) : undefined}>
            {transcodes.map((a) => (
              <source
                key={a.id}
                src={urlFor(a.id)}
                type={a.format === 'WEBM' ? 'video/webm' : 'video/mp4'}
              />
            ))}
          </video>
        </div>
      )}

      {preview ? (
        <div style={{ marginTop: 12 }}>
          <a href={urlFor(preview.id)} target="_blank" rel="noreferrer">Download preview clip</a>
        </div>
      ) : null}

      {frames.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>Frames</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {frames.map((f) => (
              <div key={f.id}>
                <img src={urlFor(f.id)} alt="Frame" style={{ width: '100%', height: 'auto', border: '1px solid #eee' }} />
                <button onClick={() => setPoster(f.id)} style={{ width: '100%', marginTop: 4 }}>Set as poster</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

type VideoDetailPageParams = {
  id: string;
};

type VideoDetailPageProps = {
  params: VideoDetailPageParams;
};


