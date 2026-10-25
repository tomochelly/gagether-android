'use client';
import UiText from './ui-text';
import {textAppearance,textAppearanceStyle} from '@/lib/text-appearance';
import {EntryEdit} from './owner-inline';
import {ownerUi} from '@/lib/owner-ui';
import {useState,type CSSProperties} from 'react';
import {ArrowUpRight,ImageOff,Pencil} from 'lucide-react';
import type {Entry,Game,Locale,Region} from '@/lib/types';
import {artworkForLocale,serviceArtworkLocale,isBrandArtwork} from '@/lib/artwork';
import {regionLabel} from '@/lib/presentation';
import {useCatalog,editEntryTarget} from './catalog-context';
import ArtworkMedia from './artwork-media';
import {artworkPresets} from '@/lib/artwork-presets';
import ArtworkDisclosure from './artwork-disclosure';

export default function VersionHero({entry,game,region,locale,onOpen}:{entry?:Entry;game:Game;region:Region;locale:Locale;onOpen:(e:Entry)=>void}){
 const {t,editMode,openEditor,simpleMode}=useCatalog();const [failed,setFailed]=useState('');
 const art=entry?artworkForLocale(entry,locale,'full',serviceArtworkLocale(entry.region,entry.gameId)):undefined;
 const image=art?.imageVerified&&art.image!==failed&&!isBrandArtwork(art.image,game)?art.image:undefined;
 const title=entry?.versionTitle?.[locale]||entry?.title[locale]||t.versionPending;
 if(simpleMode)return <section className="simple-version" style={{'--version-color':game.color} as CSSProperties} aria-label={t.currentVersion}><div className="simple-version-heading"><img src={game.icon||game.logo} alt=""/><div><span>{game.name[locale]} · {regionLabel(game,region,locale,t)}</span><small><UiText name="currentVersion">{t.currentVersion}</UiText>{entry?.version&&/^\d+(\.\d+)*$/.test(entry.version)?' · V'+entry.version:''}</small><h1 style={textAppearanceStyle(textAppearance(entry,locale),'title')}>{title}</h1></div>{entry&&<button aria-label={t.more} onClick={()=>onOpen(entry)}><ArrowUpRight size={19}/></button>}</div>{image&&art&&<ArtworkDisclosure key={entry!.id+locale} locale={locale}><div className="simple-version-art"><ArtworkMedia art={{...art,previewArtwork:undefined,previewBounds:undefined,localizedArtwork:undefined}} alt={title} locale={locale} serviceLocale={serviceArtworkLocale(entry!.region,entry!.gameId)} mode="full" onUnavailable={()=>setFailed(image)}/></div></ArtworkDisclosure>}</section>;
 return <div className="owner-banner-frame"><section className={'version-hero'+(image?'':' version-hero-pending')} style={{'--version-color':game.color} as CSSProperties} aria-label={t.currentVersion}>
  {image&&art&&<><div className="version-hero-glow" style={{backgroundImage:`url(${image})`}} aria-hidden="true"/><div className="version-hero-art"><ArtworkMedia art={{...art,previewFocus:art.previewFocus||artworkPresets[image]||{x:50,y:32,zoom:1},previewArtwork:undefined,previewBounds:undefined,localizedArtwork:undefined}} alt={title} locale={locale} serviceLocale={serviceArtworkLocale(entry!.region,entry!.gameId)} priority banner="version" onUnavailable={()=>setFailed(image)}/></div></>}
  <div className="version-hero-copy"><div className="version-hero-kicker"><img src={game.logo} alt=""/><span>{game.name[locale]}<small>{regionLabel(game,region,locale,t)}</small></span></div><div className="version-hero-meta"><span><UiText name="currentVersion">{t.currentVersion}</UiText></span>{entry?.version&&/^\d+(\.\d+)*$/.test(entry.version)&&<b>V{entry.version}</b>}{entry?.translatedLocales?.includes(locale)&&!entry.officialLocales?.includes(locale)&&<small><UiText name="translatedTitle">{t.translatedTitle}</UiText></small>}</div><h1 style={textAppearanceStyle(textAppearance(entry,locale),'title')}>{title}</h1>{entry?<button className="version-detail-button" onClick={()=>onOpen(entry)}><UiText name="more">{t.more}</UiText><ArrowUpRight size={17}/></button>:<p><UiText name="serverEmpty">{t.serverEmpty}</UiText></p>}{!image&&<span className="version-art-pending"><ImageOff size={16}/><UiText name="imagePending">{t.imagePending}</UiText></span>}</div>
  {editMode&&entry&&<button className="canvas-image-edit edit-chip" onClick={()=>openEditor({...editEntryTarget(entry),focus:'image'})}><Pencil size={14}/>{ownerUi[locale].editImage}</button>}{editMode&&entry&&<button className="version-edit edit-chip" onClick={()=>openEditor(editEntryTarget(entry))}><Pencil size={13}/><UiText name="currentVersion">{t.currentVersion}</UiText></button>}
 </section>{entry&&<EntryEdit entry={entry} locale={locale}/>}</div>;
}
