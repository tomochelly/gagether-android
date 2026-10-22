import {emptyCatalog} from '@/lib/initial-shell';
import {packCatalog} from '@/lib/catalog-transport';
import {homeMetadata} from '@/lib/seo';
export const metadata=homeMetadata;
import Radar from '@/components/radar';
import {requestLocale} from '@/lib/request-locale';
import {readData} from '@/lib/store';
import {requestLayout} from '@/lib/request-layout';
export const dynamic='force-dynamic';
export default async function Mobile({searchParams}:{searchParams:Promise<{entry?:string;tab?:string}>}) {
 const q=await searchParams;
 const [{locale,manual},layout]=await Promise.all([requestLocale(),requestLayout()]);
 if(q.entry){const data=await readData({index:true});return <Radar initialLocale={locale} initialLocaleManual={manual} initialCatalog={packCatalog(data)} initialComplete initialDeferred revalidateOnMount appMode {...layout}/>;}
 return <Radar initialView={q.tab==='history'?'history':'overview'} initialLocale={locale} initialLocaleManual={manual} initialData={emptyCatalog()} initialComplete={q.tab==='history'} initialPending initialDeferred appMode {...layout}/>;
}
