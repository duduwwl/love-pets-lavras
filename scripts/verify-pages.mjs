import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const root=join(process.cwd(),'docs');
const base='/love-pets-lavras/';
const pages=['index.html','produtos/index.html','agendar/index.html','equipe/index.html','demo-admin/index.html','admin/index.html','404.html'];
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
assert(home.includes('assets/fachada-love-pets.jpeg'));
assert(home.includes('assets/taxydog-love-pets.jpeg'));
assert(home.includes(`href="${base}agendar/#taxydog"`));
assert(home.includes('🐶')&&home.includes('🐱'));
const booking=readFileSync(join(root,'agendar/index.html'),'utf8');
assert(booking.includes('id="booking-form"'));
assert(booking.includes('Nome do tutor'));
assert(booking.includes('id="taxydog-option"'));
assert(booking.includes('name="pickupAddress"'));
assert(!booking.includes('01—03'));
assert(readFileSync(join(root,'booking.js'),'utf8').includes("service.id !== 'tosa'"));
const team=readFileSync(join(root,'equipe/index.html'),'utf8');
assert(team.includes('value="lovepets-demo"'));
assert(team.includes(`action="${base}demo-admin/"`));
const demo=readFileSync(join(root,'demo-admin/index.html'),'utf8');
assert(demo.includes('PAINEL DE DEMONSTRAÇÃO'));
assert(demo.includes(`${base}demo-admin-data.js`));
assert(demo.includes(`${base}admin.js`));
assert(demo.includes(`${base}admin-products.js`));
assert(!demo.includes('Calendário externo'));
const adminProducts=readFileSync(join(root,'admin-products.js'),'utf8');
assert(adminProducts.includes('products.json'));
assert(adminProducts.includes('name="sizes"'));
assert(adminProducts.includes('stockQuantity'));
const admin=readFileSync(join(root,'admin/index.html'),'utf8');
assert(admin.includes('url=https://love-pets-lavras.duduwwl.chatgpt.site/admin'));
assert(!admin.includes('demo-admin-data.js'));
const products=JSON.parse(readFileSync(join(root,'products.json'),'utf8'));
assert.equal(products.length,25);
const counts={higiene:14,petiscos:3,alimentacao:1,passeio:2,descanso:2,brinquedos:1,gatos:2};
for(const [category,count] of Object.entries(counts))assert.equal(products.filter(p=>p.category===category).length,count);
assert.equal(new Set(products.map(product=>product.image)).size,25);
for(const [id,filename] of [['14','mantinhas-enquadradas.jpg'],['24','shampoo-filhote.jpg'],['25','shampoo-5-em-1.jpg'],['26','shampoo-neutro.jpg']]){
 assert.equal(products.find(product=>product.id.endsWith(id.padStart(12,'0')))?.image,`${base}assets/products/${filename}`);
}
assert.deepEqual(products.find(product=>product.id.endsWith('000000000008'))?.flavors,['Maçã','Manga','Morango']);
assert.equal(products.find(product=>product.id.endsWith('000000000008'))?.stockQuantity,10);
assert.equal(products.filter(product=>product.name.startsWith('OneByOne Fit')).length,1);
assert.deepEqual(products.find(product=>product.name.startsWith('Fraldas'))?.sizes,['P','M','G']);
assert.equal(products.find(product=>product.name==='Mantinhas Love Pets')?.price,'R$ 20,00');
for(const product of products){
 for(const field of ['description','usage','selection','care'])assert(product[field]?.length>20,`${product.name}: missing ${field}`);
 assert.match(product.id,/^[0-9a-f-]{36}$/);
 assert(product.image.startsWith(base));assert(existsSync(join(root,product.image.slice(base.length))));
 assert(!product.price.includes('ilustrativo'));
 assert.equal(product.illustrative,false);
}
assert(readFileSync(join(root,'products.js'),'utf8').includes("/api/products"));
assert(readFileSync(join(root,'products.js'),'utf8').includes('love-pets-demo-products-v1'));
assert(!existsSync(join(root,'admin.html')));
assert(existsSync(join(root,'admin.js')));
assert(readFileSync(join(root,'runtime.js'),'utf8').includes('https://love-pets-lavras.duduwwl.chatgpt.site'));
console.log(`Pages verified: ${pages.length} pages, ${references} links/assets, 25 photographed products, internal booking form, protected admin gateway.`);
