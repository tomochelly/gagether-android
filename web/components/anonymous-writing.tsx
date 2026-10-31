'use client';
import type {Locale} from '@/lib/types';
import {anonymousCommunityCopy} from '@/lib/anonymous-community-copy';
export default function AnonymousWriting({locale,signedIn=false,anonymous=false,ipPrefix,onChange,disabled=false}:{locale:Locale;signedIn?:boolean;anonymous?:boolean;ipPrefix?:string|null;onChange?:(value:boolean)=>void;disabled?:boolean}){
 const t=anonymousCommunityCopy[locale];
 return <div className="anonymous-writing">{signedIn&&onChange&&<label><input type="checkbox" checked={anonymous} disabled={disabled} onChange={e=>onChange(e.target.checked)}/>{t.choose}</label>}{anonymous&&<p><strong>{t.label}{ipPrefix?' ('+ipPrefix+')':''}</strong><span>{t.notice}</span></p>}</div>;
}
export function CommunityAuthor({name,anonymous,ipPrefix,locale}:{name:string;anonymous?:boolean;ipPrefix?:string;locale:Locale}){return <span>{name||anonymousCommunityCopy[locale].label}{anonymous&&<small className="community-ip"> ({ipPrefix||anonymousCommunityCopy[locale].unavailable})</small>}</span>;}
