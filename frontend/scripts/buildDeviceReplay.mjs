import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { ISOLATED_AUTH_SOURCE } from './deviceReplay/authFixture.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=process.env.CRYPTOID_DEVICE_REPLAY_OUT||'/tmp/cryptoid-device-replay';
const sourcePath=path.join(root,'src/pages/GamePage.tsx');
const original=fs.readFileSync(sourcePath,'utf8');
const expectedGameHash='eb628a5d73247ea64ec5443d2ff4efdab071a97228634f16f2aa915cdc832607';
assert.equal(createHash('sha256').update(original).digest('hex'),expectedGameHash,'review a changed GamePage before updating device-test hooks');
const effects=process.env.CRYPTOID_REPLAY_PROFILE==='effects';
const lifecycle=effects||process.env.CRYPTOID_REPLAY_PROFILE==='lifecycle';
const buildInfo={id:effects?'device-replay-20261018-v4-effects':lifecycle?'device-replay-20261018-v3-lifecycle':'device-replay-20261018-v2',gameCommit:'27d174788327c3423f04ace32be61af67a2004cc',gameSourceSha256:expectedGameHash};
const hooks=fs.readFileSync(path.join(root,'scripts/deviceReplay',lifecycle?'lifecycleHooks.ts.txt':'gameHooks.ts.txt'),'utf8');
const instrument=source=>{
 const once=(before,after)=>{assert.equal(source.split(before).length,2,'unique insertion '+before.slice(0,70));source=source.replace(before,after);};
 once('  const levelLabel =',hooks+'\n  const levelLabel =');
 once('      const delta = Math.min(34, frameGap);','      const delta = Math.min(34, frameGap);\n      if(state.status===\'playing\')(window as any).__cryptoidDeviceReplay?.clock(time,frameGap,delta);');
 once('            state.shots.push(...volley.slice(0, MAX_PLAYER_SHOTS - state.shots.length));',
   '            state.shots.push(...volley.slice(0, MAX_PLAYER_SHOTS - state.shots.length));\n            (window as any).__cryptoidDeviceReplay?.volley(time);');
 once('      try { simulate(time); }','      const replayWorkStart=performance.now();\n      try { simulate(time); }');
 once("      finally { probe?.mark('phase-save-and-paint'); probe?.end(time); }",
   "      finally { probe?.mark('phase-save-and-paint'); probe?.end(time); (window as any).__cryptoidDeviceReplay?.afterFrame(time,performance.now()-replayWorkStart); }");
 return source;
};
fs.mkdirSync(path.join(destination,'public'),{recursive:true});
const bundled=await build({absWorkingDir:root,entryPoints:['scripts/deviceReplay/entry.tsx'],bundle:true,write:false,
 platform:'browser',format:'esm',target:['safari16'],jsx:'automatic',minify:true,metafile:true,
 define:{'import.meta.env':'{"VITE_CRYPTOID_DIAGNOSTICS":"0"}','process.env.NODE_ENV':'"production"',
   __CRYPTOID_RELEASE__:'"DEVICE REPLAY"',__CRYPTOID_REPLAY_BUILD__:JSON.stringify(buildInfo),__CRYPTOID_LIFECYCLE__:JSON.stringify(lifecycle),__CRYPTOID_EFFECTS__:JSON.stringify(effects)},
 plugins:[{name:'isolated-device-replay',setup(b){
   // These two real modules differ only by their initial letter. Match the
   // resource module exactly rather than esbuild's TSX-first fallback.
   b.onResolve({filter:/(?:^|\/)paintedShip(?:\.ts)?$/},args=>({path:path.resolve(args.resolveDir,'paintedShip.ts')}));
   b.onResolve({filter:/(?:hooks\/useAuth|hooks\/useModalNavigation|axiosClient)(?:\.ts)?$/},args=>({path:args.path,namespace:'isolated'}));
   b.onLoad({filter:/.*/,namespace:'isolated'},args=>({loader:'js',contents:args.path.includes('useAuth')?
     ISOLATED_AUTH_SOURCE:
     args.path.includes('useModalNavigation')?'export default ()=>{};':
     'const denied=()=>{window.__cryptoidBlockedRequests?.push("application API blocked");throw new Error("Account API disabled in device replay")};export const axiosClient={get:denied,post:denied,put:denied,delete:denied};export const getBaseURL=()=>"";export const PI_ACCESS_TOKEN_KEY="unused-device-replay";'}));
   b.onResolve({filter:/^axios$/},()=>({path:'axios',namespace:'isolated-axios'}));
   b.onLoad({filter:/.*/,namespace:'isolated-axios'},()=>({loader:'js',contents:'export default {isAxiosError:()=>false};'}));
   b.onLoad({filter:/\.css$/},()=>({loader:'js',contents:'export {};'}));
   b.onLoad({filter:/GamePage\.tsx$/},()=>({loader:'tsx',contents:instrument(original)}));
 }}]});
