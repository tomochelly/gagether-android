import {Suspense} from 'react';
import Radar from './radar';
import {readPublicCatalogSnapshot} from '@/lib/public-catalog-read';
import {emptyCatalog} from '@/lib/initial-shell';
import {packCatalog} from '@/lib/catalog-transport';
import {requestLayout} from '@/lib/request-layout';
import {effectiveRegion} from '@/lib/presentation';
import {defaultRegionForLocale} from '@/lib/visitor-locale';
import type {Game,Locale,Region} from '@/lib/types';

// Stream the same real calendar for visitors and crawlers. The fast shell never
// waits on D1; the completed server HTML contains the saved schedules as well.
export default async function LocalizedCatalog({locale,game,region}:{locale:Locale;game?:Game;region?:Region}){
 const layout=await requestLayout();
 const props={initialLocale:locale,initialLocaleManual:true,initialView:game?'game' as const:'overview' as const,initialGameId:game?.id,initialRegion:game?effectiveRegion(game,region||defaultRegionForLocale(locale)):undefined,initialComplete:false,initialDeferred:true,...layout};
 async function SavedCalendar(){
  try{const data=await readPublicCatalogSnapshot(game?.id);
  return <Radar {...props} initialCatalog={packCatalog(data)} initialPending={!data.persistent} revalidateOnMount/>;}catch{return <Radar {...props} initialData={emptyCatalog()} initialPending/>};
 }
 return <Suspense fallback={<Radar {...props} initialData={emptyCatalog()} initialPending/>}><SavedCalendar/></Suspense>;
}
