import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const root=join(process.cwd(),'docs');
const base='/love-pets-lavras/';
const pages=['index.html','produtos/index.html','agendar/index.html','equipe/index.html','admin/index.html','404.html'];
let references=0;
for(const path of pages){
 const html=readFileSync(join(root,path),'utf8');
 if(path!=='admin/index.html')assert(!/(?:href|action)="[^"]*\.chatgpt\.site/.test(html),`${path}: navigation leaves GitHub Pages`);
 assert(!html.includes('location.replace'),`${path}: unexpected redirect`);
 for(const [,value] of html.matchAll(/(?:href|src|action)="([^"]*)"/g)){
  if(!value.startsWith('/'))continue;
  assert(value.startsWith(base),`${path}: wrong base ${value}`);
  const destination=value.slice(base.length).split('#')[0].split('?')[0];
  const resolved=join(root,destination.endsWith('/')||!destination?destination+'index.html':destination);
  assert(existsSync(resolved),`${path}: missing ${resolved}`);references++;
 }
}
const home=readFileSync(join(root,'index.html'),'utf8');
assert(!home.includes('id="product-grid"'));
assert(!home.includes('id="booking-form"'));
assert(!home.includes('id="sobre"'));
assert(!home.includes('hero-footnote'));
assert(!home.includes('hero-bottom'));
assert(home.includes(`href="${base}agendar/"`));
assert(!home.includes('intro-mark'));
assert(home.includes('class="contact-map"'));
assert(home.includes('🐶')&&home.includes('🐱'));
const booking=readFileSync(join(root,'agendar/index.html'),'utf8');
assert(booking.includes('id="booking-form"'));
assert(booking.includes('Nome do tutor'));
assert(!booking.includes('01—03'));
assert(readFileSync(join(root,'booking.js'),'utf8').includes("service.id !== 'tosa'"));
assert(readFileSync(join(root,'equipe/index.html'),'utf8').includes('value="lovepets-demo"'));
const admin=readFileSync(join(root,'admin/index.html'),'utf8');
assert(admin.includes('url=https://love-pets-lavras.duduwwl.chatgpt.site/admin'));
assert(!admin.includes('demo-admin-data.js'));
const products=JSON.parse(readFileSync(join(root,'products.json'),'utf8'));
assert.equal(products.length,22);
const counts={mantinhas:4,roupinhas:4,caminhas:4,caes:5,gatos:5};
for(const [category,count] of Object.entries(counts))assert.equal(products.filter(p=>p.category===category).length,count);
for(const product of products){
 for(const field of ['description','usage','selection','care'])assert(product[field]?.length>20,`${product.name}: missing ${field}`);
 assert.match(product.id,/^[0-9a-f-]{36}$/);
 assert(product.image.startsWith(base));assert(existsSync(join(root,product.image.slice(base.length))));
}
assert(readFileSync(join(root,'products.js'),'utf8').includes("/api/products"));
assert(!existsSync(join(root,'admin.html')));
assert(!existsSync(join(root,'admin.js')));
assert(readFileSync(join(root,'runtime.js'),'utf8').includes('https://love-pets-lavras.duduwwl.chatgpt.site'));
console.log(`Pages verified: ${pages.length} pages, ${references} links/assets, 22 complete products, internal booking form, protected admin gateway.`);
