export type LayerArtwork={inset:string;'border-radius':string;background:string;filter:string};
export const FIRE_KEYS:number[][];
export const SMOKE_KEYS:number[][];
export function layerFrame(keys:number[][],progress:number):number[];
export function fragmentFrame(ms:number,delay:number):{motion:number;alpha:number;scale:number};
export function polygonPoints(shape:string):number[][];
export function layerSvg(art:LayerArtwork,diameter:number,dpr:number):{svg:string;pixels:number;size:number;pad:number;extent:number};
