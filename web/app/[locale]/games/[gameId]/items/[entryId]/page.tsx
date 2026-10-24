import {cache} from 'react';
import {notFound} from 'next/navigation';
import {isLocale} from '@/lib/visitor-locale';
import {games} from '@/lib/games';
import {readEntry} from '@/lib/store';
import {contentInAudience} from '@/lib/content-audience';
import {entryDiscoveryMetadata} from '@/lib/discovery';
import DocumentReader from '@/components/document-reader';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;gameId:string;entryId:string}>};
const load=cache(async(locale:string,gameId:string,id:string)=>{const game=games.find(g=>g.id===gameId);if(!isLocale(locale)||!game||id.length>200)notFound();const entry=await readEntry(id,{requirePersistent:true});if(!entry||entry.gameId!==gameId||entry.hidden||entry.broadcast||!contentInAudience(entry,game,entry.region,locale))notFound();return {entry,locale};});
export async function generateMetadata({params}:Props){const {locale,gameId,entryId}=await params;const selected=await load(locale,gameId,entryId);return entryDiscoveryMetadata(selected.entry,selected.locale);}
export default async function ItemPage({params}:Props){const {locale,gameId,entryId}=await params;const selected=await load(locale,gameId,entryId);return <DocumentReader {...selected}/>;}
