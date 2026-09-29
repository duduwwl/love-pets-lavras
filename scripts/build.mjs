import { readFileSync, readdirSync, mkdirSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const root = process.cwd();
const publicDir = join(root, 'public');
const outDir = join(root, 'dist');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const files = [];
function collect(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) collect(file);
    else if (entry.isFile()) files.push(file);
    else throw new Error(`Unsupported public asset: ${file}`);
  }
}
collect(publicDir);
const assets = Object.fromEntries(files.map(file => {
  const key = '/' + relative(publicDir, file).replaceAll('\\', '/');
  const type = mime[extname(file)] || 'application/octet-stream';
  return [key, { type, data: readFileSync(file).toString('base64') }];
}));
rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, 'server'), { recursive: true });
mkdirSync(join(outDir, '.openai'), { recursive: true });
const worker = readFileSync(join(root, 'worker', 'index.js'), 'utf8');
writeFileSync(join(outDir, 'server', 'index.js'), `const STATIC_ASSETS = ${JSON.stringify(assets)};\n${worker}`);
copyFileSync(join(root, '.openai', 'hosting.json'), join(outDir, '.openai', 'hosting.json'));
console.log(`Built Worker with ${files.length} assets.`);
