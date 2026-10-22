import {notFound} from 'next/navigation';
import Radar from '@/components/radar';
import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {editorIdentity} from '@/lib/editor-access';
import {readData} from '@/lib/store';
import {requestLocale} from '@/lib/request-locale';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false}};
export default async function OwnerPage(){
 await requireChatGPTUser('/owner');
 if(!await editorIdentity())notFound();
 const [{locale,manual},data]=await Promise.all([requestLocale(),readData()]);
 return <Radar initialLocale={locale} initialLocaleManual={manual} initialData={data} ownerMode/>;
}
