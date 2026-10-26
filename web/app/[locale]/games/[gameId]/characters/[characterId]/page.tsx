import {deliverPublicRead} from '@/lib/public-delivery';
import {cache} from 'react';
import {notFound} from 'next/navigation';
import {games} from '@/lib/games';
import {isLocale,defaultRegionForLocale} from '@/lib/visitor-locale';
import {effectiveRegion} from '@/lib/presentation';
import {readPublicCharacterRoster} from '@/lib/roster-public-read';
import type {Region} from '@/lib/types';
import {rosterCopy,characterPath} from '@/lib/character-roster';
import {discoveryWords} from '@/lib/discovery';
import {brandOrigin} from '@/lib/brand';
import CharacterLanding from '@/components/character-landing';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;gameId:string;characterId:string}>;searchParams?:Promise<{region?:string}>};
const load=cache(async(locale:string,gameId:string,id:string,requested?:string)=>{
 const game=games.find(g=>g.id===gameId);if(!isLocale(locale)||!game||id.length>200)notFound();
 const response=await deliverPublicRead(new Request('https://gagether.wiki/api/characters?'+new URLSearchParams({game:gameId,id})),readPublicCharacterRoster);if(response.status===404)notFound();if(response.status!==200)throw Error('Saved roster unavailable');const result=await response.json() as {gameId:string;character:import('@/lib/character-roster').RosterCharacter;source:Pick<import('@/lib/character-roster').CharacterRoster,'sourceName'|'sourceUrls'|'checkedAt'|'coverage'>},character=result.character;
 let region=effectiveRegion(game,game.regions.includes(requested as Region)?requested as Region:defaultRegionForLocale(locale));
 if(['umamusume','arknights'].includes(gameId)&&character.regions?.length&&!character.regions.includes(region))region=(['jp','kr','global','cn']as const).find(r=>character.regions!.includes(r))!;
 return {locale,game,data:{gameId:result.gameId,...result.source},character,region};
});
export async function generateMetadata({params,searchParams}:Props){const p=await params,q=await searchParams||{},{locale,game,character,region}=await load(p.locale,p.gameId,p.characterId,q.region),title=`${rosterCopy(character.name,locale)} · ${game.name[locale]} ${discoveryWords[locale].characters} | 가게더 GAGETHER`,url=brandOrigin+characterPath(locale,game.id,character.id)+(region!==effectiveRegion(game,defaultRegionForLocale(locale))?'?region='+region:''),description=[rosterCopy(character.name,locale),...character.traits?.map(t=>rosterCopy(t.value,locale))||[],game.name[locale],discoveryWords[locale].characters].join(' · ');return {title,description,alternates:{canonical:url,languages:Object.fromEntries((['ko','en','ja','zh']as const).map(l=>[l,brandOrigin+characterPath(l,game.id,character.id)+(region!==effectiveRegion(game,defaultRegionForLocale(l))?'?region='+region:'')]))},openGraph:{type:'article',title,description,url},robots:{index:true,follow:true}};}
export default async function CharacterPage({params,searchParams}:Props){const p=await params,q=await searchParams||{},{locale,game,data,character,region}=await load(p.locale,p.gameId,p.characterId,q.region);return <CharacterLanding gameId={game.id} locale={locale} region={region} data={{gameId:data.gameId,sourceName:data.sourceName,sourceUrls:data.sourceUrls,checkedAt:data.checkedAt,coverage:data.coverage,characters:[]}} character={character}/>;}
