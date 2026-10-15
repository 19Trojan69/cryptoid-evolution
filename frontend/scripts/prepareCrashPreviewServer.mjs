// Port the diagnostic-only service into an already opened official Vinext Site
// checkout. Never creates a Site, changes sharing, or publishes anything.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const site=path.resolve(process.argv[2]||'');
if(!process.argv[2])throw Error('Provide the existing private Site checkout');
const manifestPath=path.join(site,'.openai/hosting.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(!manifest.project_id||!fs.existsSync(path.join(site,'vite.config.ts')))throw Error('Expected opened official Vinext Site checkout');
const write=(target,source)=>{const file=path.join(site,target);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,source);};
const read=p=>fs.readFileSync(path.join(root,p));
write('app/route.ts',read('previewServer/appRoute.ts'));
write('app/preview.html',fs.readFileSync(path.join(site,'public/index.html')));
write('app/api/diagnostics/route.ts',read('previewServer/apiRoute.ts'));
write('app/api/diagnostics/diagnosticsService.ts',read('previewServer/diagnosticsService.ts').toString().replace('../src/pages/traceBackupFormat.ts','./traceBackupFormat'));
write('app/api/diagnostics/traceBackupFormat.ts',read('src/pages/traceBackupFormat.ts'));
write('db/schema.ts',read('previewServer/schema.ts'));
for(const relative of ['0000_special_hellfire_club.sql','meta/0000_snapshot.json','meta/_journal.json']){
 const input=read('previewServer/drizzle/'+relative),target=path.join(site,'drizzle',relative);
 if(fs.existsSync(target)&&!fs.readFileSync(target).equals(input))throw Error('Keep published migrations immutable; generate a new migration instead');
 write('drizzle/'+relative,input);
}
delete manifest.static;manifest.d1='DB';
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({site,project_id:manifest.project_id,diagnosticService:'/api/diagnostics',published:false}));
