import {notFound} from 'next/navigation';
import Radar from '@/components/radar';
import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {editorIdentity} from '@/lib/editor-access';
import {emptyCatalog} from '@/lib/initial-shell';
import {requestLocale} from '@/lib/request-locale';
import OwnerHome from '@/components/owner-home';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false}};
export default async function OwnerPage({searchParams}:{searchParams:Promise<{view?:string}>}){
 const edit=(await searchParams).view==='site';
 await requireChatGPTUser(edit?'/owner?view=site':'/owner');
 if(!await editorIdentity())notFound();
 const {locale,manual}=await requestLocale();
 if(!edit)return <OwnerHome locale={locale}/>;
 // Start with the same lightweight shell as the public catalog. The existing
 // browser loader then receives the effective index, and individual editors
 // still read their complete saved record after the owner check above.
 return <Radar initialLocale={locale} initialLocaleManual={manual} initialData={emptyCatalog()} initialPending initialComplete={false} initialDeferred ownerMode/>;
}
