import {notFound,redirect} from 'next/navigation';
import {isLocale} from '@/lib/visitor-locale';
export default async function LegacyOrbit({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const {locale}=await params;if(!isLocale(locale))notFound();const q=await searchParams,query=new URLSearchParams();for(const key of ['game','section','tab','region'])if(typeof q[key]==='string')query.set(key,q[key]);redirect('/orbit/'+locale+(query.size?'?'+query:''));}
