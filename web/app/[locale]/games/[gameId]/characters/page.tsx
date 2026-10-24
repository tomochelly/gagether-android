import {notFound} from 'next/navigation';
import {games} from '@/lib/games';
import {isLocale,defaultRegionForLocale} from '@/lib/visitor-locale';
import {effectiveRegion} from '@/lib/presentation';
import {readCharacterRoster} from '@/lib/character-roster-store';
import {rosterSummary} from '@/lib/character-roster';
import {sectionDiscoveryMetadata,discoveryWords} from '@/lib/discovery';
import {readWuwaReference} from '@/lib/wuwa-reference-store';
import WuwaReferencePanel from '@/components/wuwa-reference';
import CharacterLanding from '@/components/character-landing';
import type {Region} from '@/lib/types';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;gameId:string}>;searchParams:Promise<{region?:string}>};
export async function generateMetadata({params}:Props){const {locale,gameId}=await params;if(!isLocale(locale)||!games.some(g=>g.id===gameId))notFound();return sectionDiscoveryMetadata(gameId,locale,'characters');}
export default async function CharacterDirectory({params,searchParams}:Props){const {locale,gameId}=await params,game=games.find(g=>g.id===gameId);if(!isLocale(locale)||!game)notFound();const q=await searchParams,region=effectiveRegion(game,game.regions.includes(q?.region as Region)?q.region as Region:defaultRegionForLocale(locale));
 if(gameId==='wuwa'){const {data}=await readWuwaReference();return <main className="document-reader"><nav className="document-navigation"><a href={'/'+locale}>GAGETHER</a><a href={`/${locale}/games/wuwa`}>{discoveryWords[locale].back}</a></nav><WuwaReferencePanel locale={locale} section="characters" now={Date.now()}/><details><summary>{discoveryWords[locale].characters} · {data.characters.length}</summary><p>{data.characters.map(c=>c.name[locale]).join(' · ')}</p></details></main>;}
 const roster=await readCharacterRoster(gameId);if(!roster)notFound();const data={...roster.data,characters:roster.data.characters.map(rosterSummary)};return <CharacterLanding gameId={gameId} locale={locale} region={region} data={data}/>;
}
