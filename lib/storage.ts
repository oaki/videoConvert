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

  function assertInsideRoot(abs: string) {
    const rel = path.relative(localRoot, abs);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error('Attempt to access path outside LOCAL_STORAGE_ROOT');
    }
  }

  function ensureDir(dir: string) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return {
    resolve(key: string) {
      const abs = path.resolve(localRoot, key.replace(/^\/+/, ''));
      assertInsideRoot(abs);
      return abs;
    },
    async putStream(key, stream) {
      const abs = this.resolve(key);
      ensureDir(path.dirname(abs));
      const write = fs.createWriteStream(abs, { flags: 'w' });
      await pipeline(stream, write);
    },
    async putFile(key, sourceAbs) {
      const abs = this.resolve(key);
      ensureDir(path.dirname(abs));
      await fs.promises.copyFile(sourceAbs, abs);
    },
    async delete(key) {
      const abs = this.resolve(key);
      try {
        await fs.promises.unlink(abs);
      } catch (e: unknown) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      }
    },
    async exists(key) {
      const abs = this.resolve(key);
      try {
        await fs.promises.access(abs, fs.constants.F_OK);
        return true;
      } catch {
        return false;
      }
    },
  };
}



