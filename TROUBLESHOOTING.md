# 🔧 gcloud CLI Troubleshooting

Ak `gcloud run deploy` zamrzne alebo nefunguje:

## Quick Fixes:

### 1. Aktualizuj gcloud
```bash
gcloud components update
```

### 2. Reštartuj gcloud config
```bash
gcloud auth revoke
gcloud auth login
gcloud config set project videoconvert-app
```

### 3. Skontroluj verziu
```bash
gcloud version
# Mali by si mať aspoň 400.0.0+
```

### 4. Použi Cloud Console
Najspoľahlivejšie riešenie:
```bash
open https://console.cloud.google.com/run/create?project=videoconvert-app
```
Postupuj podľa `MANUAL_DEPLOY.md`

### 5. Použiconda YAML
```bash
gcloud run services replace service.yaml --region=europe-west1
```

## Debugging:

### Test či gcloud funguje:
```bash
gcloud projects list
gcloud services list --enabled
```

### Test deploy s verbose:
```bash
gcloud run deploy videoconvert \
  --image=gcr.io/videoconvert-app/videoconvert:latest \
  --region=europe-west1 \
  --verbosity=debug
```

### Skontroluj permissions:
```bash
gcloud projects get-iam-policy videoconvert-app --flatten="bindings[].members" --format='table(bindings.role)' --filter="bindings.members:$(gcloud config get-value account)"
```

Potrebuješ:
- `roles/run.admin`
- `roles/iam.serviceAccountUser`

---

**TL;DR:** Ak CLI nefunguje → použi Cloud Console (vždy funguje!)

