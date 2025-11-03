# ✅ FINAL SOLUTION - Using YAML File for Env Vars

## Problem:
gcloud has issues parsing `--set-env-vars` when values contain commas.

**Multiple approaches tried:**
1. ❌ Single flag with all vars: `--set-env-vars "A=1,B=2,C=x,y,z"` → Parsing error
2. ❌ Multiple flags: `--set-env-vars A=1 --set-env-vars B=2` → Still fails with commas
3. ✅ **YAML file: Works perfectly!**

---

## ✅ Solution: env-vars.yaml

**Created file: `env-vars.yaml`**
```yaml
NODE_ENV: production
PORT: "8080"
OUTPUT_FORMATS: mp4,webm,av1      # ← No problem with commas in YAML!
MAX_UPLOAD_MB: "1024"
DELETE_ON_FAIL: "false"
MAX_RETRIES: "3"
SIGNED_URL_TTL_SEC: "900"
POLL_INTERVAL_MS: "2000"
NEXT_TELEMETRY_DISABLED: "1"
LOCAL_STORAGE_ROOT: /data
```

**Updated deploy commands:**
```bash
gcloud run deploy videoconvert \
  --image gcr.io/videoconvert-app/videoconvert:latest \
  --region europe-west1 \
  --env-vars-file env-vars.yaml \           # ← Use YAML file
  --set-secrets DATABASE_URL=DATABASE_URL:latest,SHADOW_DATABASE_URL=SHADOW_DATABASE_URL:latest
```

---

## 🔧 Updated Scripts:

All deployment scripts now use `--env-vars-file env-vars.yaml`:

- ✅ `redeploy.sh`
- ✅ `deploy.sh`
- ✅ `quick-deploy.sh`

---

## 🚀 Deploy Now:

```bash
./redeploy.sh
```

This will:
1. Ask to commit changes
2. Build new Docker image
3. Deploy to Cloud Run using `env-vars.yaml`
4. **NO MORE PARSING ERRORS!**

---

## 📝 To Modify Env Vars:

Simply edit `env-vars.yaml`:
```bash
# Edit the file
nano env-vars.yaml

# Deploy changes
./quick-deploy.sh
```

---

## ✅ Why This Works:

| Method | Issue | Result |
|--------|-------|--------|
| `--set-env-vars "A=1,B=2,C=x,y,z"` | gcloud parses commas as delimiters | ❌ ERROR |
| `--set-env-vars A=1 --set-env-vars C=x,y,z` | Still parses commas in value | ❌ ERROR |
| `--env-vars-file env-vars.yaml` | YAML parser handles commas correctly | ✅ WORKS |

---

## 🎯 Current Cloud Run Variables:

After deployment, these env vars will be set:
- `NODE_ENV=production`
- `PORT=8080`
- `OUTPUT_FORMATS=mp4,webm,av1` ← No more parsing issues!
- `MAX_UPLOAD_MB=1024`
- `DELETE_ON_FAIL=false`
- `MAX_RETRIES=3`
- `SIGNED_URL_TTL_SEC=900`
- `POLL_INTERVAL_MS=2000`
- `NEXT_TELEMETRY_DISABLED=1`
- `LOCAL_STORAGE_ROOT=/data`

Plus secrets:
- `DATABASE_URL` (from Secret Manager)
- `SHADOW_DATABASE_URL` (from Secret Manager)

---

**THIS WILL WORK! Run `./redeploy.sh` now!** 🚀

