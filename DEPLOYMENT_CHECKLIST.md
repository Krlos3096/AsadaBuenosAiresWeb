# Production Deployment Checklist

Use this checklist to ensure a safe and complete production deployment.

## Pre-Deployment Checklist

### Prerequisites
- [ ] Cloudflare account with Workers enabled
- [ ] Domain registered and added to Cloudflare
- [ ] Wrangler CLI installed and authenticated
- [ ] Node.js >= 24.15.0 installed
- [ ] Git repository set up with proper access

### Configuration
- [ ] Updated `worker/wrangler.toml` with production database IDs
- [ ] Updated `worker/wrangler.toml` with production bucket names
- [ ] Updated `worker/wrangler.toml` with custom domain names
- [ ] Created `.env.production` with correct API URLs
- [ ] Created `.env.staging` with staging URLs
- [ ] Updated `_headers` with security headers
- [ ] Updated `_redirects` with SPA routing

### Secrets Setup
- [ ] Generated secure JWT secrets (production and staging)
- [ ] Set JWT_SECRET for production: `wrangler secret put JWT_SECRET --env production`
- [ ] Set JWT_SECRET for staging: `wrangler secret put JWT_SECRET --env staging`
- [ ] Created `.dev.vars` for local development
- [ ] Added `.dev.vars` to `.gitignore`
- [ ] No secrets committed to git

### Database Setup
- [ ] Created production D1 database: `wrangler d1 create asada-buenosaires-db-prod`
- [ ] Created staging D1 database: `wrangler d1 create asada-buenosaires-db-staging`
- [ ] Updated `wrangler.toml` with database IDs
- [ ] Applied schema to production: `wrangler d1 execute DB_ID --remote --file=schema.sql --env production`
- [ ] Applied schema to staging: `wrangler d1 execute DB_ID --remote --file=schema.sql --env staging`
- [ ] Seeded admin user for production
- [ ] Seeded admin user for staging
- [ ] Verified database connections

### R2 Setup
- [ ] Created production R2 bucket: `wrangler r2 bucket create asada-buenosaires-images-prod`
- [ ] Created staging R2 bucket: `wrangler r2 bucket create asada-buenosaires-images-staging`
- [ ] Enabled public access on production bucket
- [ ] Enabled public access on staging bucket
- [ ] Configured custom domain for CDN (cdn.asadabuenosaires.com)
- [ ] Uploaded initial images to production bucket
- [ ] Uploaded initial images to staging bucket
- [ ] Verified image URLs work correctly

### Code Review
- [ ] All code reviewed and approved
- [ ] All tests passing locally
- [ ] No console errors in browser
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Authentication hardening implemented
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Error handling in place

### Testing
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing completed on staging
- [ ] API endpoints tested on staging
- [ ] Frontend tested on staging
- [ ] Authentication flow tested
- [ ] File upload tested
- [ ] Image display tested
- [ ] Mobile responsiveness tested
- [ ] Cross-browser testing completed

## Deployment Steps

### Staging Deployment
- [ ] Deployed worker to staging: `npm run worker:deploy:staging`
- [ ] Verified worker deployment: `wrangler deployments list --env staging`
- [ ] Tested API endpoints on staging
- [ ] Deployed frontend to staging
- [ ] Verified frontend deployment
- [ ] Tested full application on staging
- [ ] Checked worker logs for errors
- [ ] Verified database connections on staging
- [ ] Verified R2 connections on staging

### Production Deployment
- [ ] Created backup of production database (if exists)
- [ ] Notified team of upcoming deployment
- [ ] Deployed worker to production: `npm run worker:deploy:production`
- [ ] Verified worker deployment: `wrangler deployments list --env production`
- [ ] Set up worker logs monitoring: `wrangler tail --env production`
- [ ] Tested API endpoints on production
- [ ] Deployed frontend to production
- [ ] Verified frontend deployment
- [ ] Tested full application on production
- [ ] Verified authentication works
- [ ] Verified image loading works
- [ ] Checked SSL/TLS certificates
- [ ] Verified custom domains resolve correctly

## Post-Deployment Verification

