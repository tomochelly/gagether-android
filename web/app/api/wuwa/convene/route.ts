import {readWuwaConveneCatalog} from '@/lib/wuwa-convene-catalog';
import {matchesIfNoneMatch} from '@/lib/http-cache';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 if(new URL(request.url).searchParams.size)return Response.json({error:'Invalid convene selection'},{status:400});
 try{const catalog=await readWuwaConveneCatalog(),{checkedAt,...content}=catalog;const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(content)));const etag='"convene-'+Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('')+'"';const headers={'Cache-Control':'public, max-age=15, stale-while-revalidate=15',ETag:etag};if(matchesIfNoneMatch(request.headers.get('If-None-Match'),etag))return new Response(null,{status:304,headers});return Response.json(catalog,{headers});}catch{return Response.json({error:'Current convene data unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
