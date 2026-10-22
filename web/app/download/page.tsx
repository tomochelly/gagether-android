import {redirect} from 'next/navigation';
import {requestLocale} from '@/lib/request-locale';
export const dynamic='force-dynamic';
export default async function Download(){const {locale}=await requestLocale();redirect('/'+locale+'/download');}
