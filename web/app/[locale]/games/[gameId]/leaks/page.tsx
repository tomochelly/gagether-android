import {notFound} from 'next/navigation';
import {games} from '@/lib/games';
import {isLocale} from '@/lib/visitor-locale';
import {sectionDiscoveryMetadata} from '@/lib/discovery';
import LeakLanding from '@/components/leak-landing';
type Props={params:Promise<{locale:string;gameId:string}>};
async function selection({params}:Props){const {locale,gameId}=await params;if(!isLocale(locale)||!games.some(g=>g.id===gameId))notFound();return {locale,gameId};}
export async function generateMetadata(props:Props){const {locale,gameId}=await selection(props);return sectionDiscoveryMetadata(gameId,locale,'leaks');}
export default async function LeaksPage(props:Props){return <LeakLanding {...await selection(props)}/>;}
