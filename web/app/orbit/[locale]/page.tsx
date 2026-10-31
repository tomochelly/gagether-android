import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import LocalizedCatalog from '@/components/localized-catalog';
import {games} from '@/lib/games';
import {isLocale,defaultRegionForLocale} from '@/lib/visitor-locale';
import {effectiveRegion} from '@/lib/presentation';
import {orbitGroups,orbitDefaultTab,orbitTabFor,hasOrbitGacha,type OrbitGroup,type OrbitTab} from '@/lib/orbit';
import type {Region} from '@/lib/types';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'GAGETHER ORBIT · BETA',description:'GAGETHER Orbit beta',robots:{index:false,follow:true}};
export default async function OrbitPage({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|undefined>>}){const {locale}=await params;if(!isLocale(locale))notFound();const q=await searchParams,game=games.find(g=>g.id===q.game)||games.find(g=>g.id==='wuwa')!,requested=q.region as Region,region=effectiveRegion(game,game.regions.includes(requested)?requested:defaultRegionForLocale(locale));let group:OrbitGroup=orbitGroups.includes(q.section as OrbitGroup)?q.section as OrbitGroup:'schedule';if(group==='gacha'&&!hasOrbitGacha(game.id))group='schedule';const tab=orbitTabFor(group,q.tab);return <LocalizedCatalog locale={locale} game={game} region={region} orbitMode orbitGroup={group} orbitTab={tab}/>;}

