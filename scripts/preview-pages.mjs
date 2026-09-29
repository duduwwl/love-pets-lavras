import {createServer} from 'node:http';
import {readFileSync,statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
const root=resolve('docs');
const base='/love-pets-lavras/';
const port=Number(process.env.PORT||8766);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain'};
createServer((request,response)=>{
 try{
  const requested=new URL(request.url,`http://127.0.0.1:${port}`);
  const path=requested.pathname;
  if(path==='/__responsive'){
   const width=Number(requested.searchParams.get('width'))===820?820:390;
   const route=['','produtos/','agendar/','equipe/','admin/'].includes(requested.searchParams.get('route'))?requested.searchParams.get('route'):'';
   response.writeHead(200,{'content-type':mime['.html'],'cache-control':'no-store'});
   response.end(`<!doctype html><html><head><title>Prévia responsiva local</title><style>body{margin:0;background:#e8e2da}iframe{width:${width}px;height:880px;border:0;display:block;margin:12px auto}</style></head><body><iframe title="Prévia ${width}px" src="${base}${route}"></iframe></body></html>`);return;
  }
  if(path==='/'){response.writeHead(302,{location:base});response.end();return;}
  if(!path.startsWith(base)){response.writeHead(404);response.end('Not found');return;}
  let file=resolve(root,decodeURIComponent(path.slice(base.length)));
  if(file!==root&&!file.startsWith(root+sep)){response.writeHead(403);response.end();return;}
  if(statSync(file).isDirectory())file=resolve(file,'index.html');
  response.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});response.end(readFileSync(file));
 }catch{response.writeHead(404);response.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`http://127.0.0.1:${port}${base}`));
