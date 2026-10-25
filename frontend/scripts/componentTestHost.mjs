import fs from 'node:fs';
import {transformSync} from 'esbuild';
// Execute real component handlers/effects with a deterministic hook scheduler.
export function componentHost(path,name,props,extra={}){
 const source=fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const code=transformSync(source.replace(/^import[\s\S]*?;\r?\n/gm,'').replace('export default function','function'),{loader:'tsx',jsxFactory:'element',jsxFragment:'fragment'}).code;
 const slots=[],pending=[];let index=0,dirty=true,tree,active=true;
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const env={
  useState(initial){const i=index++;slots[i]??={value:typeof initial==='function'?initial():initial};return[slots[i].value,value=>{const next=typeof value==='function'?value(slots[i].value):value;if(!Object.is(next,slots[i].value)){slots[i].value=next;dirty=true;}}];},
  useRef(initial){const i=index++;slots[i]??={current:initial};return slots[i];},
  useEffect(fn,deps){const i=index++;if(!same(slots[i]?.deps,deps)){slots[i]?.cleanup?.();slots[i]={deps};pending.push(()=>{slots[i].cleanup=fn();});}},
  element:(type,props,...children)=>({type,props:{...props,children:children.flat(Infinity)}}),fragment:'fragment',
  ...extra,
 };
 const component=new Function('env','with(env){'+code+';return '+name+';}')(env);
 const render=()=>{if(!active)return;let loops=0;while(dirty){if(++loops>100)throw Error('render loop');dirty=false;index=0;tree=component(props);while(pending.length)pending.shift()();}};
 const nodes=()=>{const out=[];const walk=n=>{if(!n||typeof n!=='object')return;out.push(n);n.props?.children?.forEach(walk);};walk(tree);return out;};
 render();return{env,render,nodes,update(p){props={...props,...p};dirty=true;render();},unmount(){active=false;slots.forEach(s=>s.cleanup?.());},async flush(){for(let i=0;i<30;i++){await Promise.resolve();render();}}};
}
