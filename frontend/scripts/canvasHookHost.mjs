// Minimal hook host shared by the actual-component allocation and raster checks.
import assert from 'node:assert/strict';

const equalDeps=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
export class Host{
  slots=[];index=0;dirty=true;layouts=[];effects=[];output=null;
  constructor(component,props,canvas=null){this.component=component;this.props=props;this.canvas=canvas;}
  state(initial){const i=this.index++;if(!this.slots[i])this.slots[i]={value:typeof initial==='function'?initial():initial};return [this.slots[i].value,value=>{const next=typeof value==='function'?value(this.slots[i].value):value;if(!Object.is(next,this.slots[i].value)){this.slots[i].value=next;this.dirty=true;}}];}
  ref(value){const i=this.index++;return this.slots[i]??(this.slots[i]={current:value===null&&this.canvas?this.canvas:value});}
  memo(fn,deps){const i=this.index++;if(!equalDeps(this.slots[i]?.deps,deps))this.slots[i]={value:fn(),deps};return this.slots[i].value;}
  effect(layout,fn,deps){const i=this.index++,old=this.slots[i];if(equalDeps(old?.deps,deps))return;this.slots[i]={deps,cleanup:old?.cleanup};(layout?this.layouts:this.effects).push(()=>{this.slots[i].cleanup?.();this.slots[i].cleanup=fn();});}
  render(){for(let guard=0;this.dirty;guard++){assert.ok(guard<20,'hooks settle');this.dirty=false;this.index=0;globalThis.__hookHost=this;this.output=this.component(this.props);for(const run of this.layouts.splice(0))run();}return this.output;}
  passive(){for(const run of this.effects.splice(0))run();}
  unmount(){for(const slot of this.slots)slot?.cleanup?.();}
}
