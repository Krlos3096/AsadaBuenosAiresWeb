# ASADA Buenos Aires Web - Production Deployment Guide

This repository contains the production deployment configuration for the ASADA Buenos Aires web application.

## Quick Links

- [Full Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [Authentication Hardening](./AUTHENTICATION_HARDENING.md) - Security hardening for authentication
- [Production Best Practices](./PRODUCTION_BEST_PRACTICES.md) - Performance, security, and monitoring best practices
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Pre and post-deployment checklist

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare Edge                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Pages      │  │   Worker     │  │     R2       │       │
│  │   (React)    │  │   (API)      │  │   (Images)   │       │
│  │              │  │              │  │              │       │
│  │ www.asada    │  │ api.asada    │  │ cdn.asada    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                 │                 │                │
│         └─────────────────┴─────────────────┘                │
│                           │                                   │
│                     ┌──────▼──────┐                          │
│                     │     D1      │                          │
│                     │  (Database)  │                          │
│                     └─────────────┘                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Environment Structure

### Local Development
- Frontend: `http://localhost:3000`
- Worker: `http://localhost:8787`
- Database: Local D1 (via Wrangler)
- Images: Local R2 (via Wrangler)

### Staging
- Frontend: `https://staging.asadabuenosaires.com`
- Worker: `https://api-staging.asadabuenosaires.com`
- Database: `asada-buenosaires-db-staging`
- Images: `asada-buenosaires-images-staging`

### Production
- Frontend: `https://www.asadabuenosaires.com`
- Worker: `https://api.asadabuenosaires.com`
- Database: `asada-buenosaires-db-prod`
- Images: `asada-buenosaires-images-prod`

## Key Configuration Files

### Worker Configuration
- `worker/wrangler.toml` - Worker deployment configuration with environment separation

### Frontend Configuration
- `.env.production` - Production environment variables
- `.env.staging` - Staging environment variables
- `_headers` - HTTP headers for Cloudflare Pages
- `_redirects` - URL redirects for SPA routing

### CI/CD
- `.github/workflows/deploy.yml` - GitHub Actions deployment workflow

## Deployment Commands

### Local Development
```bash
# Start React frontend
npm start

# Start Worker API
npm run worker:dev

# Run database migrations
npm run db:migrate
```

### Staging Deployment
```bash
# Deploy Worker to staging
npm run worker:deploy:staging

# Build frontend for staging
npm run build:staging

# Deploy frontend to staging (via Cloudflare Pages)
# Or use GitHub Actions automatically
```

### Production Deployment
```bash
# Deploy Worker to production
npm run worker:deploy:production

# Build frontend for production
npm run build:production

# Deploy frontend to production (via Cloudflare Pages)
# Or use GitHub Actions automatically
```

## Secrets Management

### Required Secrets

**Worker Secrets** (set via `wrangler secret put`):
- `JWT_SECRET` - Production JWT secret
- `JWT_SECRET` (staging) - Staging JWT secret

**GitHub Secrets** (for CI/CD):
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare Account ID
- `REACT_APP_API_URL` - Production API URL
- `REACT_APP_IMAGE_BASE_URL` - Production CDN URL
- `REACT_APP_API_URL_STAGING` - Staging API URL
- `REACT_APP_IMAGE_BASE_URL_STAGING` - Staging CDN URL

### Setting Secrets

```bash
# Worker secrets
cd worker
wrangler secret put JWT_SECRET --env production
wrangler secret put JWT_SECRET --env staging

# GitHub secrets (via GitHub UI)
# Settings > Secrets and variables > Actions
```

## Monitoring

### Cloudflare Dashboard
- **Analytics**: Traffic and performance metrics
- **Workers Analytics**: Worker invocations and errors
- **R2 Analytics**: Storage and request metrics
- **D1 Analytics**: Database query performance

### Worker Logs
```bash
# Real-time logs
cd worker
wrangler tail --env production
```

### Health Check
```bash
# Test API health
curl https://api.asadabuenosaires.com/health

# Test frontend
curl https://www.asadabuenosaires.com
```

## Troubleshooting

### Common Issues

**Worker deployment fails**
- Check `wrangler.toml` configuration
- Verify secrets are set
- Check Cloudflare dashboard for errors

**Frontend build fails**
- Check environment variables
- Verify dependencies are installed
- Check for TypeScript errors

**Database connection errors**
- Verify D1 bindings in `wrangler.toml`
- Check database ID is correct
- Ensure database exists

**Images not loading**
- Verify R2 bucket exists
- Check public access is enabled
- Verify custom domain configuration

## Support

For deployment issues:
1. Check the [Deployment Guide](./DEPLOYMENT.md)
2. Review the [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
3. Check Cloudflare dashboard logs
4. Review Worker logs: `wrangler tail`

## Architecture Decisions

### Why Cloudflare Pages?
- Global CDN distribution
- Automatic HTTPS
- Easy GitHub integration
- Preview deployments
- Zero config deployment

### Why Cloudflare Workers?
- Edge computing
- No server management
- Global distribution
- Direct D1/R2 access
- Pay-per-request pricing

### Why D1?
- Serverless SQLite
- Edge replication
- Simple schema
- Direct Worker access
- Automatic backups

### Why R2?
- S3-compatible API
- Zero egress fees
- Global distribution
- Public access support
- Custom domains

## Security

- All communications over HTTPS
- JWT-based authentication
- CORS properly configured
- Rate limiting implemented
- Security headers configured
- Secrets never committed to git

See [Authentication Hardening](./AUTHENTICATION_HARDENING.md) for detailed security recommendations.

## Performance

- Static assets cached at edge
- Images served via CDN
- Worker responses cached
- Code splitting implemented
- Lazy loading for routes
- Optimized bundle size

See [Production Best Practices](./PRODUCTION_BEST_PRACTICES.md) for detailed performance recommendations.

## License

Copyright © 2024 ASADA Buenos Aires
