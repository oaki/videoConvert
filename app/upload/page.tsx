'use client';

import { useRef, useState } from 'react';

export default function UploadPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string>('');

  async function onUpload(): Promise<void> {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('video', f);
    setStatus('Uploading...');
    const res = await fetch('/api/videos', { method: 'POST', body: fd });
    const json = (await res.json()) as UploadResponse;
    setStatus(res.ok ? `Queued: ${json.id}` : `Failed: ${json.error || 'error'}`);
  }

  return (
    <main>
      <h1>Upload</h1>
      <input ref={fileRef} type="file" accept="video/*" />
      <button onClick={onUpload} style={{ marginLeft: 8 }}>Upload</button>
      <div style={{ marginTop: 12 }}>{status}</div>
    </main>
  );
}

type UploadResponse = {
  id?: string;
  error?: string;
};



