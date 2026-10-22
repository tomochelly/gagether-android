import {headers} from 'next/headers';
import {requestLocale} from '@/lib/request-locale';
import {accountUi} from '@/lib/account-ui';
import {visitorSession} from '@/lib/visitor-auth-store';
import GoogleAccount from '@/components/google-account';
import type {Locale} from '@/lib/types';
export const dynamic='force-dynamic';
export const metadata={title:'계정 | GAGETHER',robots:{index:false,follow:false}};
export default async function Account({searchParams}:{searchParams:Promise<{locale?:string;returnTo?:string}>}){
 const [q,request,h]=await Promise.all([searchParams,requestLocale(),headers()]);
 const user=await visitorSession(h);
 const locale:Locale=['ko','en','ja','zh'].includes(q.locale||'')?q.locale as Locale:request.locale;
 const t=accountUi[locale],back=q.returnTo==='/mobile'?'/mobile':q.returnTo&&/^\/\?entry=[a-zA-Z0-9_%.-]+$/.test(q.returnTo)?q.returnTo:'/';
 return <main className="account-page"><a className="account-back" href={back}>← {t.back}</a><section className="account-panel"><span className="account-brand">GAGETHER</span><h1>{t.title}</h1><GoogleAccount locale={locale} user={user?{name:user.name,email:user.email}:null}/></section></main>;
}
