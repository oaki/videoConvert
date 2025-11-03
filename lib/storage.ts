import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { loadConfig } from './config';

export type PutOptions = { contentType?: string };

export interface Storage {
  resolve(key: string): string;
  putStream(key: string, stream: NodeJS.ReadableStream, opts?: PutOptions): Promise<void>;
  putFile(key: string, absPath: string, opts?: PutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export function localStorage(): Storage {
  const { localRoot } = loadConfig();
  console.log('[STORAGE] Initialized with root:', localRoot);

  function assertInsideRoot(abs: string) {
    const rel = path.relative(localRoot, abs);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      console.log('[STORAGE] ERROR: Path outside root attempted:', abs);
      throw new Error('Attempt to access path outside LOCAL_STORAGE_ROOT');
    }
  }

  function ensureDir(dir: string) {
    console.log('[STORAGE] Ensuring directory exists:', dir);
    fs.mkdirSync(dir, { recursive: true });
  }

  return {
    resolve(key: string) {
      const abs = path.resolve(localRoot, key.replace(/^\/+/, ''));
      console.log('[STORAGE] Resolving key:', key, '→', abs);
      assertInsideRoot(abs);
      return abs;
    },
    async putStream(key, stream) {
      console.log('[STORAGE] putStream START:', key);
      const abs = this.resolve(key);
      ensureDir(path.dirname(abs));
      const write = fs.createWriteStream(abs, { flags: 'w' });

      let bytesWritten = 0;
      write.on('drain', () => {
        console.log('[STORAGE] Write stream drained, bytes so far:', bytesWritten);
      });

      stream.on('data', (chunk: Buffer) => {
        bytesWritten += chunk.length;
      });

      try {
        await pipeline(stream, write);
        console.log('[STORAGE] putStream COMPLETE:', key, 'Total bytes:', bytesWritten);
      } catch (err) {
        console.log('[STORAGE] putStream ERROR:', key, err);
        throw err;
      }
    },
    async putFile(key, sourceAbs) {
      console.log('[STORAGE] putFile:', sourceAbs, '→', key);
      const abs = this.resolve(key);
      ensureDir(path.dirname(abs));
      try {
        await fs.promises.copyFile(sourceAbs, abs);
        console.log('[STORAGE] putFile COMPLETE:', key);
      } catch (err) {
        console.log('[STORAGE] putFile ERROR:', key, err);
        throw err;
      }
    },
    async delete(key) {
      console.log('[STORAGE] delete:', key);
      const abs = this.resolve(key);
      try {
        await fs.promises.unlink(abs);
        console.log('[STORAGE] delete COMPLETE:', key);
      } catch (e: unknown) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.log('[STORAGE] delete ERROR:', key, e);
          throw e;
        }
        console.log('[STORAGE] delete: File not found (ignoring):', key);
      }
    },
    async exists(key) {
      const abs = this.resolve(key);
      try {
        await fs.promises.access(abs, fs.constants.F_OK);
        console.log('[STORAGE] exists: YES:', key);
        return true;
      } catch {
        console.log('[STORAGE] exists: NO:', key);
        return false;
      }
    },
  };
}



