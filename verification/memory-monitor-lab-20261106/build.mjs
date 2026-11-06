import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {controller,labHtml,BASE_RUNTIME,LAB_PROJECT} from './transform.mjs';
const directory=new URL('.',import.meta.url).pathname,root=resolve(directory,'../..'),out=resolve(directory,'site');
if(process.env.VERCEL)assert.equal(process.env.VERCEL_PROJECT_ID,LAB_PROJECT,'Only the separate memory-lab project may build this artifact');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
assert.equal(git('rev-parse','HEAD:frontend'),'6e0cdc1bea4b6c84972382f636fa66caf2739010','Entire released frontend must remain unchanged');
const original=readFileSync(root+'/frontend/src/pages/GamePage.tsx','utf8');controller(original);
const identity={sourceCommit:process.env.VERCEL_GIT_COMMIT_SHA||git('rev-parse','HEAD'),sourceTree:git('rev-parse','HEAD^{tree}'),baseRuntime:BASE_RUNTIME,
  isolatedProject:LAB_PROJECT,gameRules:'current-testnet-rules',guestOnly:true,liveBackend:false,actualPiAuthentication:false,payments:false,automaticUpload:false,whiteScreenFixed:false};
const require=createRequire(root+'/frontend/package.json'),{build}=require('vite'),react=require('@vitejs/plugin-react').default;
execFileSync(process.execPath,['--experimental-strip-types','scripts/buildPaintedHulls.mjs'],{cwd:root+'/frontend',stdio:'inherit'});
for(const key of Object.keys(process.env))if(key.startsWith('VITE_'))delete process.env[key];
mkdirSync(directory+'/empty-env',{recursive:true});
await build({configFile:false,root:root+'/frontend',envDir:directory+'/empty-env',mode:'production',
 define:{__CRYPTOID_RELEASE__:JSON.stringify('ISOLIERTES SPEICHERLABOR'),__CRYPTOID_BUILD__:JSON.stringify(identity),'import.meta.env.VITE_CRYPTOID_DIAGNOSTICS':'"0"'},
 resolve:{dedupe:['react','react-dom','react-router-dom','axios'],alias:{'@mui/styled-engine':root+'/frontend/node_modules/@mui/styled-engine-sc'}},
 plugins:[react(),{name:'separate-memory-lab',enforce:'pre',transform(code,id){const path=id.split('?')[0];
   if(path===root+'/frontend/src/App.tsx')return `export {default} from ${JSON.stringify(directory+'App.jsx')};`;
   if(path===root+'/frontend/src/pages/GamePage.tsx')return controller(code);
   if(path===root+'/frontend/src/hooks/useAuth.ts')return `export {useAuth} from ${JSON.stringify(directory+'auth.mjs')};`;
   if(path===root+'/frontend/src/lib/axiosClient.ts')return `export * from ${JSON.stringify(directory+'transport.mjs')};`;
   if(path===root+'/frontend/src/lib/aggregateUsage.ts')return 'export async function startAggregateUsage() {}';
 },transformIndexHtml:{order:'post',handler:labHtml}}],build:{outDir:out,emptyOutDir:true,sourcemap:false}});
// The diagnostic deployment contains static files, no server/API handler.
for(const entry of readdirSync(out)){if(entry.endsWith('.html')&&entry!=='index.html')rmSync(out+'/'+entry);}
writeFileSync(out+'/lab-sdk.js',`window.Pi={init(){},getPiHostAppInfo:async()=>({hostApp:'web'}),authenticate:async()=>{throw Error('No real login in memory lab')},createPayment(){throw Error('No payments in memory lab')}};\n`);
writeFileSync(out+'/lab-info.json',JSON.stringify({...identity,sampleMs:5000,maxSamples:360,totalNativeRamAvailable:false,resourceByteValuesAreEstimates:true},null,2)+'\n');
writeFileSync(out+'/lab-denied.json','{"error":"isolated_lab_no_backend"}\n');
writeFileSync(out+'/robots.txt','User-agent: *\nDisallow: /\n');
console.log('MEMORY_LAB_BUILD '+JSON.stringify(identity));
