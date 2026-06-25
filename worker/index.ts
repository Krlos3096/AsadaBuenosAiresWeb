import {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  generatePayload,
} from './auth';
import {
  generateUniqueFilename,
  isValidImageType,
  isValidFileType,
  isValidFileSize,
  getContentType,
} from './r2';
import { Resend } from 'resend';

interface Env {
  asada_buenosaires_db: D1Database;
  JWT_SECRET: string;
  asada_buenosaires_images: R2Bucket;
  IMAGE_BASE_URL: string;
  RESEND_API_KEY: string;
}

// Helper function to parse JSON body
async function parseBody(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Helper function to send JSON response
function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

// Helper function to send error response
function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ error: message }, status);
}

// Helper function to map joined card results with authors and items
function mapCardWithRelations(rows: any[]): any[] {
  const cardMap = new Map<number, any>();

  for (const row of rows) {
    const cardId = row.card_id;
    
    if (!cardMap.has(cardId)) {
      cardMap.set(cardId, {
        id: cardId,
        title: row.title,
        description: row.description,
        date: row.date,
        image: row.image,
        subtitle: row.subtitle,
        tag: row.tag,
        badge: row.badge,
        icon: row.icon,
        url: row.url,
        google_maps_url: row.google_maps_url,
        variant: row.variant,
        authors: [],
        items: [],
      });
    }

    const card = cardMap.get(cardId);

    // Add author if exists
    if (row.author_id) {
      const existingAuthor = card.authors.find((a: any) => a.id === row.author_id);
      if (!existingAuthor) {
        card.authors.push({
          id: row.author_id,
          name: row.author_name,
          avatar: row.author_avatar,
        });
      }
    }

    // Add item if exists
    if (row.item_id && row.item_text) {
      const existingItem = card.items.find((i: any) => i.id === row.item_id);
      if (!existingItem) {
        card.items.push({
          id: row.item_id,
          item: row.item_text,
        });
      }
    }
  }

  return Array.from(cardMap.values());
}

// ==================== AUTHENTICATION ENDPOINTS ====================

