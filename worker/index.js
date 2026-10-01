const ZONE = 'America/Sao_Paulo';
const MAX_DAYS = 45;
const SLOT_STEP = 30;
const DEFAULT_SERVICES = [
  { id: 'banho', label: 'Banho', durationMinutes: 60, enabled: true },
  { id: 'banho-tosa', label: 'Banho e tosa', durationMinutes: 120, enabled: true },
  { id: 'tosa', label: 'Tosa', durationMinutes: 90, enabled: false },
];
const DEFAULT_HOURS = Array.from({ length: 7 }, (_, weekday) => ({
  weekday,
  enabled: weekday >= 2 && weekday <= 6,
  openTime: '12:00',
  closeTime: '18:00',
}));
const assetCache = new Map();

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...extra },
  });
}

function fail(message, status = 400) { return json({ error: message }, status); }

function staticResponse(path, noStore = false, head = false) {
  const item = STATIC_ASSETS[path];
  if (!item) return null;
  let body = assetCache.get(path);
  if (!body) {
    const binary = atob(item.data);
    body = Uint8Array.from(binary, char => char.charCodeAt(0));
    assetCache.set(path, body);
  }
  return new Response(head ? null : body, {
    headers: {
      'content-type': item.type,
      'cache-control': noStore ? 'no-store' : path.endsWith('.html') ? 'public, max-age=300' : 'public, max-age=86400',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
    },
  });
}

function localNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(d.valueOf()) && d.toISOString().slice(0, 10) === value;
}

