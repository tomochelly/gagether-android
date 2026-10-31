
import {redirect} from 'next/navigation';
import {getChatGPTUser,chatGPTSignInPath} from '@/app/chatgpt-auth';
import {editorIdentity} from '@/lib/editor-access';
import {combatImages} from '@/lib/wuwa-combat-images';
import EquipmentUpload from '@/components/wuwa-equipment-upload';
export const dynamic='force-dynamic';
export default async function Page(){if(!await getChatGPTUser())redirect(chatGPTSignInPath('/owner/wuwa-combat-images'));if(!await editorIdentity())return <main style={{padding:40}}>소유자만 원본 이미지를 등록할 수 있습니다.</main>;return <EquipmentUpload combat images={combatImages.map(a=>({hash:a.hash,bytes:a.bytes}))}/>;}
