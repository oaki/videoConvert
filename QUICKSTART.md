# 🚀 Google Cloud Run - Quick Setup Checklist

## ✅ Pripravené súbory

- [x] `.env` - Databázové credentials (MySQL WebSupport)
- [x] `.env.example` - Template pre environment variables
- [x] `Dockerfile` - Production Docker image pre Cloud Run
- [x] `.gcloudignore` - Vylúčenie súborov z uploadu
- [x] `docker-compose.yml` - Aktualizované (bez lokálnej DB)
- [x] `deploy.sh` - Automatický deployment script
- [x] `migrate.sh` - Script pre databázové migrácie
- [x] `cloudbuild.yaml` - Google Cloud Build konfigurácia
- [x] `.github/workflows/deploy.yml` - GitHub Actions CI/CD
- [x] `DEPLOYMENT.md` - Detailný deployment guide
- [x] `CLOUD_STORAGE.md` - Guide pre Cloud Storage setup
- [x] `README.md` - Aktualizovaná dokumentácia

## 📋 Nasledujúce kroky

### 1. Nainštaluj Google Cloud SDK (ak ešte nemáš)

```bash
brew install --cask google-cloud-sdk
```

### 2. Prihlás sa a vytvor projekt

```bash
# Prihlásenie
gcloud auth login

# Vytvor projekt (alebo použi existujúci)
gcloud projects create videoconvert-app --name="Video Convert"

# Nastav projekt
gcloud config set project videoconvert-app
gcloud config set run/region europe-west1
```

### 3. Aktivuj API & Vytvor Secrets

```bash
# Aktivuj potrebné API
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Vytvor database secrets
echo -n "mysql://memorypuzzlega:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlega" | \
  gcloud secrets create DATABASE_URL --data-file=-

echo -n "mysql://memorypuzzlegash:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlegash" | \
  gcloud secrets create SHADOW_DATABASE_URL --data-file=-
```

### 4. Spusti migrácie (lokálne)

```bash
# Nainštaluj dependencies
npm install

# Spusti migrácie
./migrate.sh
# alebo
npx prisma migrate deploy
```

### 5. Deploy na Cloud Run

```bash
# Nastav environment variables
export GCLOUD_PROJECT_ID="videoconvert-app"
export GCLOUD_REGION="europe-west1"

# Spusti deployment
./deploy.sh
```

### 6. Otestuj deployment

Po deploymente dostaneš URL, napríklad:
```
https://videoconvert-xxxxxxxxx-ew.a.run.app
```

Test:
```bash
# Health check
curl https://YOUR-URL/api/health

# Version
curl https://YOUR-URL/api/version
```

## ⚠️ Dôležité poznámky

### Storage
- **Cloud Run je ephemeral** - súbory sa strácajú po reštarte
- Pre produkciu nastav **Cloud Storage** (pozri `CLOUD_STORAGE.md`)
- Aktuálne: súbory sú v `/data` (dočasné)

### Worker proces
- Docker Compose má `worker` službu pre background processing
- **Cloud Run je HTTP-based** - worker nebude fungovať
- Riešenia:
  - Cloud Run Jobs (odporúčané)
  - Cloud Tasks + Cloud Run endpoint
  - Compute Engine VM pre workera

### Databáza
- Používaš externú MariaDB (WebSupport) ✅
- Over firewall - Cloud Run potrebuje prístup
- Latency: Cloud Run (Europe) → WebSupport DB
- Connection pooling: Prisma default settings

### Náklady
- Cloud Run: Pay-per-use
  - CPU/Memory: ~$0.00002400/vCPU-sec
  - Requests: $0.40/million
- Storage: Local je free (ale ephemeral)
- Cloud Storage: ~$0.020/GB/month

### Bezpečnosť
- ✅ Secrets v Secret Manager
- ✅ Database credentials nie sú v kóde
- ✅ HTTPS automaticky
- ⚠️ Service je public (`--allow-unauthenticated`)

## 🔧 Troubleshooting

### Build fails
```bash
# Skontroluj logy
gcloud builds list --limit 5
gcloud builds log [BUILD_ID]
```

### Database connection fails
```bash
# Test connection lokálne
npm install -g prisma
npx prisma db pull

# Skontroluj firewall na WebSupport
# Skontroluj credentials v Secret Manager
gcloud secrets versions access latest --secret="DATABASE_URL"
```

### Service crashes
```bash
# Pozri logy
gcloud run services logs tail videoconvert --region europe-west1 --limit 100

# Skontroluj health endpoint
curl https://YOUR-URL/api/health
```

## 📚 Dokumentácia

- `DEPLOYMENT.md` - Kompletný deployment guide
- `CLOUD_STORAGE.md` - Nastavenie Cloud Storage pre produkciu
- `README.md` - Projekt dokumentácia

## 🎯 Quick Commands

```bash
# Deploy
./deploy.sh

# Migrácie
./migrate.sh

# Logy
gcloud run services logs tail videoconvert --region europe-west1

# Update secrets
echo -n "new-value" | gcloud secrets versions add DATABASE_URL --data-file=-

# Redeploy (nový build)
gcloud builds submit --tag gcr.io/PROJECT_ID/videoconvert
gcloud run deploy videoconvert --image gcr.io/PROJECT_ID/videoconvert

# Škálovanie
gcloud run services update videoconvert \
  --min-instances 1 \
  --max-instances 20

# Pridaj vlastnú doménu
gcloud run domain-mappings create \
  --service videoconvert \
  --domain your-domain.com
```

## ✨ Next Steps

1. **Setup Cloud Storage** - pre persistent files
2. **Setup Cloud Run Jobs** - pre worker processing
3. **Setup Monitoring** - Cloud Monitoring & Alerting
4. **Setup CI/CD** - GitHub Actions (už pripravené)
5. **Custom Domain** - Vlastná doména
6. **CDN** - Cloud CDN pre rychlejšie delivery

---

**Hotovo! Projekt je pripravený na deployment do Google Cloud Run! 🎉**

