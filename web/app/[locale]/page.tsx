import {notFound} from 'next/navigation';
import {isLocale} from '@/lib/visitor-locale';
import {catalogMetadata} from '@/lib/seo';
import LocalizedCatalog from '@/components/localized-catalog';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))notFound();return catalogMetadata(locale);
}
export default async function LocaleHome({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))notFound();return <LocalizedCatalog locale={locale}/>;
}
