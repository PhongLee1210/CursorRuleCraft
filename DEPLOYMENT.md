# Deployment Guide for CursorRuleCraft on Render

## 🏗️ Architecture Overview

This is an NX monorepo deployed as a **single combined container** with:
- **Frontend**: React/Vite app served by Nginx on port 80
- **Backend**: NestJS API running on port 4000
- **Nginx**: Proxies `/api/*` requests to backend, serves frontend for all other routes

## 📦 Build Process

### TypeScript Build Output Structure
The backend build **preserves the source folder structure**:
```
apps/backend/dist/
  └── apps/backend/src/
      └── main.js  ← Entry point
```

⚠️ **IMPORTANT**: Do NOT assume `main.js` is at the root of `dist/`!

### Docker Build Stages
1. **base**: Install dependencies
2. **builder**: Build both frontend and backend
3. **combined**: Runtime container with Nginx + Node.js

## 🐋 Docker Container Structure

```
/app/
├── backend/
│   ├── apps/backend/src/main.js  ← Backend entry point (nested!)
│   ├── packages/shared-types/     ← Shared types for module-alias
│   ├── package.json               ← Contains module-alias config
│   └── node_modules/
├── /usr/share/nginx/html/         ← Frontend static files
└── docker-entrypoint.sh           ← Smart startup script
```

## 🚀 Startup Process

The `docker-entrypoint.sh` script:
1. **Finds** `main.js` dynamically (no hardcoded paths!)
2. **Starts** backend server in background
3. **Verifies** backend is running
4. **Starts** Nginx in foreground

## 🔧 Module Resolution

The backend uses `module-alias` to resolve `@cursorrulecraft/shared-types`:

```json
{
  "_moduleAliases": {
    "@cursorrulecraft/shared-types": "packages/shared-types/src"
  }
}
```

This path is **relative to `package.json`** location (`/app/backend/package.json`), so shared-types must be at `/app/backend/packages/shared-types/src`.

## 🌐 Render Configuration

### Ports
- **External**: Render routes traffic from `:10000` (public) → `:80` (container)
- **Internal**: 
  - Nginx listens on `:80`
  - Backend listens on `:4000`

### Health Check
- **Endpoint**: `/health` (served by Nginx, returns 200 immediately)
- **Interval**: 30s
- **Timeout**: 10s
- **Start Period**: 40s (gives backend time to initialize)

### Environment Variables
Required in Render dashboard:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`
- `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY_BASE64`, etc.

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find module '/app/backend/main.js'"
**Cause**: Hardcoded path doesn't match build output structure  
**Solution**: Use `docker-entrypoint.sh` which finds `main.js` dynamically

### Issue 2: "Cannot find module '@cursorrulecraft/shared-types'"
**Cause**: Shared-types not copied to correct location relative to `package.json`  
**Solution**: Must copy to `/app/backend/packages/shared-types` (see Dockerfile line 117)

### Issue 3: Health check timeout
**Cause**: Backend takes too long to start, or wrong port configuration  
**Solution**: 
- Nginx health check at `/health` responds immediately (doesn't wait for backend)
- Start period is 40s to allow backend initialization
- Backend starts in background so Nginx can handle health checks

### Issue 4: Port 10000 conflicts
**Cause**: Trying to listen on Render's reserved port  
**Solution**: Listen on port 80 internally; Render handles routing from 10000→80

## 📝 Making Changes

### Modifying Backend Code
1. Build preserves folder structure - entry point will be at nested path
2. `docker-entrypoint.sh` handles this automatically
3. Just commit and push - no path adjustments needed!

### Modifying Frontend Code
1. Vite builds to `/dist/apps/frontend/`
2. Copied to `/usr/share/nginx/html` in container
3. Nginx serves these files

### Modifying Nginx Config
- Edit: `apps/frontend/nginx.combined.conf`
- Must listen on port 80 (not 10000!)
- Health check endpoint: `/health` should return 200

## 🚢 Deployment Checklist

- [ ] All environment variables set in Render dashboard
- [ ] `render.yaml` build filters configured
- [ ] `docker-entrypoint.sh` is executable (`chmod +x`)
- [ ] Nginx listens on port 80 (not 10000)
- [ ] Health check endpoint returns quickly
- [ ] Git commit and push to trigger deploy

## 📊 Monitoring

**View logs**: Use Render MCP tools or dashboard
```bash
# Check latest logs
mcp_render_list_logs resource=["srv-d3n1ujb3fgac73a8r1l0"] limit=50
```

**Check service health**:
```bash
curl https://cursorrulecraft.onrender.com/health
curl https://cursorrulecraft.onrender.com/api/health
```

## 🎯 Key Takeaways

1. **Never hardcode paths** - Use `docker-entrypoint.sh` to find files dynamically
2. **Module-alias paths** are relative to `package.json` location
3. **Nginx on port 80**, Render routes from 10000 automatically
4. **Health checks** should be fast - use Nginx endpoint, not backend
5. **Build structure** is nested - `apps/backend/dist/apps/backend/src/main.js`

