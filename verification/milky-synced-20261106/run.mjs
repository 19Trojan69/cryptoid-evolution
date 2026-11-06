import assert from 'node:assert/strict';
import {orders,makeDriver} from './makeDriver.mjs';
import {writeFileSync,unlinkSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const order=process.argv[2];assert.ok(Object.hasOwn(orders,order));
for(const condition of orders[order]){
 const file=new URL('./generated-'+order+'-'+condition+'.mjs',import.meta.url);
 writeFileSync(file,makeDriver(condition,order));
 try{execFileSync(process.execPath,[file.pathname],{stdio:'inherit'});}finally{unlinkSync(file);}
}
