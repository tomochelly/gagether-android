import {env} from 'cloudflare:workers';
import {editorIdentity} from '@/lib/editor-access';
import {sameOrigin} from '@/lib/store';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!await editorIdentity())return Response.json({error:'Editor access required'},{status:403});if(!sameOrigin(request)||request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Origin mismatch'},{status:403});
 if(Number(request.headers.get('content-length')||0)>27*1024*1024)return Response.json({error:'Image must be 25 MB or smaller'},{status:413});
 try{
  const form=await request.formData();const file=form.get('image');if(!(file instanceof File)||file.size>25*1024*1024||file.size===0)return Response.json({error:'Choose an image up to 25 MB'},{status:400});
  const buffer=await file.arrayBuffer();const bytes=new Uint8Array(buffer);const ascii=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));
  let format='';if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)format='jpeg';else if(bytes[0]===137&&ascii(1,4)==='PNG')format='png';else if(ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP')format='webp';else if(ascii(4,8)==='ftyp'&&['avif','avis'].includes(ascii(8,12)))format='avif';
  if(!format)return Response.json({error:'Use PNG, JPEG, WebP or AVIF'},{status:400});
  const key=crypto.randomUUID()+'.'+format;const bucket=(env as unknown as {BUCKET:R2Bucket}).BUCKET;
  await bucket.put('editor/'+key,buffer,{httpMetadata:{contentType:'image/'+format},customMetadata:{originalName:file.name.slice(0,200)}});
  return Response.json({ok:true,url:'/api/media/'+key});
 }catch{return Response.json({error:'Could not upload image'},{status:503});}
}
