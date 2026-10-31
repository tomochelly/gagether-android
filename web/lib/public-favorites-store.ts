import {env} from 'cloudflare:workers';
import {games} from './games';
import {tokenHash} from './public-favorites';
import {favoriteReadChanged} from './public-read-jobs';
const normalize=(rows:{game_id:string;count:number}[])=>{const values=Object.fromEntries(rows.map(r=>{if(!Number.isSafeInteger(r.count)||r.count<0)throw Error('Invalid aggregate count');return [r.game_id,r.count]}));return Object.fromEntries(games.map(g=>[g.id,values[g.id]||0]));};
async function rawCounts(){const r=await env.DB!.prepare("SELECT j.value AS game_id,COUNT(DISTINCT b.id) AS count FROM public_favorite_browsers b,json_each(b.favorites) j GROUP BY j.value").all<{game_id:string;count:number}>();return normalize(r.results);}
export async function favoriteCountSnapshot():Promise<{counts:Record<string,number>;countsVersion:number|null}>{
 try{
  const read=()=>env.DB!.prepare('SELECT game_id,count FROM public_favorite_totals').all<{game_id:string;count:number}>();let rows=(await read()).results;
  if(!rows.some(r=>r.game_id==='__ready__')){
   // Separate, atomic and idempotent data backfill; migrations remain schema-only.
   await env.DB!.batch([
    env.DB!.prepare("UPDATE public_favorite_totals SET count=0 WHERE NOT EXISTS(SELECT 1 FROM public_favorite_totals WHERE game_id='__ready__')"),
    env.DB!.prepare("INSERT INTO public_favorite_totals(game_id,count) SELECT j.value,COUNT(DISTINCT b.id) FROM public_favorite_browsers b,json_each(b.favorites) j WHERE j.value<>'__ready__' AND NOT EXISTS(SELECT 1 FROM public_favorite_totals WHERE game_id='__ready__') GROUP BY j.value ON CONFLICT(game_id) DO UPDATE SET count=excluded.count"),
    env.DB!.prepare("INSERT INTO public_favorite_totals(game_id,count) VALUES('__ready__',0) ON CONFLICT(game_id) DO NOTHING")
   ]);rows=(await read()).results;
  }
  const marker=rows.find(r=>r.game_id==='__ready__');if(!marker||!Number.isSafeInteger(marker.count)||marker.count<0)throw Error('Aggregate revision unavailable');
  return {counts:normalize(rows.filter(r=>r.game_id!=='__ready__')),countsVersion:marker.count};
 }catch{return {counts:await rawCounts(),countsVersion:null};}
}
export async function favoriteCounts(){return (await favoriteCountSnapshot()).counts;}
export async function favoriteSession(token:string|null){
 if(token){const id=await tokenHash(token);const r=await env.DB!.prepare('SELECT revision FROM public_favorite_browsers WHERE id=?').bind(id).first<{revision:number}>();if(r)return {revision:r.revision,token:null};}
 const next=[...crypto.getRandomValues(new Uint8Array(32))].map(v=>v.toString(16).padStart(2,'0')).join('');
 await env.DB!.prepare("INSERT INTO public_favorite_browsers(id,favorites,revision,updated_at) VALUES (?,'[]',0,?)").bind(await tokenHash(next),new Date().toISOString()).run();return {revision:0,token:next};
}
export async function saveFavoriteSelection(token:string,favorites:string[],revision:number){
 const id=await tokenHash(token),payload=JSON.stringify(favorites);
 const r=await env.DB!.prepare('UPDATE public_favorite_browsers SET favorites=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND favorites<>?').bind(payload,new Date().toISOString(),id,revision,payload).run();
 if(r.meta.changes>0){favoriteReadChanged();return {ok:true,revision:revision+1};}
 const current=await env.DB!.prepare('SELECT revision,favorites FROM public_favorite_browsers WHERE id=?').bind(id).first<{revision:number;favorites:string}>();
 return {ok:!!current&&current.revision===revision&&current.favorites===payload,revision:current?.revision??null};
}
