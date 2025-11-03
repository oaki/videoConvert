# 🚀 Deployment Guide - Quick Reference

## 📦 Čo bolo zmenené:

Ak si zmenil kód, potrebuješ:
1. **Commit changes** (odporúčané)
2. **Rebuild Docker image**
3. **Redeploy na Cloud Run**

---

## ⚡ NAJRÝCHLEJŠÍ SPÔSOB:

### Automatický redeploy script:
```bash
./redeploy.sh
```

Tento script:
- ✅ Ukáže ti git status
- ✅ Opýta sa či chceš commitnúť zmeny
- ✅ Build nový Docker image
- ✅ Deploy na Cloud Run
- ✅ Ukáže service URL

---

## 🔧 MANUÁLNY DEPLOYMENT:

### 1. Commit changes (odporúčané):
```bash
git add .
git commit -m "Added comprehensive logging to upload endpoint"
git push
```

### 2. Build nový image:
```bash
# Build a push do Container Registry
gcloud builds submit --tag gcr.io/videoconvert-app/videoconvert
```

### 3. Deploy na Cloud Run:
```bash
# Metóda A: Použiť existujúci deploy script
./deploy.sh

# Metóda B: Jednoduchý deploy (ak image už existuje)
gcloud run deploy videoconvert \
    --image gcr.io/videoconvert-app/videoconvert:latest \
    --region europe-west1
```

---

## 🐳 DOCKER COMPOSE (lokálne testovanie):

### Rebuild a restart:
```bash
# Stop existujúce kontajnery
docker compose down

# Rebuild images s novým kódom
docker compose build

# Spusti znova
docker compose up

# Alebo všetko naraz:
docker compose up --build
```

### Sleduj logy:
```bash
docker compose logs -f web
```

---

## 💻 LOKÁLNY VÝVOJ (npm):

### Jednoduchý refresh:
```bash
# Next.js má hot reload, takže stačí:
npm run dev

# Zmeny sa automaticky prejavia
```

### Po zmenách v Prisma schema:
```bash
npx prisma generate
npx prisma migrate dev --name description_of_change
```

---

## 🔍 OVERENIE DEPLOYMENTU:

### Cloud Run:
```bash
# Zisti URL
gcloud run services describe videoconvert --region europe-west1 --format 'value(status.url)'

# Test health endpoint
curl https://YOUR-URL/api/health

# Sleduj logy
gcloud run services logs tail videoconvert --region europe-west1
```

### Docker:
```bash
# Test localhost
curl http://localhost:3000/api/health

# Logy
docker compose logs -f web
```

---

## 📋 DEPLOYMENT CHECKLIST:

- [ ] Zmeny sú otestované lokálne (`npm run dev`)
- [ ] Zmeny sú otestované v Dockeri (`docker compose up --build`)
- [ ] Zmeny sú commitnuté do gitu
- [ ] Build nový image (`gcloud builds submit`)
- [ ] Deploy na Cloud Run (`./deploy.sh` alebo `./redeploy.sh`)
- [ ] Over že funguje (curl health endpoint)
- [ ] Sleduj logy pre errory

---

## ⚙️ QUICK COMMANDS:

```bash
# FULL REDEPLOY (všetko naraz):
./redeploy.sh

# Alebo krok-za-krokom:
git add . && git commit -m "Changes" && git push
gcloud builds submit --tag gcr.io/videoconvert-app/videoconvert
./deploy.sh

# DOCKER (lokálne testovanie):
docker compose up --build

# Sleduj logy:
gcloud run services logs tail videoconvert --region europe-west1

# Test endpoint:
curl $(gcloud run services describe videoconvert --region europe-west1 --format 'value(status.url)')/api/health
```

---

## 🔄 HOT RELOAD vs FULL REBUILD:

| Typ zmeny | Lokálne (npm) | Docker | Cloud Run |
|-----------|---------------|--------|-----------|
| **Frontend kód** | Hot reload ✅ | Rebuild 🔄 | Rebuild + Deploy 🔄 |
| **API routes** | Hot reload ✅ | Rebuild 🔄 | Rebuild + Deploy 🔄 |
| **Prisma schema** | Migrate 🔄 | Rebuild 🔄 | Rebuild + Deploy 🔄 |
| **Dependencies** | npm install 🔄 | Rebuild 🔄 | Rebuild + Deploy 🔄 |
| **ENV vars** | Restart ⚠️ | Restart 🔄 | Redeploy 🔄 |

---

## 💡 TIPS:

### Rýchle testovanie:
```bash
# 1. Test lokálne
npm run dev

# 2. Test v Dockeri (production-like)
docker compose up --build

# 3. Deploy na Cloud Run
./redeploy.sh
```

### Rollback (ak niečo pokazíš):
```bash
# List revisions
gcloud run revisions list --service videoconvert --region europe-west1

# Rollback na predchádzajúcu verziu
gcloud run services update-traffic videoconvert \
    --region europe-west1 \
    --to-revisions REVISION_NAME=100
```

### Debug deployment issues:
```bash
# Build logs
gcloud builds list --limit 5

# Detail konkrétneho buildu
gcloud builds log BUILD_ID

# Service logs
gcloud run services logs read videoconvert --region europe-west1 --limit 100
```

---

## 🎯 TL;DR:

**Najrýchlejší deploy:**
```bash
./redeploy.sh
```

**Testovanie pred deployom:**
```bash
docker compose up --build
```

**Sleduj čo sa deje:**
```bash
gcloud run services logs tail videoconvert --region europe-west1
```

