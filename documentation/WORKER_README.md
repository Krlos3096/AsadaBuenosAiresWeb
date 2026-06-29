# ASADA Buenos Aires API - Cloudflare Worker + D1

A REST API built with Cloudflare Workers and D1 database for the ASADA Buenos Aires website.

## Project Structure

```
/
├── wrangler.toml          # Cloudflare Workers configuration
├── worker/
│   ├── index.ts           # Main Worker code with all endpoints
│   ├── package.json       # Worker dependencies
│   └── README.md          # This file
├── db/
│   └── schema.sql         # Database schema
└── src/                   # React frontend
```

## Setup

### 1. Install Dependencies

```bash
cd worker
npm install
```

### 2. Create D1 Database

```bash
# Create the database
wrangler d1 create asada-buenosaires-db
```

Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "asada-buenosaires-db"
database_id = "your-actual-database-id-here"
```

### 3. Apply Schema Locally

```bash
# Apply schema to local database
wrangler d1 execute asada_buenosaires_db --local --file=../db/schema.sql
```

### 4. Run Local Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:8787`

## API Endpoints

### Cards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cards` | List all cards (add `?variant=news` to filter) |
| GET | `/cards?id=1` | Get single card with authors and items |
| POST | `/cards` | Create new card |
| PUT | `/cards/:id` | Update card (replaces authors/items if provided) |
| DELETE | `/cards/:id` | Delete card (cascade deletes relations) |

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contacts` | Get contact information |
| PUT | `/contacts` | Update contact information |

### Home Slides

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/home-slides` | List all home slides |
| POST | `/home-slides` | Create new home slide |
| PUT | `/home-slides/:id` | Update home slide |
| DELETE | `/home-slides/:id` | Delete home slide |

### Timeline

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/timeline` | List all timeline items |
| POST | `/timeline` | Create new timeline item |
| PUT | `/timeline/:id` | Update timeline item |
| DELETE | `/timeline/:id` | Delete timeline item |

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | List all stats |
| PUT | `/stats` | Bulk replace all stats |

### About Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/about` | List all about content |
| GET | `/about/mission` | Get specific content type |
| PUT | `/about/:type` | Upsert content by type |

## Example Requests

### Get Cards by Variant

```bash
curl http://localhost:8787/cards?variant=news
```

### Get Single Card

```bash
curl http://localhost:8787/cards?id=1
```

### Create Card

```bash
curl -X POST http://localhost:8787/cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Card",
    "description": "Card description",
    "variant": "news",
    "date": "17 de abril de 2026",
    "tag": "Avisos",
    "authors": [
      {"name": "Author Name", "avatar": "/avatar.jpg"}
    ],
    "items": ["Item 1", "Item 2"]
  }'
```

### Update Card

```bash
curl -X PUT http://localhost:8787/cards/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "Updated description"
  }'
```

### Delete Card

```bash
curl -X DELETE http://localhost:8787/cards/1
```

### Get Contacts

```bash
curl http://localhost:8787/contacts
```

### Update Contacts

```bash
curl -X PUT http://localhost:8787/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "whatsappPhoneInfo": "+50685676443",
    "whatsappPhoneSupport": "+50684479692",
    "facebookUrl": "https://facebook.com/asada"
  }'
```

### Get Stats

```bash
curl http://localhost:8787/stats
```

### Update Stats (Bulk Replace)

```bash
curl -X PUT http://localhost:8787/stats \
  -H "Content-Type: application/json" \
  -d '[
    {"number": "2,500+", "label": "Usuarios Conectados"},
    {"number": "29", "label": "Años de Servicio"}
  ]'
```

### Get About Content

```bash
curl http://localhost:8787/about/mission
```

### Update About Content

```bash
curl -X PUT http://localhost:8787/about/mission \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Misión",
    "content": "Nuestra misión es..."
  }'
```

## Database Schema

The schema is defined in `db/schema.sql` and includes:

- `cards` - Main content with variant types (news, service, governance, contact)
- `card_authors` - Authors linked to cards
- `card_items` - List items linked to cards
- `contacts` - Single-row contact table
- `home_slides` - Homepage carousel slides
- `timeline_items` - Historical timeline entries
- `stats` - Homepage statistics
- `about_content` - Key-value content (mission, vision, etc.)

## Deployment

### Deploy to Production

```bash
# Apply schema to production database
wrangler d1 execute DB --file=../db/schema.sql

# Deploy worker
npm run deploy
```

## Key Features

- **Type-safe**: Built with TypeScript
- **Normalized responses**: Cards with authors/items are automatically joined and nested
- **Error handling**: Proper HTTP status codes and JSON error responses
- **CORS enabled**: Cross-origin requests supported
- **Parameterized queries**: SQL injection prevention
- **Transaction support**: Related data (authors/items) handled atomically

## Notes

- Local development uses `--local` flag for D1 operations
- Production uses the same schema without the `--local` flag
- The `mapCardWithRelations` helper function automatically flattens joined results into nested JSON
- All endpoints return JSON with appropriate HTTP status codes
