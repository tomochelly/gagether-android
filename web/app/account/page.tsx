import {headers} from 'next/headers';
import {requestLocale} from '@/lib/request-locale';
import {accountUi} from '@/lib/account-ui';
import {visitorSession} from '@/lib/visitor-auth-store';
import GoogleAccount from '@/components/google-account';
import type {Locale} from '@/lib/types';
import {discordLoginConfig} from '@/lib/discord-auth-store';
import {accountReturnTo} from '@/lib/discord-login';
export const dynamic='force-dynamic';
export async function generateMetadata({searchParams}:{searchParams:Promise<{locale?:string}>}){const q=await searchParams,locale:Locale=['ko','en','ja','zh'].includes(q.locale||'')?q.locale as Locale:(await requestLocale()).locale;return {title:accountUi[locale].title+' | GAGETHER',robots:{index:false,follow:false}};}
export default async function Account({searchParams}:{searchParams:Promise<{locale?:string;returnTo?:string;discord?:string}>}){
 const [q,request,h]=await Promise.all([searchParams,requestLocale(),headers()]);
 const user=await visitorSession(h);
 const locale:Locale=['ko','en','ja','zh'].includes(q.locale||'')?q.locale as Locale:request.locale;
 const t=accountUi[locale],back=accountReturnTo(q.returnTo),discord=discordLoginConfig();
 return <main className="account-page"><a className="account-back" href={back}>← {t.back}</a><section className="account-panel"><span className="account-brand">GAGETHER</span><h1>{t.title}</h1><GoogleAccount locale={locale} user={user?{name:user.name,email:user.email,provider:user.provider}:null} discordOrigin={discord?new URL(discord.redirectUri).origin:null} returnTo={back} discordResult={q.discord==='cancelled'?'cancelled':q.discord?'failed':undefined}/></section></main>;
}
