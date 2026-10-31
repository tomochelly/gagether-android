import {wuwaAnnouncements} from '@/lib/wuwa-announcements';
import type {WuwaCharacter} from '@/lib/wuwa-reference';
import {contentSitemapHandler} from '@/lib/content-sitemap';
import {deliverPublicRead} from '@/lib/public-delivery';
import {brandOrigin} from '@/lib/brand';
import type {CharacterIdentity} from '@/lib/character-canonical';
export const dynamic='force-dynamic';
const handle=contentSitemapHandler({
 async entries(gameId){const {readData}=await import('@/lib/store'),data=await readData({index:true,gameId});if(!data.persistent)throw Error('Saved entries unavailable');return data.entries;},
 async characters(gameId){
  const wuwa=gameId==='wuwa',reader=wuwa?(await import('@/app/api/wuwa/library/route')).GET:(await import('@/lib/roster-public-read')).readPublicCharacterRoster;
  const response=await deliverPublicRead(new Request(brandOrigin+(wuwa?'/api/wuwa/library?view=directory':'/api/characters?'+new URLSearchParams({game:gameId}))),reader);
  if(response.status!==200)throw Error('Saved character directory unavailable');const value=await response.json() as {data?:{gameId?:string;characters?:CharacterIdentity[]}},data=value.data;
  if(!data||!Array.isArray(data.characters)||!data.characters.length||!wuwa&&data.gameId!==gameId)throw Error('Character directory scope mismatch');return wuwa?[...data.characters,...wuwaAnnouncements(data.characters as WuwaCharacter[])]:data.characters;
 },
 async leaks(gameId){const {readLeaks}=await import('@/lib/leaks-store');return readLeaks(gameId);}
});
export async function GET(request:Request){return handle(request);}
