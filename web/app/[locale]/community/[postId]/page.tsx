import {notFound} from 'next/navigation';
import {isLocale} from '@/lib/visitor-locale';
import {forumId,forumTitles} from '@/lib/forum';
import ForumBoard from '@/components/forum-board';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:true}};
export default async function PostPage({params}:{params:Promise<{locale:string;postId:string}>}){const {locale,postId}=await params;if(!isLocale(locale)||!forumId.safeParse(postId).success)notFound();return <ForumBoard locale={locale} postId={postId}/>;}
