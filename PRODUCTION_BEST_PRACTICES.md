# Production Best Practices

This guide covers production best practices for the ASADA Buenos Aires Web application deployed on Cloudflare.

## Table of Contents

1. [Performance Optimization](#performance-optimization)
2. [Caching Strategy](#caching-strategy)
3. [Security Headers](#security-headers)
4. [Logging Strategy](#logging-strategy)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Monitoring Recommendations](#monitoring-recommendations)
8. [Backup Strategy](#backup-strategy)
9. [Disaster Recovery](#disaster-recovery)

## Performance Optimization

### Frontend Optimization

#### Code Splitting

React already handles code splitting with `react-scripts build`. Ensure:
- Lazy load routes with React.lazy()
- Use dynamic imports for large libraries
- Split vendor bundles

```typescript
// Example: Lazy load components
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// In render
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

#### Image Optimization

- Use WebP format where possible
- Implement responsive images
- Add lazy loading for below-the-fold images
- Serve images via CDN (R2 with custom domain)

```html
<!-- Responsive image example -->
<img
  srcset="image-320w.webp 320w,
          image-640w.webp 640w,
          image-1280w.webp 1280w"
  sizes="(max-width: 640px) 320px,
         (max-width: 1280px) 640px,
         1280px"
  src="image-1280w.webp"
  alt="Description"
  loading="lazy"
/>
```

#### Bundle Size Optimization

- Analyze bundle size: `npm run build` then check build folder
- Use `source-map-explorer` to analyze: `npm install --save-dev source-map-explorer`
- Add to package.json:
```json
"scripts": {
  "analyze": "source-map-explorer build/static/js/*.js"
}
```

### Worker Optimization

#### Minimize Cold Starts

- Keep worker code minimal
- Avoid heavy initialization
- Use cached responses where possible
- Implement edge caching

#### Response Compression

Cloudflare Workers automatically compress responses. Ensure:
- Enable Brotli compression in Cloudflare Dashboard
- Set appropriate cache headers

```typescript
// Cache headers for static data
function setCacheHeaders(response: Response, maxAge: number): Response {
  response.headers.set('Cache-Control', `public, max-age=${maxAge}`);
  return response;
}

// Usage for cards API (cache for 5 minutes)
return setCacheHeaders(jsonResponse(cards), 300);
```

## Caching Strategy

### Frontend Caching

#### Browser Caching

Configure in `_headers` file:

```
# Cache static assets for 1 year
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Cache images for 1 year
/images/*
  Cache-Control: public, max-age=31536000, immutable

# HTML files - cache for 1 hour but revalidate
/*.html
  Cache-Control: public, max-age=3600, must-revalidate
```

#### Service Worker (Optional)

Consider implementing a service worker for offline capability:
```javascript
// service-worker.js
const CACHE_NAME = 'asada-buenosaires-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

### API Caching

#### Worker-Level Caching

Use Cloudflare Cache API in Workers:

```typescript
// Cache API responses
async function cachedFetch(key: string, fetcher: () => Promise<Response>, ttl: number = 300): Promise<Response> {
  const cache = caches.default;
  const cached = await cache.match(key);
  
  if (cached) {
    return cached;
  }
  
  const response = await fetcher();
  const responseToCache = response.clone();
  
  await cache.put(key, responseToCache);
  
  return response;
}

// Usage
const cards = await cachedFetch('cards', () => getCardsFromDB(env), 300);
```

#### Database Query Caching

Cache frequently accessed data in D1:

```typescript
// Add caching layer
const cache = new Map<string, { data: any; expiry: number }>();

async function getCachedData(key: string, fetcher: () => Promise<any>, ttl: number = 300): Promise<any> {
  const cached = cache.get(key);
  
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, expiry: Date.now() + ttl * 1000 });
  
  return data;
}
```

### CDN Caching

Configure R2 with Cloudflare CDN:
1. Enable public access on R2 bucket
2. Add custom domain (cdn.asadabuenosaires.com)
3. Enable Cloudflare caching rules

## Security Headers

### Implement These Headers

Add to `_headers` file or in Worker middleware:

```
# Security headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Content Security Policy (CSP)

Implement CSP for additional security:

```
# CSP header
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.asadabuenosaires.com
```

## Logging Strategy

### Worker Logging

#### Structured Logging

Implement structured logging in Workers:

```typescript
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
}

function log(entry: LogEntry): void {
  console.log(JSON.stringify(entry));
}

// Usage
log({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'User login',
  context: { userId: '123', ip: request.headers.get('CF-Connecting-IP') }
});
```

#### Log Levels

- **INFO**: Normal operations, user actions
- **WARN**: Deprecated features, potential issues
- **ERROR**: Failed operations, exceptions

#### Log Aggregation

Send logs to external services:
- Cloudflare Analytics (built-in)
- Sentry (error tracking)
- Datadog (monitoring)
- Custom logging endpoint

```typescript
// Send to external service
async function sendLog(entry: LogEntry): Promise<void> {
  await fetch('https://your-logging-service.com/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
}
```

### Frontend Logging

#### Error Tracking

Integrate error tracking:
```javascript
// Error boundary component
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Send to error tracking service
    logErrorToService(error, errorInfo);
  }
}
```

#### User Analytics

Track user behavior (with consent):
```javascript
// Analytics tracking
function trackEvent(eventName, properties) {
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track(eventName, properties);
  }
}
```

## Error Handling

### Worker Error Handling

#### Graceful Error Responses

```typescript
function handleWorkerError(error: Error, context: string): Response {
  console.error(`Error in ${context}:`, error);
  
  // Don't expose internal errors to clients
  const isProduction = env.ENVIRONMENT === 'production';
  
  return jsonResponse(
    {
      error: isProduction ? 'An internal error occurred' : error.message,
      context: isProduction ? undefined : context,
    },
    500
  );
}
```

#### Error Boundaries

Wrap critical operations in try-catch:

```typescript
try {
  const result = await performOperation();
  return jsonResponse(result);
} catch (error) {
  return handleWorkerError(error as Error, 'performOperation');
}
```

### Frontend Error Handling

#### Global Error Handler

```javascript
// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to error tracking
});

// Unhandled promise rejection
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  // Send to error tracking
});
```

#### User-Friendly Error Messages

Display user-friendly error messages:
```typescript
function getErrorMessage(error: any): string {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
```

## Rate Limiting

### Implement Rate Limiting

#### IP-Based Rate Limiting

```typescript
const RATE_LIMITS = {
  window: 60 * 1000, // 1 minute
  maxRequests: 60,   // 60 requests per minute
};

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMITS.window });
    return { allowed: true, remaining: RATE_LIMITS.maxRequests - 1 };
  }
  
  if (record.count >= RATE_LIMITS.maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMITS.maxRequests - record.count };
}

// Apply to API routes
if (!checkRateLimit(ip).allowed) {
  return errorResponse('Rate limit exceeded. Please try again later.', 429);
}
```

#### Endpoint-Specific Rate Limits

Different limits for different endpoints:
```typescript
const RATE_LIMITS = {
  '/api/auth/login': { window: 60 * 1000, maxRequests: 5 },    // 5 per minute
  '/api/cards': { window: 60 * 1000, maxRequests: 60 },       // 60 per minute
  '/api/upload': { window: 60 * 1000, maxRequests: 10 },     // 10 per minute
};
```

#### Cloudflare Rate Limiting

Use Cloudflare's built-in rate limiting:
1. Go to Security > WAF > Rate Limiting Rules
2. Create rules for specific endpoints
3. Configure thresholds and actions

## Monitoring Recommendations

### Cloudflare Analytics

Leverage built-in Cloudflare features:
- **Analytics**: Traffic, requests, errors
- **Workers Analytics**: Worker invocations, errors, latency
- **R2 Analytics**: Storage usage, request counts
- **D1 Analytics**: Query performance, row counts

### External Monitoring Services

#### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

Monitor:
- Frontend availability
- API endpoints
- CDN accessibility

#### Performance Monitoring

Use tools like:
- Google PageSpeed Insights
- WebPageTest
- Lighthouse CI

#### Error Tracking

Integrate error tracking:
- Sentry (recommended)
- Rollbar
- Bugsnag

```javascript
// Sentry integration
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: process.env.REACT_APP_ENVIRONMENT,
});
```

### Custom Metrics

Track custom metrics:
```typescript
// Track response times
const startTime = Date.now();
const result = await operation();
const duration = Date.now() - startTime;

log({
  level: 'info',
  message: 'Operation completed',
  context: { operation: 'getCards', duration, status: 'success' }
});
```

### Alerting

Set up alerts for:
- High error rates (> 5%)
- High latency (> 1s)
- Rate limit violations
- Failed deployments
- Database connection errors

## Backup Strategy

### D1 Database Backups

#### Automated Backups

Cloudflare D1 doesn't have built-in automated backups. Implement:

```typescript
// Create backup script
async function backupDatabase(env: Env): Promise<void> {
  const tables = ['cards', 'card_authors', 'card_items', 'contacts', 'home_slides', 'timeline_items', 'stats', 'about_content', 'admins'];
  
  for (const table of tables) {
    const result = await env.asada_buenosaires_db.prepare(`SELECT * FROM ${table}`).all();
    
    // Store in R2
    const backupKey = `backups/${table}-${Date.now()}.json`;
    await env.asada_buenosaires_images.put(backupKey, JSON.stringify(result.results));
  }
}

// Schedule daily backup via Cloudflare Cron Triggers
// wrangler.toml:
# [triggers]
# crons = ["0 0 * * *"]  # Daily at midnight
```

#### Manual Backup

```bash
# Export data
wrangler d1 execute DB_ID --remote --command="SELECT * FROM cards"

# Save to file
wrangler d1 export DB_ID --remote --output=backup.sql
```

### R2 Backup Strategy

#### Cross-Region Replication

Configure R2 replication to another region:
1. Go to R2 bucket settings
2. Enable replication
3. Select destination region

#### Versioning

Enable R2 versioning:
```bash
wrangler r2 bucket configure asada-buenosaires-images-prod --versioning
```

#### Lifecycle Rules

Implement lifecycle rules:
- Move old files to cold storage
- Delete old backups after 90 days

```bash
wrangler r2 bucket configure asada-buenosaires-images-prod --lifecycle
```

## Disaster Recovery

### Recovery Procedures

#### Database Recovery

```bash
# Restore from backup
wrangler d1 execute DB_ID --remote --file=backup.sql

# Restore specific table
wrangler d1 execute DB_ID --remote --command="DELETE FROM cards"
wrangler d1 execute DB_ID --remote --file=cards-backup.sql
```

#### Worker Rollback

```bash
# View deployment history
wrangler deployments list --env production

# Rollback to previous version
wrangler rollback --env production
```

#### Frontend Rollback

Use Cloudflare Pages dashboard to rollback to previous deployment.

### Incident Response

#### Incident Response Plan

1. **Detection**: Monitoring alerts trigger
2. **Assessment**: Determine impact and scope
3. **Containment**: Isolate affected systems
4. **Eradication**: Fix the root cause
5. **Recovery**: Restore from backups if needed
6. **Post-Incident**: Document and improve

#### Communication Plan

- Internal team notification
- User communication (if outage > 15 min)
- Status page updates

### Testing Recovery

Regularly test recovery procedures:
- Monthly backup restoration tests
- Quarterly disaster recovery drills
- Annual full system failover tests

## Additional Best Practices

### Environment Separation

- Always use separate environments (dev, staging, production)
- Never use production credentials in development
- Test all changes in staging first

### Secret Management

- Never commit secrets to git
- Use Cloudflare Secrets for sensitive data
- Rotate secrets regularly (every 90 days)
- Use strong, randomly generated secrets

### Documentation

- Document all procedures
- Keep deployment guides up to date
- Maintain runbooks for common operations
- Document incident responses

### Security Regular Reviews

- Quarterly security audits
- Regular dependency updates
- Vulnerability scanning
- Penetration testing

### Performance Monitoring

- Regular performance audits
- Monitor Core Web Vitals
- Track bundle size over time
- Monitor API response times

### Cost Optimization

- Monitor Cloudflare usage and costs
- Optimize R2 storage (delete unused files)
- Use appropriate caching strategies
- Review and optimize Worker execution time

## Checklist

- [ ] Implement all security headers
- [ ] Set up comprehensive logging
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerting
- [ ] Implement backup strategy
- [ ] Document disaster recovery procedures
- [ ] Test backup restoration
- [ ] Set up error tracking
- [ ] Implement performance monitoring
- [ ] Configure CDN caching
- [ ] Set up automated backups
- [ ] Document incident response plan
