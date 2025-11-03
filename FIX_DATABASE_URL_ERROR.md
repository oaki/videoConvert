# ⚠️ MISSING DATABASE_URL ERROR - RIEŠENIE

## Problém:
```
Error: Missing env DATABASE_URL
```

Táto chyba znamená, že **Cloud Run service account nemá prístup k secretom**.

---

## 🚀 RÝCHLE RIEŠENIE:

### Metóda 1: Cez Cloud Console (NAJJEDNODUCHŠIE) ⭐

1. **Otvor Secret Manager:**
   ```
   https://console.cloud.google.com/security/secret-manager?project=videoconvert-app
   ```

2. **Pre DATABASE_URL:**
   - Klikni na `DATABASE_URL`
   - Tab **PERMISSIONS**
   - Klikni **GRANT ACCESS**
   - **New principals:** Zadaj service account (nižšie)
   - **Role:** `Secret Manager Secret Accessor`
   - Klikni **SAVE**

3. **Pre SHADOW_DATABASE_URL:**
   - Opakuj rovnaké kroky

4. **Service Account email:**
   Použi jeden z týchto (Cloud Run automaticky použije default):
   ```
   PROJECT_NUMBER-compute@developer.gserviceaccount.com
   ```
   
   Kde `PROJECT_NUMBER` zistíš:
   ```bash
   gcloud projects describe videoconvert-app --format='value(projectNumber)'
   ```
   
   Napríklad: `123456789-compute@developer.gserviceaccount.com`

5. **Redeploy Cloud Run service** (aby načítal nové permissions)

---

### Metóda 2: Cez CLI script

Spusti pripravený script:

```bash
./fix-permissions.sh
```

Alebo manuálne:

```bash
# Zisti project number
PROJECT_NUMBER=$(gcloud projects describe videoconvert-app --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Pridaj permissions
gcloud secrets add-iam-policy-binding DATABASE_URL \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding SHADOW_DATABASE_URL \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"
```

---

### Metóda 3: Priamo v Cloud Run UI pri vytváraní služby

Keď vytváraš službu v Cloud Run:

1. V sekcii **SECRETS:**
   - Neklikaj "Reference a secret"
   - Namiesto toho klikni **"SHOW ADVANCED SETTINGS"** (dole)
   
2. **Security tab:**
   - **Service account:** Nechaj `Compute Engine default service account`
   - Alebo vytvor custom service account

3. **Potom v Secret Manager** (pred vytvorením služby):
   - Daj permissions ako v Metóde 1

---

## 🔍 Alternatíva: Použiť environment variables namiesto secrets

Ak secrets nefungujú, môžeš dočasne použiť env variables:

### V Cloud Run UI:

V sekcii **VARIABLES** (namiesto SECRETS) pridaj:

```
DATABASE_URL=mysql://memorypuzzlega:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlega

SHADOW_DATABASE_URL=mysql://memorypuzzlegash:Nk7_WXtW00@mariadb105.r4.websupport.sk:3315/memorypuzzlegash
```

⚠️ **Menej bezpečné**, ale fungovať bude okamžite!

---

## ✅ Overenie:

Po pridaní permissions skontroluj:

```bash
# Zoznam permissions na DATABASE_URL
gcloud secrets get-iam-policy DATABASE_URL

# Malo by obsahovať:
# - members:
#   - serviceAccount:123456789-compute@developer.gserviceaccount.com
#   role: roles/secretmanager.secretAccessor
```

---

## 📋 Kompletný postup (Cloud Console):

1. **Zisti project number:**
   ```bash
   gcloud projects describe videoconvert-app --format='value(projectNumber)'
   ```
   Napríklad: `48273776183`

2. **Service account email:**
   ```
   48273776183-compute@developer.gserviceaccount.com
   ```

3. **Otvor Secret Manager:**
   - https://console.cloud.google.com/security/secret-manager?project=videoconvert-app
   - Klikni `DATABASE_URL` → PERMISSIONS → GRANT ACCESS
   - Principal: `48273776183-compute@developer.gserviceaccount.com`
   - Role: `Secret Manager Secret Accessor`
   - SAVE
   - Opakuj pre `SHADOW_DATABASE_URL`

4. **Redeploy Cloud Run service** (alebo vytvor novú)

5. **Hotovo!** ✅

---

## 🎯 Quick Links:

- [Secret Manager](https://console.cloud.google.com/security/secret-manager?project=videoconvert-app)
- [IAM Permissions](https://console.cloud.google.com/iam-admin/iam?project=videoconvert-app)
- [Cloud Run Services](https://console.cloud.google.com/run?project=videoconvert-app)

---

**TL;DR:** 
1. Zisti project number: `gcloud projects describe videoconvert-app --format='value(projectNumber)'`
2. Service account: `PROJECT_NUMBER-compute@developer.gserviceaccount.com`
3. Pridaj permissions v Secret Manager → DATABASE_URL → PERMISSIONS → GRANT ACCESS
4. Redeploy Cloud Run

**Alebo:** Použi environment variables namiesto secrets (menej bezpečné, ale rýchlejšie)

