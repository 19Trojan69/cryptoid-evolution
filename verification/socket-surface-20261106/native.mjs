import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {createReadStream,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {code,original,candidate,root,scope} from './source.mjs';
import {compareSurfaces} from './compare.mjs';
const require=createRequire(import.meta.url),pw=require('playwright');
assert.equal(require('playwright/package.json').version,'1.62.1');
const engine=process.argv[2];assert.ok(['chromium','webkit'].includes(engine));
const directory=root+'/verification/socket-surface-20261106/results';mkdirSync(directory,{recursive:true});
const result={engine,identity:scope(),complete:false,physicalDevice:false,whiteScreenFixed:false,fullGameAcceptance:false,cases:0,
 limits:'Actual engine canvas equality and logical source allocation only; no total process/GPU/phone RAM reduction inferred.'};
const server=createServer((req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Socket surface equivalence</title>');return;}
 if(!/^\/ships\/bosses\/evolved\/boss-\d{2}-guns\.webp$/.test(path)){res.writeHead(404).end();return;}
 res.setHeader('Content-Type','image/webp');createReadStream(resolve(root,'frontend/public'+path)).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await pw[engine].launch({headless:true});result.engineVersion=browser.version();
 const context=await browser.newContext({viewport:{width:430,height:825},deviceScaleFactor:3});const page=await context.newPage();
 let fault;page.on('crash',()=>fault='crash');page.on('pageerror',e=>fault=e.message);
 await page.goto('http://127.0.0.1:'+server.address().port);
 result.comparison=await page.evaluate(async({a,b,compare})=>{
  const before=eval(a),after=eval(b);
  const compareSurfaces=eval('('+compare+')');
  return await compareSurfaces({before,after,
   makeCanvas:(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;},
   loadImage:p=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{image.onload=image.onerror=null;resolve(image);};image.onerror=()=>reject(Error('Original atlas missing'));image.src=p;}),
   pixels:c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data});
 },{a:code(original),b:code(candidate),compare:compareSurfaces.toString()});
 assert.equal(result.comparison.complete,true);assert.equal(result.comparison.rows.length,50);assert.equal(result.comparison.cases,700);assert.ok(!fault,fault);
 result.cases=result.comparison.cases;result.complete=true;
}catch(e){result.failure={message:e.message};process.exitCode=1;}
finally{
 if(browser)await browser.close();await new Promise(r=>server.close(r));
 writeFileSync(directory+'/'+engine+'.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({complete:result.complete,cases:result.cases,failure:result.failure}));
}
