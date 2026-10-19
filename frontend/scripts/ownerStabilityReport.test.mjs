import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { readOwnerStabilityReport } from '../src/pages/stabilityReport.mjs';

// Run the actual owner-panel source with controlled hooks, API and local storage.
// This checks permission/read/copy ordering; it does not simulate Pi authentication.
const source = fs.readFileSync(new URL('../src/pages/AdminPage.tsx', import.meta.url), 'utf8');
const component = source.slice(source.indexOf('async function verifyReportOwner()'), source.indexOf('export default function AdminPage()'));
const compiled = ts.transpileModule(component + '\nmodule.exports = OwnerStabilityReport;', { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const same = (a,b) => a && b && a.length === b.length && a.every((v,i)=>Object.is(v,b[i]));
function panel(verify, clipboard = async () => {}) {
  const slots=[]; let index=0, dirty=true, output, reads=0, copies=0, selected=0;
  const pending=[];
  const state = initial => { const i=index++; slots[i] ??= { value: typeof initial==='function'?initial():initial }; return [slots[i].value, value => { slots[i].value=value; dirty=true; }]; };
  const ref = initial => { const i=index++; slots[i] ??= { current:initial }; return slots[i]; };
  const callback = (fn,deps) => { const i=index++; if(!same(slots[i]?.deps,deps)) slots[i]={fn,deps}; return slots[i].fn; };
  const effect = (fn,deps) => { const i=index++; if(!same(slots[i]?.deps,deps)) { slots[i]?.cleanup?.(); slots[i]={deps}; pending.push(()=>{slots[i].cleanup=fn();}); } };
  const jsx=(type,props)=>({type,props});
  const t=value=>value;
  const sandbox={ module:{exports:{}}, exports:{}, require:()=>({jsx,jsxs:jsx}), useState:state,useRef:ref,useCallback:callback,useEffect:effect,
    useAdminLocale:()=>({t}), errorMessage:()=> 'denied', readOwnerStabilityReport,
    axiosClient:{get:async path=>{assert.equal(path,'/admin/status');return {data:await verify()};}},
    window:{localStorage:{getItem:key=>{reads++;if(key==='cryptoid_game_diagnostics_v1')return JSON.stringify([{reason:'performance',sector:19,phase:'ATTACK_CYCLE',username:'excluded'}]);if(key==='cryptoid_reload_trace_v2'||key==='cryptoid_resource_trend_v4')return null;throw Error('unexpected key');}},sessionStorage:{getItem:key=>{reads++;if(key==='cryptoid_game_session_v1'||key==='cryptoid_reload_trace_v2'||key==='cryptoid_resource_trend_v4')return null;throw Error('unexpected key');}}},
    navigator:{clipboard:{writeText:async text=>{copies++;await clipboard(text);}}},
  };
  vm.runInNewContext(compiled,sandbox);
  const walk=(node,visit)=>{if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(n=>walk(n,visit));return;}visit(node);walk(node.props?.children,visit);};
  const render=()=>{while(dirty){dirty=false;index=0;output=sandbox.module.exports();walk(output,node=>{if(node.type==='textarea')node.props.ref.current={focus(){selected++;},select(){selected++;},setSelectionRange(){selected++;}};});while(pending.length)pending.shift()();}};
  const flush=async()=>{for(let i=0;i<12;i++){await Promise.resolve();render();}};
  render();
  return {flush,unmount:()=>slots.forEach(slot=>slot.cleanup?.()),button:label=>{let found;walk(output,node=>{if(node.type==='button'&&node.props.children===label)found=node.props;});return found;},text:()=>{let value='';walk(output,node=>{if(node.type==='textarea')value=node.props.value;});return value;},get reads(){return reads;},get copies(){return copies;},get selected(){return selected;}};
}
test('denied owner verification renders no report and never reads local records',async()=>{
  const p=panel(async()=>({canAdmin:false}));await p.flush();assert.equal(p.reads,0);assert.equal(p.text(),'');assert.equal(p.button('Bericht kopieren').disabled,true);
});
test('verified owner reads sanitized local report, and denied copy clears it',async()=>{
  let calls=0;const p=panel(async()=>{if(++calls>1)throw Error('401');return {canAdmin:true};});
  await p.flush();assert.equal(p.reads,6);assert.equal(JSON.parse(p.text()).events[0].sector,19);assert.ok(!p.text().includes('excluded'));
  await p.button('Bericht kopieren').onClick();await p.flush();assert.equal(p.copies,0);assert.equal(p.text(),'');
});
test('copy rechecks owner permission and copies exactly the displayed report',async()=>{
  let calls=0,copied;const p=panel(async()=>{calls++;return {canAdmin:true};},async text=>{copied=text;});await p.flush();const expected=p.text();p.button('Bericht kopieren').onClick();await p.flush();assert.equal(calls,2);assert.equal(copied,expected);assert.equal(p.copies,1);
});
test('clipboard denial leaves a selectable report for manual copying',async()=>{
  const p=panel(async()=>({canAdmin:true}),async()=>{throw Error('blocked');});await p.flush();p.button('Bericht kopieren').onClick();await p.flush();assert.equal(p.selected,3);assert.ok(p.text());
});
test('closing the panel cancels a pending permission check before storage access',async()=>{
  let finish;const permission=new Promise(resolve=>{finish=resolve;});const p=panel(()=>permission);p.unmount();finish({canAdmin:true});await p.flush();assert.equal(p.reads,0);assert.equal(p.text(),'');
});
