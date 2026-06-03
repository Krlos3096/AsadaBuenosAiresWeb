# Authentication Production Hardening Guide

This guide covers hardening the authentication system for production deployment on Cloudflare.

## Current Authentication Setup

The application uses:
- JWT (JSON Web Tokens) for stateless authentication
- Password hashing with bcrypt
- Cookie-based token storage
- D1 database for user credentials

## Security Hardening Recommendations

### 1. JWT Configuration

#### Token Expiration

**Current Issue**: Tokens may not have proper expiration.

**Recommendations**:
```typescript
// In worker/auth.ts
const JWT_EXPIRATION = '15m'; // Access token: 15 minutes
const JWT_REFRESH_EXPIRATION = '7d'; // Refresh token: 7 days

// Access token - short-lived
function createAccessToken(payload: any): string {
  return createToken(payload, JWT_EXPIRATION);
}

// Refresh token - longer-lived
function createRefreshToken(payload: any): string {
  return createToken(payload, JWT_REFRESH_EXPIRATION);
}
```

#### Token Storage Strategy

**Recommended**: Use HttpOnly, Secure, SameSite cookies

```typescript
// In worker/index.ts - Login endpoint
function setAuthCookie(response: Response, token: string, isRefresh: boolean = false): Response {
  const cookieOptions = [
    `token=${token}`,
    'HttpOnly', // Prevents JavaScript access
    'Secure',   // Only sent over HTTPS
    'SameSite=Strict', // CSRF protection
    'Path=/',
    isRefresh ? 'Max-Age=604800' : 'Max-Age=900', // 7d vs 15m
  ];
  
  response.headers.set('Set-Cookie', cookieOptions.join('; '));
  return response;
}
```

### 2. Password Security

#### Password Hashing

**Ensure bcrypt is properly configured**:
```typescript
// In worker/auth.ts
const SALT_ROUNDS = 12; // Minimum 10, 12 is recommended for production

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}
```

#### Password Requirements

**Implement password policy**:
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

```typescript
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 12) {
    return { valid: false, error: 'Password must be at least 12 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain a number' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain a special character' };
  }
  return { valid: true };
}
```

### 3. HTTPS-Only Behavior

#### Force HTTPS

Cloudflare automatically provides HTTPS, but add these headers:

```typescript
// In worker/index.ts - Add to all responses
function addSecurityHeaders(response: Response): Response {
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}
```

### 4. SameSite Cookie Policy

**Current**: Not explicitly set

**Recommendation**: Always use `SameSite=Strict` or `SameSite=Lax`

```typescript
// Strict - Most secure, prevents all cross-site cookies
'SameSite=Strict'

// Lax - Allows some cross-site cookies (recommended for most apps)
'SameSite=Lax'

// None - Required for cross-origin requests (must be used with Secure)
'SameSite=None; Secure'
```

**For this application**: Use `SameSite=Strict` since the API and frontend are on the same domain.

### 5. CORS Configuration

**Current**: `Access-Control-Allow-Origin: *`

**Security Issue**: This allows any origin to access your API.

**Recommendation**: Restrict to specific origins:

```typescript
// In worker/index.ts
const ALLOWED_ORIGINS = [
  'https://www.asadabuenosaires.com',
  'https://asadabuenosaires.com',
  'https://staging.asadabuenosaires.com',
];

function getCorsHeaders(request: Request): Headers {
  const origin = request.headers.get('Origin');
  const headers = new Headers();
  
  if (ALLOWED_ORIGINS.includes(origin || '')) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return headers;
}
```

### 6. Rate Limiting

**Implement rate limiting** to prevent brute force attacks:

```typescript
// In worker/index.ts
const RATE_LIMIT = {
  window: 60 * 1000, // 1 minute
  maxRequests: 5,    // 5 requests per minute
};

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT.window });
    return true;
  }
  
  if (record.count >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// Apply to login endpoint
if (url.pathname === '/api/auth/login' && !checkRateLimit(ip)) {
  return errorResponse('Too many login attempts. Please try again later.', 429);
}
```

### 7. Session Management

#### Token Refresh Implementation

**Implement refresh token rotation**:

```typescript
// Add refresh token endpoint
async function handleRefreshToken(request: Request, env: Env): Promise<Response> {
  const refreshToken = request.headers.get('Cookie')?.match(/token=([^;]+)/)?.[1];
  
  if (!refreshToken) {
    return errorResponse('No refresh token provided', 401);
  }
  
  try {
    const payload = verifyToken(refreshToken, env.JWT_SECRET);
    
    // Generate new access token
    const newAccessToken = createAccessToken(payload);
    
    // Optionally rotate refresh token
    const newRefreshToken = createRefreshToken(payload);
    
    const response = jsonResponse({ success: true });
    setAuthCookie(response, newAccessToken, false);
    setAuthCookie(response, newRefreshToken, true);
    
    return response;
  } catch (error) {
    return errorResponse('Invalid refresh token', 401);
  }
}
```

