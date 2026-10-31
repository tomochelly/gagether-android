'use client';
import {useDisplayZone} from './display-time';
import {Clock3} from 'lucide-react';
import type {Entry,Locale,SourceCheck} from '@/lib/types';
import {ownerUi} from '@/lib/owner-ui';
import {localeCode} from '@/lib/i18n';
export default function UpdateStatus({entries,checks,locale}:{entries:Entry[];checks:SourceCheck[];locale:Locale}){
 const zone=useDisplayZone();
 const t=ownerUi[locale];const checked=checks.map(c=>c.checkedAt).sort().at(-1);
 const reviewed=entries.filter(e=>!e.id.startsWith('feed-')).map(e=>e.verifiedAt).sort().at(-1);
 const date=(value?:string)=>value?new Intl.DateTimeFormat(localeCode[locale],{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:zone}).format(new Date(value))+' '+zone:t.unknown;
 return <details className="update-status"><summary><Clock3 size={13}/><strong>{t.policy}</strong><span>{t.feed} {date(checked)}</span></summary><p>{t.syncHelp}</p><p>{t.liveLimit}</p><div><span>{t.feed}: {date(checked)}</span><span>{t.review}: {date(reviewed)}</span></div></details>;
}
