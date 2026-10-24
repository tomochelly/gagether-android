import {cache} from 'react';
import {notFound} from 'next/navigation';
import {isLocale} from '@/lib/visitor-locale';
import {games} from '@/lib/games';
import {readLeaks} from '@/lib/leaks-store';
import {nativeCopy} from '@/lib/leaks';
import {leakPath,sectionDiscoveryMetadata} from '@/lib/discovery';
import {brandOrigin} from '@/lib/brand';
import {supportedLocales} from '@/lib/catalog-paths';
import LeakLanding from '@/components/leak-landing';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;gameId:string;leakId:string}>};
const load=cache(async(locale:string,gameId:string,id:string)=>{if(!isLocale(locale)||!games.some(g=>g.id===gameId)||id.length>100)notFound();const item=(await readLeaks(gameId)).find(x=>x.id===id);if(!item)notFound();return {item,locale};});
export async function generateMetadata({params}:Props){const p=await params,{item,locale}=await load(p.locale,p.gameId,p.leakId),meta=sectionDiscoveryMetadata(p.gameId,locale,'leaks'),copy=nativeCopy(item,locale),url=brandOrigin+leakPath(locale,item),title=copy.title+' · '+meta.title;return {...meta,title,alternates:{canonical:url,languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+leakPath(l,item)]))},openGraph:{...meta.openGraph,url,title},twitter:{card:'summary',title,description:String(meta.description)}};}
export default async function LeakItemPage({params}:Props){const p=await params,{item,locale}=await load(p.locale,p.gameId,p.leakId);return <LeakLanding gameId={item.gameId} locale={locale} selectedId={item.id} heading={nativeCopy(item,locale).title}/>;}