#### Logout Implementation

```typescript
async function handleLogout(request: Request): Promise<Response> {
  const response = jsonResponse({ success: true });
  
  // Clear cookies by setting expiration in the past
  response.headers.set('Set-Cookie', 'token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
  
  return response;
}
```

### 8. Account Security Features

#### Implement these additional features:

1. **Account Lockout**: Lock account after N failed attempts
2. **Password Reset**: Implement secure password reset flow
3. **2FA**: Consider adding two-factor authentication for admin users
4. **Audit Logging**: Log all authentication events
5. **Session Monitoring**: Track active sessions

```typescript
// Account lockout example
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

const loginAttempts = new Map<string, { count: number; lockUntil?: number }>();

async function checkLoginAttempts(username: string): Promise<boolean> {
  const attempts = loginAttempts.get(username);
  
  if (attempts?.lockUntil && Date.now() < attempts.lockUntil) {
    return false; // Account is locked
  }
  
  return true;
}

async function recordFailedAttempt(username: string): Promise<void> {
  const attempts = loginAttempts.get(username) || { count: 0 };
  attempts.count++;
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockUntil = Date.now() + LOCKOUT_DURATION;
  }
  
  loginAttempts.set(username, attempts);
}

async function recordSuccessfulAttempt(username: string): Promise<void> {
  loginAttempts.delete(username);
}
```

### 9. Security Headers

Add these headers to all API responses:

```typescript
function addSecurityHeaders(response: Response): Response {
  // HSTS - Force HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (if serving HTML)
  response.headers.set('Content-Security-Policy', "default-src 'self'");
  
  // Permissions policy
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  return response;
}
```

### 10. JWT Secret Management

**Never commit JWT secrets to git**

```bash
# Generate secure secret
openssl rand -base64 32

# Set as secret in Cloudflare
wrangler secret put JWT_SECRET --env production
wrangler secret put JWT_SECRET --env staging

# For local development, use .dev.vars
# worker/.dev.vars:
JWT_SECRET=your-secret-here
```

### 11. Additional Recommendations

#### Implement IP Whitelisting for Admin Access

```typescript
const ADMIN_IPS = ['YOUR_ADMIN_IP', 'ANOTHER_ADMIN_IP'];

function isAdminRequest(request: Request): boolean {
  const ip = request.headers.get('CF-Connecting-IP');
  return ADMIN_IPS.includes(ip || '');
}
```

#### Implement Request Logging

```typescript
function logRequest(request: Request, response: Response, userId?: string): void {
  const log = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    ip: request.headers.get('CF-Connecting-IP'),
    userAgent: request.headers.get('User-Agent'),
    userId: userId || 'anonymous',
    status: response.status,
  };
  
  // Send to logging service (Cloudflare Analytics, Sentry, etc.)
  console.log(JSON.stringify(log));
}
```

#### Implement Input Validation

```typescript
function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
}
```

## Implementation Checklist

- [ ] Update JWT expiration times (15m access, 7d refresh)
- [ ] Implement HttpOnly, Secure, SameSite cookies
- [ ] Update CORS configuration to restrict origins
- [ ] Implement rate limiting on login endpoint
- [ ] Add account lockout after failed attempts
- [ ] Implement refresh token rotation
- [ ] Add logout endpoint
- [ ] Add security headers to all responses
- [ ] Set JWT secrets via wrangler secret put
- [ ] Implement password validation
- [ ] Add request logging
- [ ] Implement input sanitization
- [ ] Test authentication flow end-to-end

## Testing Security

### Test with OWASP ZAP or Burp Suite

1. Run security scans before production
2. Test for common vulnerabilities:
   - SQL injection
   - XSS
   - CSRF
   - Authentication bypass
   - Rate limiting bypass

### Manual Security Testing

```bash
# Test CORS
curl -H "Origin: https://evil.com" https://api.asadabuenosaires.com/api/cards

# Test rate limiting
for i in {1..10}; do
  curl -X POST https://api.asadabuenosaires.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
done

# Test HTTPS
curl -I http://api.asadabuenosaires.com  # Should redirect to HTTPS

# Test security headers
curl -I https://api.asadabuenosaires.com/api/cards
```

## Monitoring and Alerts

Set up alerts for:
- Failed login attempts spike
- Unusual API usage patterns
- Authentication errors
- Rate limit violations

Use Cloudflare Analytics or integrate with:
- Sentry
- Datadog
- New Relic
- Custom logging solution

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Cloudflare Workers Security Best Practices](https://developers.cloudflare.com/workers/configuration/security/)
- [MDN HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
