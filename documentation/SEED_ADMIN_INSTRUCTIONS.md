# Creating the Initial Admin User

## Method 1: Using the Worker Dashboard (Recommended for Production)

1. Go to your Cloudflare Workers dashboard
2. Navigate to D1 databases
3. Select your database
4. Open the SQL editor
5. Run the following command to create an admin user:

```sql
INSERT INTO admins (username, password_hash) VALUES ('admin', 'YOUR_HASH_HERE');
```

## Method 2: Using Wrangler CLI (Local Development)

### Step 1: Generate a password hash

Since Cloudflare Workers don't have bcrypt, we use PBKDF2 with Web Crypto API. You can generate a hash using the following Node.js script:

```javascript
// generate-hash.js
async function generatePasswordHash(password) {
  const crypto = require('crypto');
  
  // Generate a random salt
  const salt = crypto.randomBytes(16);
  
  // Derive key using PBKDF2
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
  // Combine salt and hash
  const combined = Buffer.concat([salt, hash]);
  
  // Convert to base64
  return combined.toString('base64');
}

const password = 'your-secure-password';
const hash = generatePasswordHash(password);
console.log('Password hash:', hash);
```

Run it:
```bash
node generate-hash.js
```

### Step 2: Insert the admin user

Replace `YOUR_HASH_HERE` with the generated hash:

```bash
npx wrangler d1 execute asada-buenosaires-db --local --command="INSERT INTO admins (username, password_hash) VALUES ('admin', 'YOUR_HASH_HERE')"
```

For production (without --local):
```bash
npx wrangler d1 execute asada-buenosaires-db --command="INSERT INTO admins (username, password_hash) VALUES ('admin', 'YOUR_HASH_HERE')"
```

## Default Credentials (After Setup)

- **Username:** admin
- **Password:** (whatever you set during setup)

⚠️ **IMPORTANT:** Change the default password immediately after first login!

## Verifying the Admin User

Check if the admin was created:

```bash
npx wrangler d1 execute asada-buenosaires-db --local --command="SELECT * FROM admins"
```

## Security Notes

1. **Never commit passwords or hashes to version control**
2. **Use strong passwords** (at least 12 characters, mix of upper/lowercase, numbers, symbols)
3. **Change JWT_SECRET** in wrangler.toml before deploying to production
4. **Generate a secure JWT_SECRET** using: `openssl rand -base64 32`
5. **Consider adding rate limiting** to the login endpoint in production
6. **Use HTTPS** in production to protect credentials in transit
