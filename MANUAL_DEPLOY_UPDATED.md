# 🚀 MANUÁLNY DEPLOY CEZ CLOUD CONSOLE (AKTUALIZOVANÉ)

Docker image už je vytvorený a pushnutý do Container Registry!
`gcr.io/videoconvert-app/videoconvert:latest`

---

## ⚡ RIEŠENIE "Missing DATABASE_URL" chyby:

**Použi ENVIRONMENT VARIABLES namiesto SECRETS!**

---

## Krok 1: Otvor Cloud Run

```bash
open https://console.cloud.google.com/run/create?project=videoconvert-app
```

Alebo manuálne: https://console.cloud.google.com/run

## Krok 2: Vytvor službu

1. Klikni **"CREATE SERVICE"** (modrý button hore)
2. V sekcii "Container image URL" klikni **"SELECT"**
3. Vyber:
   - **Container Registry** (tab)
   - **videoconvert-app** (projekt)
   - **videoconvert** (image)
   - **latest** (tag)
4. Klikni **"SELECT"**

## Krok 3: Základné nastavenia

### Service name:
```
videoconvert
```

### Region:
```
europe-west1 (Belgium)
```

### Authentication:
- ✅ **Allow unauthenticated invocations**

### CPU allocation:
- ✅ **CPU is always allocated**

### Autoscaling:
- Minimum: `0`
- Maximum: `10`

---

## Krok 4: Environment variables ⭐ DÔLEŽITÉ!

Klikni **"CONTAINER, VARIABLES & SECRETS, CONNECTIONS, SECURITY"**

### Tab "VARIABLES" (NIE "SECRETS"!):

Klikni **"+ ADD VARIABLE"** a pridaj **VŠETKY** tieto premenné:

| Name | Value |
|------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `OUTPUT_FORMATS` | `mp4,webm,av1` |
| `MAX_UPLOAD_MB` | `1024` |
| `DELETE_ON_FAIL` | `false` |
| `MAX_RETRIES` | `3` |
| `SIGNED_URL_TTL_SEC` | `900` |
| `POLL_INTERVAL_MS` | `2000` |
| `NEXT_TELEMETRY_DISABLED` | `1` |
| `LOCAL_STORAGE_ROOT` | `/data` |
| `DATABASE_URL` | `mysql://memorypuzzlega:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlega` |
| `SHADOW_DATABASE_URL` | `mysql://memorypuzzlegash:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlegash` |

⚠️ **DÔLEŽITÉ:** 
- Pridaj DATABASE_URL a SHADOW_DATABASE_URL do **VARIABLES** (nie SECRETS)
- Toto vyrieši "Missing env DATABASE_URL" chybu!
- Je to menej bezpečné než secrets, ale funguje okamžite

**NECHAJ "SECRETS" tab prázdny!**

---

## Krok 5: Resources

V **CONTAINER** tab:

- **Memory:** `2 GiB`
- **CPU:** `2`
- **Request timeout:** `3600` seconds

---

## Krok 6: Deploy!

1. **Skontroluj všetky nastavenia:**
   - ✅ Image: `gcr.io/videoconvert-app/videoconvert:latest`
   - ✅ Region: `europe-west1`
   - ✅ Memory: `2 GiB`, CPU: `2`
   - ✅ 12 environment variables (vrátane DATABASE_URL)
   - ✅ Authentication: Allow unauthenticated

2. Klikni **"CREATE"** (modrý button dole)

3. Počkaj **1-2 minúty** (sleduj progress bar)

4. Po dokončení uvidíš URL služby napr:
   ```
   https://videoconvert-xyz123-ew.a.run.app
   ```

---

## Krok 7: Otestuj

Klikni na URL alebo:

```bash
# Zisti URL
gcloud run services describe videoconvert --region europe-west1 --format 'value(status.url)'

# Otvor v browseri
open https://YOUR-SERVICE-URL
```

Test health endpoint:
```bash
curl https://YOUR-SERVICE-URL/api/health
```

---

## ⚠️ Troubleshooting

### "Missing env DATABASE_URL"
- ✅ Skontroluj, že si pridal DATABASE_URL do **VARIABLES** (nie SECRETS)
- ✅ Skontroluj, že hodnota je správna (začína `mysql://`)

### Služba sa nespustí
- Pozri logy: Cloud Run → videoconvert → LOGS
- Skontroluj databázové pripojenie

### Nemôžem pristupovať k databáze
- Over firewall na WebSupport
- Over že Cloud Run má prístup k externému MySQL

---

## 🔒 Ako neskôr prepnúť na Secrets (bezpečnejšie)

Ak chceš použiť secrets namiesto env vars:

1. **Nastav permissions** podľa `FIX_DATABASE_URL_ERROR.md`
2. **Update service:**
   - Cloud Run → videoconvert → EDIT & DEPLOY NEW REVISION
   - Odstráň DATABASE_URL a SHADOW_DATABASE_URL z VARIABLES
   - Pridaj ich do SECRETS (Reference a secret)
3. **Deploy**

---

## 📚 Ďalšie dokumenty

- `FIX_DATABASE_URL_ERROR.md` - Detailné riešenie DATABASE_URL chyby
- `DEPLOYMENT.md` - Kompletný deployment guide
- `TROUBLESHOOTING.md` - gcloud CLI problémy

---

**Poznámka:** Používať env variables pre database credentials je menej bezpečné než secrets, ale pre začiatok a testovanie je to OK. Pre produkciu odporúčam neskôr prepnúť na secrets s proper permissions.

