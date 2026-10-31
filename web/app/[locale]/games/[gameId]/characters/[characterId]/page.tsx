import {deliverPublicRead} from '@/lib/public-delivery';
import {cache} from 'react';
import {notFound,redirect} from 'next/navigation';
import {wuwaAnnouncement,releasedAnnouncement} from '@/lib/wuwa-announcements';
import {games} from '@/lib/games';
import {materialWords,materialGroupsForService} from '@/lib/roster-materials';
import {isLocale} from '@/lib/visitor-locale';
import {characterCanonicalPath,characterService} from '@/lib/character-canonical';
import {readPublicCharacterRoster} from '@/lib/roster-public-read';
import {rosterCopy,characterPath} from '@/lib/character-roster';
import {discoveryWords} from '@/lib/discovery';
import {brandOrigin,searchBrand} from '@/lib/brand';
import CharacterLanding from '@/components/character-landing';
import WuwaCharacterLanding from '@/components/wuwa-character-landing';
import {validateWuwaCharacter,type WuwaCharacter} from '@/lib/wuwa-reference';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;gameId:string;characterId:string}>;searchParams?:Promise<{region?:string}>};
const load=cache(async(locale:string,gameId:string,id:string,requested?:string)=>{
 const game=games.find(g=>g.id===gameId);if(!isLocale(locale)||!game||id.length>200)notFound();
 const response=await deliverPublicRead(new Request('https://gagether.wiki/api/characters?'+new URLSearchParams({game:gameId,id})),readPublicCharacterRoster);if(response.status===404)notFound();if(response.status!==200)throw Error('Saved roster unavailable');const result=await response.json() as {gameId:string;character:import('@/lib/character-roster').RosterCharacter;source:Pick<import('@/lib/character-roster').CharacterRoster,'sourceName'|'sourceUrls'|'checkedAt'|'coverage'>},character=result.character;
 const region=characterService(game,character,locale,requested);
 return {locale,game,data:{gameId:result.gameId,...result.source},character,region};
});
const loadWuwa=cache(async(locale:string,id:string)=>{
 const game=games.find(g=>g.id==='wuwa')!;if(!isLocale(locale)||!id||id.length>200)notFound();
 const {GET}=await import('@/app/api/wuwa/library/route');
 const response=await deliverPublicRead(new Request('https://gagether.wiki/api/wuwa/library?'+new URLSearchParams({id})),GET);
 if(response.status===404)notFound();if(response.status!==200)throw Error('Saved resonator unavailable');
 const result=await response.json() as {gameId:string;character:WuwaCharacter};
 if(result.gameId!=='wuwa'||result.character?.id!==id)throw Error('Saved resonator identity mismatch');
 return {locale,game,character:validateWuwaCharacter(result.character)};
});
const loadAnnouncedWuwa=cache(async(locale:string,id:string)=>{
 const character=wuwaAnnouncement(id);if(!character)return null;if(!isLocale(locale))notFound();
 const {GET}=await import('@/app/api/wuwa/library/route'),response=await deliverPublicRead(new Request('https://gagether.wiki/api/wuwa/library?view=directory'),GET);
 if(response.status!==200)throw Error('Saved resonators unavailable');const {data}=await response.json() as {data:import('@/lib/wuwa-reference').WuwaReference},released=releasedAnnouncement(character,data.characters);
 if(released)redirect(characterPath(locale,'wuwa',released.id));
 return {locale,character};
});
function announcementMetadata(locale:import('@/lib/types').Locale,character:import('@/lib/character-roster').RosterCharacter){
 const title=rosterCopy(character.name,locale)+' · '+({ko:'출시 예정',en:'Upcoming',ja:'実装予定',zh:'即将登场'})[locale]+' | GAGETHER',url=brandOrigin+characterPath(locale,'wuwa',character.id);
 return {title,description:title,alternates:{canonical:url,languages:Object.fromEntries((['ko','en','ja','zh']as const).map(l=>[l,brandOrigin+characterPath(l,'wuwa',character.id)]))},robots:{index:true,follow:true}};
}
function wuwaMetadata({locale,game,character}:Awaited<ReturnType<typeof loadWuwa>>){
 const title=`${character.name[locale]} · ${game.name[locale]} ${discoveryWords[locale].characters} | ${searchBrand(locale)}`,url=brandOrigin+characterPath(locale,'wuwa',character.id),description=[character.name[locale],character.element.name[locale],character.weapon.name[locale],...character.tags.map(t=>t.name[locale]),game.name[locale],discoveryWords[locale].characters].join(' · ');
 return {title,description,alternates:{canonical:url,languages:Object.fromEntries((['ko','en','ja','zh']as const).map(l=>[l,brandOrigin+characterPath(l,'wuwa',character.id)]))},openGraph:{type:'article',title,description,url},robots:{index:true,follow:true}};
}
export async function generateMetadata({params,searchParams}:Props){const p=await params;if(p.gameId==='wuwa'){const preview=await loadAnnouncedWuwa(p.locale,p.characterId);return preview?announcementMetadata(preview.locale,preview.character):wuwaMetadata(await loadWuwa(p.locale,p.characterId));}const q=await searchParams||{},{locale,game,character,region}=await load(p.locale,p.gameId,p.characterId,q.region),title=`${rosterCopy(character.name,locale)} · ${materialGroupsForService(character.materialGroups,region).length?materialWords[locale].seo:discoveryWords[locale].characters} · ${game.name[locale]} | ${searchBrand(locale)}`,url=brandOrigin+characterCanonicalPath(locale,game,character,region),description=[rosterCopy(character.name,locale),...(materialGroupsForService(character.materialGroups,region).length?[materialWords[locale].heading(rosterCopy(character.name,locale))]:[]),...character.traits?.map(t=>rosterCopy(t.value,locale))||[],game.name[locale],discoveryWords[locale].characters].join(' · ');return {title,description,alternates:{canonical:url,languages:Object.fromEntries((['ko','en','ja','zh']as const).map(l=>[l,brandOrigin+characterCanonicalPath(l,game,character,region)]))},openGraph:{type:'article',title,description,url},robots:{index:true,follow:true}};}
export default async function CharacterPage({params,searchParams}:Props){const p=await params;if(p.gameId==='wuwa'){const preview=await loadAnnouncedWuwa(p.locale,p.characterId);if(preview)return <CharacterLanding gameId="wuwa" locale={preview.locale} region="global" character={preview.character}/>;const {locale,character}=await loadWuwa(p.locale,p.characterId);return <WuwaCharacterLanding locale={locale} character={character}/>;}const q=await searchParams||{},{locale,game,data,character,region}=await load(p.locale,p.gameId,p.characterId,q.region);return <CharacterLanding gameId={game.id} locale={locale} region={region} data={{gameId:data.gameId,sourceName:data.sourceName,sourceUrls:data.sourceUrls,checkedAt:data.checkedAt,coverage:data.coverage,characters:[]}} character={character}/>;}
