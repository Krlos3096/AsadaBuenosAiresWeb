# Authentication System - Complete Setup Guide

This guide provides step-by-step instructions to set up the secure authentication system for your React + Cloudflare Workers + D1 project.

## Overview

The authentication system includes:
- **Backend**: JWT-based authentication with PBKDF2 password hashing
- **Frontend**: React Context for auth state management
- **Security**: Protected write endpoints, timing-safe password comparison
- **UI**: Login dialog using existing FullScreenDialog component

## Files Created/Modified

### Database
- `db/schema.sql` - Added `admins` table
- `db/seed-admin.ts` - Password hash generation utility
- `db/SEED_ADMIN_INSTRUCTIONS.md` - Instructions for creating admin user

### Backend (Worker)
- `worker/auth.ts` - Password hashing and JWT utilities (NEW)
- `worker/index.ts` - Added auth endpoints and middleware protection

### Configuration
- `wrangler.toml` - Added JWT_SECRET
- `.env` - Added VITE_JWT_SECRET

### Frontend (React)
- `src/context/AuthContext.tsx` - Auth context and provider (NEW)
- `src/components/LoginDialog/LoginDialog.tsx` - Login UI component (NEW)
- `src/components/LoginDialog/index.ts` - Export file (NEW)
- `src/services/dataService.ts` - Added auth methods and protected API calls

### Documentation
- `AUTH_IMPLEMENTATION_EXAMPLES.md` - Usage examples for components
- `AUTH_SETUP_GUIDE.md` - This file

## Setup Instructions

### Step 1: Run Database Migration

Apply the updated schema to your D1 database:

```bash
# Local development
npx wrangler d1 execute asada-buenosaires-db --local --file=./db/schema.sql

# Production
npx wrangler d1 execute asada-buenosaires-db --file=./db/schema.sql
```

### Step 2: Generate Secure JWT Secret

Generate a secure random string for JWT signing:

```bash
# Using OpenSSL
openssl rand -base64 32

# Or use any secure random string generator
```

### Step 3: Update Configuration Files

**wrangler.toml**:
```toml
[vars]
JWT_SECRET = "your-secure-random-secret-here"
```

**.env**:
```env
VITE_JWT_SECRET = "your-secure-random-secret-here"
```

⚠️ **IMPORTANT**: Use different secrets for local and production environments!

### Step 4: Create Initial Admin User

Follow the instructions in `db/SEED_ADMIN_INSTRUCTIONS.md` to create your first admin user.

Quick summary:
1. Generate a password hash using the provided Node.js script
2. Insert the admin user into the database using wrangler CLI
3. Default username: `admin`
4. Change the password immediately after first login

### Step 5: Wrap App with AuthProvider

In your `src/App.tsx`, wrap your app with the AuthProvider:

```tsx
import { AuthProvider } from './context/AuthContext';
import GlobalDialog from './components/FullScreenDialog/GlobalDialog';

function App() {
  return (
    <AuthProvider>
      <GlobalDialog>
        {/* Your existing app content */}
      </GlobalDialog>
    </AuthProvider>
  );
}
```

### Step 6: Add Login Button to AppBar

Add a "Portal Administrativo" button to your AppBar that opens the login dialog:

```tsx
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { LoginDialogContent } from '../components/LoginDialog';

const AppBar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { openDialog, closeDialog } = useDialog();

  const handleLoginClick = () => {
    openDialog({
      title: 'Portal Administrativo',
      content: <LoginDialogContent onSuccess={closeDialog} />,
      maxWidth: 'sm',
    });
  };

  return (
    <div>
      <button onClick={isAuthenticated ? logout : handleLoginClick}>
        {isAuthenticated ? `Cerrar Sesión (${user?.username})` : 'Portal Administrativo'}
      </button>
    </div>
  );
};
```

### Step 7: Add Edit Mode to Components

Add conditional edit controls to your components using the `useAuth` hook:

```tsx
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Regular content */}
      
      {isAuthenticated && (
        <div className="edit-controls">
          <button onClick={handleEdit}>Editar</button>
          <button onClick={handleDelete}>Eliminar</button>
        </div>
      )}
    </div>
  );
};
```

