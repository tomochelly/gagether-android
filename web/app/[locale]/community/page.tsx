import {notFound} from 'next/navigation';
import {isLocale} from '@/lib/visitor-locale';
import {games} from '@/lib/games';
import {forumTitles,forumPath} from '@/lib/forum';
import {brandOrigin} from '@/lib/brand';
import ForumBoard from '@/components/forum-board';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string}>;searchParams:Promise<{game?:string}>};
export async function generateMetadata({params}:Props){const {locale}=await params;if(!isLocale(locale))notFound();return {title:forumTitles[locale]+' | GAGETHER',alternates:{canonical:brandOrigin+forumPath(locale)},robots:{index:true,follow:true}};}
export default async function CommunityPage({params,searchParams}:Props){const {locale}=await params;if(!isLocale(locale))notFound();const q=await searchParams;if(q.game&&!games.some(g=>g.id===q.game))notFound();return <ForumBoard locale={locale} initialGame={q.game}/>;}
