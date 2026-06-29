/**
 * Seed script to create the initial admin user
 * Run this after creating the database to set up the first admin account
 * 
 * Usage:
 * 1. Make sure your D1 database is set up in wrangler.toml
 * 2. Run: npx wrangler d1 execute DB --local --file=./db/schema.sql
 * 3. Run: npx wrangler d1 execute DB --local --command="SELECT * FROM admins"
 * 4. To create an admin user, use the hash function from the auth utility
 * 
 * For production, run without --local flag
 */

// This is a helper script to generate a password hash
// Copy this code and run it in a Node.js environment to generate a hash

async function generatePasswordHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derive key using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const hash = await crypto.subtle.exportKey('raw', key);
  const hashBytes = hash instanceof ArrayBuffer ? new Uint8Array(hash) : new Uint8Array(0);
  
  // Combine salt and hash for storage
  const combined = new Uint8Array(salt.length + hashBytes.length);
  combined.set(salt, 0);
  combined.set(hashBytes, salt.length);
  
  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined));
}

// Example usage:
// Uncomment and run this in a Node.js environment with crypto support
// Or use the Cloudflare Workers dashboard to execute this

async function main() {
  const username = 'user';
  const password = 'pass'; // CHANGE THIS!
  
  const passwordHash = await generatePasswordHash(password);
  
  console.log('Username:', username);
  console.log('Password (change this!):', password);
  console.log('Password Hash:', passwordHash);
  console.log('\nSQL to insert admin:');
  console.log(`INSERT INTO admins (username, password_hash) VALUES ('${username}', '${passwordHash}');`);
}

// Uncomment to run
main().catch(console.error);

// Manual SQL command for wrangler:
// npx wrangler d1 execute asada-buenosaires-db --local --command="INSERT INTO admins (username, password_hash) VALUES ('admin', 'YOUR_HASH_HERE')"

export { generatePasswordHash };
