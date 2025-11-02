'use client';

import { useEffect, useState } from 'react';

async function fetchVideos(): Promise<VideoListItem[]> {
  const res = await fetch('/api/videos', { cache: 'no-store' });
  if (!res.ok) return [];
  return (await res.json()) as VideoListItem[];
}

export default function HomePage() {
  const [videos, setVideos] = useState<VideoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploymentVersion, setDeploymentVersion] = useState<string>('0.1.0');

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await fetchVideos();
      setVideos(data);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVersion = async () => {
    try {
      const res = await fetch('/api/version', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setDeploymentVersion(json.version || '0.1.0');
      }
    } catch (error) {
      console.error('Failed to load version:', error);
    }
  };

  useEffect(() => {
    loadVideos();
    loadVersion();
  }, []);

  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Failed to delete video: ${error.error || 'Unknown error'}`);
        return;
      }

      // Reload videos list
      await loadVideos();
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('Failed to delete video');
    }
  };

  return (
    <main>
      <h1>Video Converter</h1>
      <p>
        <a href="/upload">Upload</a>
      </p>
      <h2>Videos</h2>
      {loading ? (
        <p>Loading...</p>
      ) : videos.length === 0 ? (
        <p>No videos yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {videos.map((v) => (
            <li
              key={v.id}
              style={{
                marginBottom: 12,
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 4 }}>
                  <a href={`/video/${v.id}`} style={{ marginRight: 8, fontWeight: 'bold' }}>
                    {v.title || 'Untitled'}
                  </a>
                  <span style={{ padding: '2px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.85em' }}>
                    {v.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.85em', color: '#666', fontFamily: 'monospace' }}>
                  ID: {v.id}
                </div>
              </div>
              <button
                onClick={() => handleDelete(v.id)}
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '0.9em',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c82333')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #ddd', fontSize: '0.85em', color: '#666' }}>
        Deployment Version: {deploymentVersion}
      </div>
    </main>
  );
}

type VideoListItem = {
  id: string;
  title: string;
  status: string;
  posterAssetId: string | null;
};