### Health Checks
- [ ] Frontend loads at https://www.asadabuenosaires.com
- [ ] API responds at https://api.asadabuenosaires.com
- [ ] CDN serves images at https://cdn.asadabuenosaires.com
- [ ] Health check endpoint responds
- [ ] Authentication login works
- [ ] File upload works
- [ ] All API endpoints respond correctly
- [ ] No console errors in browser
- [ ] No errors in worker logs

### Performance Checks
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Images load quickly
- [ ] No layout shifts
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals passing

### Security Verification
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] CORS headers correct
- [ ] Rate limiting active
- [ ] JWT tokens expire correctly
- [ ] Password hashing working
- [ ] No sensitive data in logs

### Monitoring Setup
- [ ] Cloudflare Analytics enabled
- [ ] Worker Analytics enabled
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Uptime monitoring configured
- [ ] Alert rules configured
- [ ] Log aggregation set up

## Domain Configuration

### DNS Records
- [ ] CNAME www → asada-buenosaires-web.pages.dev (Proxied)
- [ ] CNAME api → worker URL (Proxied)
- [ ] CNAME cdn → R2 domain (Proxied)
- [ ] CNAME staging → staging Pages domain (Proxied)
- [ ] DNS propagation verified
- [ ] SSL/TLS certificates valid
- [ ] SSL/TLS mode set to "Full (strict)"

### Worker Routes
- [ ] Routes configured in `wrangler.toml`
- [ ] Custom domain connected to Worker
- [ ] Zone ID correct in configuration
- [ ] Route patterns tested

## CI/CD Setup

### GitHub Integration
- [ ] GitHub Actions workflow created
- [ ] Cloudflare API token added to GitHub secrets
- [ ] Cloudflare Account ID added to GitHub secrets
- [ ] Environment secrets configured
- [ ] Test workflow passing
- [ ] Deployment workflow tested
- [ ] Staging deployment automated
- [ ] Production deployment automated

### Environment Variables
- [ ] REACT_APP_API_URL set in GitHub secrets
- [ ] REACT_APP_IMAGE_BASE_URL set in GitHub secrets
- [ ] Worker secrets set via wrangler
- [ ] No secrets in code or git

## Documentation

- [ ] Deployment guide updated
- [ ] API documentation current
- [ ] Runbooks created
- [ ] Incident response plan documented
- [ ] Team trained on procedures
- [ ] Contact information documented

## Maintenance Tasks

### Regular Maintenance
- [ ] Schedule weekly dependency updates
- [ ] Schedule monthly security audits
- [ ] Schedule quarterly backup tests
- [ ] Schedule annual disaster recovery tests
- [ ] Monitor costs monthly
- [ ] Review logs regularly

### Backup Verification
- [ ] Automated daily backups configured
- [ ] Backup restoration tested
- [ ] R2 versioning enabled
- [ ] Lifecycle rules configured
- [ ] Cross-region replication configured

### Security Maintenance
- [ ] Secrets rotation scheduled (every 90 days)
- [ ] Security headers reviewed quarterly
- [ ] Dependencies scanned regularly
- [ ] Access reviews scheduled
- [ ] Security training for team

## Rollback Plan

### Rollback Procedures Documented
- [ ] Worker rollback procedure documented
- [ ] Frontend rollback procedure documented
- [ ] Database rollback procedure documented
- [ ] Team trained on rollback
- [ ] Rollback tested

### Rollback Triggers
- [ ] Error rate > 5%
- [ ] Response time > 2s
- [ ] Critical functionality broken
- [ ] Security issue detected
- [ ] Data corruption

## Sign-Off

### Pre-Deployment
- [ ] Developer sign-off
- [ ] QA sign-off
- [ ] Security review sign-off
- [ ] Product owner sign-off

### Post-Deployment
- [ ] Deployment successful
- [ ] Verification complete
- [ ] Monitoring active
- [ ] Documentation updated
- [ ] Team notified

## Notes

**Deployment Date**: _______________

**Deployed By**: _______________

**Version**: _______________

**Rollback Commit**: _______________

**Issues Encountered**: _______________

**Follow-up Actions**: _______________
