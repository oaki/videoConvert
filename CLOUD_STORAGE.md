# Cloud Storage Setup Guide

Pre produkčné nasadenie na Google Cloud Run je potrebné použiť Cloud Storage namiesto lokálneho filesystému, pretože Cloud Run kontajnery sú ephemeral (súbory sa strácajú pri reštarte).

## 1. Vytvor Cloud Storage Bucket

```bash
# Nastav project
gcloud config set project videoconvert-app

# Vytvor bucket (meno musí byť globálne unikátne)
gsutil mb -l europe-west1 gs://videoconvert-media

# Nastav CORS pre web prístup (ak potrebuješ)
cat > cors.json << EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://videoconvert-media
```

## 2. Aktualizuj kód pre Cloud Storage

### Inštaluj GCS SDK

```bash
npm install @google-cloud/storage
```

### Vytvor storage adapter

**lib/gcs-storage.ts:**

```typescript
import { Storage } from '@google-cloud/storage';
import { Readable } from 'stream';

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'videoconvert-media';
const bucket = storage.bucket(bucketName);

export async function uploadFile(
  filePath: string,
  destination: string,
  contentType?: string
): Promise<string> {
  await bucket.upload(filePath, {
    destination,
    metadata: {
      contentType,
    },
  });
  
  return `gs://${bucketName}/${destination}`;
}

export async function uploadFromBuffer(
  buffer: Buffer,
  destination: string,
  contentType?: string
): Promise<string> {
  const file = bucket.file(destination);
  
  await file.save(buffer, {
    metadata: {
      contentType,
    },
  });
  
  return `gs://${bucketName}/${destination}`;
}

export async function downloadFile(
  source: string,
  destination: string
): Promise<void> {
  await bucket.file(source).download({ destination });
}

export async function downloadAsBuffer(source: string): Promise<Buffer> {
  const [buffer] = await bucket.file(source).download();
  return buffer;
}

export function getReadStream(source: string): Readable {
  return bucket.file(source).createReadStream();
}

export function getWriteStream(
  destination: string,
  contentType?: string
): NodeJS.WritableStream {
  return bucket.file(destination).createWriteStream({
    metadata: {
      contentType,
    },
  });
}

export async function deleteFile(source: string): Promise<void> {
  await bucket.file(source).delete();
}

export async function getSignedUrl(
  source: string,
  expiresIn: number = 900 // 15 minutes
): Promise<string> {
  const [url] = await bucket.file(source).getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresIn * 1000,
  });
  
  return url;
}

export async function fileExists(source: string): Promise<boolean> {
  const [exists] = await bucket.file(source).exists();
  return exists;
}
```

### Aktualizuj storage.ts

**lib/storage.ts:**

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';
import * as gcs from './gcs-storage';

const USE_GCS = process.env.USE_GCS === 'true';
const LOCAL_ROOT = process.env.LOCAL_STORAGE_ROOT || '/data';

export async function saveFile(
  buffer: Buffer,
  filePath: string,
  contentType?: string
): Promise<string> {
  if (USE_GCS) {
    return gcs.uploadFromBuffer(buffer, filePath, contentType);
  }
  
  const fullPath = path.join(LOCAL_ROOT, filePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);
  return fullPath;
}

export async function getFile(filePath: string): Promise<Buffer> {
  if (USE_GCS) {
    return gcs.downloadAsBuffer(filePath);
  }
  
  const fullPath = path.join(LOCAL_ROOT, filePath);
  return fs.readFile(fullPath);
}

export async function deleteFile(filePath: string): Promise<void> {
  if (USE_GCS) {
    return gcs.deleteFile(filePath);
  }
  
  const fullPath = path.join(LOCAL_ROOT, filePath);
  await fs.unlink(fullPath);
}

export async function getSignedUrl(
  filePath: string,
  expiresIn?: number
): Promise<string> {
  if (USE_GCS) {
    return gcs.getSignedUrl(filePath, expiresIn);
  }
  
  // For local, return direct path (requires INTERNAL_BASE_URL)
  const baseUrl = process.env.INTERNAL_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/api/files/${filePath}`;
}
```

## 3. Aktualizuj environment variables

**V .env:**

```bash
USE_GCS=true
GCS_BUCKET_NAME=videoconvert-media
```

**V Cloud Run deployment:**

```bash
gcloud run deploy videoconvert \
  --set-env-vars "USE_GCS=true,GCS_BUCKET_NAME=videoconvert-media" \
  # ...ostatné env vars
```

## 4. Nastav IAM permissions

```bash
# Zisti service account používaný Cloud Run
gcloud run services describe videoconvert \
  --region europe-west1 \
  --format "value(spec.template.spec.serviceAccountName)"

# Pridaj Storage Object Admin permission
gcloud projects add-iam-policy-binding videoconvert-app \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/storage.objectAdmin"
```

## 5. Aktualizuj deploy script

V `deploy.sh` pridaj:

```bash
# Create bucket if not exists
if ! gsutil ls gs://videoconvert-media &> /dev/null; then
    echo "Creating Cloud Storage bucket..."
    gsutil mb -l $REGION gs://videoconvert-media
fi
```

## 6. Lifecycle management (voliteľné)

Pre automatické mazanie starých súborov:

```bash
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 30,
          "matchesPrefix": ["temp/", "processing/"]
        }
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://videoconvert-media
```

## 7. Monitoring & Costs

- Cloud Storage costs: ~$0.020 per GB/month (Standard Storage)
- Network egress: $0.12 per GB (to internet)
- Operations: Čítanie/Zápis majú minimálne náklady

```bash
# Sleduj využitie
gsutil du -sh gs://videoconvert-media

# Zisti počet súborov
gsutil ls -r gs://videoconvert-media | wc -l
```

## Alternative: Cloud Filestore

Pre high-performance shared filesystem (drahšie):

```bash
# Create Filestore instance
gcloud filestore instances create videoconvert-fs \
  --zone=europe-west1-b \
  --tier=BASIC_HDD \
  --file-share=name=videos,capacity=1TB \
  --network=name=default

# Mount v Cloud Run (requires VPC connector)
```

Cloud Filestore je vhodný ak potrebuješ:
- POSIX filesystem
- Shared storage medzi viacerými inštanciami
- Vysoký IOPS

Pre väčšinu prípadov je Cloud Storage lepšia voľba.