// POST /auth/login
async function login(request: Request, env: Env): Promise<Response> {
  const body = await parseBody(request);

  if (!body || !body.username || !body.password) {
    return errorResponse('Faltan campos requeridos: usuario, contraseña', 400);
  }

  try {
    // Find admin by username
    const admin = await env.asada_buenosaires_db.prepare(
      'SELECT id, username, password_hash FROM admins WHERE username = ?'
    ).bind(body.username).first();

    if (!admin) {
      return errorResponse('Credenciales inválidas', 401);
    }

    // Verify password
    const isValid = await verifyPassword(body.password, admin.password_hash as string);
    if (!isValid) {
      return errorResponse('Credenciales inválidas', 401);
    }

    // Generate JWT token
    const payload = generatePayload(String(admin.id), admin.username as string);
    const token = await createToken(payload, env.JWT_SECRET);

    return jsonResponse({
      token,
      user: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /auth/logout
async function logout(): Promise<Response> {
  // For stateless JWT, logout is handled client-side by removing the token
  return jsonResponse({ success: true, message: 'Logged out successfully' });
}

// GET /auth/me
async function getCurrentUser(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse('No se proporcionó token', 401);
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token, env.JWT_SECRET);

  if (!payload) {
    return errorResponse('Token inválido o expirado', 401);
  }

  try {
    const admin = await env.asada_buenosaires_db.prepare(
      'SELECT id, username, created_at FROM admins WHERE id = ?'
    ).bind(payload.sub).first();

    if (!admin) {
      return errorResponse('Usuario no encontrado', 404);
    }

    return jsonResponse({
      id: admin.id,
      username: admin.username,
      created_at: admin.created_at,
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// ==================== AUTH MIDDLEWARE ====================

/**
 * Middleware to check if request is authenticated
 * Returns the user payload if authenticated, null otherwise
 */
async function authenticateRequest(request: Request, env: Env): Promise<{ userId: string; username: string } | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token, env.JWT_SECRET);

  if (!payload) {
    return null;
  }

  return {
    userId: payload.sub,
    username: payload.username,
  };
}

// ==================== CARDS ENDPOINTS ====================

// GET /cards?variant=news
async function getCards(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const variant = url.searchParams.get('variant');
  const id = url.searchParams.get('id');

  // Get single card with relations
  if (id) {
    const card = await env.asada_buenosaires_db.prepare(`
      SELECT 
        c.id as card_id, c.title, c.description, c.date, c.image, c.subtitle, c.tag, c.badge,
        c.icon, c.url, c.google_maps_url as google_maps_url, c.variant, c.sort_order,
        ca.id as author_id, ca.name as author_name, ca.avatar as author_avatar,
        ci.id as item_id, ci.item as item_text
      FROM cards c
      LEFT JOIN card_authors ca ON c.id = ca.card_id
      LEFT JOIN card_items ci ON c.id = ci.card_id
      WHERE c.id = ?
      ORDER BY ci.id ASC
    `).bind(id).all();

    if (!card.results || card.results.length === 0) {
      return errorResponse('Tarjeta no encontrada', 404);
    }

    const mapped = mapCardWithRelations(card.results);
    return jsonResponse(mapped[0]);
  }

  // Get cards with optional variant filter
  let query = `
    SELECT 
      c.id as card_id, c.title, c.description, c.date, c.image, c.subtitle, c.tag, c.badge,
      c.icon, c.url, c.google_maps_url as google_maps_url, c.variant, c.sort_order,
      ca.id as author_id, ca.name as author_name, ca.avatar as author_avatar,
      ci.id as item_id, ci.item as item_text
    FROM cards c
    LEFT JOIN card_authors ca ON c.id = ca.card_id
    LEFT JOIN card_items ci ON c.id = ci.card_id
  `;

  const params: any[] = [];

  if (variant) {
    query += ' WHERE c.variant = ?';
    params.push(variant);
  }

  query += ' ORDER BY c.sort_order ASC, c.id DESC, ci.id ASC';

  const stmt = env.asada_buenosaires_db.prepare(query);
  const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

  if (!result.results) {
    return jsonResponse([]);
  }

  const mapped = mapCardWithRelations(result.results);
  return jsonResponse(mapped);
}

// POST /cards
async function createCard(request: Request, env: Env): Promise<Response> {
  const body = await parseBody(request);

  if (!body || !body.title || !body.variant) {
    return errorResponse('Faltan campos requeridos: título, variante');
  }

  try {
    // Insert card
    const cardResult = await env.asada_buenosaires_db.prepare(`
      INSERT INTO cards (title, description, date, image, subtitle, tag, badge, icon, url, google_maps_url, variant, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.title,
      body.description || '',
      body.date || null,
      body.image || null,
      body.subtitle || null,
      body.tag || null,
      body.badge || null,
      body.icon || null,
      body.url || null,
      body.googleMapsUrl || null,
      body.variant,
      body.sort_order || 0
    ).run();

    const cardId = cardResult.meta.last_row_id;

    // Insert authors if provided
    if (body.author && typeof body.author === 'string') {
      // Handle single author string
      await env.asada_buenosaires_db.prepare(
        'INSERT INTO card_authors (card_id, name, avatar) VALUES (?, ?, ?)'
      ).bind(cardId, body.author, null).run();
    } else if (body.authors && Array.isArray(body.authors)) {
      // Handle array of author objects
      for (const author of body.authors) {
        await env.asada_buenosaires_db.prepare(
          'INSERT INTO card_authors (card_id, name, avatar) VALUES (?, ?, ?)'
        ).bind(cardId, author.name, author.avatar || null).run();
      }
    }

    // Insert items if provided
    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items) {
        await env.asada_buenosaires_db.prepare(
          'INSERT INTO card_items (card_id, item) VALUES (?, ?)'
        ).bind(cardId, item).run();
      }
    }

    // Fetch and return the created card with relations
    return getCards(new Request(`http://localhost?id=${cardId}`), env);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT /cards/:id
async function updateCard(request: Request, env: Env, id: string): Promise<Response> {
  const auth = await authenticateRequest(request, env);
  if (!auth) {
    return errorResponse('No autorizado', 401);
  }

  const body = await parseBody(request);

  if (!body) {
    return errorResponse('Falta el cuerpo de la solicitud');
  }

  try {
    // Update card
    const updateFields: string[] = [];
    const params: any[] = [];

    if (body.title !== undefined) {
      updateFields.push('title = ?');
      params.push(body.title);
    }
    if (body.description !== undefined) {
      updateFields.push('description = ?');
      params.push(body.description);
    }
    if (body.date !== undefined) {
      updateFields.push('date = ?');
      params.push(body.date);
    }
    if (body.image !== undefined) {
      updateFields.push('image = ?');
      params.push(body.image);
    }
    if (body.subtitle !== undefined) {
      updateFields.push('subtitle = ?');
      params.push(body.subtitle);
    }
    if (body.tag !== undefined) {
      updateFields.push('tag = ?');
      params.push(body.tag);
    }
    if (body.badge !== undefined) {
      updateFields.push('badge = ?');
      params.push(body.badge);
    }
    if (body.icon !== undefined) {
      updateFields.push('icon = ?');
      params.push(body.icon);
    }
    if (body.url !== undefined) {
      updateFields.push('url = ?');
      params.push(body.url);
    }
    if (body.googleMapsUrl !== undefined) {
      updateFields.push('google_maps_url = ?');
      params.push(body.googleMapsUrl);
    }
    if (body.variant !== undefined) {
      updateFields.push('variant = ?');
      params.push(body.variant);
    }
    if (body.sort_order !== undefined) {
      updateFields.push('sort_order = ?');
      params.push(body.sort_order);
    }

    if (updateFields.length === 0) {
      return errorResponse('No hay campos para actualizar');
    }

    params.push(id);
    await env.asada_buenosaires_db.prepare(`UPDATE cards SET ${updateFields.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    // Replace authors if provided
    if (body.authors !== undefined) {
      await env.asada_buenosaires_db.prepare('DELETE FROM card_authors WHERE card_id = ?').bind(id).run();
      
      if (Array.isArray(body.authors)) {
        for (const author of body.authors) {
          await env.asada_buenosaires_db.prepare(
            'INSERT INTO card_authors (card_id, name, avatar) VALUES (?, ?, ?)'
          ).bind(id, author.name, author.avatar || null).run();
        }
      }
    }

    // Replace items if provided
    if (body.items !== undefined) {
      await env.asada_buenosaires_db.prepare('DELETE FROM card_items WHERE card_id = ?').bind(id).run();
      
      if (Array.isArray(body.items)) {
        for (const item of body.items) {
          await env.asada_buenosaires_db.prepare(
            'INSERT INTO card_items (card_id, item) VALUES (?, ?)'
          ).bind(id, item).run();
        }
      }
    }

    // Fetch and return the updated card with relations
    return getCards(new Request(`http://localhost?id=${id}`), env);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// DELETE /cards/:id
async function deleteCard(request: Request, env: Env, id: string): Promise<Response> {
  const auth = await authenticateRequest(request, env);
  if (!auth) {
    return errorResponse('No autorizado', 401);
  }

  try {
    await env.asada_buenosaires_db.prepare('DELETE FROM card_authors WHERE card_id = ?').bind(id).run();
    await env.asada_buenosaires_db.prepare('DELETE FROM card_items WHERE card_id = ?').bind(id).run();
    await env.asada_buenosaires_db.prepare('DELETE FROM cards WHERE id = ?').bind(id).run();

    return jsonResponse({ success: true, message: 'Card deleted successfully' });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /cards/reorder
async function reorderCards(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateRequest(request, env);
  if (!auth) {
    return errorResponse('No autorizado', 401);
  }

  const body = await parseBody(request);

  if (!body || !body.items || !Array.isArray(body.items)) {
    return errorResponse('Missing items array', 400);
  }

  try {
    for (const item of body.items) {
      if (!item.id || item.sort_order === undefined) {
        continue;
      }
      await env.asada_buenosaires_db.prepare('UPDATE cards SET sort_order = ? WHERE id = ?')
        .bind(item.sort_order, item.id)
        .run();
    }

    return jsonResponse({ success: true, message: 'Cards reordered successfully' });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// ==================== CONTACTS ENDPOINTS ====================

// GET /contacts
async function getContacts(env: Env): Promise<Response> {
  const result = await env.asada_buenosaires_db.prepare('SELECT * FROM contacts WHERE id = 1').first();

  return jsonResponse(result || {});
}

// PUT /contacts
async function updateContacts(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateRequest(request, env);
  if (!auth) {
    return errorResponse('No autorizado', 401);
  }

  const body = await parseBody(request);

  if (!body) {
    return errorResponse('Missing request body', 400);
  }

  try {
    await env.asada_buenosaires_db.prepare(`
      INSERT OR REPLACE INTO contacts (id, whatsapp_phone_info, whatsapp_phone_support, facebook_url)
      VALUES (1, ?, ?, ?)
    `).bind(
      body.whatsapp_phone_info || null,
      body.whatsapp_phone_support || null,
      body.facebook_url || null
    ).run();

    return getContacts(env);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /send-complaint
async function sendComplaintEmail(request: Request, env: Env): Promise<Response> {
  const body = await parseBody(request);

  if (!body || !body.to || !body.message) {
    return errorResponse('Faltan campos requeridos: destinatario, mensaje', 400);
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY);
    console.log(env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: body.to,
      subject: 'Queja de usuario',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #52bc52;">Queja de Usuario</h2>
          <p>Se ha recibido una nueva queja:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${body.message}</p>
          </div>
          <p style="color: #666; font-size: 14px;">Este mensaje fue enviado desde el formulario de quejas de Asada Buenos Aires.</p>
        </div>
      `,
    });

    return jsonResponse({ success: true, message: 'Queja enviada exitosamente' });
  } catch (error: any) {
    console.error('Error al enviar email:', error);
    return errorResponse('Error al enviar la queja', 500);
  }
}

// ==================== HOME SLIDES ENDPOINTS ====================

// GET /home-slides
async function getHomeSlides(env: Env): Promise<Response> {
  const result = await env.asada_buenosaires_db.prepare('SELECT * FROM home_slides ORDER BY sort_order').all();

  return jsonResponse(result.results || []);
}

// POST /home-slides
async function createHomeSlide(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateRequest(request, env);
  if (!auth) {
    return errorResponse('No autorizado', 401);
  }

  const body = await parseBody(request);

  if (!body || !body.image || !body.title || !body.description) {
    return errorResponse('Faltan campos requeridos: imagen, título, descripción');
  }

  try {
    const result = await env.asada_buenosaires_db.prepare(`
      INSERT INTO home_slides (image, title, subtitle, description, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      body.image,
      body.title,
      body.subtitle || null,
      body.description,
      body.sort_order || 0
    ).run();

    const id = result.meta.last_row_id;
    const slide = await env.asada_buenosaires_db.prepare('SELECT * FROM home_slides WHERE id = ?').bind(id).first();

    return jsonResponse(slide, 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT /home-slides/:id
async function updateHomeSlide(request: Request, env: Env, id: string): Promise<Response> {
  const auth = await authenticateRequest(request, env);
  if (!auth) {
    return errorResponse('No autorizado', 401);
  }

  const body = await parseBody(request);

  if (!body) {
    return errorResponse('Falta el cuerpo de la solicitud');
  }

  try {
    const updateFields: string[] = [];
    const params: any[] = [];

    if (body.image !== undefined) {
      updateFields.push('image = ?');
      params.push(body.image);
    }
    if (body.title !== undefined) {
      updateFields.push('title = ?');
      params.push(body.title);
    }
    if (body.subtitle !== undefined) {
      updateFields.push('subtitle = ?');
      params.push(body.subtitle);
    }
    if (body.description !== undefined) {
      updateFields.push('description = ?');
      params.push(body.description);
    }
    if (body.sort_order !== undefined) {
      updateFields.push('sort_order = ?');
      params.push(body.sort_order);
    }

    if (updateFields.length === 0) {
      return errorResponse('No hay campos para actualizar');
    }

    params.push(id);
    await env.asada_buenosaires_db.prepare(`UPDATE home_slides SET ${updateFields.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    const slide = await env.asada_buenosaires_db.prepare('SELECT * FROM home_slides WHERE id = ?').bind(id).first();

    return jsonResponse(slide);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// DELETE /home-slides/:id
async function deleteHomeSlide(request: Request, env: Env, id: string): Promise<Response> {
  const auth = await authenticateRequest(request, env);
  if (!auth) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const result = await env.asada_buenosaires_db.prepare('DELETE FROM home_slides WHERE id = ?').bind(id).run();

    if (result.meta.changes === 0) {
      return errorResponse('Diapositiva de inicio no encontrada', 404);
    }

    return jsonResponse({ success: true, message: 'Home slide deleted' });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// ==================== TIMELINE ENDPOINTS ====================

// GET /timeline
async function getTimeline(env: Env): Promise<Response> {
  const result = await env.asada_buenosaires_db.prepare('SELECT * FROM timeline_items ORDER BY year ASC').all();

  return jsonResponse(result.results || []);
}

// POST /timeline
async function createTimelineItem(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateRequest(request, env);
  if (!auth) {
    return errorResponse('No autorizado', 401);
  }

  const body = await parseBody(request);

  if (!body || !body.year || !body.title) {
    return errorResponse('Faltan campos requeridos: año, título');
  }

  try {
    const result = await env.asada_buenosaires_db.prepare(`
      INSERT INTO timeline_items (year, title, description, icon, image, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      body.year,
      body.title,
      body.description || '',
      body.icon || null,
      body.image || null,
      body.sort_order || 0
    ).run();

    const id = result.meta.last_row_id;
    const item = await env.asada_buenosaires_db.prepare('SELECT * FROM timeline_items WHERE id = ?').bind(id).first();

    return jsonResponse(item, 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT /timeline/:id
async function updateTimelineItem(request: Request, env: Env, id: string): Promise<Response> {
  const auth = await authenticateRequest(request, env);
  if (!auth) {
    return errorResponse('No autorizado', 401);
  }

  const body = await parseBody(request);

  if (!body) {
    return errorResponse('Falta el cuerpo de la solicitud');
  }

  try {
    const updateFields: string[] = [];
    const params: any[] = [];

    if (body.year !== undefined) {
      updateFields.push('year = ?');
      params.push(body.year);
    }
    if (body.title !== undefined) {
      updateFields.push('title = ?');
      params.push(body.title);
    }
    if (body.description !== undefined) {
      updateFields.push('description = ?');
      params.push(body.description);
    }
    if (body.icon !== undefined) {
      updateFields.push('icon = ?');
      params.push(body.icon);
    }
    if (body.image !== undefined) {
      updateFields.push('image = ?');
      params.push(body.image);
    }
    if (body.sort_order !== undefined) {
      updateFields.push('sort_order = ?');
      params.push(body.sort_order);
    }

    if (updateFields.length === 0) {
      return errorResponse('No hay campos para actualizar');
    }

    params.push(id);
    await env.asada_buenosaires_db.prepare(`UPDATE timeline_items SET ${updateFields.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    const item = await env.asada_buenosaires_db.prepare('SELECT * FROM timeline_items WHERE id = ?').bind(id).first();

    return jsonResponse(item);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// DELETE /timeline/:id
async function deleteTimelineItem(request: Request, env: Env, id: string): Promise<Response> {
  const auth = await authenticateRequest(request, env);
  if (!auth) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const result = await env.asada_buenosaires_db.prepare('DELETE FROM timeline_items WHERE id = ?').bind(id).run();

    if (result.meta.changes === 0) {
      return errorResponse('Elemento de línea de tiempo no encontrado', 404);
    }

    return jsonResponse({ success: true, message: 'Timeline item deleted' });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// ==================== STATS ENDPOINTS ====================

// GET /stats
async function getStats(env: Env): Promise<Response> {
  const result = await env.asada_buenosaires_db.prepare('SELECT * FROM stats ORDER BY sort_order').all();

  return jsonResponse(result.results || []);
}

// PUT /stats (bulk replace)
async function updateStats(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateRequest(request, env);
  if (!auth) {
    return errorResponse('No autorizado', 401);
  }

  const body = await parseBody(request);

  if (!body || !Array.isArray(body)) {
    return errorResponse('El cuerpo de la solicitud debe ser un arreglo de estadísticas');
  }

  try {
    // Delete all existing stats
    await env.asada_buenosaires_db.prepare('DELETE FROM stats').run();

    // Insert new stats
    for (const stat of body) {
      if (!stat.number || !stat.label) {
        continue;
      }
      await env.asada_buenosaires_db.prepare(
        'INSERT INTO stats (number, label, sort_order) VALUES (?, ?, ?)'
      ).bind(stat.number, stat.label, stat.sort_order || 0).run();
    }

    return getStats(env);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// ==================== ABOUT CONTENT ENDPOINTS ====================

// GET /about
async function getAboutContent(env: Env): Promise<Response> {
  const result = await env.asada_buenosaires_db.prepare('SELECT * FROM about_content').all();

  return jsonResponse(result.results || []);
}

// GET /about/:type
async function getAboutContentByType(env: Env, type: string): Promise<Response> {
  const result = await env.asada_buenosaires_db.prepare('SELECT * FROM about_content WHERE content_type = ?')
    .bind(type)
    .first();

  if (!result) {
    return errorResponse('Contenido de "Nosotros" no encontrado', 404);
  }

  return jsonResponse(result);
}

// PUT /about/:type (upsert)
async function upsertAboutContent(request: Request, env: Env, type: string): Promise<Response> {
  const auth = await authenticateRequest(request, env);
  if (!auth) {
    return errorResponse('No autorizado', 401);
  }

  const body = await parseBody(request);

  if (!body || !body.title || !body.content) {
    return errorResponse('Faltan campos requeridos: título, contenido');
  }

  try {
    await env.asada_buenosaires_db.prepare(`
      INSERT INTO about_content (content_type, title, content)
      VALUES (?, ?, ?)
      ON CONFLICT(content_type) DO UPDATE SET
        title = excluded.title,
        content = excluded.content
    `).bind(type, body.title, body.content).run();

    return getAboutContentByType(env, type);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// ==================== MAIN ROUTER ====================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // ==================== AUTH ROUTES ====================
    if (path === '/auth/login' && method === 'POST') {
      return login(request, env);
    }
    if (path === '/auth/logout' && method === 'POST') {
      return logout();
    }
    if (path === '/auth/me' && method === 'GET') {
      return getCurrentUser(request, env);
    }

    // ==================== CARDS ROUTES ====================
    if (path === '/cards' && method === 'GET') {
      return getCards(request, env);
    }
    if (path === '/cards' && method === 'POST') {
      return createCard(request, env);
    }
    if (path === '/cards/reorder' && method === 'POST') {
      return reorderCards(request, env);
    }
    if (path.startsWith('/cards/') && method === 'PUT') {
      const id = path.split('/')[2];
      return updateCard(request, env, id);
    }
    if (path.startsWith('/cards/') && method === 'DELETE') {
      const id = path.split('/')[2];
      return deleteCard(request, env, id);
    }

    // ==================== CONTACTS ROUTES ====================
    if (path === '/contacts' && method === 'GET') {
      return getContacts(env);
    }
    if (path === '/contacts' && method === 'PUT') {
      return updateContacts(request, env);
    }
    if (path === '/send-complaint' && method === 'POST') {
      return sendComplaintEmail(request, env);
    }

    // ==================== HOME SLIDES ROUTES ====================
    if (path === '/home-slides' && method === 'GET') {
      return getHomeSlides(env);
    }
    if (path === '/home-slides' && method === 'POST') {
      return createHomeSlide(request, env);
    }
    if (path.startsWith('/home-slides/') && method === 'PUT') {
      const id = path.split('/')[2];
      return updateHomeSlide(request, env, id);
    }
    if (path.startsWith('/home-slides/') && method === 'DELETE') {
      const id = path.split('/')[2];
      return deleteHomeSlide(request, env, id);
    }

    // ==================== TIMELINE ROUTES ====================
    if (path === '/timeline' && method === 'GET') {
      return getTimeline(env);
    }
    if (path === '/timeline' && method === 'POST') {
      return createTimelineItem(request, env);
    }
    if (path.startsWith('/timeline/') && method === 'PUT') {
      const id = path.split('/')[2];
      return updateTimelineItem(request, env, id);
    }
    if (path.startsWith('/timeline/') && method === 'DELETE') {
      const id = path.split('/')[2];
      return deleteTimelineItem(request, env, id);
    }

    // ==================== STATS ROUTES ====================
    if (path === '/stats' && method === 'GET') {
      return getStats(env);
    }
    if (path === '/stats' && method === 'PUT') {
      return updateStats(request, env);
    }

    // ==================== ABOUT CONTENT ROUTES ====================
    if (path === '/about' && method === 'GET') {
      return getAboutContent(env);
    }
    if (path.startsWith('/about/') && method === 'GET') {
      const type = path.split('/')[2];
      return getAboutContentByType(env, type);
    }
    if (path.startsWith('/about/') && method === 'PUT') {
      const type = path.split('/')[2];
      return upsertAboutContent(request, env, type);
    }

    // ==================== FILE STORAGE ROUTES ====================
    if (path === '/upload' && method === 'POST') {
      return uploadFile(request, env);
    }
    if (path.startsWith('/files/') && method === 'DELETE') {
      const key = path.split('/')[2];
      return deleteFile(request, env, key);
    }
    if (path.startsWith('/images/') && method === 'GET') {
      const key = path.split('/')[2];
      return serveImage(request, env, key);
    }

    // 404 for unknown routes
    return errorResponse('No encontrado', 404);
  },
};

// ==================== FILE STORAGE ROUTES ====================

// Upload file endpoint
async function uploadFile(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateRequest(request, env);
  if (!auth) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return errorResponse('No se proporcionó archivo', 400);
    }

    // Check if it's a File object (not a string)
    if (typeof file === 'string') {
      return errorResponse('Archivo inválido proporcionado', 400);
    }

    // Cast to File since we've verified it's not a string
    const imageFile = file as File;

    // Validate file type (accept both images and documents)
    if (!isValidFileType(imageFile.type)) {
      return errorResponse('Tipo de archivo inválido. Tipos permitidos: JPEG, PNG, WebP, PDF, DOC, DOCX, XLS, XLSX, TXT, CSV', 400);
    }

    // Validate file size
    if (!isValidFileSize(imageFile.size)) {
      return errorResponse('Archivo demasiado grande. Tamaño máximo es 10MB.', 400);
    }

    // Generate unique filename
    const filename = generateUniqueFilename(imageFile.name);
    const contentType = getContentType(filename);

    // Store file in R2
    await env.asada_buenosaires_images.put(filename, imageFile.stream(), {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });

    return jsonResponse({ key: filename }, 201);
  } catch (error) {
    console.error('Error al subir:', error);
    return errorResponse('Error al subir archivo', 500);
  }
}

// Delete file endpoint
async function deleteFile(request: Request, env: Env, key: string): Promise<Response> {
  const auth = await authenticateRequest(request, env);
  if (!auth) {
    return errorResponse('No autorizado', 401);
  }

  try {
    await env.asada_buenosaires_images.delete(key);
    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Error al eliminar:', error);
    return errorResponse('Error al eliminar archivo', 500);
  }
}

// Serve image endpoint (for local development)
async function serveImage(request: Request, env: Env, key: string): Promise<Response> {
  try {
    const object = await env.asada_buenosaires_images.get(key);

    if (!object) {
      return errorResponse('Imagen no encontrada', 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error al servir imagen:', error);
    return errorResponse('Error al servir imagen', 500);
  }
}
