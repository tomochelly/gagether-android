'use client';
import {useState} from 'react';
import type {Entry,Locale} from '@/lib/types';
import {localizedName} from '@/lib/presentation';
import {artworkForLocale,serviceArtworkLocale} from '@/lib/artwork';
import {pickupMemberIcon} from '@/lib/pickup-member-icons';
import {NativeIcon} from './reward-display';

function Portrait({entry,member,locale}:{entry:Entry;member:NonNullable<Entry['pickupMembers']>[number];locale:Locale}){
 const [failed,setFailed]=useState(''),art=artworkForLocale(member,locale,'preview',serviceArtworkLocale(entry.region,entry.gameId));
 if(art.imageVerified&&art.image&&failed!==art.image)return <img src={art.image} alt="" loading="lazy" decoding="async" onError={()=>setFailed(art.image!)}/>;
 const icon=pickupMemberIcon(entry.gameId,member.name);return icon?<NativeIcon icon={icon} alt=""/>:null;
}
/** Supporting rate-ups never become full-size cards or character detail sections. */
export default function SecondaryPickups({entry,locale}:{entry:Entry;locale:Locale}){
 const members=entry.pickupMembers?.filter(m=>m.role==='rate-up');if(!members?.length)return null;
 const label={ko:'확률 UP',en:'Rate UP',ja:'出現率UP',zh:'概率提升'}[locale];
 return <span className="secondary-pickups"><small>{label}</small><span className="secondary-pickup-list">{members.map((m,i)=><span className="secondary-pickup" key={JSON.stringify(m.name)+i}><Portrait entry={entry} member={m} locale={locale}/><span>{localizedName(m.name,locale)}</span>{m.rarity&&<i>{m.rarity}★</i>}</span>)}</span></span>;
}
