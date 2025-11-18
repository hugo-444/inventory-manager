# 🔒 Security Guidelines

## Environment Variables

### Never Commit These Files:
- ❌ `.env`
- ❌ `.env.local`
- ❌ `.env.production`
- ❌ `backend/.env`
- ❌ `frontend/.env`
- ❌ Any file containing `DATABASE_URL` with passwords
- ❌ Any file containing API keys or secrets

### Safe to Commit:
- ✅ `.env.example` (template files with no real secrets)
- ✅ Configuration files (railway.json, render.yaml)
- ✅ Code files

## What's Protected

The `.gitignore` files are configured to automatically exclude:

1. **Environment Variables:**
   - All `.env*` files
   - Files containing secrets

2. **Build Outputs:**
   - `node_modules/`
   - `dist/` and `build/` directories

3. **Database Files:**
   - Local database files (`.db`, `.sqlite`)

4. **Logs:**
   - All log files

5. **OS/IDE Files:**
   - `.DS_Store`
   - `.vscode/`, `.idea/`

## Railway Deployment

When deploying to Railway:
- Set environment variables in Railway dashboard
- Never hardcode secrets in code
- Use Railway's environment variable system

## If Secrets Were Committed

If you accidentally committed secrets:

1. **Immediately:**
   - Change all exposed passwords/keys
   - Regenerate API keys
   - Update database credentials

2. **Remove from Git:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push** (only if you're the only contributor)

---

**Remember:** `.env` files are in `.gitignore` and will NOT be committed to GitHub.

