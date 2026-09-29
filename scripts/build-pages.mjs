import {readFileSync,writeFileSync,readdirSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import {join,resolve,relative} from 'node:path';

const root=process.cwd();
const source=join(root,'public');
const output=resolve(root,'docs');
if(output!==join(root,'docs'))throw new Error('Invalid output path');
const base='/love-pets-lavras/';
const origin='https://duduwwl.github.io';
const apiOrigin='https://love-pets-lavras.duduwwl.chatgpt.site';
const directBooking=process.argv.includes('--direct-booking');
const routes={'index.html':'index.html','produtos.html':'produtos/index.html','agendar.html':'agendar/index.html','equipe.html':'equipe/index.html','demo-admin.html':'admin/index.html'};
const exclusions=new Set(['admin.html','admin.js','runtime.js','sitemap.xml','robots.txt','gato-hero.png']);
function pageLink(value) {
  if(!value.startsWith('/')||value.startsWith('//'))return value;
  const [path,...fragment]=value.split('#');
  const bookingLink=directBooking?base+'agendar/':apiOrigin+'/agendar';
  const names={'/':base,'/produtos':base+'produtos/','/produtos.html':base+'produtos/','/agendar':bookingLink,'/agendar.html':bookingLink,'/equipe.html':base+'equipe/','/admin':base+'equipe/','/demo-admin.html':base+'admin/'};
  return (names[path] || base+path.slice(1))+(fragment.length?'#'+fragment.join('#'):'');
}
rmSync(output,{recursive:true,force:true});mkdirSync(output,{recursive:true});
function collect(dir){
 for(const entry of readdirSync(dir,{withFileTypes:true})){
  const input=join(dir,entry.name);const name=relative(source,input).replaceAll('\\','/');
  if(entry.isDirectory()){collect(input);continue;}
  if(!entry.isFile())throw new Error('Unsupported asset');
  if(exclusions.has(entry.name))continue;
  const destination=join(output,routes[name]||name);mkdirSync(resolve(destination,'..'),{recursive:true});
  if(name.endsWith('.html')){
   let html=readFileSync(input,'utf8');
   if(name==='demo-admin.html')html=html.replace('src="/admin.js"','src="/demo-admin-ui.js"');
   html=html.replace(/(href|src|action)="(\/[^"]*)"/g,(_,attr,value)=>`${attr}="${pageLink(value)}"`);
   const route=(routes[name]||name).replace(/index\.html$/,'');
   const canonical=origin+base+route;
   html=html.replace(/<link rel="canonical"[^>]*>/,'').replace(/<meta property="og:url"[^>]*>/,'');
   html=html.replace('</head>',`  <link rel="canonical" href="${canonical}">\n  <meta property="og:url" content="${canonical}">\n</head>`);
   html=html.replaceAll('"url":"https://love-pets-lavras.duduwwl.chatgpt.site/"',`"url":"${origin}${base}"`);
   writeFileSync(destination,html);
  }else if(name==='products.json'){
   const products=JSON.parse(readFileSync(input,'utf8')).map(item=>({...item,image:pageLink(item.image)}));
   writeFileSync(destination,JSON.stringify(products,null,2)+'\n');
  }else copyFileSync(input,destination);
 }
}
collect(source);
copyFileSync(join(source,'admin.js'),join(output,'demo-admin-ui.js'));
// The existing live booking app works without cross-origin API permissions.
// Use --direct-booking only after deploying this repository's CORS-capable Worker.
if(!directBooking){
 const target=apiOrigin+'/agendar';
 writeFileSync(join(output,'agendar/index.html'),`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${target}"><meta name="robots" content="noindex"><link rel="canonical" href="${target}"><title>Agendamento | Love Pets</title><script>location.replace(${JSON.stringify(target)});</script></head><body><a href="${target}">Abrir formulário de agendamento</a></body></html>`);
}
writeFileSync(join(output,'runtime.js'),`// Public connection settings; no secrets.\nwindow.LOVE_PETS_PUBLIC_BASE = ${JSON.stringify(base)};\nwindow.LOVE_PETS_API_ORIGIN = ${JSON.stringify(apiOrigin)};\n`);
writeFileSync(join(output,'.nojekyll'),'');
writeFileSync(join(output,'robots.txt'),`User-agent: *\nDisallow: ${base}equipe/\nDisallow: ${base}admin/\nSitemap: ${origin}${base}sitemap.xml\n`);
writeFileSync(join(output,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['','produtos/'].map(route=>`<url><loc>${origin}${base}${route}</loc></url>`).join('')}</urlset>\n`);
writeFileSync(join(output,'404.html'),`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Página não encontrada | Love Pets</title><link rel="stylesheet" href="${base}schedule.css"></head><body class="admin-page"><main class="team-entry"><span class="eyebrow">LOVE PETS · LAVRAS</span><h1>Vamos voltar<br>ao <em>início?</em></h1><p>Esta página não está disponível.</p><a class="submit-booking" href="${base}">Voltar ao site</a><a class="return-link" href="${base}produtos/">Ver produtos</a></main></body></html>`);
console.log(`GitHub Pages prepared in docs: home, products, booking (${directBooking?'direct API':'direct links to live form'}) and team access.`);
