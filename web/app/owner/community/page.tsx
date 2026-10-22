import {notFound} from 'next/navigation';
import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {editorIdentity} from '@/lib/editor-access';
import CommunityModeration from '@/components/community-moderation';
export const dynamic='force-dynamic';
export const metadata={title:'의견 관리 · GAGETHER',robots:{index:false,follow:false}};
export default async function CommunityPage(){await requireChatGPTUser('/owner/community');if(!await editorIdentity())notFound();return <CommunityModeration/>;}
