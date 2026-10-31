import {games} from '@/lib/games';
import GameCombat from '@/components/game-combat';
import {combatSectionLabel} from '@/lib/combat-labels';
import {effectiveRegion} from '@/lib/presentation';
import {defaultRegionForLocale,isLocale,supportedLocales} from '@/lib/visitor-locale';
import type {Region} from '@/lib/types';
import {notFound} from 'next/navigation';
import {isCombatMode,combatView,type CombatMode} from '@/lib/wuwa-combat';
import {wuwaCombatMetadata} from '@/lib/wuwa-combat-seo';
import WuwaCombatDocument,{type CombatSearchParams} from '@/lib/wuwa-combat-document';
import {brandOrigin} from '@/lib/brand';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;gameId:string}>;searchParams:Promise<CombatSearchParams>};
async function selection(props:Props){
 const {locale,gameId}=await props.params,query=await props.searchParams,game=games.find(g=>g.id===gameId);
 if(!isLocale(locale)||!game||gameId==='wuwa'&&query.mode&&!isCombatMode(query.mode))notFound();
 const region=effectiveRegion(game,game.regions.includes(query.region as Region)?query.region as Region:defaultRegionForLocale(locale));
 return {locale,game,region,query,mode:gameId==='wuwa'?query.mode as CombatMode|undefined:undefined};
}
export async function generateMetadata(props:Props){
 const picked=await selection(props);
 // Legacy ?mode= URLs keep working and advertise the same clean canonical.
 if(picked.game.id==='wuwa')return wuwaCombatMetadata(picked.locale,picked.mode,combatView(picked.query.view));
 const title=picked.game.name[picked.locale]+' · '+combatSectionLabel(picked.game.id,picked.locale)+' | GAGETHER',path=(l:string)=>brandOrigin+`/${l}/games/${picked.game.id}/combat`;
 return {title,alternates:{canonical:path(picked.locale),languages:Object.fromEntries(supportedLocales.map(l=>[l,path(l)]))},robots:{index:true,follow:true}};
}
export default async function CombatPage(props:Props){
 const picked=await selection(props);
 if(picked.game.id==='wuwa')return WuwaCombatDocument({locale:picked.locale,mode:picked.mode,query:picked.query});
 const {readData}=await import('@/lib/store'),data=await readData({index:true,gameId:picked.game.id});
 return <main className="document-reader combat-landing"><nav className="document-navigation"><a href={'/'+picked.locale}>GAGETHER</a><a href={`/${picked.locale}/games/${picked.game.id}?region=${picked.region}`}>{picked.game.name[picked.locale]}</a></nav><GameCombat gameId={picked.game.id} locale={picked.locale} region={picked.region} entries={data.entries}/></main>;
}
