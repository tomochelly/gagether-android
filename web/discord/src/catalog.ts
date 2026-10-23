import type {Catalog,Env,Locale,Region} from './types';
import {siteOrigin} from './security';
import {games as supportedGames} from '../../lib/games';
import {legacyMobileGameIds} from '../../lib/mobile-compatibility';
export function catalogGamesSupported(value:unknown):boolean{
 if(!Array.isArray(value)||![legacyMobileGameIds.length,supportedGames.length].includes(value.length))return false;
 const ids=value.map(g=>g?.id),known=new Set(supportedGames.map(g=>g.id));
 return new Set(ids).size===ids.length&&ids.every(id=>typeof id==='string'&&known.has(id))&&legacyMobileGameIds.every(id=>ids.includes(id));
}
export async function loadCatalog(env:Env,locale:Locale,region:Region,now=Date.now()):Promise<Catalog>{
  const id=locale+':'+region;
  const cache=await env.DB.prepare('SELECT etag,payload,fetched_at FROM catalog_cache WHERE id=?').bind(id).first<{etag:string;payload:string;fetched_at:number}>();
  if(cache&&now-cache.fetched_at<30000)return JSON.parse(cache.payload);
  const url=new URL('/api/discord/data',siteOrigin(env.GAGETHER_ORIGIN));url.searchParams.set('locale',locale);url.searchParams.set('region',region);
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(7000),headers:cache?{'If-None-Match':cache.etag}:undefined});
  if(response.status===304&&cache){
    await env.DB.prepare('UPDATE catalog_cache SET fetched_at=? WHERE id=?').bind(now,id).run();return JSON.parse(cache.payload);
  }
  if(!response.ok)throw new Error(`Catalog HTTP ${response.status}`);
  const data=await response.json() as Catalog;
  if(data.schemaVersion!==1||data.locale!==locale||data.requestedRegion!==region||!catalogGamesSupported(data.games)||!Array.isArray(data.entries)||data.entries.length>15000||!/^\w{64}$/.test(data.revision)||!Number.isFinite(Date.parse(data.serverTime))||Math.abs(now-Date.parse(data.serverTime))>120000)throw new Error('Catalog validation failed');
  const payload=JSON.stringify(data);if(payload.length>8000000)throw new Error('Catalog exceeds limit');
  await env.DB.prepare('INSERT INTO catalog_cache(id,etag,payload,fetched_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET etag=excluded.etag,payload=excluded.payload,fetched_at=excluded.fetched_at').bind(id,response.headers.get('ETag')||`"${data.revision}"`,payload,now).run();
  return data;
}
