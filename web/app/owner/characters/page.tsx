import {notFound} from 'next/navigation';
import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {editorIdentity} from '@/lib/editor-access';
import {requestLocale} from '@/lib/request-locale';
import {games} from '@/lib/games';
import RosterArtworkEditor from '@/components/roster-artwork-editor';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false},title:'도감 이미지 편집 · GAGETHER'};
export default async function OwnerCharacters({searchParams}:{searchParams:Promise<{game?:string;id?:string;image?:string}>}){
 await requireChatGPTUser('/owner/characters');if(!await editorIdentity())notFound();
 const [{locale},q]=await Promise.all([requestLocale(),searchParams]);
 return <RosterArtworkEditor locale={locale} initialGame={games.some(g=>g.id===q.game)?q.game!:'bluearchive'} initialId={q.id?.slice(0,200)} initialImage={q.image?.slice(0,2000)}/>;
}
