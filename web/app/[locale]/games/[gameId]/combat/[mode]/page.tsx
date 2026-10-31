import {notFound} from 'next/navigation';
import {isLocale} from '@/lib/visitor-locale';
import {isCombatMode,combatView} from '@/lib/wuwa-combat';
import {wuwaCombatMetadata} from '@/lib/wuwa-combat-seo';
import WuwaCombatDocument,{type CombatSearchParams} from '@/lib/wuwa-combat-document';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;gameId:string;mode:string}>;searchParams:Promise<CombatSearchParams>};
async function selection({params,searchParams}:Props){const p=await params;if(!isLocale(p.locale)||p.gameId!=='wuwa'||!isCombatMode(p.mode))notFound();return {locale:p.locale,mode:p.mode,query:await searchParams};}
export async function generateMetadata(props:Props){const {locale,mode,query}=await selection(props);return wuwaCombatMetadata(locale,mode,combatView(query.view));}
export default async function CombatModePage(props:Props){return WuwaCombatDocument(await selection(props));}
