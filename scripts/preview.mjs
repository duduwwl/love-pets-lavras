import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../dist/server/index.js';

const sqlite = new DatabaseSync(':memory:');
for (const statement of readFileSync('drizzle/0000_neat_kronos.sql', 'utf8').split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)) sqlite.exec(statement);
sqlite.exec('PRAGMA foreign_keys = ON');
class Statement {
  constructor(sql, values = []) { this.sql = sql; this.values = values; }
  bind(...values) { return new Statement(this.sql, values); }
  all() { return { results: sqlite.prepare(this.sql).all(...this.values) }; }
  first() { return sqlite.prepare(this.sql).get(...this.values) || null; }
  run() { const result = sqlite.prepare(this.sql).run(...this.values); return { meta: { changes: result.changes } }; }
}
const db = { prepare(sql) { return new Statement(sql); }, async batch(statements) { sqlite.exec('BEGIN'); try { const result = statements.map(s => s.run()); sqlite.exec('COMMIT'); return result; } catch (error) { sqlite.exec('ROLLBACK'); throw error; } } };
const env = { DB: db, ADMIN_EMAILS: 'preview@love-pets.local', CALENDAR_FEED_TOKEN: 'local-preview-only' };
const port = Number(process.env.PORT || 8765);
createServer(async (incoming, outgoing) => {
  const url = `http://127.0.0.1:${port}${incoming.url}`;
  const chunks = [];
  for await (const chunk of incoming) chunks.push(chunk);
  const headers = new Headers(incoming.headers);
  if (incoming.url.startsWith('/admin') || incoming.url.startsWith('/api/admin/')) {
    headers.set('oai-authenticated-user-id', 'preview-owner');
    headers.set('oai-authenticated-user-email', 'preview@love-pets.local');
  }
  const request = new Request(url, { method: incoming.method, headers, body: ['GET', 'HEAD'].includes(incoming.method) ? undefined : Buffer.concat(chunks) });
  const response = await worker.fetch(request, env);
  outgoing.writeHead(response.status, Object.fromEntries(response.headers));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}`));

