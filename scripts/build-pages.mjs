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
const routes={'index.html':'index.html','produtos.html':'produtos/index.html','agendar.html':'agendar/index.html','equipe.html':'equipe/index.html'};
const exclusions=new Set(['admin.html','admin.js','runtime.js','sitemap.xml','robots.txt','gato-hero.png']);
function pageLink(value) {
  if(!value.startsWith('/')||value.startsWith('//'))return value;
  const [path,...fragment]=value.split('#');
  const names={'/':base,'/produtos':base+'produtos/','/produtos.html':base+'produtos/','/agendar':base+'agendar/','/agendar.html':base+'agendar/','/equipe.html':base+'equipe/','/admin':base+'equipe/'};
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
   let html=readFileSync(input,'utf8').replace(/(href|src)="(\/[^"]*)"/g,(_,attr,value)=>`${attr}="${pageLink(value)}"`);
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
// The existing live booking app works without cross-origin API permissions.
// Use --direct-booking only after deploying this repository's CORS-capable Worker.
if(!directBooking){
 const bookingShell=readFileSync(join(output,'equipe/index.html'),'utf8');
 const bookingHead=bookingShell.slice(0,bookingShell.indexOf('<body')).replace('Acesso da equipe | Love Pets Lavras','Agendar banho e tosa | Love Pets Lavras').replace(/<meta name="robots"[^>]*>/,'').replaceAll(origin+base+'equipe/',origin+base+'agendar/');
 const bookingHeader=bookingShell.match(/  <header[\s\S]*?<\/header>/)[0].replace(`<a href="${base}agendar/">Agendamento</a>`,`<a href="${base}produtos/">Produtos</a>`);
 const bookingHtml=`${bookingHead}<body class="booking-embed-page">\n${bookingHeader}\n<main class="booking-access"><div class="booking-access-copy"><span class="eyebrow">AGENDAMENTO ONLINE</span><h1>Um horário só<br>para <em>seu pet.</em></h1><p>Banho, tosa ou os dois. Escolha o cuidado e veja os horários livres para seu cachorrinho ou gatinho.</p><a class="submit-booking" href="${apiOrigin}/agendar">Escolher dia e horário</a><span class="booking-access-note">Você será direcionado à agenda online da Love Pets.</span><div class="booking-access-details"><h2>Como funciona</h2><ol><li>Escolha o serviço, o dia e um horário disponível.</li><li>Informe o nome do pet e seu WhatsApp.</li><li>A equipe confirma os detalhes do atendimento com você.</li></ol></div></div><div class="booking-access-photo"><img src="${base}assets/gato-hero.webp" alt="Gato em um ambiente acolhedor, imagem ilustrativa" width="1086" height="1448"><span>Cães e gatos bem-vindos</span></div></main><footer class="schedule-footer"><span>Love Pets · Lavras, MG</span><a href="${base}equipe/">Área da equipe</a></footer></body></html>`;
 writeFileSync(join(output,'agendar/index.html'),bookingHtml);
}
writeFileSync(join(output,'runtime.js'),`// Public connection settings; no secrets.\nwindow.LOVE_PETS_PUBLIC_BASE = ${JSON.stringify(base)};\nwindow.LOVE_PETS_API_ORIGIN = ${JSON.stringify(apiOrigin)};\n`);
writeFileSync(join(output,'.nojekyll'),'');
writeFileSync(join(output,'robots.txt'),`User-agent: *\nDisallow: ${base}equipe/\nSitemap: ${origin}${base}sitemap.xml\n`);
writeFileSync(join(output,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['','produtos/','agendar/'].map(route=>`<url><loc>${origin}${base}${route}</loc></url>`).join('')}</urlset>\n`);
writeFileSync(join(output,'404.html'),`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Página não encontrada | Love Pets</title><link rel="stylesheet" href="${base}schedule.css"></head><body class="admin-page"><main class="team-entry"><span class="eyebrow">LOVE PETS · LAVRAS</span><h1>Vamos voltar<br>ao <em>início?</em></h1><p>Esta página não está disponível.</p><a class="submit-booking" href="${base}">Voltar ao site</a><a class="return-link" href="${base}produtos/">Ver produtos</a></main></body></html>`);
console.log(`GitHub Pages prepared in docs: home, products, booking (${directBooking?'direct API':'access to live booking'}) and team access.`);
