import {hydrateRosterDetails} from '@/lib/roster-detail-catalog';
import {cache} from 'react';
import {notFound} from 'next/navigation';
import {games} from '@/lib/games';
import {isLocale,defaultRegionForLocale} from '@/lib/visitor-locale';
import {effectiveRegion} from '@/lib/presentation';
import {readCharacterRosterView as readCharacterRoster} from '@/lib/roster-art-framing-store';
import type {Region} from '@/lib/types';
import {rosterCopy,characterPath} from '@/lib/character-roster';
import {discoveryWords} from '@/lib/discovery';
import {brandOrigin} from '@/lib/brand';
import CharacterLanding from '@/components/character-landing';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;gameId:string;characterId:string}>;searchParams?:Promise<{region?:string}>};
const load=cache(async(locale:string,gameId:string,id:string,requested?:string)=>{
 const game=games.find(g=>g.id===gameId);if(!isLocale(locale)||!game||id.length>200)notFound();
 const result=await readCharacterRoster(gameId),character=result?.data.characters.find(c=>c.id===id);if(!result||!character)notFound();
 let region=effectiveRegion(game,game.regions.includes(requested as Region)?requested as Region:defaultRegionForLocale(locale));
 if(gameId==='umamusume'&&character.regions?.length&&!character.regions.includes(region))region=(['jp','kr','global']as const).find(r=>character.regions!.includes(r))!;
 return {locale,game,data:result.data,character:await hydrateRosterDetails(result.data,character),region};
});
export async function generateMetadata({params,searchParams}:Props){const p=await params,q=await searchParams||{},{locale,game,character,region}=await load(p.locale,p.gameId,p.characterId,q.region),title=`${rosterCopy(character.name,locale)} · ${game.name[locale]} ${discoveryWords[locale].characters} | 가게더 GAGETHER`,url=brandOrigin+characterPath(locale,game.id,character.id)+(region!==effectiveRegion(game,defaultRegionForLocale(locale))?'?region='+region:''),description=[rosterCopy(character.name,locale),...character.traits?.map(t=>rosterCopy(t.value,locale))||[],game.name[locale],discoveryWords[locale].characters].join(' · ');return {title,description,alternates:{canonical:url,languages:Object.fromEntries((['ko','en','ja','zh']as const).map(l=>[l,brandOrigin+characterPath(l,game.id,character.id)+(region!==effectiveRegion(game,defaultRegionForLocale(l))?'?region='+region:'')]))},openGraph:{type:'article',title,description,url},robots:{index:true,follow:true}};}
export default async function CharacterPage({params,searchParams}:Props){const p=await params,q=await searchParams||{},{locale,game,data,character,region}=await load(p.locale,p.gameId,p.characterId,q.region);return <CharacterLanding gameId={game.id} locale={locale} region={region} data={{gameId:data.gameId,sourceName:data.sourceName,sourceUrls:data.sourceUrls,checkedAt:data.checkedAt,coverage:data.coverage,characters:[]}} character={character}/>;}
