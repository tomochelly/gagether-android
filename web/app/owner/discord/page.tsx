import {notFound} from 'next/navigation';
import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {editorIdentity} from '@/lib/editor-access';
import DiscordSecretSetup from '@/components/discord-secret-setup';
export const dynamic='force-dynamic';
export const metadata={title:'Discord 로그인 연결 · GAGETHER',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function Page(){await requireChatGPTUser('/owner/discord');if(!await editorIdentity())notFound();return <DiscordSecretSetup/>;}
