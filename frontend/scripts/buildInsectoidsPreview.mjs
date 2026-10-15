import fs from 'node:fs';import path from 'node:path';import {fileURLToPath}from'node:url';import{build}from'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dest=path.resolve(process.argv[2]||'/tmp/insectoids-preview');
const entry=path.join(root,'.insectoids-preview-entry.tsx');
fs.writeFileSync(entry,`import{createRoot}from'react-dom/client';import Preview from './preview/InsectoidsPreview';createRoot(document.getElementById('root')!).render(<Preview/>);`);
try{
 fs.mkdirSync(dest,{recursive:true});
 await build({absWorkingDir:root,entryPoints:[entry],bundle:true,format:'iife',outfile:path.join(dest,'app.js'),minify:true,jsx:'automatic',target:['es2022'],define:{'process.env.NODE_ENV':'"production"'}});
 for(const relative of ['ships/bosses/insect/viridian-harvester.webp','ships/bosses/insect/anatomical-stinger.webp','ships/bosses/insect/reactor-eye-mantis.webp','ships/bosses/insect/earth-backdrop.webp','ships/evolution/ship_01_stage_1.png']){const output=path.join(dest,relative);fs.mkdirSync(path.dirname(output),{recursive:true});fs.copyFileSync(path.join(root,'public',relative),output);}
 for(let i=1;i<=20;i++){const rel=`ships/insectoids/enemy-${String(i).padStart(2,'0')}.webp`,out=path.join(dest,rel);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(path.join(root,'public',rel),out);}
 const audioDir=path.join(dest,'audio');fs.mkdirSync(audioDir,{recursive:true});
 // Existing game audio starts a fixed 20-file sample set; copy exactly that set.
 const audioSource=fs.readFileSync(path.join(root,'src/pages/gameAudio.ts'),'utf8'),names=audioSource.match(/const sampleNames = \[([^\]]+)\]/)[1].match(/"([^"]+)"/g).map(n=>n.slice(1,-1));
 for(const n of names){const relative=n+'.mp3',source=path.join(root,'public/audio',relative);if(fs.existsSync(source))fs.copyFileSync(source,path.join(audioDir,relative));}
 fs.writeFileSync(path.join(dest,'index.html'),'<!doctype html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#040c18"><title>Cryptoid – Private Special Mission</title><link rel="stylesheet" href="/app.css"></head><body style="margin:0;background:#040c18"><div id="root"></div><script src="/app.js"></script></body></html>');
 fs.writeFileSync(path.join(dest,'robots.txt'),'User-agent: *\nDisallow: /\n');
 console.log(JSON.stringify({directory:dest,jsBytes:fs.statSync(path.join(dest,'app.js')).size,enemies:20,availableMissions:1,normalRounds:9,accountAndPaymentCode:false}));
}finally{fs.unlinkSync(entry);}
