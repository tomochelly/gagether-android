import {notFound} from 'next/navigation';
import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {editorIdentity} from '@/lib/editor-access';
import UsageDashboard from '@/components/usage-dashboard';
export const dynamic='force-dynamic';
export const metadata={title:'이용자 현황 · GAGETHER',robots:{index:false,follow:false}};
export default async function AnalyticsPage(){
 await requireChatGPTUser('/owner/analytics');
 if(!await editorIdentity())notFound();
 return <UsageDashboard/>;
}
