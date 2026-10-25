import {matchesIfNoneMatch} from '@/lib/http-cache';
import {env} from 'cloudflare:workers';
import {rewardAsset,rewardAssetKey} from '@/lib/reward-assets';

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const asset=rewardAsset(id);const version=new URL(request.url).searchParams.get('v');
 if(!asset||version&&version!==asset.sha256)return new Response('Not found',{status:404});
 const bucket=(env as unknown as {BUCKET:R2Bucket}).BUCKET;
 const object=await bucket.get(rewardAssetKey(asset));
 if(!object)return new Response('Icon is being prepared',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'5'}});
 const etag=`"${asset.sha256}"`;
 const headers={'Content-Type':asset.contentType,'Cache-Control':'public, max-age=31536000, immutable','ETag':etag,'X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'};
 if(matchesIfNoneMatch(request.headers.get('if-none-match'),etag))return new Response(null,{status:304,headers});
 return new Response(object.body,{headers});
}
