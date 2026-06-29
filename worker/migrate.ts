import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DATA_DIR = path.join(__dirname, 'data');
const API_URL = 'http://localhost:8787';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'devpass';

let authToken: string | null = null;

interface Card {
  title: string;
  description: string;
  date?: string;
  image?: string;
  subtitle?: string;
  tag?: string;
  badge?: string;
  authors?: Array<{ name: string; avatar: string }>;
  icon?: string;
  items?: string[];
  url?: string;
  google_maps_url?: string;
  variant: string;
}

interface Contacts {
  whatsapp_phone_info?: string;
  whatsapp_phone_support?: string;
  facebook_url?: string;
}

interface HomeSlide {
  image: string;
  title: string;
  subtitle?: string;
  description: string;
}

interface TimelineItem {
  year: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
}

interface StatsData {
  number: string;
  label: string;
}

interface UsData {
  statsData?: StatsData[];
  mission?: { title: string; content: string };
  vision?: { title: string; content: string };
}

// Helper function to make API requests
async function apiRequest(endpoint: string, options: RequestInit): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Solicitud fallida: ${response.statusText}`);
  }

  return response.json();
}

// Login to get auth token
async function login(): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!response.ok) {
      throw new Error('Error de inicio de sesión');
    }

    const data = await response.json();
    authToken = data.token;
    console.log('✓ Inició sesión exitosamente');
  } catch (error: any) {
    console.error(`✗ Error al iniciar sesión: ${error.message}`);
    throw error;
  }
}

// Read JSON file
function readJsonFile<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

// Migrate cards
async function migrateCards(cards: Card[]): Promise<void> {
  if (cards.length === 0) {
    console.log('✓ No cards to migrate (empty array)');
    return;
  }
  for (const card of cards) {
    try {
      await apiRequest('/cards', {
        method: 'POST',
        body: JSON.stringify(card),
      });
      console.log(`✓ Inserted card: ${card.title}`);
    } catch (error: any) {
      console.error(`✗ Error al insertar tarjeta (${card.title}): ${error.message}`);
    }
  }
}

// Migrate contacts
async function migrateContacts(contacts: Contacts): Promise<void> {
  try {
    await apiRequest('/contacts', {
      method: 'PUT',
      body: JSON.stringify(contacts),
    });
    console.log('✓ Inserted contacts');
  } catch (error: any) {
    console.error(`✗ Error al insertar contactos: ${error.message}`);
  }
}

// Migrate home slides
async function migrateHomeSlides(slides: HomeSlide[]): Promise<void> {
  for (const slide of slides) {
    try {
      await apiRequest('/home-slides', {
        method: 'POST',
        body: JSON.stringify(slide),
      });
      console.log(`✓ Inserted home slide: ${slide.title}`);
    } catch (error: any) {
      console.error(`✗ Error al insertar diapositiva de inicio (${slide.title}): ${error.message}`);
    }
  }
}

// Migrate timeline items
async function migrateTimelineItems(items: TimelineItem[]): Promise<void> {
  if (items.length === 0) {
    console.log('✓ No timeline items to migrate (empty array)');
    return;
  }
  for (const item of items) {
    try {
      await apiRequest('/timeline', {
        method: 'POST',
        body: JSON.stringify(item),
      });
      console.log(`✓ Inserted timeline item: ${item.year} - ${item.title}`);
    } catch (error: any) {
      console.error(`✗ Error al insertar elemento de línea de tiempo (${item.year} - ${item.title}): ${error.message}`);
    }
  }
}

// Migrate stats
async function migrateStats(stats: StatsData[]): Promise<void> {
  try {
    await apiRequest('/stats', {
      method: 'PUT',
      body: JSON.stringify(stats),
    });
    console.log('✓ Inserted stats');
  } catch (error: any) {
    console.error(`✗ Error al insertar estadísticas: ${error.message}`);
  }
}

// Migrate about content
async function migrateAboutContent(usData: UsData): Promise<void> {
  if (usData.mission) {
    try {
      await apiRequest('/about/mission', {
        method: 'PUT',
        body: JSON.stringify(usData.mission),
      });
      console.log('✓ Inserted mission');
    } catch (error: any) {
      console.error(`✗ Error al insertar misión: ${error.message}`);
    }
  }

  if (usData.vision) {
    try {
      await apiRequest('/about/vision', {
        method: 'PUT',
        body: JSON.stringify(usData.vision),
      });
      console.log('✓ Inserted vision');
    } catch (error: any) {
      console.error(`✗ Error al insertar visión: ${error.message}`);
    }
  }
}

// Main migration function
export async function runMigrations(): Promise<void> {
  console.log('Iniciando migración a D1...\n');

  // Login first for authenticated endpoints
  await login();
  console.log();

  // Read all JSON files
  const cards = readJsonFile<Card[]>('cards-data.json');
  const contacts = readJsonFile<Contacts>('contacts-data.json');
  const homeSlides = readJsonFile<HomeSlide[]>('home-data.json');
  const timelineItems = readJsonFile<TimelineItem[]>('time-items-data.json');
  const usData = readJsonFile<UsData>('us-data.json');

  console.log('✓ Archivos JSON cargados\n');

  // Migrate data
  console.log('Migrando tarjetas...');
  await migrateCards(cards);
  console.log();

  console.log('Migrando contactos...');
  await migrateContacts(contacts);
  console.log();

  console.log('Migrando diapositivas de inicio...');
  await migrateHomeSlides(homeSlides);
  console.log();

  console.log('Migrando elementos de línea de tiempo...');
  await migrateTimelineItems(timelineItems);
  console.log();

  if (usData.statsData) {
    console.log('Migrando estadísticas...');
    await migrateStats(usData.statsData);
    console.log();
  }

  console.log('Migrando contenido de \"Nosotros\"...');
  await migrateAboutContent(usData);
  console.log();

  console.log('\n✓ ¡Migración completada!');
}

// Run migrations
runMigrations().catch(console.error);