See `AUTH_IMPLEMENTATION_EXAMPLES.md` for complete examples.

### Step 8: Test the Authentication

1. Start your local development servers:
   ```bash
   # Terminal 1: Start React app
   npm start

   # Terminal 2: Start Cloudflare Worker
   cd worker
   npm run dev
   ```

2. Click "Portal Administrativo" in your app
3. Enter admin credentials
4. Verify edit controls appear on components
5. Test creating/editing/deleting content
6. Logout and verify edit controls disappear

## API Endpoints

### Authentication Endpoints

- `POST /auth/login` - Login with username and password
  - Body: `{ username, password }`
  - Returns: `{ token, user }`

- `POST /auth/logout` - Logout (client-side token removal)
  - Returns: `{ success: true }`

- `GET /auth/me` - Get current user
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ id, username, created_at }`

### Protected Endpoints

All write operations now require authentication:

- `POST /cards` - Create card
- `PUT /cards/:id` - Update card
- `DELETE /cards/:id` - Delete card
- `POST /home-slides` - Create home slide
- `PUT /home-slides/:id` - Update home slide
- `DELETE /home-slides/:id` - Delete home slide
- `POST /timeline` - Create timeline item
- `PUT /timeline/:id` - Update timeline item
- `DELETE /timeline/:id` - Delete timeline item
- `PUT /stats` - Update stats
- `PUT /about/:type` - Update about content
- `PUT /contacts` - Update contacts

All protected endpoints require:
- Header: `Authorization: Bearer <token>`
- Returns `401 Unauthorized` if token is missing or invalid

## Security Features

### Password Security
- **PBKDF2** with 100,000 iterations
- **SHA-256** hash algorithm
- **Random salt** for each password
- **Timing-safe comparison** to prevent timing attacks

### JWT Security
- **HMAC-SHA256** signing
- **24-hour expiration** on tokens
- **Secure secret** stored in environment variables
- **Token verification** on every protected request

### API Security
- **CORS headers** include Authorization
- **All write operations** protected
- **Proper HTTP status codes** (401, 403, etc.)
- **Input validation** on login

## Deployment Checklist

Before deploying to production:

- [ ] Generate a secure JWT_SECRET for production
- [ ] Update wrangler.toml with production JWT_SECRET
- [ ] Run database migration on production D1
- [ ] Create admin user in production database
- [ ] Test authentication in production
- [ ] Change default admin password
- [ ] Enable HTTPS (Cloudflare Workers automatically uses HTTPS)
- [ ] Remove any test data
- [ ] Review and restrict admin access

## Troubleshooting

### Login Fails with 401
- Verify admin user exists in database
- Check password hash was generated correctly
- Ensure JWT_SECRET matches between worker and environment

### Token Expired
- Tokens expire after 24 hours
- User must log in again
- Consider implementing refresh tokens for better UX

### Protected Endpoint Returns 401
- Check Authorization header format: `Bearer <token>`
- Verify token hasn't expired
- Ensure JWT_SECRET is correct
- Check localStorage contains valid token

### CORS Errors
- Ensure worker includes Authorization in CORS headers
- Check API_URL in .env matches worker URL
- Verify worker is running on correct port

## Next Steps

### Optional Enhancements

1. **Refresh Tokens**: Implement token refresh for better UX
2. **Rate Limiting**: Add rate limiting to login endpoint
3. **Password Reset**: Implement password reset functionality
4. **Multiple Admins**: Add UI for managing admin users
5. **Audit Log**: Log all admin actions for security
6. **2FA**: Add two-factor authentication for enhanced security

### Edit Forms

Create edit forms for each content type:
- Card edit form
- Timeline item edit form
- Home slide edit form
- Stats edit form
- About content edit form
- Contacts edit form

Use the examples in `AUTH_IMPLEMENTATION_EXAMPLES.md` as a starting point.

## Support

For issues or questions:
1. Check `AUTH_IMPLEMENTATION_EXAMPLES.md` for usage examples
2. Review `db/SEED_ADMIN_INSTRUCTIONS.md` for admin setup
3. Verify all configuration files are correctly set up
4. Check Cloudflare Workers logs for errors
