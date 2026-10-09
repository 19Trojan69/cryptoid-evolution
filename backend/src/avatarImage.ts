import sharp from 'sharp';
export const sanitizeAvatar = async (input:unknown):Promise<string> => {
 if(typeof input!=='string'||!/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(input)||input.length>27400)throw Error('avatar_invalid');
 const buffer=Buffer.from(input.slice(input.indexOf(',')+1),'base64');
 if(buffer.length>20480||buffer.length<12||buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WEBP')throw Error('avatar_invalid');
 try {
 const image=sharp(buffer,{limitInputPixels:16384,animated:false,failOn:'warning'});
 const meta=await image.metadata();
 if(meta.format!=='webp'||meta.width!==128||meta.height!==128||(meta.pages||1)!==1)throw Error('avatar_invalid');
 // Decode/re-encode: no original bytes or EXIF/GPS metadata enter storage.
 const clean=await image.webp({quality:82,effort:3}).toBuffer();
 if(clean.length>20480)throw Error('avatar_too_large');
 return `data:image/webp;base64,${clean.toString('base64')}`;
 } catch { throw Error('avatar_invalid'); }
};
