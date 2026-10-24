import {readCharacterRoster} from '@/lib/character-roster-store';
import {characterPath} from '@/lib/character-roster';
import {readData} from '@/lib/store';
import {entryPath,leakPath,discoverableEntry} from '@/lib/discovery';
import {games} from '@/lib/games';
import {readLeaks} from '@/lib/leaks-store';
import {contentInAudience} from '@/lib/content-audience';
import {supportedLocales} from '@/lib/catalog-paths';
import {brandOrigin} from '@/lib/brand';
export const dynamic='force-dynamic';
const escape=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
export async function GET(){try{const data=await readData({index:true});if(!data.persistent)throw Error();const rosters=await Promise.all(games.filter(g=>g.id!=='wuwa').map(g=>readCharacterRoster(g.id)));const paths=[...new Set([...rosters.flatMap(r=>r?r.data.characters.flatMap(c=>supportedLocales.map(l=>brandOrigin+characterPath(l,r.data.gameId,c.id))):[]),...data.entries.flatMap(e=>{const game=games.find(g=>g.id===e.gameId);return !game?[]:supportedLocales.filter(l=>discoverableEntry(e,l)&&contentInAudience(e,game,e.region,l)).map(l=>brandOrigin+entryPath(l,e));}),...(await readLeaks()).flatMap(item=>supportedLocales.map(l=>brandOrigin+leakPath(l,item)))])];if(paths.length>45000)throw Error('Split sitemap required');return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(url=>'<url><loc>'+escape(url)+'</loc></url>').join('')+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'}});}catch{return new Response('Saved sitemap temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}}
