'use client';
import CompactCardRail from './compact-card-rail';
import UiText from './ui-text';
import {textAppearance,textAppearanceStyle,authoredField} from '@/lib/text-appearance';
import {EntryEdit,EntryField} from './owner-inline';
import {samePickupName,type OpenEntry} from '@/lib/pickup-detail';
import SecondaryPickups from './secondary-pickups';
import {useState,type CSSProperties} from 'react';
import {CalendarClock,ArrowUpRight,ChevronDown,ImageOff} from 'lucide-react';
import type {Entry,Locale} from '@/lib/types';
import {upcomingPickups,upcomingText,type UpcomingPickup} from '@/lib/upcoming-pickups';
import {localizedName,regionLabel,versionCaption} from '@/lib/presentation';
import {useCatalog} from './catalog-context';
import PickupThumbnail from './pickup-thumbnail';
import {thumbnailMembers} from '@/lib/pickup-thumbnail';
import ArtworkDisclosure from './artwork-disclosure';
import SourceFooter from './source-footer';
import SignatureWeapons from './signature-weapons';
import {signatureWeapons} from '@/lib/weapon-links';
import {pickupStartLabel,pickupEstimate,estimateText,estimateSourceLabel,estimateScopeLabel} from '@/lib/pickup-estimates';
import {useDisplayZone} from './display-time';

function UpcomingCard({item,locale,onOpen,weaponEntries}:{weaponEntries:Entry[];item:UpcomingPickup;locale:Locale;onOpen:OpenEntry}){
 const {byId,t,simpleMode}=useCatalog(),{entry,art}=item,l=upcomingText[locale],game=byId[entry.gameId];
 const hasArt=!!art?.image||thumbnailMembers(entry,item.name).length>1;
 const name=localizedName(item.name,locale);
 const artwork=hasArt&&<button className="upcoming-art" onClick={()=>onOpen(entry,item.name)} aria-label={name+' · '+t.more}><PickupThumbnail entry={entry} art={art} name={item.name} locale={locale}/></button>;
 const forecast=entry.pickupArchive?.status==='forecast'||(entry.sourceKind||'official')!=='official';
 const estimate=pickupEstimate(entry),dateText=estimateText[locale];
 return <article className={'upcoming-card'+(!hasArt?' without-art':'')+(simpleMode?' compact':'')} style={{'--upcoming-accent':game.color} as CSSProperties}>
  <EntryEdit entry={entry} locale={locale} scope={entry.pickupMembers?.some(m=>samePickupName(m.name,item.name))?`field:pickupMembers.${entry.pickupMembers.findIndex(m=>samePickupName(m.name,item.name))}.name`:"field:title"}/>{!simpleMode&&(<EntryField entry={entry} locale={locale} field={entry.pickupMembers?.some(m=>samePickupName(m.name,item.name))?`pickupMembers.${entry.pickupMembers.findIndex(m=>samePickupName(m.name,item.name))}`:"$art"}>{artwork||<span className="upcoming-art-placeholder"><ImageOff size={20}/>{t.imagePending}</span>}</EntryField>)}
  <button className="upcoming-info" onClick={()=>onOpen(entry,item.name)}>
   <span className="upcoming-game"><img src={game.icon||game.logo} alt="" loading="lazy"/>{game.name[locale]}<small>{regionLabel(game,entry.region,locale,t)}</small></span>
   <span className="upcoming-name"><strong style={textAppearanceStyle(textAppearance(entry,locale),'title')}>{name}</strong><ArrowUpRight size={17}/></span>
   <span className="upcoming-labels"><span>{entry.poolType==='support'?t.supportPool:item.type==='new'?t.newPickup:item.type==='rerun'?t.rerunPickup:t.upcoming}</span>{entry.selectionCount&&<span><UiText name="selectionChoose">{t.selectionChoose}</UiText> {entry.selectionCount}</span>}{versionCaption(entry,locale)&&<span>{versionCaption(entry,locale)}</span>}{entry.translatedLocales?.includes(locale)&&!entry.officialLocales?.includes(locale)&&<span className="localization-label"><UiText name="translatedTitle">{t.translatedTitle}</UiText></span>}</span>
   <SecondaryPickups entry={entry} locale={locale}/><span className="upcoming-start"><CalendarClock size={15}/><span><b>{pickupStartLabel(entry,locale,item.start)}</b>{(item.start||estimate)&&<small>{estimate?.scope==='version'?estimateScopeLabel(entry,locale):forecast?dateText.banner:l.starts}</small>}</span></span>
   {item.end&&<span className="upcoming-end">{l.ends} <time dateTime={item.end}>{item.end.replaceAll('-','.')}</time></span>}
   {forecast&&<small className="upcoming-date-source">{estimateSourceLabel(entry,locale)}</small>}
  </button>
  <SignatureWeapons links={signatureWeapons(entry,weaponEntries)} locale={locale} onOpen={onOpen} compact/>
  {simpleMode&&hasArt&&<ArtworkDisclosure locale={locale} label={name}>{artwork}</ArtworkDisclosure>}
 </article>;
}

export default function UpcomingPickups({entries,locale,now,onOpen,heading=true,weaponEntries=entries}:{weaponEntries?:Entry[];entries:Entry[];locale:Locale;now:number;onOpen:OpenEntry;heading?:boolean}){
 const {simpleMode}=useCatalog(),[limit,setLimit]=useState(6),l=upcomingText[locale];
 const zone=useDisplayZone(),items=upcomingPickups(entries,locale,now,zone);
 if(!items.length)return null;
 return <section className={'upcoming-pickups'+(simpleMode?' compact':'')} aria-label={l.title} id="gagether-upcoming">
  {heading&&<header><div><CalendarClock size={18}/><h2>{l.title}</h2><span>{items.length}</span></div></header>}
  <CompactCardRail className="upcoming-grid" label={l.title} locale={locale} count={Math.min(limit,items.length)}>{items.slice(0,limit).map(item=><UpcomingCard weaponEntries={weaponEntries} key={item.id+locale} item={item} locale={locale} onOpen={onOpen}/>)}</CompactCardRail>
  {items.length>6&&<button className="upcoming-more" onClick={()=>setLimit(limit>=items.length?6:limit+6)}>{limit>=items.length?l.less:l.more}<ChevronDown size={14}/></button>}
  <SourceFooter entries={[...new Map(items.slice(0,limit).map(i=>[i.entry.id,i.entry])).values()]} locale={locale}/>
 </section>;
}
