
import {redirect} from 'next/navigation';
import {getChatGPTUser,chatGPTSignInPath} from '@/app/chatgpt-auth';
import {editorIdentity} from '@/lib/editor-access';
import ZzzArtworkRefresh from '@/components/zzz-artwork-refresh';
export const dynamic='force-dynamic';
export default async function Page(){if(!await getChatGPTUser())redirect(chatGPTSignInPath('/owner/zzz-artwork'));if(!await editorIdentity())return <main style={{padding:40}}>소유자만 원본 이미지를 등록할 수 있습니다.</main>;return <ZzzArtworkRefresh/>;}
