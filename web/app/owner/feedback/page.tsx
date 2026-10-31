import {notFound} from 'next/navigation';
import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {editorIdentity} from '@/lib/editor-access';
import FeedbackInbox from '@/components/feedback-inbox';
export const dynamic='force-dynamic';
export const metadata={title:'피드백 제보함 · GAGETHER',robots:{index:false,follow:false}};
export default async function FeedbackPage(){await requireChatGPTUser('/owner/feedback');if(!await editorIdentity())notFound();return <FeedbackInbox/>;}
