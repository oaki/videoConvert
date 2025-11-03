# 📊 Ako sledovať logy

## Cloud Run (po deployi)

### Metóda 1: Cloud Console (najjednoduchšie)

1. **Otvor Cloud Run službu:**
   ```
   https://console.cloud.google.com/run/detail/europe-west1/videoconvert/logs?project=videoconvert-app
   ```

2. **Alebo manuálne:**
   - Cloud Run → videoconvert → LOGS tab
   - Klikni "Show query" a filtruj:
     ```
     resource.type="cloud_run_revision"
     resource.labels.service_name="videoconvert"
     ```

### Metóda 2: gcloud CLI (real-time)

```bash
# Real-time tail (live streaming)
gcloud run services logs tail videoconvert --region europe-west1

# Filter iba upload logy
gcloud run services logs tail videoconvert --region europe-west1 | grep UPLOAD

# Posledných 100 logov
gcloud run services logs read videoconvert --region europe-west1 --limit 100

# Logy za poslednú hodinu
gcloud run services logs read videoconvert --region europe-west1 --freshness=1h

# Filter podľa severity
gcloud run services logs read videoconvert --region europe-west1 --log-filter="severity>=ERROR"
```

### Metóda 3: Cloud Logging (pokročilé)

```bash
# Otvor Logs Explorer
open https://console.cloud.google.com/logs/query?project=videoconvert-app

# Query:
resource.type="cloud_run_revision"
resource.labels.service_name="videoconvert"
severity>="INFO"
textPayload=~"\[UPLOAD\]"
```

---

## Lokálne (development)

### npm run dev

```bash
# Logy sa zobrazia priamo v terminále
npm run dev
```

### Docker Compose

```bash
# Real-time logs všetkých služieb
docker compose logs -f

# Iba web služba
docker compose logs -f web

# Iba upload logy
docker compose logs -f web | grep UPLOAD

# Posledných 100 lines
docker compose logs --tail=100 web

# Od konkrétneho času
docker compose logs --since="2025-11-02T14:00:00" web
```

---

## Filtrovanie logov

### Hľadaj konkrétne events:

```bash
# Upload začína
... | grep "POST request received"

# File info
... | grep "File info"

# Databázové operácie
... | grep "database"

# Storage operácie
... | grep STORAGE

# Config loading
... | grep CONFIG

# Errors
... | grep ERROR

# Progress (každých 10MB)
... | grep Progress

# Success
... | grep SUCCESS
```

---

## Debug konkrétneho uploadu

1. **Začni upload**
2. **Sleduj logy real-time:**
   ```bash
   gcloud run services logs tail videoconvert --region europe-west1
   ```

3. **Hľadaj sequence:**
   ```
   [UPLOAD] POST request received
   [UPLOAD] File event triggered
   [UPLOAD] File info - name: ...
   [UPLOAD] Creating video record...
   [UPLOAD] Video record created with ID: xxx
   [UPLOAD] Starting file upload...
   [UPLOAD] Progress: 10 MB
   [UPLOAD] File upload complete...
   [UPLOAD] SUCCESS
   ```

4. **Ak vidíš ERROR:**
   - Pozri error message
   - Pozri stack trace
   - Skontroluj kde presne zlyhal (databáza? storage? network?)

---

## Export logov

### Cloud Run → CSV/JSON

```bash
# Export do JSON
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=videoconvert" \
  --limit 1000 \
  --format json \
  > logs.json

# Export do CSV
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 1000 \
  --format "csv(timestamp,severity,textPayload)" \
  > logs.csv
```

### Docker Compose → File

```bash
# Save do súboru
docker compose logs web > web-logs.txt

# Continuous logging do súboru
docker compose logs -f web >> web-logs.txt
```

---

## Monitoring & Alerts

### Cloud Monitoring (voliteľné)

1. **Vytvor log-based metric:**
   - Logging → Logs-based Metrics
   - Counter pre `[UPLOAD] ERROR`
   - Counter pre `[UPLOAD] SUCCESS`

2. **Vytvor alert policy:**
   - Monitoring → Alerting
   - Alert keď error rate > 10%
   - Notification: email/slack

---

## Quick Commands

```bash
# Sleduj live logy
gcloud run services logs tail videoconvert --region europe-west1

# Posledné errory
gcloud run services logs read videoconvert --region europe-west1 --limit 50 | grep ERROR

# Upload logy za poslednú hodinu
gcloud run services logs read videoconvert --region europe-west1 --freshness=1h | grep UPLOAD

# Storage operácie
gcloud run services logs read videoconvert --region europe-west1 --limit 100 | grep STORAGE

# Config check
gcloud run services logs read videoconvert --region europe-west1 --limit 10 | grep CONFIG
```

---

## Troubleshooting

### Nevidím žiadne logy?

```bash
# Over že služba beží
gcloud run services describe videoconvert --region europe-west1

# Over že máš permissions
gcloud projects get-iam-policy videoconvert-app

# Skús Cloud Console
open https://console.cloud.google.com/run/detail/europe-west1/videoconvert/logs?project=videoconvert-app
```

### Logy sú príliš hlučné?

Filtruj podľa severity:
```bash
# Iba WARNING a vyššie
gcloud run services logs read videoconvert --log-filter="severity>=WARNING"

# Iba ERRORS
gcloud run services logs read videoconvert --log-filter="severity=ERROR"
```

---

**TL;DR:**

```bash
# Cloud Run live logs:
gcloud run services logs tail videoconvert --region europe-west1

# Docker Compose live logs:
docker compose logs -f web

# Cloud Console:
https://console.cloud.google.com/run/detail/europe-west1/videoconvert/logs
```

