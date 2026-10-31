import {redirect} from 'next/navigation';
import {getChatGPTUser,chatGPTSignInPath} from '@/app/chatgpt-auth';
import {editorIdentity} from '@/lib/editor-access';
import ReviewedEntryImport from '@/components/reviewed-entry-import';
export const dynamic='force-dynamic';
export default async function Page(){if(!await getChatGPTUser())redirect(chatGPTSignInPath('/owner/reviewed-entries'));if(!await editorIdentity())return <main style={{padding:40}}>소유자만 등록할 수 있습니다.</main>;return <ReviewedEntryImport/>;}
