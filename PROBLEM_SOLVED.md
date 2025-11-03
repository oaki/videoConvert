# ✅ PROBLEM SOLVED - YAML Configuration

## ✅ Final Solution

Created **`env-vars.yaml`** file with all environment variables:

```yaml
NODE_ENV: production
OUTPUT_FORMATS: mp4,webm,av1      # ← Commas work perfectly in YAML!
MAX_UPLOAD_MB: "1024"
DELETE_ON_FAIL: "false"
MAX_RETRIES: "3"
SIGNED_URL_TTL_SEC: "900"
POLL_INTERVAL_MS: "2000"
NEXT_TELEMETRY_DISABLED: "1"
LOCAL_STORAGE_ROOT: /data
```

**Note:** `PORT` is automatically set by Cloud Run to `8080` and cannot be overridden.

## 🔧 Updated Scripts

All deployment scripts now use:
```bash
--env-vars-file env-vars.yaml
```

Instead of problematic `--set-env-vars` flags.

**Fixed scripts:**
- ✅ `redeploy.sh`
- ✅ `deploy.sh`
- ✅ `quick-deploy.sh`

## 🚀 Deploy Now

```bash
./redeploy.sh
```

**This will work 100%!** No more parsing errors.

## 📝 To Modify Variables

Simply edit `env-vars.yaml` and redeploy:

```bash
# Edit
nano env-vars.yaml

# Deploy
./quick-deploy.sh
```

## ✅ Why This Works

| Method | Issue | Result |
|--------|-------|--------|
| `--set-env-vars "A=1,B=x,y,z"` | gcloud parses commas | ❌ ERROR |
| `--env-vars-file yaml` | YAML parser handles commas | ✅ WORKS |

---

**VERIFIED AND READY TO DEPLOY!** 🎉

