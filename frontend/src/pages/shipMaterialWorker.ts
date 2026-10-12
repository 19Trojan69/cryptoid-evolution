import { paintShipMaterial } from './shipMaterial.ts';
self.onmessage = event => {
 const {data,width,height,target,accent}=event.data;
 try {paintShipMaterial(data,width,height,target,accent);self.postMessage({data}, {transfer:[data.buffer]});}
 catch {self.postMessage({failed:true});}
};
