import {deliverPublicRead} from '@/lib/public-delivery';
import {notFound} from 'next/navigation';
import {games} from '@/lib/games';
import {isLocale,defaultRegionForLocale} from '@/lib/visitor-locale';
import {effectiveRegion} from '@/lib/presentation';
import {sectionDiscoveryMetadata,discoveryWords} from '@/lib/discovery';
import WuwaReferencePanel from '@/components/wuwa-reference';
import type {Region} from '@/lib/types';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;gameId:string}>;searchParams:Promise<{region?:string}>};
export async function generateMetadata({params}:Props){const {locale,gameId}=await params;if(!isLocale(locale)||!games.some(g=>g.id===gameId))notFound();return sectionDiscoveryMetadata(gameId,locale,'characters');}
export default async function CharacterDirectory({params,searchParams}:Props){const {locale,gameId}=await params,game=games.find(g=>g.id===gameId);if(!isLocale(locale)||!game)notFound();const q=await searchParams,region=effectiveRegion(game,game.regions.includes(q?.region as Region)?q.region as Region:defaultRegionForLocale(locale));
 if(gameId==='wuwa'){const {GET}=await import('@/app/api/wuwa/library/route'),response=await deliverPublicRead(new Request('https://gagether.wiki/api/wuwa/library?view=directory'),GET);if(response.status!==200)throw Error('Saved reference unavailable');const initialRead=await response.json() as {data:import('@/lib/wuwa-reference').WuwaReference;view:string;revision:string};initialRead.revision=response.headers.get('X-Gagether-Roster-Revision')||initialRead.revision;const {data}=initialRead;return <main className="document-reader"><nav className="document-navigation"><a href={'/'+locale}>GAGETHER</a><a href={`/${locale}/games/wuwa`}>{discoveryWords[locale].back}</a></nav><WuwaReferencePanel locale={locale} section="characters" now={Date.now()} initialRead={{...initialRead,etag:response.headers.get('ETag')||undefined,readAt:Date.now(),stale:response.headers.get('X-Gagether-Public-Cache')==='STALE'}}/><details><summary>{discoveryWords[locale].characters} · {data.characters.length}</summary><p>{data.characters.map(c=>c.name[locale]).join(' · ')}</p></details></main>;}
 const [{readPublicCharacterRoster},{default:CharacterLanding}]=await Promise.all([import('@/lib/roster-public-read'),import('@/components/character-landing')]);
 const response=await deliverPublicRead(new Request('https://gagether.wiki/api/characters?'+new URLSearchParams({game:gameId})),readPublicCharacterRoster);if(response.status===404)notFound();if(response.status!==200)throw Error('Saved roster unavailable');const {data,revision}=await response.json() as {revision:string;data:import('@/lib/character-roster').CharacterRoster};return <CharacterLanding gameId={gameId} locale={locale} region={region} data={data} initialRead={{revision:response.headers.get('X-Gagether-Roster-Revision')||revision,etag:response.headers.get('ETag')||undefined,readAt:Date.now(),stale:response.headers.get('X-Gagether-Public-Cache')==='STALE'}}/>;
}
