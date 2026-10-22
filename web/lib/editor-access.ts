import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {isEditorIdentity} from './editorial';
export async function editorIdentity(){
 const user=await getChatGPTUser();
 const allowed=(env as unknown as {PATCHWORK_EDITOR_EMAILS?:string}).PATCHWORK_EDITOR_EMAILS;
 return isEditorIdentity(user,allowed)?user:null;
}
