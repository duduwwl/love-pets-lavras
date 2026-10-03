import { readFile } from 'node:fs/promises';

const projectId = 'mundix';
const apiKey = 'AIzaSyCZxFIpb91Dy_Y3uDeb0SyA3DLJ4jhkk9w';
const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const value = item => item === null || item === undefined ? { nullValue: null }
  : typeof item === 'boolean' ? { booleanValue: item }
  : typeof item === 'number' && Number.isInteger(item) ? { integerValue: String(item) }
  : typeof item === 'number' ? { doubleValue: item }
  : Array.isArray(item) ? { arrayValue: { values: item.map(value) } }
  : typeof item === 'object' ? { mapValue: { fields: Object.fromEntries(Object.entries(item).map(([key, child]) => [key, value(child)])) } }
  : { stringValue: String(item) };

const products = JSON.parse(await readFile(new URL('../public/products.json', import.meta.url), 'utf8'));
for (const product of products) {
  const fields = Object.fromEntries(Object.entries({
    name: product.name, category: product.category, description: product.description,
    usage: product.usage || '', selection: product.selection || '', care: product.care || '', image: product.image,
    price: product.price, available: product.available !== false, stockQuantity: product.stockQuantity ?? null,
    flavors: product.flavors || [], sizes: product.sizes || [], illustrative: false,
    updatedAt: new Date().toISOString(),
  }).map(([key, item]) => [key, value(item)]));
  const response = await fetch(`${endpoint}/lovePetsProducts/${encodeURIComponent(product.id)}?key=${apiKey}`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw new Error(`Falha ao cadastrar ${product.name}: ${response.status} ${await response.text()}`);
}
console.log(`Firebase mundix: ${products.length} produtos sincronizados.`);
