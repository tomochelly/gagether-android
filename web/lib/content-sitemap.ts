import {games} from './games';
import {supportedLocales} from './catalog-paths';
import {brandOrigin} from './brand';
import {characterCanonicalPath,type CharacterIdentity} from './character-canonical';
import {contentInAudience} from './content-audience';
import {discoverableEntry,entryPath,leakPath} from './discovery';
import type {Entry,Locale} from './types';

const parts=['entries','characters','leaks'] as const;
export type ContentSitemapPart=typeof parts[number];
export type ContentSitemapSelection={gameId:string;locale:Locale};
type Readers={
 entries:(gameId:string)=>Promise<Entry[]>;
 characters:(gameId:string)=>Promise<CharacterIdentity[]>;
 leaks:(gameId:string)=>Promise<{id:string;gameId:string}[]>;
};
const namespace='http://www.sitemaps.org/schemas/sitemap/0.9';
const escape=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const prefix='<?xml version="1.0" encoding="UTF-8"?>';
function xmlResponse(body:string){
 if(new TextEncoder().encode(body).byteLength>50_000_000)throw Error('Sitemap exceeds byte limit');
 return new Response(body,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'}});
}
function uniquePaths(paths:string[]){
 const unique=[...new Set(paths)];
 if(unique.length>50_000)throw Error('Sitemap exceeds URL limit');
 return unique;
}
/** Fixed selectors keep crawlers out of arbitrary URLs and unbounded query grids. */
export function contentSitemapSelection(url:URL):ContentSitemapSelection|null|false{
 const q=url.searchParams;if(!q.size)return null;
 if(q.size!==2||[...q.keys()].some(key=>!['game','locale'].includes(key)))return false;
 const gameId=q.get('game'),locale=q.get('locale');
 return games.some(g=>g.id===gameId)&&supportedLocales.includes(locale as Locale)?{gameId:gameId!,locale:locale as Locale}:false;
}
export function contentSitemapIndex(){
 const urls=uniquePaths(games.flatMap(game=>supportedLocales.map(locale=>brandOrigin+'/sitemap-items.xml?'+new URLSearchParams({game:game.id,locale}))));
 return xmlResponse(prefix+`<sitemapindex xmlns="${namespace}">`+urls.map(url=>'<sitemap><loc>'+escape(url)+'</loc></sitemap>').join('')+'</sitemapindex>');
}
export function contentSitemapPaths(selection:ContentSitemapSelection&{part:ContentSitemapPart},rows:Entry[]|CharacterIdentity[]|{id:string;gameId:string}[]){
 const {gameId,locale,part}=selection,game=games.find(g=>g.id===gameId);if(!game)throw Error('Unknown sitemap game');
 const paths=part==='entries'
  ?(rows as Entry[]).filter(e=>e.gameId===gameId&&discoverableEntry(e,locale)&&contentInAudience(e,game,e.region,locale)).map(e=>entryPath(locale,e))
  :part==='characters'
   ?(rows as CharacterIdentity[]).map(c=>{if(typeof c.id!=='string'||!c.id||c.id.length>200)throw Error('Invalid character identity');return characterCanonicalPath(locale,game,c);})
   :(rows as {id:string;gameId:string}[]).filter(item=>item.gameId===gameId).map(item=>leakPath(locale,item));
 return uniquePaths(paths).map(path=>brandOrigin+path);
}
/** Read one game, sequentially; retain URLs rather than several source payloads. */
export function contentSitemapHandler(readers:Readers){return async(request:Request)=>{
 const selection=contentSitemapSelection(new URL(request.url));
 if(selection===false)return new Response('Sitemap not found',{status:404,headers:{'Cache-Control':'no-store'}});
 try{
  if(!selection)return contentSitemapIndex();
  const paths:string[]=[];
  for(const part of parts){const rows=await readers[part](selection.gameId);paths.push(...contentSitemapPaths({...selection,part},rows));}
  const urls=uniquePaths(paths);
  // Every registered game has a saved character directory. Do not advertise an
  // empty "successful" sitemap when that source contract has broken.
  if(!urls.length)throw Error('Saved game sitemap is empty');
  return xmlResponse(prefix+`<urlset xmlns="${namespace}">`+urls.map(url=>'<url><loc>'+escape(url)+'</loc></url>').join('')+'</urlset>');
 }catch{return new Response('Saved sitemap temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
};}
