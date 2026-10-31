import {notFound} from 'next/navigation';
import {games} from '@/lib/games';
import {isLocale,defaultRegionForLocale} from '@/lib/visitor-locale';
import {effectiveRegion} from '@/lib/presentation';
import type {Region} from '@/lib/types';
import {catalogMetadata} from '@/lib/seo';
import LocalizedCatalog from '@/components/localized-catalog';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;gameId:string}>;searchParams:Promise<{region?:string}>};
async function selection({params,searchParams}:Props){const {locale,gameId}=await params;const game=games.find(g=>g.id===gameId);if(!isLocale(locale)||!game)notFound();const query=await searchParams;const requested=game.regions.includes(query?.region as Region)?query.region as Region:defaultRegionForLocale(locale);const region=effectiveRegion(game,requested);return {locale,game,region,service:region!==effectiveRegion(game,defaultRegionForLocale(locale))?region:undefined};}
export async function generateMetadata(props:Props){const {locale,game,service}=await selection(props);return catalogMetadata(locale,{id:game.id,name:game.name[locale]},false,service);}
export default async function GameCalendar(props:Props){const {locale,game,region}=await selection(props);return <LocalizedCatalog locale={locale} game={game} region={region}/>;}
