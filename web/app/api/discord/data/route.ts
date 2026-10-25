import {matchesIfNoneMatch} from '@/lib/http-cache';
import {readData} from '@/lib/store';
import {discordFeed} from '@/lib/discord-feed';
import {isLocale} from '@/lib/visitor-locale';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  const params=new URL(request.url).searchParams,language=params.get('locale'),region=params.get('region')||'kr';
  if(!['kr','jp','global','cn'].includes(region))return Response.json({error:'Invalid region'},{status:400});
  const data=await readData();
  if(!data.persistent)return Response.json({error:'Data temporarily unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  const feed=discordFeed(data.entries,data.settings,isLocale(language)?language:'ko',region as 'kr'|'jp'|'global'|'cn',Date.now());
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(feed)));
  const revision=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
  const headers={'Cache-Control':'public, max-age=30','ETag':`"${revision}"`};
  if(matchesIfNoneMatch(request.headers.get('If-None-Match'),headers.ETag))return new Response(null,{status:304,headers});
  return Response.json({...feed,revision,serverTime:new Date().toISOString()},{headers});
}
