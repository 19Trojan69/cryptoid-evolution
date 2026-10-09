import sharp from 'sharp';
export const sanitizeAvatar = async (input:unknown):Promise<string> => {
 if(typeof input!=='string'||!/^data:image\/(webp|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(input)||input.length>94000)throw Error('avatar_invalid');
 const png=input.startsWith('data:image/png;');
 const buffer=Buffer.from(input.slice(input.indexOf(',')+1),'base64');
 if(buffer.length>(png?70000:20480)||buffer.length<12)throw Error('avatar_invalid');
 if(png?!buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WEBP')throw Error('avatar_invalid');
 try {
 const image=sharp(buffer,{limitInputPixels:16384,animated:false,failOn:'warning'});
 const meta=await image.metadata();
 if(meta.format!==(png?'png':'webp')||meta.width!==128||meta.height!==128||(meta.pages||1)!==1)throw Error('avatar_invalid');
 // Decode/re-encode: no original bytes or EXIF/GPS metadata enter storage.
 for(const quality of [82,70,55,40]){
 const clean=await image.clone().webp({quality,effort:3}).toBuffer();
 if(clean.length<=20480)return `data:image/webp;base64,${clean.toString('base64')}`;
 }
 throw Error('avatar_too_large');
 } catch { throw Error('avatar_invalid'); }
};
