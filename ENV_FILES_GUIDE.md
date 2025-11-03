# 📦 Environment Files Setup

## Súbory:

### `.env` - Pre lokálny vývoj (npm run dev)
- `LOCAL_STORAGE_ROOT=/Users/pavolbincik/Sites/videoConvert/data`
- `NODE_ENV=development`
- `PORT=3000`

### `.env.docker` - Pre Docker Compose
- `LOCAL_STORAGE_ROOT=/data` (mapované na Docker volume)
- `NODE_ENV=production`
- `PORT=3000`

### `.env.example` - Template pre iných vývojárov

---

## Použitie:

### Lokálny vývoj:
```bash
npm run dev
# Používa .env
# Súbory sa ukladajú do /Users/pavolbincik/Sites/videoConvert/data
```

### Docker Compose:
```bash
docker compose up
# Používa .env.docker
# Súbory sa ukladajú do Docker volume 'app_data' (mapované ako /data v kontajneri)
```

### Cloud Run:
- Používa environment variables nastavené v Cloud Console/deploy script
- `LOCAL_STORAGE_ROOT=/data` (ephemeral storage)

---

## Storage paths:

| Environment | LOCAL_STORAGE_ROOT | Skutočná lokácia |
|-------------|-------------------|------------------|
| **Lokálne** | `/Users/pavolbincik/Sites/videoConvert/data` | Host machine |
| **Docker** | `/data` | Docker volume `app_data` |
| **Cloud Run** | `/data` | Ephemeral (stratí sa pri reštarte) |

---

## Docker volume:

```bash
# Pozrieť obsah volume
docker volume inspect videoconvert_app_data

# Vymazať volume (odstráni všetky súbory!)
docker compose down -v

# Backup volume
docker run --rm -v videoconvert_app_data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz /data
```

---

## .gitignore:

```gitignore
.env           # Lokálny .env (obsahuje absolútnu cestu)
.env.local
.env.*.local
/data          # Lokálny data folder
```

**Committed do gitu:**
- ✅ `.env.example` - Template
- ✅ `.env.docker` - Docker konfigurácia
- ❌ `.env` - Lokálny (každý developer má svoju cestu)
- ❌ `/data` - Uploadované súbory

---

## Quick reference:

```bash
# Lokálny vývoj
npm run dev

# Docker (production-like)
docker compose up

# Rebuild Docker
docker compose up --build

# Pozrieť logy
docker compose logs -f web

# Zastaviť
docker compose down

# Zastaviť a vymazať data
docker compose down -v
```

