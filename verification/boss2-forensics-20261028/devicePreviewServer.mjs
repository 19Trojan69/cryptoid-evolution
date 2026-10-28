import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { root } from './fixture.mjs';
import { previewReply } from '../../api/index.ts';
export async function serveDevicePreview() {
  const directory=resolve(root,'verification/boss2-forensics-20261028/results/device-preview/site');
  const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
  const server=createServer((req,res)=>{
    let path;try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
    if(path==='/api'||path.startsWith('/api/')){const value=previewReply(req.method,path,'preview');res.writeHead(value.status,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(value.body?JSON.stringify(value.body):undefined);return;}
    let file=resolve(directory,'.'+path);
    if(!file.startsWith(directory+sep)&&file!==directory){res.writeHead(403).end();return;}
    try{if(!statSync(file).isFile())file=directory+'/index.html';}catch{if(extname(path)){res.writeHead(404).end();return;}file=directory+'/index.html';}
    res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');
    if(req.method==='HEAD')res.end();else createReadStream(file).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return{origin:'http://127.0.0.1:'+server.address().port,close:()=>new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()))};
}
