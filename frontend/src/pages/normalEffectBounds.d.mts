export type Bounds={left:number;top:number;right:number;bottom:number};
export function unionBounds(a:Bounds|null,b:Bounds):Bounds;
export function fieldBounds(box:Bounds|null,width:number,height:number):Bounds;
export function impactBounds(record:any):Bounds;
