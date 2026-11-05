import {conditions,makeDriver} from './makeDriver.mjs';
import {writeFileSync,unlinkSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
for(const condition of conditions){
 const file=new URL('./generated-'+condition+'.mjs',import.meta.url);
 writeFileSync(file,makeDriver(condition));
 try{execFileSync(process.execPath,[file.pathname],{stdio:'inherit'});}finally{unlinkSync(file);}
}
