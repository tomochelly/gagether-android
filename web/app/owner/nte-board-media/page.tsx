import {redirect} from 'next/navigation';
import {getChatGPTUser,chatGPTSignInPath} from '@/app/chatgpt-auth';
import {editorIdentity} from '@/lib/editor-access';
import {nteBoardMedia} from '@/lib/nte-board-media';
import NteMediaUpload from '@/components/nte-board-media-upload';
export default async function Page(){if(!await getChatGPTUser())redirect(chatGPTSignInPath('/owner/nte-board-media'));if(!await editorIdentity())return <main style={{padding:40}}>소유자만 등록할 수 있습니다.</main>;return <NteMediaUpload clips={nteBoardMedia}/>;}
