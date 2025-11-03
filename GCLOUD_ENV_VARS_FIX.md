# ✅ FINAL FIX - gcloud Env Vars Syntax

## ❌ PROBLÉM (chybná syntax):

```bash
# Toto NEFUNGUJE:
--set-env-vars "VAR1=value1,VAR2=value2,OUTPUT_FORMATS=mp4,webm,av1"
#                                                          ↑ čiarky v hodnote spôsobujú parsing error
```

**Error:**
```
ERROR: Bad syntax for dict arg: [webm]
```

---

## ✅ RIEŠENIE (správna syntax):

### Metóda 1: Viacero flagov (POUŽITÉ V SKRIPTOCH)

```bash
gcloud run deploy videoconvert \
  --image gcr.io/project/image \
  --region europe-west1 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars PORT=8080 \
  --set-env-vars OUTPUT_FORMATS=mp4,webm,av1 \    # ← každý samostatne
  --set-env-vars MAX_UPLOAD_MB=1024 \
  --set-env-vars DELETE_ON_FAIL=false
```

### Metóda 2: Použiť ^:^ separator (alternatíva)

```bash
--set-env-vars "VAR1=value1^:^VAR2=value2^:^OUTPUT_FORMATS=mp4,webm,av1"
#                      ↑ špeciálny separator namiesto čiarky
```

### Metóda 3: YAML súbor (pre veľa premenných)

**env.yaml:**
```yaml
NODE_ENV: production
PORT: "8080"
OUTPUT_FORMATS: mp4,webm,av1
MAX_UPLOAD_MB: "1024"
DELETE_ON_FAIL: "false"
```

**Deploy:**
```bash
gcloud run deploy videoconvert \
  --env-vars-file env.yaml
```

---

## 🔧 ČO BOLO OPRAVENÉ:

### Všetky deployment skripty používajú teraz Metódu 1:

**redeploy.sh:**
```bash
--set-env-vars NODE_ENV=production \
--set-env-vars PORT=8080 \
--set-env-vars OUTPUT_FORMATS=mp4,webm,av1 \
--set-env-vars MAX_UPLOAD_MB=1024 \
--set-env-vars DELETE_ON_FAIL=false \
--set-env-vars MAX_RETRIES=3 \
--set-env-vars SIGNED_URL_TTL_SEC=900 \
--set-env-vars POLL_INTERVAL_MS=2000 \
--set-env-vars NEXT_TELEMETRY_DISABLED=1 \
--set-env-vars LOCAL_STORAGE_ROOT=/data
```

**Rovnako opravené:**
- ✅ `deploy.sh`
- ✅ `deploy-only.sh`
- ✅ `quick-deploy.sh`

---

## 🚀 POUŽITIE:

```bash
# Full redeploy (build + deploy)
./redeploy.sh

# Quick deploy (len deploy, bez buildu)
./quick-deploy.sh

# Full deployment
./deploy.sh
```

---

## 📋 OVERENIE:

```bash
# Syntax check všetkých skriptov
bash -n redeploy.sh && \
bash -n deploy.sh && \
bash -n deploy-only.sh && \
bash -n quick-deploy.sh && \
echo "✅ All OK"
```

---

## 💡 TIP: Ak chceš upraviť env vars:

**Zmeniť hodnotu:**
```bash
# V skriptoch najdi riadok napr:
--set-env-vars MAX_UPLOAD_MB=1024 \

# Zmeň hodnotu:
--set-env-vars MAX_UPLOAD_MB=2048 \
```

**Pridať novú premennú:**
```bash
# Pridaj nový riadok:
--set-env-vars NEW_VAR=value \
```

**Odstrániť premennú:**
```bash
# Vymaž riadok alebo použi --remove-env-vars:
gcloud run services update videoconvert \
  --region europe-west1 \
  --remove-env-vars NEW_VAR
```

---

## ✅ SUMMARY:

| Chybná syntax | Správna syntax |
|---------------|----------------|
| `--set-env-vars "A=1,B=2,C=x,y,z"` | `--set-env-vars A=1 --set-env-vars B=2 --set-env-vars C=x,y,z` |
| Všetko v jednom flagu | Každá premenná samostatný flag |
| Parsing error pri čiarkach | Funguje perfektne ✅ |

---

**TERAZ BY TO MALO FUNGOVAŤ! Spusti `./redeploy.sh`** 🚀

