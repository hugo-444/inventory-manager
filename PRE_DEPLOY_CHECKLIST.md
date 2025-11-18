# 🔒 Pre-Deployment Security Checklist

## ✅ Before Pushing to GitHub

### 1. Check for Sensitive Files

Run these commands to verify no secrets are being committed:

```bash
# Check for .env files
find . -name ".env*" -type f

# Check git status for sensitive files
git status | grep -E "\.env|secrets|\.key|\.pem|password|token"

# Verify .gitignore is working
git check-ignore .env backend/.env frontend/.env
```

### 2. Files That MUST Be Ignored

✅ **Environment Variables:**
- `.env`
- `.env.local`
- `.env.production`
- `.env.development`
- `backend/.env`
- `frontend/.env`
- Any file containing `DATABASE_URL`, passwords, or API keys

✅ **Secrets & Keys:**
- `*.pem`
- `*.key`
- `*.cert`
- `secrets/`
- `.secrets`

✅ **Database Files:**
- `*.db`
- `*.sqlite`
- `*.sqlite3`

✅ **Build Outputs:**
- `dist/`
- `build/`
- `node_modules/`

### 3. Safe to Commit

✅ **Configuration Examples:**
- `.env.example` (no real secrets)
- `railway.json`
- `render.yaml`
- `package.json`
- `tsconfig.json`

✅ **Code:**
- All source code files
- Documentation
- Migration files (they're version controlled)

### 4. Quick Verification

```bash
# 1. Check what will be committed
git status

# 2. Verify .env is ignored
git check-ignore .env backend/.env frontend/.env
# Should output the file paths if properly ignored

# 3. Review staged files
git diff --cached --name-only

# 4. If you see any .env files, unstage them:
git reset HEAD .env backend/.env frontend/.env
```

### 5. If You Accidentally Committed Secrets

**If secrets were already committed:**

```bash
# Remove from git history (use with caution!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env backend/.env frontend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Or use BFG Repo-Cleaner (safer)
# https://rtyley.github.io/bfg-repo-cleaner/
```

**Then:**
1. Change all exposed secrets immediately
2. Regenerate API keys
3. Update database passwords
4. Force push (only if you're sure!)

---

## 🚨 Critical: Never Commit

- ❌ `.env` files
- ❌ Database connection strings with passwords
- ❌ API keys
- ❌ Private keys (`.pem`, `.key`)
- ❌ OAuth secrets
- ❌ JWT secrets
- ❌ Any file containing "password", "secret", "token", "key"

---

## ✅ Current .gitignore Status

Your `.gitignore` files are configured to ignore:
- ✅ All `.env*` files
- ✅ `node_modules/`
- ✅ `dist/` and build outputs
- ✅ Database files
- ✅ Log files
- ✅ OS files (.DS_Store, etc.)

---

## 📝 Next Steps

1. ✅ Verify `.gitignore` is in place
2. ✅ Check for any `.env` files
3. ✅ Review `git status` output
4. ✅ Commit and push safely!

---

**Remember:** When deploying to Railway, set environment variables in the Railway dashboard, NOT in code!

