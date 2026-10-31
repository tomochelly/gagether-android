import {emptyCatalog} from '@/lib/initial-shell';
import {packCatalog} from '@/lib/catalog-transport';
import {catalogMetadata} from '@/lib/seo';
export async function generateMetadata(){return catalogMetadata((await requestLocale()).locale,undefined,true);}
import Radar from "@/components/radar";
import {requestLocale} from '@/lib/request-locale';
import {readData} from '@/lib/store';
import {requestLayout} from '@/lib/request-layout';
export const dynamic='force-dynamic';
export default async function Home({searchParams}:{searchParams:Promise<{tab?:string;entry?:string}>}) {
 const {tab,entry}=await searchParams;
 const [{locale,manual},layout]=await Promise.all([requestLocale(),requestLayout()]);
 // Entry links retain full server rendering. Ordinary visits never wait on D1.
 if(entry){const data=await readData({index:true});return <Radar initialView={tab==='history'?'history':'overview'} initialLocale={locale} initialLocaleManual={manual} initialCatalog={packCatalog(data)} initialComplete initialDeferred revalidateOnMount {...layout}/>;}
 return <Radar initialView={tab==='history'?'history':'overview'} initialLocale={locale} initialLocaleManual={manual} initialData={emptyCatalog()} initialComplete={tab==='history'} initialPending initialDeferred {...layout}/>;
}
