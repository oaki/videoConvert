# Google Cloud Run Deployment Guide

## Príprava

### 1. Nainštaluj Google Cloud SDK
```bash
# macOS
brew install --cask google-cloud-sdk

# Alebo stiahni z:
# https://cloud.google.com/sdk/docs/install
```

### 2. Prihlás sa a nastav projekt
```bash
# Prihlásenie
gcloud auth login

# Vytvor nový projekt alebo použi existujúci
gcloud projects create videoconvert-app --name="Video Convert"

# Nastav projekt
gcloud config set project videoconvert-app

# Nastav región (Europe)
gcloud config set run/region europe-west1
```

### 3. Aktivuj potrebné API
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 4. Vytvor secrets pre databázu
```bash
# DATABASE_URL
echo -n "mysql://memorypuzzlega:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlega" | \
  gcloud secrets create DATABASE_URL --data-file=-

# SHADOW_DATABASE_URL
echo -n "mysql://memorypuzzlegash:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlegash" | \
  gcloud secrets create SHADOW_DATABASE_URL --data-file=-
```

## Deployment

### Automatický deployment (odporúčané)
```bash
# Nastav environment variables
export GCLOUD_PROJECT_ID="videoconvert-app"
export GCLOUD_REGION="europe-west1"

# Spusti deployment script
chmod +x deploy.sh
./deploy.sh
```

### Manuálny deployment

#### 1. Build a push image
```bash
gcloud builds submit --tag gcr.io/videoconvert-app/videoconvert
```

#### 2. Deploy na Cloud Run
```bash
gcloud run deploy videoconvert \
  --image gcr.io/videoconvert-app/videoconvert \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --set-env-vars "NODE_ENV=production,PORT=8080,OUTPUT_FORMATS=mp4,webm,av1,MAX_UPLOAD_MB=1024,DELETE_ON_FAIL=false,MAX_RETRIES=3,SIGNED_URL_TTL_SEC=900,POLL_INTERVAL_MS=2000,NEXT_TELEMETRY_DISABLED=1,LOCAL_STORAGE_ROOT=/data" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,SHADOW_DATABASE_URL=SHADOW_DATABASE_URL:latest"
```

#### 3. Spusti migrácie databázy
```bash
# Lokálne (pred deploymentom)
npm install
npx prisma migrate deploy

# Alebo cez Cloud Build job
```

## Aktualizácia

### Pri zmene kódu
```bash
./deploy.sh
```

### Pri zmene secrets
```bash
# Aktualizuj secret
echo -n "nová-hodnota" | gcloud secrets versions add DATABASE_URL --data-file=-

# Redeploy služby
gcloud run services update videoconvert --region europe-west1
```

### Pri zmene databázovej schémy
```bash
# 1. Vytvor migráciu lokálne
npx prisma migrate dev --name description_of_change

# 2. Deploy s migráciou
./deploy.sh
```

## Monitoring & Logs

### Pozri logy
```bash
gcloud run services logs read videoconvert --region europe-west1 --limit 50
```

### Pozri metriky
```bash
# Otvor v browseri
gcloud run services describe videoconvert --region europe-west1
```

### Cloud Console
Naviguj na: https://console.cloud.google.com/run

## Troubleshooting

### Connection timeout k databáze
- Skontroluj, či Cloud Run môže pristupovať k externej MySQL/MariaDB
- Over firewall pravidlá na WebSupport
- Over, či IP adresa Cloud Run nie je blokovaná

### Deployment fails
```bash
# Skontroluj build logs
gcloud builds list --limit 5
gcloud builds log [BUILD_ID]
```

### Service crashes
```bash
# Skontroluj logs
gcloud run services logs tail videoconvert --region europe-west1
```

## Dôležité poznámky

1. **Storage**: Cloud Run je stateless - súbory sa po reštarte strácajú. Pre produkciu použi:
   - Google Cloud Storage (GCS)
   - Cloud Filestore
   - Externú storage službu

2. **Database**: Používaš externú MariaDB (WebSupport), čo je OK, ale over:
   - Latency medzi Cloud Run a DB
   - Connection limits
   - Firewall pravidlá

3. **Costs**: Cloud Run účtuje podľa:
   - CPU/Memory času
   - Počtu requestov
   - Network egress
   
   Minimalizuj náklady cez:
   - `--min-instances 0` (default)
   - Optimalizuj memory/cpu

4. **Worker proces**: Cloud Run je HTTP-based. Pre background worker budeš potrebovať:
   - Cloud Run Jobs
   - Cloud Functions
   - Compute Engine VM
   - Alebo použi front ako BullMQ/Cloud Tasks

## Environment Variables

Aktuálne nastavené v `.env`:
- `DATABASE_URL` - MySQL connection string
- `SHADOW_DATABASE_URL` - Shadow DB pre migrácie
- `PORT=8080` - Cloud Run default port
- `NODE_ENV=production`
- Video processing konfigurácia

## Bezpečnosť

✅ Secrets sú v Secret Manager, nie v kóde
✅ Database credentials nie sú v image
✅ HTTPS je automaticky enabled
⚠️ Service je `--allow-unauthenticated` - uprav podľa potreby

## Ďalšie kroky

1. Nastav vlastnú doménu:
```bash
gcloud run domain-mappings create --service videoconvert --domain your-domain.com
```

2. Nastav CI/CD s GitHub Actions alebo Cloud Build triggers

3. Implementuj Cloud Storage pre persistent files

4. Nastav monitoring & alerting
# Database Configuration
DATABASE_URL="mysql://memorypuzzlega:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlega"
SHADOW_DATABASE_URL="mysql://memorypuzzlegash:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlegash"

# Application Configuration
NODE_ENV=production
PORT=8080

# Storage Configuration
LOCAL_STORAGE_ROOT=/data

# Video Processing Configuration
OUTPUT_FORMATS=mp4,webm,av1
MAX_UPLOAD_MB=1024
DELETE_ON_FAIL=false
MAX_RETRIES=3

# Security & URLs
SIGNED_URL_TTL_SEC=900
POLL_INTERVAL_MS=2000

# Next.js Configuration
NEXT_TELEMETRY_DISABLED=1

