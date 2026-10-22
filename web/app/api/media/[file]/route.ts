import {env} from 'cloudflare:workers';
export async function GET(_request:Request,{params}:{params:Promise<{file:string}>}){
 const {file}=await params;if(!/^[0-9a-f-]{36}\.(png|jpeg|webp|avif)$/.test(file))return new Response('Not found',{status:404});
 const object=await (env as unknown as {BUCKET:R2Bucket}).BUCKET.get('editor/'+file);if(!object)return new Response('Not found',{status:404});
 const headers=new Headers();object.writeHttpMetadata(headers);headers.set('ETag',object.httpEtag);headers.set('Cache-Control','private, max-age=31536000, immutable');headers.set('X-Content-Type-Options','nosniff');return new Response(object.body,{headers});
}
