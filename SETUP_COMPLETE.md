# ✅ Projekt pripravený na Google Cloud Run

## 🎉 Čo bolo urobené

### 1. **Databázová konfigurácia**
- ✅ Vytvorený `.env` súbor s prístupom do MySQL/MariaDB (WebSupport)
- ✅ Odstránená Docker DB služba z `docker-compose.yml`
- ✅ Všetky služby teraz používajú externú databázu z `.env`

### 2. **Google Cloud Run deployment**
- ✅ `Dockerfile` - Optimalizovaný pre Cloud Run (port 8080)
- ✅ `deploy.sh` - Automatický deployment script
- ✅ `migrate.sh` - Script pre databázové migrácie
- ✅ `.gcloudignore` - Vylúčenie súborov z uploadu
- ✅ `cloudbuild.yaml` - Google Cloud Build konfigurácia

### 3. **CI/CD**
- ✅ `.github/workflows/deploy.yml` - GitHub Actions automatický deployment

### 4. **Dokumentácia**
- ✅ `QUICKSTART.md` - Rýchly štart checklist
- ✅ `DEPLOYMENT.md` - Detailný deployment guide
- ✅ `CLOUD_STORAGE.md` - Guide pre Cloud Storage setup
- ✅ `README.md` - Aktualizovaná dokumentácia

## 📁 Vytvorené súbory

```
.env                    # Database credentials (MySQL WebSupport)
.env.example           # Template pre env variables
.gcloudignore          # Vylúčenie súborov z Cloud Run
Dockerfile             # Production Docker image (port 8080)
docker-compose.yml     # Aktualizované (bez DB služby)
deploy.sh             # Automatický deployment script
migrate.sh            # Databázové migrácie
cloudbuild.yaml       # Google Cloud Build config
.github/workflows/deploy.yml  # GitHub Actions CI/CD
QUICKSTART.md         # Quick setup checklist
DEPLOYMENT.md         # Detailný deployment guide
CLOUD_STORAGE.md      # Cloud Storage setup guide
```

## 🚀 Ako nasadiť na Cloud Run

### Rýchly štart (3 kroky)

```bash
# 1. Nainštaluj Google Cloud SDK
brew install --cask google-cloud-sdk

# 2. Prihlás sa a vytvor projekt
gcloud auth login
gcloud projects create videoconvert-app --name="Video Convert"
gcloud config set project videoconvert-app

# 3. Deploy!
export GCLOUD_PROJECT_ID="videoconvert-app"
./deploy.sh
```

**Hotovo!** Tvoja aplikácia bude dostupná na:
`https://videoconvert-xxxxxxxxx-ew.a.run.app`

### Detailné inštrukcie

Pozri **`QUICKSTART.md`** pre kompletný checklist alebo **`DEPLOYMENT.md`** pre detailný guide.

## 🔧 Lokálny vývoj

```bash
# 1. Nainštaluj dependencies
npm install

# 2. Spusti migrácie
./migrate.sh

# 3. Spusti dev server
npm run dev
```

Alebo s Docker Compose:

```bash
docker compose up
```

## ⚙️ Konfigurácia

Všetky nastavenia sú v `.env`:

```bash
DATABASE_URL="mysql://memorypuzzlega:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlega"
SHADOW_DATABASE_URL="mysql://memorypuzzlegash:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlegash"
NODE_ENV=production
PORT=8080
OUTPUT_FORMATS=mp4,webm,av1
MAX_UPLOAD_MB=1024
# ...a ďalšie
```

## ⚠️ Dôležité poznámky

### Storage
- **Cloud Run je ephemeral** - súbory sa strácajú po reštarte
- Pre produkciu nastav **Cloud Storage** → pozri `CLOUD_STORAGE.md`
- Aktuálne: súbory sú v `/data` (dočasné)

### Worker proces
- Docker Compose má `worker` službu pre background processing
- **Cloud Run je HTTP-based** - worker nebude fungovať ako samostatná služba
- Riešenia:
  - ✅ Cloud Run Jobs (odporúčané)
  - ✅ Cloud Tasks + Cloud Run endpoint
  - ✅ Compute Engine VM pre workera

### Databáza
- ✅ Používaš externú MariaDB (WebSupport)
- ⚠️ Over firewall - Cloud Run potrebuje prístup k DB
- ⚠️ Latency: Cloud Run (Europe) → WebSupport DB
- ✅ Connection pooling: Prisma default settings

## 📚 Pomocné príkazy

```bash
# Deploy
./deploy.sh

# Migrácie
./migrate.sh

# Logy
gcloud run services logs tail videoconvert --region europe-west1

# Health check
curl https://YOUR-URL/api/health

# Update secret
echo -n "new-value" | gcloud secrets versions add DATABASE_URL --data-file=-
```

## 🎯 Nasledujúce kroky

1. ✅ **Deploy na Cloud Run** - Použite `./deploy.sh`
2. ⏳ **Setup Cloud Storage** - Pre persistent files (pozri `CLOUD_STORAGE.md`)
3. ⏳ **Setup Worker** - Cloud Run Jobs alebo Cloud Tasks
4. ⏳ **Setup Monitoring** - Cloud Monitoring & Alerting
5. ⏳ **Custom Domain** - Vlastná doména
6. ⏳ **CDN** - Cloud CDN pre rýchlejšie delivery

## 📖 Dokumentácia

- **`QUICKSTART.md`** - Rýchly checklist (začni tu!)
- **`DEPLOYMENT.md`** - Kompletný deployment guide
- **`CLOUD_STORAGE.md`** - Nastavenie Cloud Storage
- **`README.md`** - Projekt dokumentácia

## 🆘 Pomoc

Ak niečo nefunguje:

1. Skontroluj logy: `gcloud run services logs tail videoconvert`
2. Over database connection: `./migrate.sh`
3. Test health endpoint: `curl https://YOUR-URL/api/health`
4. Pozri troubleshooting v `DEPLOYMENT.md`

---

**Projekt je hotový! Môžeš deployovať na Google Cloud Run! 🎉**

Začni s: `./deploy.sh`

