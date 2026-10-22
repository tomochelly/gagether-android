"use client";
import {ArrowUpRight,Swords} from 'lucide-react';
import type {Entry,Locale} from '@/lib/types';
import {weaponUi,type WeaponLink} from '@/lib/weapon-links';
import {localizedName} from '@/lib/presentation';
import {artworkForLocale,serviceArtworkLocale} from '@/lib/artwork';
import ArtworkMedia from './artwork-media';
export default function SignatureWeapons({links,locale,onOpen,compact=false}:{links:WeaponLink[];locale:Locale;onOpen:(entry:Entry)=>void;compact?:boolean}){
 if(!links.length)return null;
 const t=weaponUi[locale];
 return <div className={'signature-weapons'+(compact?' compact':'')} aria-label={t.label}>{links.map(link=>{
  const name=localizedName(link.name,locale),art=artworkForLocale(link.art,locale,'preview',serviceArtworkLocale(link.entry.region,link.entry.gameId));
  return <button type="button" className="signature-weapon" key={link.key} onClick={()=>onOpen(link.entry)} aria-label={name+' · '+t.open}>
   {!compact&&<span className="signature-weapon-art">{art.imageVerified&&art.image?<ArtworkMedia art={link.art} locale={locale} serviceLocale={serviceArtworkLocale(link.entry.region,link.entry.gameId)} alt={name} fitPreview="contain"/>:<Swords size={22}/>}</span>}
   <span className="signature-weapon-copy"><small><Swords size={12}/>{t.label}</small><strong>{name}</strong><span>{t.open}<ArrowUpRight size={13}/></span></span>
  </button>;
 })}</div>;
}
