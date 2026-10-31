import {characterBuildGuide} from '@/lib/wuwa-build-data';
import {matchesIfNoneMatch} from '@/lib/http-cache';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get('id'),data=id&&characterBuildGuide(id);
 if(!data)return Response.json({error:'Build guide not found'},{status:404,headers:{'Cache-Control':'no-store'}});
 const body=JSON.stringify(data),digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body)),etag='"build-'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')+'"',headers={'Cache-Control':'public, max-age=3600, stale-while-revalidate=86400','Content-Type':'application/json; charset=utf-8',ETag:etag};
 return matchesIfNoneMatch(request.headers.get('If-None-Match'),etag)?new Response(null,{status:304,headers}):new Response(body,{headers});
}
