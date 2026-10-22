import {env} from 'cloudflare:workers';
import {games} from './games';
import {tokenHash} from './public-favorites';
export async function favoriteCounts(){const r=await env.DB!.prepare("SELECT j.value AS game_id,COUNT(*) AS count FROM public_favorite_browsers b,json_each(b.favorites) j GROUP BY j.value").all<{game_id:string;count:number}>();const values=Object.fromEntries(r.results.map(r=>[r.game_id,r.count]));return Object.fromEntries(games.map(g=>[g.id,values[g.id]||0]));}
export async function favoriteSession(token:string|null){
 if(token){const id=await tokenHash(token);const r=await env.DB!.prepare('SELECT revision FROM public_favorite_browsers WHERE id=?').bind(id).first<{revision:number}>();if(r)return {revision:r.revision,token:null};}
 const next=[...crypto.getRandomValues(new Uint8Array(32))].map(v=>v.toString(16).padStart(2,'0')).join('');
 await env.DB!.prepare("INSERT INTO public_favorite_browsers(id,favorites,revision,updated_at) VALUES (?,'[]',0,?)").bind(await tokenHash(next),new Date().toISOString()).run();return {revision:0,token:next};
}
export async function saveFavoriteSelection(token:string,favorites:string[],revision:number){const id=await tokenHash(token);const r=await env.DB!.prepare('UPDATE public_favorite_browsers SET favorites=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(JSON.stringify(favorites),new Date().toISOString(),id,revision).run();if(r.meta.changes===1)return {ok:true,revision:revision+1};const current=await env.DB!.prepare('SELECT revision FROM public_favorite_browsers WHERE id=?').bind(id).first<{revision:number}>();return {ok:false,revision:current?.revision??null};}