function dayOffset(date, delta) {
  const day = new Date(`${date}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() + delta);
  return day.toISOString().slice(0, 10);
}

function weekday(date) { return new Date(`${date}T12:00:00Z`).getUTCDay(); }
function minuteOf(time) { return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)); }
function timeOf(minute) { return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`; }
function validTime(value) { return /^([01]\d|2[0-3]):(00|30)$/.test(value || ''); }
function clean(value, max) { return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : ''; }
function cellsFor(time, duration) { return Array.from({ length: duration / SLOT_STEP }, (_, i) => timeOf(minuteOf(time) + i * SLOT_STEP)); }

function bookableDate(date) {
  if (!validDate(date)) return false;
  const today = localNow().date;
  return date >= today && date <= dayOffset(today, MAX_DAYS);
}

function leadTimeAllows(date, time) {
  const now = localNow();
  const slot = Date.parse(`${date}T${time}:00Z`);
  const current = Date.parse(`${now.date}T${now.time}:00Z`);
  return slot - current >= 2 * 60 * 60 * 1000;
}

async function rows(db, sql, ...values) { return (await db.prepare(sql).bind(...values).all()).results || []; }
async function first(db, sql, ...values) { return db.prepare(sql).bind(...values).first(); }

async function services(db) {
  const saved = await rows(db, 'SELECT id, label, duration_minutes, enabled FROM services ORDER BY rowid');
  return saved.length ? saved.map(s => ({ id: s.id, label: s.label, durationMinutes: s.duration_minutes, enabled: !!s.enabled })) : DEFAULT_SERVICES;
}

async function hours(db) {
  const saved = await rows(db, 'SELECT weekday, enabled, open_time, close_time FROM weekly_hours ORDER BY weekday');
  if (!saved.length) return DEFAULT_HOURS;
  const byDay = new Map(saved.map(h => [h.weekday, { weekday: h.weekday, enabled: !!h.enabled, openTime: h.open_time, closeTime: h.close_time }]));
  return DEFAULT_HOURS.map(defaultDay => byDay.get(defaultDay.weekday) || defaultDay);
}

async function availability(db, date, serviceId) {
  if (!bookableDate(date)) return { date, slots: [] };
  const service = (await services(db)).find(item => item.id === serviceId && item.id !== 'tosa' && item.enabled);
  if (!service) return null;
  const schedule = (await hours(db))[weekday(date)];
  if (!schedule.enabled) return { date, service: serviceId, slots: [] };
  const occupied = await rows(db, 'SELECT time FROM calendar_cells WHERE date = ?', date);
  const unavailable = new Set(occupied.map(row => row.time));
  const slots = [];
  for (let start = minuteOf(schedule.openTime); start + service.durationMinutes <= minuteOf(schedule.closeTime); start += SLOT_STEP) {
    const time = timeOf(start);
    if (leadTimeAllows(date, time) && cellsFor(time, service.durationMinutes).every(cell => !unavailable.has(cell))) slots.push(time);
  }
  return { date, service: serviceId, durationMinutes: service.durationMinutes, slots };
}

async function readBody(request, maxLength = 6000) {
  const raw = await request.text();
  if (raw.length > maxLength) throw new Error('too_large');
  try { return JSON.parse(raw); } catch { throw new Error('invalid_json'); }
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

// Only the public booking endpoints are available to the GitHub Pages frontend.
const PUBLIC_BOOKING_ORIGINS = new Set(['https://duduwwl.github.io']);
function publicBookingPath(path) {
  return ['/api/config', '/api/availability', '/api/appointments', '/api/products'].includes(path) ||
    /^\/api\/appointments\/[0-9a-f-]{36}\.ics$/.test(path) || /^\/api\/product-images\/[0-9a-f-]{36}\.webp$/.test(path);
}
function bookingOriginAllowed(request) {
  return sameOrigin(request) || PUBLIC_BOOKING_ORIGINS.has(request.headers.get('origin'));
}
async function apiWithCors(request, env, path) {
  const origin = request.headers.get('origin');
  const allowCors = publicBookingPath(path) && PUBLIC_BOOKING_ORIGINS.has(origin);
  if(request.method === 'OPTIONS') {
    if(!allowCors) return fail('Origem não permitida.', 403);
    const requestedMethod = request.headers.get('access-control-request-method');
    if(!['GET', 'POST'].includes(requestedMethod)) return fail('Método não permitido.', 405);
    const requestedHeaders = (request.headers.get('access-control-request-headers') || '').split(',').map(h => h.trim().toLowerCase()).filter(Boolean);
    if(requestedHeaders.some(h => h !== 'content-type')) return fail('Cabeçalho não permitido.', 403);
    return new Response(null, {status:204,headers:{'access-control-allow-origin':origin,'access-control-allow-methods':'GET, POST','access-control-allow-headers':'Content-Type','access-control-max-age':'600','vary':'Origin'}});
  }
  const response = await api(request, env, path);
  if(allowCors) {
    response.headers.set('access-control-allow-origin', origin);
    response.headers.set('vary', 'Origin');
  }
  return response;
}

async function createAppointment(request, db) {
  if (!bookingOriginAllowed(request)) return fail('Origem não permitida.', 403);
  let body;
  try { body = await readBody(request); } catch { return fail('Não foi possível ler os dados do agendamento.'); }
  if (body.website) return fail('Não foi possível receber este pedido.');
  const date = body.date;
  const time = body.time;
  const service = clean(body.service, 40);
  const petName = clean(body.petName, 80);
  const petType = clean(body.petType, 12);
  const guardianName = clean(body.guardianName, 100);
  const phone = String(body.phone || '').replace(/\D/g, '');
  const email = clean(body.email, 120).toLowerCase();
  const notes = clean(body.notes, 500);
  if (!bookableDate(date) || !validTime(time) || !petName || !guardianName || !['cao', 'gato'].includes(petType) || !['10', '11'].includes(String(phone.length)) || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return fail('Revise a data, o horário e os dados de contato.');
  }
  const available = await availability(db, date, service);
  if (!available || !available.slots.includes(time)) return fail('Esse horário não está mais disponível. Escolha outro.', 409);
  const recent = await first(db, "SELECT COUNT(*) AS count FROM appointments WHERE phone = ? AND created_at >= datetime('now', '-1 day') AND status <> 'cancelled'", phone);
  if ((recent?.count || 0) >= 3) return fail('Há muitas solicitações recentes para este número. Fale com a equipe.', 429);
  const id = crypto.randomUUID();
  const statements = [db.prepare('INSERT INTO appointments (id, date, time, service, duration_minutes, pet_name, pet_type, guardian_name, phone, email, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, date, time, service, available.durationMinutes, petName, petType, guardianName, phone, email || null, notes || null, 'pending')];
  for (const cell of cellsFor(time, available.durationMinutes)) {
    statements.push(db.prepare('INSERT INTO calendar_cells (date, time, appointment_id) VALUES (?, ?, ?)').bind(date, cell, id));
  }
  try { await db.batch(statements); }
  catch (error) {
    if (/UNIQUE|constraint|PRIMARY KEY/i.test(String(error))) return fail('Esse horário acabou de ser ocupado. Escolha outro.', 409);
    throw error;
  }
  return json({ id, date, time, status: 'pending', calendarUrl: `/api/appointments/${id}.ics` }, 201);
}

function isAdmin(request, env) {
  const email = (request.headers.get('oai-authenticated-user-email') || '').trim().toLowerCase();
  const userId = request.headers.get('oai-authenticated-user-id');
  const allowed = (env.ADMIN_EMAILS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  return !!userId && !!email && allowed.includes(email);
}

function adminDenied(request, env) {
  if (isAdmin(request, env)) return null;
  return request.headers.get('oai-authenticated-user-id') ? fail('Acesso restrito à equipe da Love Pets.', 403) : fail('Entre com sua conta ChatGPT para acessar a agenda.', 401);
}

async function adminState(db, request) {
  const url = new URL(request.url);
  const today = localNow().date;
  const from = validDate(url.searchParams.get('from')) ? url.searchParams.get('from') : today;
  const to = validDate(url.searchParams.get('to')) ? url.searchParams.get('to') : dayOffset(today, 45);
  if (from > to || to > dayOffset(from, 120)) return fail('Intervalo de datas inválido.');
  const [bookings, blocked, weekly, serviceList] = await Promise.all([
    rows(db, 'SELECT id, date, time, service, duration_minutes, pet_name, pet_type, guardian_name, phone, email, notes, status, created_at FROM appointments WHERE date BETWEEN ? AND ? ORDER BY date, time', from, to),
    rows(db, 'SELECT id, date, time, reason FROM blocked_slots WHERE date BETWEEN ? AND ? ORDER BY date, time', from, to),
    hours(db), services(db),
  ]);
  return json({ appointments: bookings, blocks: blocked, hours: weekly, services: serviceList, today });
}

async function changeStatus(db, id, request) {
  let body;
  try { body = await readBody(request); } catch { return fail('Dados inválidos.'); }
  const status = body.status;
  if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) return fail('Status inválido.');
  const existing = await first(db, 'SELECT id, date, time, duration_minutes, status FROM appointments WHERE id = ?', id);
  if (!existing) return fail('Agendamento não encontrado.', 404);
  if (existing.status === status) return json({ ok: true });
  const update = db.prepare("UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(status, id);
  try {
    if (status === 'cancelled') {
      await db.batch([db.prepare('DELETE FROM calendar_cells WHERE appointment_id = ?').bind(id), update]);
    } else if (existing.status === 'cancelled') {
      const statements = [update];
      for (const cell of cellsFor(existing.time, existing.duration_minutes)) statements.push(db.prepare('INSERT INTO calendar_cells (date, time, appointment_id) VALUES (?, ?, ?)').bind(existing.date, cell, id));
      await db.batch(statements);
    } else await update.run();
  } catch (error) {
    if (/UNIQUE|constraint|PRIMARY KEY/i.test(String(error))) return fail('O período está ocupado ou bloqueado e não pode ser reativado.', 409);
    throw error;
  }
  return json({ ok: true });
}

async function saveHours(db, request) {
  let body;
  try { body = await readBody(request); } catch { return fail('Dados inválidos.'); }
  if (!Array.isArray(body.hours) || body.hours.length !== 7) return fail('Informe os sete dias da semana.');
  const ordered = [...body.hours].sort((a, b) => a.weekday - b.weekday);
  for (let i = 0; i < 7; i++) {
    const row = ordered[i];
    if (row.weekday !== i || typeof row.enabled !== 'boolean' || !validTime(row.openTime) || !validTime(row.closeTime) || minuteOf(row.openTime) >= minuteOf(row.closeTime)) return fail('Revise os horários da semana.');
  }
  await db.batch([db.prepare('DELETE FROM weekly_hours'), ...ordered.map(row => db.prepare('INSERT INTO weekly_hours (weekday, enabled, open_time, close_time) VALUES (?, ?, ?, ?)').bind(row.weekday, row.enabled ? 1 : 0, row.openTime, row.closeTime))]);
  return json({ ok: true });
}

async function saveServices(db, request) {
  let body;
  try { body = await readBody(request); } catch { return fail('Dados inválidos.'); }
  if (!Array.isArray(body.services) || body.services.length !== 3) return fail('Informe os três serviços.');
  const ids = new Set();
  for (const service of body.services) {
    if (!DEFAULT_SERVICES.some(item => item.id === service.id) || ids.has(service.id) || !clean(service.label, 60) || !Number.isInteger(service.durationMinutes) || service.durationMinutes < 30 || service.durationMinutes > 240 || service.durationMinutes % 30 || typeof service.enabled !== 'boolean') return fail('Revise os serviços e suas durações.');
    ids.add(service.id);
  }
  if (!body.services.some(service => service.enabled)) return fail('Mantenha ao menos um serviço disponível.');
  await db.batch([db.prepare('DELETE FROM services'), ...body.services.map(service => db.prepare('INSERT INTO services (id, label, duration_minutes, enabled) VALUES (?, ?, ?, ?)').bind(service.id, clean(service.label, 60), service.durationMinutes, service.enabled ? 1 : 0))]);
  return json({ ok: true });
}

async function addBlock(db, request) {
  let body;
  try { body = await readBody(request); } catch { return fail('Dados inválidos.'); }
  const date = body.date;
  const time = body.time;
  const reason = clean(body.reason, 100);
  if (!validDate(date) || date < localNow().date || date > dayOffset(localNow().date, 180) || (time !== '*' && !validTime(time))) return fail('Data ou horário inválido.');
  const id = crypto.randomUUID();
  const cells = time === '*' ? Array.from({ length: 48 }, (_, i) => timeOf(i * SLOT_STEP)) : [time];
  const statements = [db.prepare('INSERT INTO blocked_slots (id, date, time, reason) VALUES (?, ?, ?, ?)').bind(id, date, time, reason || null)];
  for (const cell of cells) statements.push(db.prepare('INSERT INTO calendar_cells (date, time, block_id) VALUES (?, ?, ?)').bind(date, cell, id));
  try { await db.batch(statements); }
  catch (error) { if (/UNIQUE|constraint|PRIMARY KEY/i.test(String(error))) return fail('Há um agendamento ou bloqueio nesse período. Resolva-o antes de bloquear.', 409); throw error; }
  return json({ ok: true }, 201);
}

function icsEscape(value) { return String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, match => '\\' + match); }
function icsUtc(date, time) {
  const guess = Date.parse(`${date}T${time}:00Z`);
  const offsetName = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, timeZoneName: 'shortOffset' }).formatToParts(new Date(guess)).find(part => part.type === 'timeZoneName')?.value || 'GMT-3';
  const match = offsetName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const offsetMinutes = match ? (match[1] === '+' ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3] || 0)) : -180;
  return new Date(guess - offsetMinutes * 60000);
}
function icsStamp(date) { return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
function calendarEvent(booking, publicCopy = false) {
  const start = icsUtc(booking.date, booking.time);
  const end = new Date(start.valueOf() + booking.duration_minutes * 60000);
  const summary = publicCopy ? 'Solicitação de horário · Love Pets' : `Love Pets · ${booking.pet_name} (${booking.service})`;
  return ['BEGIN:VEVENT', `UID:${booking.id}@love-pets-lavras`, `DTSTAMP:${icsStamp(new Date())}`, `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`, `SUMMARY:${icsEscape(summary)}`, `STATUS:${booking.status === 'pending' ? 'TENTATIVE' : 'CONFIRMED'}`, 'END:VEVENT'];
}
function calendarResponse(bookings, filename) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Love Pets Lavras//Agenda//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...bookings.flatMap(booking => calendarEvent(booking, filename === 'solicitacao.ics')), 'END:VCALENDAR'];
  return new Response(lines.join('\r\n') + '\r\n', { headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="${filename}"`, 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' } });
}

const PRODUCT_CATEGORIES = new Set(['mantinhas', 'roupinhas', 'caminhas', 'caes', 'gatos']);
function productInput(body) {
  if (!body || !PRODUCT_CATEGORIES.has(body.category)) return null;
  const product = {
    name: clean(body.name, 100), category: body.category,
    description: clean(body.description, 450), usage: clean(body.usage, 300),
    selection: clean(body.selection, 300), care: clean(body.care, 300),
    price: clean(body.price, 40) || null, available: body.available !== false,
  };
  if (!product.name || !product.description || !product.usage || !product.selection || !product.care) return null;
  return product;
}

function productImageUrl(image, origin) {
  return image.startsWith('products/') ? `${origin}/api/product-images/${image.slice('products/'.length)}` : image;
}

async function listShopProducts(db, origin, includeUnavailable = false) {
  const sql = `SELECT id, name, category, description, usage, selection, care, image, price, available
    FROM shop_products ${includeUnavailable ? '' : 'WHERE available = 1'} ORDER BY created_at DESC`;
  return (await rows(db, sql)).map(item => ({ ...item, image: productImageUrl(item.image, origin), available: !!item.available }));
}

async function writeShopProduct(db, bucket, request, id = crypto.randomUUID()) {
  let body;
  try { body = await readBody(request, 370000); } catch { return fail('Foto ou dados inválidos. Use uma imagem menor.'); }
  const product = productInput(body);
  if (!product) return fail('Preencha os dados do produto.');
  const origin = new URL(request.url).origin;
  const existing = request.method === 'PUT' ? await first(db, 'SELECT image FROM shop_products WHERE id = ?', id) : null;
  if (request.method === 'PUT' && !existing) return fail('Produto não encontrado.', 404);
  let image = existing?.image;
  let uploadedKey = null;
  if (typeof body.image === 'string' && /^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(body.image) && body.image.length <= 350000) {
    const binary = atob(body.image.slice('data:image/webp;base64,'.length));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    uploadedKey = `products/${crypto.randomUUID()}.webp`;
    await bucket.put(uploadedKey, bytes, { httpMetadata: { contentType: 'image/webp' } });
    image = uploadedKey;
  } else if (!existing || body.image !== productImageUrl(existing.image, origin)) {
    return fail('Envie uma foto WebP válida de até 250 KB.');
  }
  const values = [product.name, product.category, product.description, product.usage, product.selection, product.care, image, product.price, product.available ? 1 : 0];
  try {
    if (request.method === 'POST') {
      await db.prepare('INSERT INTO shop_products (id, name, category, description, usage, selection, care, image, price, available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, ...values).run();
    } else {
      await db.prepare('UPDATE shop_products SET name = ?, category = ?, description = ?, usage = ?, selection = ?, care = ?, image = ?, price = ?, available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(...values, id).run();
    }
  } catch (error) {
    if (uploadedKey) await bucket.delete(uploadedKey).catch(() => {});
    throw error;
  }
  if (uploadedKey && existing?.image.startsWith('products/')) await bucket.delete(existing.image).catch(error => console.error('Old product photo cleanup failed', error));
  return json({ id, ok: true }, request.method === 'POST' ? 201 : 200);
}

async function api(request, env, path) {
  if (!env.DB) return fail('A agenda está temporariamente indisponível.', 503);
  const db = env.DB;
  const url = new URL(request.url);
  if (path === '/api/config' && request.method === 'GET') return json({ services: (await services(db)).filter(s => s.enabled && s.id !== 'tosa'), today: localNow().date, maxDate: dayOffset(localNow().date, MAX_DAYS), timezone: ZONE });
  if (path === '/api/products' && request.method === 'GET') return json({ products: await listShopProducts(db, url.origin) });
  const productImage = path.match(/^\/api\/product-images\/([0-9a-f-]{36})\.webp$/);
  if (productImage && request.method === 'GET') {
    if (!env.BUCKET) return fail('Fotos temporariamente indisponíveis.', 503);
    const object = await env.BUCKET.get(`products/${productImage[1]}.webp`);
    return object ? new Response(object.body, { headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } }) : fail('Foto não encontrada.', 404);
  }
  if (path === '/api/availability' && request.method === 'GET') {
    const result = await availability(db, url.searchParams.get('date'), url.searchParams.get('service'));
    return result ? json(result) : fail('Serviço inválido.');
  }
  if (path === '/api/appointments' && request.method === 'POST') return createAppointment(request, db);
  const visitorIcs = path.match(/^\/api\/appointments\/([0-9a-f-]{36})\.ics$/);
  if (visitorIcs && request.method === 'GET') {
    const booking = await first(db, "SELECT id, date, time, duration_minutes, status FROM appointments WHERE id = ? AND status <> 'cancelled'", visitorIcs[1]);
    return booking ? calendarResponse([booking], 'solicitacao.ics') : fail('Agendamento não encontrado.', 404);
  }
  if (path === '/api/calendar.ics' && request.method === 'GET') {
    const token = url.searchParams.get('token');
    if (!env.CALENDAR_FEED_TOKEN || !token || token !== env.CALENDAR_FEED_TOKEN) return fail('Acesso não autorizado.', 401);
    const bookings = await rows(db, "SELECT id, date, time, duration_minutes, pet_name, service, status FROM appointments WHERE date >= ? AND status <> 'cancelled' ORDER BY date, time", dayOffset(localNow().date, -7));
    return calendarResponse(bookings, 'love-pets-agenda.ics');
  }
  if (!path.startsWith('/api/admin/')) return fail('Rota não encontrada.', 404);
  const denied = adminDenied(request, env);
  if (denied) return denied;
  if (!['GET', 'HEAD'].includes(request.method) && !sameOrigin(request)) return fail('Origem não permitida.', 403);
  if (path === '/api/admin/state' && request.method === 'GET') return adminState(db, request);
  if (path === '/api/admin/products' && request.method === 'GET') return json({ products: await listShopProducts(db, url.origin, true) });
  if (path === '/api/admin/products' && request.method === 'POST') return env.BUCKET ? writeShopProduct(db, env.BUCKET, request) : fail('Fotos temporariamente indisponíveis.', 503);
  const shopProduct = path.match(/^\/api\/admin\/products\/([0-9a-f-]{36})$/);
  if (shopProduct && request.method === 'PUT') return env.BUCKET ? writeShopProduct(db, env.BUCKET, request, shopProduct[1]) : fail('Fotos temporariamente indisponíveis.', 503);
  if (shopProduct && request.method === 'DELETE') {
    const existing = await first(db, 'SELECT image FROM shop_products WHERE id = ?', shopProduct[1]);
    if (!existing) return fail('Produto não encontrado.', 404);
    await db.prepare('DELETE FROM shop_products WHERE id = ?').bind(shopProduct[1]).run();
    if (env.BUCKET && existing.image.startsWith('products/')) await env.BUCKET.delete(existing.image).catch(error => console.error('Product photo cleanup failed', error));
    return json({ ok: true });
  }
  if (path === '/api/admin/calendar-url' && request.method === 'GET') return env.CALENDAR_FEED_TOKEN ? json({ url: `${url.origin}/api/calendar.ics?token=${encodeURIComponent(env.CALENDAR_FEED_TOKEN)}` }) : fail('Calendário externo não configurado.', 503);
  if (path === '/api/admin/hours' && request.method === 'PUT') return saveHours(db, request);
  if (path === '/api/admin/services' && request.method === 'PUT') return saveServices(db, request);
  if (path === '/api/admin/blocks' && request.method === 'POST') return addBlock(db, request);
  const block = path.match(/^\/api\/admin\/blocks\/([0-9a-f-]{36})$/);
  if (block && request.method === 'DELETE') { await db.batch([db.prepare('DELETE FROM calendar_cells WHERE block_id = ?').bind(block[1]), db.prepare('DELETE FROM blocked_slots WHERE id = ?').bind(block[1])]); return json({ ok: true }); }
  const appointment = path.match(/^\/api\/admin\/appointments\/([0-9a-f-]{36})$/);
  if (appointment && request.method === 'PATCH') return changeStatus(db, appointment[1], request);
  return fail('Rota não encontrada.', 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    try {
      if (path.startsWith('/api/')) return await apiWithCors(request, env, path);
      if (!['GET', 'HEAD'].includes(request.method)) return fail('Método não permitido.', 405);
      if (path === '/admin' || path === '/admin.html') {
        if (!isAdmin(request, env)) {
          if (!request.headers.get('oai-authenticated-user-id')) return Response.redirect(`${url.origin}/signin-with-chatgpt?return_to=%2Fadmin`, 302);
          return new Response('Acesso restrito à equipe da Love Pets.', { status: 403, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
        }
        return staticResponse('/admin.html', true, request.method === 'HEAD');
      }
      const asset = path === '/' ? '/index.html' : path === '/agendar' ? '/agendar.html' : path === '/produtos' ? '/produtos.html' : path;
      return staticResponse(asset, asset.endsWith('.html'), request.method === 'HEAD') || new Response('Página não encontrada.', { status: 404 });
    } catch (error) {
      console.error('Love Pets request failed', error);
      return fail('Não foi possível concluir agora. Tente novamente ou fale com a Love Pets.', 503);
    }
  },
};
