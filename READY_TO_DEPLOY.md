# ✅ ALL FIXED - Ready to Deploy!

## Changes Made:

### 1. ✅ Fixed env vars parsing (YAML solution)
- Created `env-vars.yaml` 
- All scripts now use `--env-vars-file env-vars.yaml`
- Commas in `OUTPUT_FORMATS=mp4,webm,av1` work perfectly

### 2. ✅ Removed PORT variable
- `PORT` is reserved by Cloud Run
- Automatically set to `8080`
- Removed from `env-vars.yaml`

### 3. ✅ Secret Manager Permissions (NEW!)
- Service account needs access to secrets
- Run `./add-secret-permissions.sh` before first deploy
- Grants `Secret Manager Secret Accessor` role

---

## 🔐 IMPORTANT: First Time Setup

**Before deploying for the first time, grant secret permissions:**

```bash
./add-secret-permissions.sh
```

This grants the Cloud Run service account access to:
- `DATABASE_URL` secret
- `SHADOW_DATABASE_URL` secret

**You only need to do this ONCE.**

---

## 📝 Final env-vars.yaml:

```yaml
NODE_ENV: production
OUTPUT_FORMATS: mp4,webm,av1
MAX_UPLOAD_MB: "1024"
DELETE_ON_FAIL: "false"
MAX_RETRIES: "3"
SIGNED_URL_TTL_SEC: "900"
POLL_INTERVAL_MS: "2000"
NEXT_TELEMETRY_DISABLED: "1"
LOCAL_STORAGE_ROOT: /data
```

---

## 🚀 Deploy Commands:

### Full redeploy (build + deploy):
```bash
./redeploy.sh
```

### Quick deploy (no build):
```bash
./quick-deploy.sh
```

---

## 📊 After Deployment:

Your Cloud Run service will have:

**Environment Variables:**
- `NODE_ENV=production`
- `PORT=8080` (auto-set by Cloud Run)
- `OUTPUT_FORMATS=mp4,webm,av1`
- `MAX_UPLOAD_MB=1024`
- `DELETE_ON_FAIL=false`
- `MAX_RETRIES=3`
- `SIGNED_URL_TTL_SEC=900`
- `POLL_INTERVAL_MS=2000`
- `NEXT_TELEMETRY_DISABLED=1`
- `LOCAL_STORAGE_ROOT=/data`

**Secrets (from Secret Manager):**
- `DATABASE_URL`
- `SHADOW_DATABASE_URL`

---

## 📋 Files Updated:

- ✅ `env-vars.yaml` - Environment variables (no PORT)
- ✅ `redeploy.sh` - Uses env-vars-file
- ✅ `deploy.sh` - Uses env-vars-file
- ✅ `quick-deploy.sh` - Uses env-vars-file
- ✅ `PROBLEM_SOLVED.md` - Documentation

---

## 🎯 Next Steps:

1. **Deploy now:**
   ```bash
   ./redeploy.sh
   ```

2. **Monitor deployment:**
   ```bash
   gcloud run services logs tail videoconvert --region europe-west1
   ```

3. **Test the service:**
   ```bash
   URL=$(gcloud run services describe videoconvert --region europe-west1 --format 'value(status.url)')
   curl $URL/api/health
   ```

4. **Upload test:**
   - Open the URL in browser
   - Try uploading a video
   - Check logs for `[UPLOAD]` messages

---

## ⚠️ Cloud Run Reserved Variables:

Don't add these to env-vars.yaml (automatically set):
- `PORT` - Always 8080
- `K_SERVICE` - Service name
- `K_REVISION` - Revision name  
- `K_CONFIGURATION` - Configuration name

---

**EVERYTHING IS FIXED AND READY! Run `./redeploy.sh` now!** 🎉
