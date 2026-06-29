-- Schema for ASADA Buenos Aires website content
-- Compatible with SQLite and Cloudflare D1
-- Image paths kept as-is for future R2 migration

-- Cards table (news, services, governance, contacts)
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT,
  image TEXT,
  subtitle TEXT,
  tag TEXT,
  badge TEXT,
  icon TEXT,
  url TEXT,
  google_maps_url TEXT,
  variant TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Unique constraint to prevent duplicate cards
CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_unique ON cards(title, variant, date);

-- Card authors (normalized)
CREATE TABLE IF NOT EXISTS card_authors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Card items (normalized lists)
CREATE TABLE IF NOT EXISTS card_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  item TEXT NOT NULL,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Contacts table (single row)
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  whatsapp_phone_info TEXT,
  whatsapp_phone_support TEXT,
  facebook_url TEXT
);

-- Home slides table
CREATE TABLE IF NOT EXISTS home_slides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Timeline items table
CREATE TABLE IF NOT EXISTS timeline_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  image TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Unique constraint to prevent duplicate timeline items
CREATE UNIQUE INDEX IF NOT EXISTS idx_timeline_unique ON timeline_items(year, title);

-- Stats table
CREATE TABLE IF NOT EXISTS stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- About content table (mission, vision, etc.)
CREATE TABLE IF NOT EXISTS about_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL UNIQUE, -- 'mission', 'vision', etc.
  title TEXT NOT NULL,
  content TEXT NOT NULL
);

-- Admin users table for authentication
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Unique constraint on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
