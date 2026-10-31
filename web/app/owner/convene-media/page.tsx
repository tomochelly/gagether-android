import {redirect} from 'next/navigation';
import {getChatGPTUser,chatGPTSignInPath} from '@/app/chatgpt-auth';
import {editorIdentity} from '@/lib/editor-access';
import {characterConveneClips} from '@/lib/wuwa-convene-media';
import ConveneMediaUpload from '@/components/wuwa-convene-media-upload';
export default async function Page(){
 if(!await getChatGPTUser())redirect(chatGPTSignInPath('/owner/convene-media'));
 if(!await editorIdentity())return <main style={{padding:40}}>소유자만 영상 파일을 등록할 수 있습니다.</main>;
 const clips=characterConveneClips.filter(c=>['1312','1109','1509'].includes(c.characterId)).map(c=>({id:c.characterId,sha256:c.sha256,bytes:c.bytes}));
 return <ConveneMediaUpload clips={clips}/>;
}
