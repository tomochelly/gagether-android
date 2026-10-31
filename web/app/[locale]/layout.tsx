import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import {notFound} from 'next/navigation';
import {isLocale} from '@/lib/visitor-locale';
import {localeMetadataDefaults} from '@/lib/seo';
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;if(!isLocale(locale))notFound();return localeMetadataDefaults(locale);
}
export default function LocaleLayout({children}:{children:ReactNode}){return children;}
