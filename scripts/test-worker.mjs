import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../dist/server/index.js';

const sqlite = new DatabaseSync(':memory:');
for (const migration of readdirSync('drizzle').filter(name => name.endsWith('.sql')).sort()) {
  for (const statement of readFileSync(`drizzle/${migration}`, 'utf8').split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)) sqlite.exec(statement);
}
sqlite.exec('PRAGMA foreign_keys = ON');

class Statement {
  constructor(sql, values = []) { this.sql = sql; this.values = values; }
  bind(...values) { return new Statement(this.sql, values); }
  all() { return { results: sqlite.prepare(this.sql).all(...this.values) }; }
  first() { return sqlite.prepare(this.sql).get(...this.values) || null; }
  run() { const result = sqlite.prepare(this.sql).run(...this.values); return { meta: { changes: result.changes } }; }
}
const db = {
  prepare(sql) { return new Statement(sql); },
  async batch(statements) {
    sqlite.exec('BEGIN');
    try { const results = statements.map(s => s.run()); sqlite.exec('COMMIT'); return results; }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  },
};
const storedPhotos = new Map();
const bucket = {
  async put(key, value) { storedPhotos.set(key, value); },
  async get(key) { return storedPhotos.has(key) ? { body: new Response(storedPhotos.get(key)).body } : null; },
  async delete(key) { storedPhotos.delete(key); },
};
const env = { DB: db, BUCKET: bucket, ADMIN_EMAILS: 'admin@example.com', CALENDAR_FEED_TOKEN: 'test-feed-secret' };
const origin = 'https://love-pets-lavras.example';
const adminHeaders = { 'oai-authenticated-user-id': 'owner', 'oai-authenticated-user-email': 'admin@example.com', origin };
async function call(path, { method = 'GET', body, headers = {} } = {}) {
  const request = new Request(origin + path, { method, headers: { ...headers, ...(body ? { 'content-type': 'application/json', origin } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return worker.fetch(request, env);
}
async function data(response) { return response.json(); }
function futureTuesday() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  const d = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`);
  let offset = (2 - d.getUTCDay() + 7) % 7;
  if (offset < 2) offset += 7;
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

assert.equal((await call('/')).status, 200);
assert.equal((await call('/agendar')).status, 200);
assert.equal((await call('/admin')).status, 302);
assert.equal((await call('/admin', { headers: { 'oai-authenticated-user-id': 'other', 'oai-authenticated-user-email': 'other@example.com' } })).status, 403);
assert.equal((await call('/admin', { headers: adminHeaders })).status, 200);
assert.equal((await call('/api/admin/state')).status, 401);

const date = futureTuesday();
const config = await data(await call('/api/config'));
assert.equal(config.services.length, 2);
assert(!config.services.some(service => service.id === 'tosa'));
const initial = await data(await call(`/api/availability?date=${date}&service=banho-tosa`));
assert(initial.slots.includes('12:00'));
const initialHours = (await data(await call('/api/admin/state', {headers:adminHeaders}))).hours;
const changedHours = initialHours.map(day => day.weekday === 2 ? {...day,openTime:'13:00'} : day);
assert.equal((await call('/api/admin/hours', {method:'PUT',headers:adminHeaders,body:{hours:changedHours}})).status,200);
assert(!(await data(await call(`/api/availability?date=${date}&service=banho`))).slots.includes('12:00'));
assert.equal((await call('/api/admin/hours', {method:'PUT',headers:adminHeaders,body:{hours:initialHours}})).status,200);
const booking = { date, time: '12:00', service: 'banho-tosa', petName: 'Mel', petType: 'cao', guardianName: 'Ana', phone: '35999998888', email: 'ana@example.com', notes: 'Primeira visita' };
const saved = await data(await call('/api/appointments', { method: 'POST', body: booking }));
assert.match(saved.id, /^[0-9a-f-]{36}$/);
assert.equal(saved.status, 'pending');
assert.equal((await call('/api/appointments', { method: 'POST', body: booking })).status, 409);
const later = await data(await call(`/api/availability?date=${date}&service=banho`));
assert(!later.slots.includes('12:00'));
assert(!later.slots.includes('13:30'));
assert(later.slots.includes('14:00'));
assert.equal((await call('/api/admin/blocks', { method: 'POST', headers: adminHeaders, body: { date, time: '12:30', reason: 'Conflito' } })).status, 409);

const state = await data(await call('/api/admin/state', { headers: adminHeaders }));
assert.equal(state.appointments.length, 1);
assert.equal(state.appointments[0].pet_name, 'Mel');
assert.equal(state.appointments[0].taxydog, 0);
assert.equal((await call(`/api/admin/appointments/${saved.id}`, { method: 'PATCH', headers: adminHeaders, body: { status: 'confirmed' } })).status, 200);
assert.equal((await call(`/api/admin/appointments/${saved.id}`, { method: 'PATCH', headers: adminHeaders, body: { status: 'completed' } })).status, 200);
assert(!(await data(await call(`/api/availability?date=${date}&service=banho`))).slots.includes('12:00'));
assert.equal((await call('/api/calendar.ics?token=wrong')).status, 401);
const feed = await call('/api/calendar.ics?token=test-feed-secret');
assert.equal(feed.status, 200);
assert.match(await feed.text(), /SUMMARY:Love Pets/);
const single = await call(`/api/appointments/${saved.id}.ics`);
assert.equal(single.status, 200);
assert.doesNotMatch(await single.text(), /35999998888/);

assert.equal((await call(`/api/admin/appointments/${saved.id}`, { method: 'PATCH', headers: adminHeaders, body: { status: 'cancelled' } })).status, 200);
assert((await data(await call(`/api/availability?date=${date}&service=banho-tosa`))).slots.includes('12:00'));
assert.equal((await call('/api/admin/blocks', { method: 'POST', headers: adminHeaders, body: { date, time: '*', reason: 'Folga' } })).status, 201);
assert.equal((await data(await call(`/api/availability?date=${date}&service=banho`))).slots.length, 0);
assert.equal((await call(`/api/admin/appointments/${saved.id}`, { method: 'PATCH', headers: adminHeaders, body: { status: 'confirmed' } })).status, 409);
const pagesOrigin = 'https://duduwwl.github.io';
async function crossOrigin(path, method = 'GET', body, originHeader = pagesOrigin, extra = {}) {
  return worker.fetch(new Request(origin + path, {method,headers:{origin:originHeader,...(body?{'content-type':'application/json'}:{}),...extra},body:body?JSON.stringify(body):undefined}),env);
}
const preflight = await crossOrigin('/api/appointments','OPTIONS',undefined,pagesOrigin,{'access-control-request-method':'POST','access-control-request-headers':'content-type'});
assert.equal(preflight.status,204);
assert.equal(preflight.headers.get('access-control-allow-origin'),pagesOrigin);
assert.equal((await crossOrigin('/api/admin/state','OPTIONS',undefined,pagesOrigin,{'access-control-request-method':'GET'})).status,403);
assert.equal((await crossOrigin('/api/appointments','OPTIONS',undefined,'https://untrusted.example',{'access-control-request-method':'POST'})).status,403);
assert.equal((await crossOrigin('/api/config')).headers.get('access-control-allow-origin'),pagesOrigin);
assert.equal((await crossOrigin('/api/admin/state')).headers.get('access-control-allow-origin'),null);
const photo = 'data:image/webp;base64,UklGRgAAAAAA';
const originalCatalog = (await data(await call('/api/admin/products', {headers:adminHeaders}))).products;
assert.equal(originalCatalog.length,25);
assert(originalCatalog.every(item => item.id.startsWith('10000000-')));
assert(originalCatalog.every(item => !item.price.includes('ilustrativo')));
const fitProduct=originalCatalog.find(item=>item.id==='10000000-0000-4000-8000-000000000008');
assert.deepEqual(fitProduct.flavors,['Maçã','Manga','Morango']);
assert.equal(fitProduct.stockQuantity,10);
assert.equal(originalCatalog.filter(item=>item.name.startsWith('OneByOne Fit')).length,1);
assert.equal(originalCatalog[0].stockQuantity,null);
assert.equal((await call(`/api/admin/products/${originalCatalog[0].id}`, {method:'PUT',headers:adminHeaders,body:{...originalCatalog[0],price:'R$ 15,90',stockQuantity:null}})).status,200);
assert.equal((await data(await call('/api/products'))).products.find(item=>item.id===originalCatalog[0].id).price,'R$ 15,90');
assert.equal((await call(`/api/admin/products/${originalCatalog[0].id}/stock`, {method:'PATCH',headers:adminHeaders,body:{stockQuantity:3}})).status,200);
assert.equal((await data(await call('/api/products'))).products.find(item=>item.id===originalCatalog[0].id).stockQuantity,3);
assert.equal((await call(`/api/admin/products/${originalCatalog[0].id}/stock`, {method:'PATCH',headers:adminHeaders,body:{stockQuantity:-1}})).status,400);
const product = { name:'Caminha de teste',category:'descanso',description:'Caminha macia',image:photo,price:'R$ 50',available:true,stockQuantity:5,flavors:['Baunilha','Mel'] };
assert.equal((await call('/api/admin/products', { method:'POST', body: product })).status,401);
const createdProduct = await data(await call('/api/admin/products', { method:'POST',headers:adminHeaders,body:product }));
assert.match(createdProduct.id,/^[0-9a-f-]{36}$/);
assert.equal((await data(await crossOrigin('/api/products'))).products.length,26);
assert.equal((await crossOrigin('/api/products')).headers.get('access-control-allow-origin'),pagesOrigin);
const publicProduct = (await data(await call('/api/products'))).products.find(item=>item.id===createdProduct.id);
assert.deepEqual(publicProduct.flavors,['Baunilha','Mel']);
assert.match(publicProduct.image, /\/api\/product-images\/[0-9a-f-]{36}\.webp$/);
assert.equal((await call(new URL(publicProduct.image).pathname)).headers.get('content-type'),'image/webp');
assert.equal(storedPhotos.size,1);
assert.equal((await call(`/api/admin/products/${createdProduct.id}`, { method:'PUT',headers:adminHeaders,body:product })).status,200);
const replacedProduct = (await data(await call('/api/products'))).products.find(item=>item.id===createdProduct.id);
assert.notEqual(replacedProduct.image, publicProduct.image);
assert.equal((await call(new URL(publicProduct.image).pathname)).status,404);
assert.equal((await call(`/api/admin/products/${createdProduct.id}`, { method:'PUT',headers:adminHeaders,body:{...product,image:replacedProduct.image,available:false} })).status,200);
assert.equal(storedPhotos.size,1);
assert.equal((await data(await call('/api/products'))).products.length,25);
assert.equal((await data(await call('/api/admin/products', {headers:adminHeaders}))).products.length,26);
assert.equal((await call(`/api/admin/products/${createdProduct.id}`, {method:'DELETE',headers:adminHeaders})).status,200);
assert.equal(storedPhotos.size,0);
const nextDate = new Date(`${date}T12:00:00Z`);nextDate.setUTCDate(nextDate.getUTCDate()+1);
const taxiBooking={...booking,date:nextDate.toISOString().slice(0,10),time:'16:00',service:'banho',phone:'35977776666',taxydog:true,pickupAddress:'Rua das Flores, 25, Centro, Lavras'};
assert.equal((await call('/api/appointments',{method:'POST',body:{...taxiBooking,pickupAddress:'Rua'}})).status,400);
assert.equal((await call('/api/appointments',{method:'POST',body:taxiBooking})).status,201);
const taxiState=await data(await call('/api/admin/state',{headers:adminHeaders}));
assert.equal(taxiState.appointments.find(item=>item.phone===taxiBooking.phone)?.taxydog,1);
assert.equal(taxiState.appointments.find(item=>item.phone===taxiBooking.phone)?.pickup_address,taxiBooking.pickupAddress);
const pagesBooking={...booking,date:nextDate.toISOString().slice(0,10),phone:'35988887777'};
assert.equal((await crossOrigin('/api/appointments','POST',pagesBooking,'https://untrusted.example')).status,403);
const pagesSaved=await crossOrigin('/api/appointments','POST',pagesBooking);
assert.equal(pagesSaved.status,201);
assert.equal(pagesSaved.headers.get('access-control-allow-origin'),pagesOrigin);
assert.equal((await crossOrigin('/api/appointments','POST',pagesBooking)).status,409);
assert.equal((await call('/produtos')).status,200);
assert.equal((await call('/assets/fachada-love-pets.jpeg')).headers.get('content-type'),'image/jpeg');
assert.equal((await call('/assets/taxydog-love-pets.jpeg')).headers.get('content-type'),'image/jpeg');
console.log('Booking, conflicts, admin authorization, calendar, blocks, and GitHub Pages CORS verified.');

