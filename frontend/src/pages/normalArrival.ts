import {entryPosition,type EntryPattern} from './entryPatterns.ts';
type Route={pattern:EntryPattern;startX:number;startY:number;targetX:number;targetY:number;width:number;height:number;radius:number;side:number;index:number;stage:number};
export function normalArrival(route:Route,duration:number,sector:number,flight:number,diameter:number){
 if(sector===1||sector%10===0||(sector+flight)%3===1)return{startX:route.startX,startY:route.startY,duration};
 const startX=route.targetX<route.width/2?-diameter/2-route.radius-8:route.width+diameter/2+route.radius+8;
 const side={...route,startX,startY:route.targetY};
 // Match the existing velocity envelope, including its shallow cubic arc.
 // This runs once at spawn, never in shooting or the frame renderer.
 const peak=(r:Route)=>{let max=0,last=entryPosition({...r,progress:0});for(let step=1;step<=64;step++){const next=entryPosition({...r,progress:step/64});max=Math.max(max,Math.hypot(next.x-last.x,next.y-last.y));last=next;}return max;};
 // Do not extend formation readiness or postpone shooting. Use a side
 // route only when its velocity fits the approved original arrival duration.
 if(peak(side)>peak(route)+1e-7)return{startX:route.startX,startY:route.startY,duration};
 return{startX,startY:route.targetY,duration};
}