const inputs=Object.keys(bundled.metafile.inputs);
assert.ok(!inputs.some(x=>/src\/(?:lib\/axiosClient|hooks\/useAuth)\.ts$/.test(x)),'real auth/API module must be absent');
const js=bundled.outputFiles[0].text;
fs.writeFileSync(path.join(destination,'public/replay.js'),js);
const style=`html,body,#root{margin:0;min-height:100%;background:#041423;color:#e4f3f7;font-family:system-ui,sans-serif}.device-replay-panel{box-sizing:border-box;max-width:580px;margin:auto;padding:clamp(26px,7vw,55px) 24px;line-height:1.55}.device-replay-panel h1{font-size:27px;line-height:1.2;color:#f1d796}.device-replay-panel small{font-size:11px;letter-spacing:.12em;color:#86d9dd}.device-replay-panel button{display:block;width:100%;margin:16px 0;padding:15px;border:1px solid #8bb7c8;border-radius:12px;background:#102d42;color:#effbff;font:600 16px system-ui}.device-replay-panel button:first-of-type{background:#d6b76e;color:#101d27}.device-replay-panel label{display:flex;align-items:center;gap:10px;margin:24px 0}.device-replay-panel footer{margin-top:30px;font-size:11px;color:#9bafb9}.device-replay-panel textarea{width:100%;min-height:160px;background:#0a2032;color:#eaf7ff}.device-replay-game{pointer-events:none}.device-replay-progress{position:fixed;right:8px;bottom:max(14px,env(safe-area-inset-bottom));z-index:999;display:flex;align-items:center;gap:10px;background:#041423e8;padding:8px 10px;border:1px solid #83b5c96b;border-radius:10px;font:11px/1.4 system-ui;color:#fff;max-width:230px}.device-replay-progress button{color:#dce9f3;background:#16364c;border:1px solid #83b5c9;border-radius:7px;padding:8px}`;
fs.writeFileSync(path.join(destination,'public/index.html'),`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><title>Cryptoid · Kurzer Gerätetest</title><link rel="stylesheet" href="/assets/index-CLY2nAhm.css"><style>${style}</style><script>window.__ENV={appNetwork:'testnet'};</script></head><body><div id="root"></div><script type="module" src="/replay.js"></script></body></html>`);
fs.writeFileSync(path.join(destination,'public/blocked.json'),'{"error":"Account API disabled in isolated device replay"}');
const roots=['assets','ships','audio','effects','planets','fonts','cards','home','badges','emblems','galaxy','pilots','ranks'];
const config={framework:null,installCommand:'',buildCommand:'',outputDirectory:'public',rewrites:[
 {source:'/api/:path*',destination:'/blocked.json'},
 ...roots.map(name=>({source:`/${name}/:path*`,destination:`https://cryptoid-evolution-testnet.vercel.app/${name}/:path*`}))],
 headers:[{source:'/(.*)',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'},
 {key:'Content-Security-Policy',value:"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'"}]}]};
fs.writeFileSync(path.join(destination,'vercel.json'),JSON.stringify(config,null,2));
const proof={...buildInfo,applicationApisRemoved:true,authModuleRemoved:true,staticAssetsReadOnlyFrom:'https://cryptoid-evolution-testnet.vercel.app',inputs:inputs.length,
 files:['public/index.html','public/replay.js','public/blocked.json','vercel.json'].map(file=>{const data=fs.readFileSync(path.join(destination,file));return {file,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')};})};
fs.writeFileSync(path.join(destination,'build-proof.json'),JSON.stringify(proof,null,2));
console.log(JSON.stringify({destination,...proof},null,2));
