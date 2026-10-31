import {notFound} from 'next/navigation';
import {games} from '@/lib/games';
import {isLocale} from '@/lib/visitor-locale';
import {readForesight} from '@/lib/foresight-data';
import {hasForesight,foresightPath,foresightTabs} from '@/lib/foresight';
import {brandOrigin,searchBrand} from '@/lib/brand';
import type {Region} from '@/lib/types';
import ForesightPanel from '@/components/foresight-panel';
type Props={params:Promise<{locale:string;gameId:string}>;searchParams:Promise<{region?:string}>};
async function selection({params}:Props){const {locale,gameId}=await params;if(!isLocale(locale)||!hasForesight(gameId))notFound();const game=games.find(g=>g.id===gameId)!,data=readForesight(gameId);if(!data)notFound();return {locale,gameId,game,data};}
export async function generateMetadata(props:Props){const {locale,gameId,game,data}=await selection(props),title=game.name[locale]+' '+foresightTabs[locale]+' | '+searchBrand(locale),url=brandOrigin+foresightPath(locale,gameId);return {title,description:data.overview[locale],alternates:{canonical:url,languages:Object.fromEntries((['ko','en','ja','zh']as const).map(l=>[l,brandOrigin+foresightPath(l,gameId)]))},robots:{index:true,follow:true},openGraph:{type:'website',url,title,description:data.overview[locale]}};}
export default async function ForesightPage(props:Props){const {locale,gameId,game,data}=await selection(props),q=await props.searchParams,region=game.regions.includes(q.region as Region)?q.region as Region:undefined;return <main className="document-reader"><nav className="document-navigation"><a href={'/'+locale}>GAGETHER</a><a href={`/${locale}/games/${gameId}`}>{game.name[locale]}</a></nav><ForesightPanel gameId={gameId} locale={locale} region={region} initialData={data} now={Date.now()} showLanguageLinks/></main>;}
