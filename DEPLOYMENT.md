# Production Deployment Guide for ASADA Buenos Aires Web

This guide covers deploying the full stack (React frontend + Cloudflare Worker API + D1 + R2) to Cloudflare.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [D1 Database Setup](#d1-database-setup)
4. [R2 Bucket Setup](#r2-bucket-setup)
5. [Worker Deployment](#worker-deployment)
6. [React Frontend Deployment](#react-frontend-deployment)
7. [Environment Variables and Secrets](#environment-variables-and-secrets)
8. [Domain Configuration](#domain-configuration)
9. [Verification](#verification)

## Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI installed: `npm install -g wrangler`
- Node.js >= 24.15.0
- Git

```bash
# Authenticate with Cloudflare
wrangler login
```

## Initial Setup

### 1. Update wrangler.toml with your domain

Replace the placeholder values in `worker/wrangler.toml`:
- `PRODUCTION_DATABASE_ID` - after creating production D1 database
- `STAGING_DATABASE_ID` - after creating staging D1 database
- `asadabuenosaires.com` - replace with your actual domain
- Update routes patterns with your actual domain

### 2. Create production D1 databases

```bash
# Create production database
wrangler d1 create asada-buenosaires-db-prod

# Note the database_id and update wrangler.toml

# Create staging database
wrangler d1 create asada-buenosaires-db-staging

# Note the database_id and update wrangler.toml
```

### 3. Create production R2 buckets

```bash
# Create production bucket
wrangler r2 bucket create asada-buenosaires-images-prod

# Create staging bucket
wrangler r2 bucket create asada-buenosaires-images-staging
```

## D1 Database Setup

### Apply Schema to Production

```bash
# Apply schema to production database
cd worker
wrangler d1 execute DB_ID --remote --file=schema.sql --env production

# Apply schema to staging database
wrangler d1 execute DB_ID --remote --file=schema.sql --env staging
```

Replace `DB_ID` with the actual database ID from wrangler.toml or use the database name:
```bash
wrangler d1 execute asada-buenosaires-db-prod --remote --file=schema.sql
```

### Seed Admin User

```bash
# Seed admin user for production
tsx seed-admin.ts --env production

# Seed admin user for staging
tsx seed-admin.ts --env staging
```

### Migration Strategy

For future schema changes:
1. Create a new migration file in `worker/migrations/` directory
2. Use descriptive names: `001_add_new_field.sql`, `002_update_table.sql`
3. Apply migrations in order:
```bash
wrangler d1 execute DB_ID --remote --file=migrations/001_add_new_field.sql --env production
```

### Safety Tips

- Always backup production data before schema changes
- Test migrations on staging first
- Use transactional migrations when possible
- Keep a migration history log

## R2 Bucket Setup

### Configure Public Access

1. Go to Cloudflare Dashboard > R2 > asada-buenosaires-images-prod
2. Settings > Public Access
3. Enable "Allow public read access"
4. Configure custom domain (e.g., cdn.asadabuenosaires.com)

### Upload Initial Images

```bash
# Upload images to production bucket
wrangler r2 object put asada-buenosaires-images-prod/news/image1.jpg --file=path/to/image1.jpg

# Upload entire directory
wrangler r2 object put asada-buenosaires-images-prod/path/to/image.jpg --file=local/path/to/image.jpg
```

### Image Key Storage in D1

Store only the relative path in D1 (not full URLs):
- Good: `news/2024-01-15-image1.jpg`
- Bad: `https://cdn.asadabuenosaires.com/news/2024-01-15-image1.jpg`

The `IMAGE_BASE_URL` environment variable will be prepended at runtime.

### Bucket Naming Convention

- Production: `asada-buenosaires-images-prod`
- Staging: `asada-buenosaires-images-staging`
- Local: `asada-buenosaires-images`

## Worker Deployment

### Set Secrets

```bash
# Set JWT secret for production
cd worker
wrangler secret put JWT_SECRET --env production
# Enter a secure random string (generate with: openssl rand -base64 32)

# Set JWT secret for staging
wrangler secret put JWT_SECRET --env staging
# Enter a different secure random string

# Set secrets for local development
# Create .dev.vars file in worker directory:
# JWT_SECRET=your-secret-here
```

### Deploy to Staging

```bash
cd worker
wrangler deploy --env staging
```

### Deploy to Production

```bash
cd worker
wrangler deploy --env production
```

### Deploy to Local Development

```bash
cd worker
wrangler dev
```

### Verify Deployment

```bash
# Check worker logs
wrangler tail --env production

# Test API endpoint
curl https://api.asadabuenosaires.com/api/cards
```

## React Frontend Deployment

### Option 1: Cloudflare Pages (Recommended)

#### Connect GitHub Repository

1. Go to Cloudflare Dashboard > Pages
2. "Create a project" > "Connect to Git"
3. Select your repository
4. Configure build settings:
   - Build command: `npm run build:production`
   - Build output directory: `build`

#### Configure Environment Variables

In Cloudflare Pages project settings:
```
REACT_APP_API_URL=https://api.asadabuenosaires.com
REACT_APP_IMAGE_BASE_URL=https://cdn.asadabuenosaires.com
REACT_APP_ENVIRONMENT=production
```

#### Configure Custom Domain

1. Pages project > Custom domains
2. Add domain: `www.asadabuenosaires.com`
3. Configure DNS records as shown by Cloudflare

#### Configure Staging Environment

Create a separate Pages project for staging with:
- Build command: `npm run build:staging`
- Environment variables pointing to staging endpoints
- Domain: `staging.asadabuenosaires.com`

### Option 2: Manual Deploy

```bash
# Build for production
npm run build:production

# Install Wrangler Pages CLI
npm install -g wrangler

# Deploy to Pages
wrangler pages deploy build --project-name=asada-buenosaires-web
```

## Environment Variables and Secrets

### Worker Secrets (Never commit to git)

```bash
# Production
wrangler secret put JWT_SECRET --env production
wrangler secret put API_KEY --env production  # If needed

# Staging
wrangler secret put JWT_SECRET --env staging

# Local development
# Create worker/.dev.vars file
JWT_SECRET=your-local-secret
ENVIRONMENT=local
IMAGE_BASE_URL=http://localhost:8787/images
```

### Frontend Environment Variables

These are build-time variables and can be committed:
- `.env.production` - Production build variables
- `.env.staging` - Staging build variables

**Important**: These are embedded in the build output. Never put secrets here.

### Secret Generation

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate API keys
openssl rand -hex 32
```

## Domain Configuration

### Recommended Domain Structure

```
Frontend (Pages):  https://www.asadabuenosaires.com
API (Worker):      https://api.asadabuenosaires.com
CDN (R2):          https://cdn.asadabuenosaires.com
Staging:           https://staging.asadabuenosaires.com
```

### DNS Configuration

In Cloudflare DNS:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | www | asada-buenosaires-web.pages.dev | Proxied (orange) |
| CNAME | api | asada-buenosaires-api-prod.YOUR_ACCOUNT.workers.dev | Proxied (orange) |
| CNAME | cdn | asada-buenosaires-images-prod.r2.dev | Proxied (orange) |
| CNAME | staging | asada-buenosaires-web-staging.pages.dev | Proxied (orange) |

### Worker Routes Configuration

The routes are already configured in `wrangler.toml`:
```toml
[env.production]
routes = [
  { pattern = "api.asadabuenosaires.com/*", zone_name = "asadabuenosaires.com" }
]
```

### SSL/TLS

Cloudflare automatically provides SSL for all proxied domains. Ensure:
- SSL/TLS mode is set to "Full (strict)" in Cloudflare Dashboard
- Origin certificates are used if needed

## Verification

### Test Production Deployment

```bash
# Test API
curl https://api.asadabuenosaires.com/api/cards
curl https://api.asadabuenosaires.com/api/contacts

# Test frontend
curl https://www.asadabuenosaires.com

# Test CDN
curl https://cdn.asadabuenosaires.com/path/to/image.jpg

# Test authentication
curl -X POST https://api.asadabuenosaires.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'
```

### Monitor Worker Logs

```bash
# Real-time logs
cd worker
wrangler tail --env production

# View recent logs in Cloudflare Dashboard
# Workers & Pages > asada-buenosaires-api-prod > Logs
```

### Health Checks

Create a simple health check endpoint in your worker:
```typescript
// In worker/index.ts
if (url.pathname === '/health') {
  return jsonResponse({ status: 'ok', timestamp: Date.now() });
}
```

Test: `curl https://api.asadabuenosaires.com/health`

## Rollback Procedure

### Worker Rollback

```bash
# View deployment history
wrangler deployments list --env production

# Rollback to previous version
wrangler rollback --env production
```

### Pages Rollback

In Cloudflare Dashboard > Pages > Project > Deployments:
- Click on the deployment you want to rollback to
- Click "Rollback to this deployment"

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure your worker has proper CORS headers
2. **Database connection errors**: Verify D1 bindings in wrangler.toml
3. **Secret not found**: Ensure secrets are set with `wrangler secret put`
4. **Build failures**: Check build logs in Cloudflare Dashboard
5. **Domain not resolving**: Check DNS configuration and propagation

### Debug Mode

```bash
# Enable verbose logging
wrangler deploy --env production --loglevel debug
```

## Next Steps

- [ ] Set up CI/CD pipeline (see CI_CD.md)
- [ ] Configure monitoring and alerts
- [ ] Set up automated backups
- [ ] Configure rate limiting
- [ ] Set up error tracking (Sentry, etc.)
