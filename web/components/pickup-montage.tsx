'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import type {Entry,Locale} from '@/lib/types';
import {montageMembers,exactMontageCharacter} from '@/lib/pickup-montage';
import {rosterArts,type RosterCharacter} from '@/lib/character-roster';
import {cachedMontageDirectory,loadMontageDirectory} from '@/lib/pickup-montage-directory';
import {artworkForLocale,serviceArtworkLocale} from '@/lib/artwork';
import {useRosterArtFrame} from './use-roster-art-frame';
import {useAutomaticRosterFrame} from './use-automatic-roster-frame';
import {rosterGalleryFocus,reviewedRosterArtFrame} from '@/lib/roster-gallery-focus';
import ArtworkMedia from './artwork-media';
import ThumbnailImage from './thumbnail-image';
import {thumbnailRows} from '@/lib/thumbnail-framing';
import {pickupThumbnailHead,pickupThumbnailFrame,canUseRosterThumbnail} from '@/lib/pickup-thumbnail';
export default function PickupMontage({entry,locale,priority=false,thumbnail=false,fill=false,membersOverride}:{entry:Entry;locale:Locale;priority?:boolean;thumbnail?:boolean;fill?:boolean;membersOverride?:NonNullable<Entry['pickupMembers']>}){
 const members=membersOverride||montageMembers(entry),[rows,setRows]=useState<{gameId:string;characters:RosterCharacter[]} | undefined>(()=>cachedMontageDirectory(entry.gameId)),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),ref=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  if(!members.length||entry.gameId==='wuwa')return;
  const node=ref.current;if(!node)return;let stopped=false,started=false;
  const load=()=>{if(started)return;started=true;setFailed(false);void loadMontageDirectory(entry.gameId).then(data=>{if(!stopped)setRows(data);}).catch(()=>{if(!stopped)setFailed(true);});};
  const observer=typeof IntersectionObserver==='undefined'?undefined:new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){load();observer?.disconnect();}},{rootMargin:'180px'});
  if(observer)observer.observe(node);else load();return()=>{stopped=true;observer?.disconnect();};
 },[entry.gameId,members.length,attempt,fill,locale]);
 const sourceRows=rows?.gameId===entry.gameId?rows.characters:[];
 if(fill){let offset=0;return <span ref={ref} className="pickup-montage is-filled" data-candidates={members.length} aria-label={entry.title[locale]}>{thumbnailRows(members.length).map((count,row)=>{const rowMembers=members.slice(offset,offset+count);offset+=count;return <span className="thumbnail-montage-row" key={row}>{rowMembers.map((member,i)=>{const native=artworkForLocale(member,locale,'full',serviceArtworkLocale(entry.region,entry.gameId)),character=exactMontageCharacter(member.name,sourceRows,entry.region),roster=character&&rosterArts(character,locale,entry.region)[0],preferRoster=!!roster&&canUseRosterThumbnail(member,locale,serviceArtworkLocale(entry.region,entry.gameId)),art=preferRoster?{image:roster!.url,imageSource:roster!.sourceUrl}:native;return <span className="thumbnail-montage-panel" key={Object.values(member.name).join('|')}>
 {art.image?<ThumbnailImage src={art.image} alt={member.name[locale]||member.name.en} head={pickupThumbnailHead(entry.gameId,art)} focus={'previewFocus' in art?art.previewFocus:undefined} frame={pickupThumbnailFrame(art)} priority={priority&&row===0&&i<5}/>:<span className="pickup-montage-wait"/>}
 {members.length<=3&&<small className="thumbnail-member-name">{member.name[locale]||member.name.en}</small>}</span>;})}</span>;})}</span>;}

 return <span ref={ref} className={'pickup-montage'+(!thumbnail&&members.length>6?' is-scrollable':'')+(thumbnail?' is-thumbnail':'')} style={{'--montage-count':members.length} as CSSProperties} aria-label={entry.title[locale]}>
  {members.map((member,i)=>{const native=artworkForLocale(member,locale,'preview',serviceArtworkLocale(entry.region,entry.gameId)),character=exactMontageCharacter(member.name,sourceRows,entry.region),art=character&&rosterArts(character,locale,entry.region)[0];return <span className="pickup-montage-panel" key={Object.values(member.name).join('|')}>
   {art&&character?<MontageImage art={art} character={character} gameId={entry.gameId} name={member.name[locale]} priority={priority&&i<5}/>:native.image?<ArtworkMedia art={member} locale={locale} serviceLocale={serviceArtworkLocale(entry.region,entry.gameId)} alt={member.name[locale]} priority={priority&&i<5}/>:<span className="pickup-montage-wait" aria-hidden="true"/>}
   {!thumbnail&&<span className="pickup-montage-name">{member.name[locale]||member.name.en}</span>}
  </span>;})}
  {failed&&!thumbnail&&<button className="montage-retry" onClick={e=>{e.stopPropagation();setAttempt(n=>n+1);}}>{({ko:'이미지 다시 불러오기',en:'Retry artwork',ja:'画像を再読み込み',zh:'重新加载图片'})[locale]}</button>}
 </span>;
}
function MontageImage({art,character,gameId,name,priority}:{art:NonNullable<RosterCharacter['image']>;character:RosterCharacter;gameId:string;name:string;priority:boolean}){
 const ref=useRef<HTMLImageElement>(null),manual=reviewedRosterArtFrame(gameId,character.artworkFrames,art.url,'gallery'),placement=useRosterArtFrame(ref,art.url,manual),automatic=useAutomaticRosterFrame(ref,art.url,art.kind,!!manual,true,rosterGalleryFocus(gameId,art.url)),[failed,setFailed]=useState(false);
 if(failed)return <span className="pickup-montage-wait"/>;
 return <img ref={ref} src={art.url} alt={name} width={art.width} height={art.height} style={placement.style||automatic.style} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} decoding="async" referrerPolicy="no-referrer" onLoad={()=>{placement.measure();automatic.measure();}} onError={()=>setFailed(true)}/>;
}
