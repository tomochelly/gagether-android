import {notFound} from 'next/navigation';
import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {editorIdentity} from '@/lib/editor-access';
import OperationsConsole from '@/components/operations-console';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false}};
export default async function Page(){await requireChatGPTUser('/owner/operations');if(!await editorIdentity())notFound();return <OperationsConsole/>;}
