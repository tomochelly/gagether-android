import reviewed from '../content/reviewed-pickup-artwork.json' with {type:'json'};
import type {ArtworkAsset,EntityArtwork,Entry,ImageFrame,ImageFraming,Localized,PreviewBounds} from './types';
import {frameGeometry} from './image-framing';

type Rule={entryId:string;gameId:string;region:string;sourceUrl:string;name:Partial<Localized>;previous:{image:string;imageSource:string}[];fillMissing?:boolean;asset:ArtworkAsset;assetSourceKind?:'official'|'community';head:PreviewBounds;sha256:string};
const rules=reviewed.rules as Rule[];
const defaultFrameObjects=new WeakMap<ImageFrame,{head:PreviewBounds;kind:'banner'|'card'|'mobile'}>();
const artworkFields=new Set(['image','imageSource','imageVerified','imageKind','imageLocale','imageCaption','imageFraming','previewFocus','previewBounds','previewArtwork','imageFit','imagePosition','localizedArtwork','textFreePreview','originalLanguageFallback','pickupMembers']);
function artworkEdited(entry:Entry){return entry.editor?.fields.some(field=>artworkFields.has(field.split('.')[0]));}
const exactName=(name:Localized|undefined,rule:Rule)=>!!name&&Object.entries(rule.name).every(([locale,value])=>name[locale as keyof Localized]===value);
const oldSource=(art:EntityArtwork,rule:Rule)=>art.imageVerified===true&&rule.previous.some(old=>old.image===art.image&&old.imageSource===art.imageSource);
const trulyMissing=(art:EntityArtwork)=>art.image===undefined&&art.imageVerified===undefined;

/** Reviewed head envelopes define defaults, never owner placement or destructive crops. */
function defaultFrames(rule:Rule):ImageFraming{
 const {width,height}=rule.asset,head=rule.head;
 function frame(box:{width:number;height:number},anchorX:number,headHeight:number,anchorY:number):ImageFrame{
  const headWidth=width*(head.right-head.left)/100,headPixels=height*(head.bottom-head.top)/100;
  const scale=Math.min(box.height*headHeight/headPixels,box.width*(anchorX>.5?.43:.88)/headWidth,1);
  const left=box.width*anchorX-width*(head.left+head.right)/200*scale;
  const top=Math.max(0,box.height*anchorY-height*(head.bottom-head.top)/200*scale)-height*head.top/100*scale;
  return {fit:'contain',zoom:scale/Math.min(box.width/width,box.height/height),x:(left+width*scale/2)/box.width*100,y:(top+height*scale/2)/box.height*100};
 }
 const frames={banner:frame({width:1200,height:620},.73,.50,.25),card:frame({width:350,height:420},.5,.52,.29),mobile:frame({width:390,height:320},.5,.56,.30)};
 for(const [kind,value]of Object.entries(frames))defaultFrameObjects.set(value,{head,kind:kind as 'banner'|'card'|'mobile'});
 return frames;
}

/** Only newly generated exact-source defaults qualify; saved owner frames never do. */
export function isReviewedPickupDefaultFrame(art:EntityArtwork,frame:ImageFrame|undefined):frame is ImageFrame{
 return !!frame&&defaultFrameObjects.has(frame)&&rules.some(rule=>rule.asset.image===art.image&&rule.asset.imageSource===art.imageSource);
}
/** Exact-source face envelope for pickup thumbnails; never change the saved original or placement. */
export function reviewedPickupHead(art:EntityArtwork){const rule=rules.find(rule=>rule.asset.image===art.image&&rule.asset.imageSource===art.imageSource);return rule?{...rule.head,width:rule.asset.width,height:rule.asset.height}:undefined;}
export function reviewedPickupFrameGeometry(art:EntityArtwork,image:{width:number;height:number},box:{width:number;height:number},frame:ImageFrame,pixelRatio=1){
 const geometry=frameGeometry(image,box,frame,pixelRatio);
 if(!isReviewedPickupDefaultFrame(art,frame))return geometry;
 const {head,kind}=defaultFrameObjects.get(frame)!,wideThumbnail=kind==='card'&&box.width/box.height>=1.15;
 const anchorX=kind==='banner'?.73:.5,anchorY=kind==='banner'?.25:kind==='mobile'?.30:wideThumbnail?.44:.29;
 const headHeight=kind==='banner'?.50:kind==='mobile'?.56:wideThumbnail?.80:.52;
 const headWidth=image.width*(head.right-head.left)/100,headPixels=image.height*(head.bottom-head.top)/100;
 const scale=Math.min(box.height*headHeight/headPixels,box.width*(anchorX>.5?.43:.88)/headWidth,1/Math.max(1,pixelRatio)),width=image.width*scale,height=image.height*scale;
 const left=box.width*anchorX-width*(head.left+head.right)/200,top=Math.max(0,box.height*anchorY-height*(head.bottom-head.top)/200)-height*head.top/100;
 return {...geometry,width,height,left,top,limited:false};
}

function replace<T extends EntityArtwork>(base:T,rule:Rule):T{
 if(!(rule.fillMissing?trulyMissing(base):oldSource(base,rule)))return base;
 // A registered slot, including a clear, is handled independently below.
 return {...base,...rule.asset,previewArtwork:undefined,previewBounds:undefined,previewFocus:undefined,imagePosition:undefined,imageFit:'contain',textFreePreview:true,originalLanguageFallback:false,imageFraming:base.imageFraming||defaultFrames(rule)};
}
function replaceSlots<T extends EntityArtwork>(base:T,rule:Rule):T{
 let next=replace(base,rule),localized=base.localizedArtwork;
 if(localized){
  let changed=false;const slots={...localized};
  for(const locale of ['ko','en','ja','zh'] as const){const slot=localized[locale];if(!slot)continue;
   // An explicit empty/unverified locale remains authoritative over a root fill.
   const replacement=rule.fillMissing?slot:replace(slot,rule);if(replacement!==slot){slots[locale]=replacement;changed=true;}
  }
  if(changed)next={...next,localizedArtwork:slots};
 }
 return next;
}

/** Exact source/rotation/outfit projection for pickup previews only. Never persist it. */
export function reviewedPickupArtwork(entry:Entry):Entry{
 if(!entry||!entry.id||!entry.gameId||entry.kind!=='pickup'&&!(entry.id==='review-umamusume-jp-20261026-support'&&entry.kind==='weapon'&&entry.poolType==='support'))return entry;
 let result=entry;
 if(!artworkEdited(entry)){
  const applicable=rules.filter(rule=>rule.entryId===entry.id&&rule.gameId===entry.gameId&&rule.region===entry.region&&rule.sourceUrl===entry.sourceUrl);
  if(applicable.length){
   const changedRules=new Set<Rule>();
   const members=entry.pickupMembers?.map(member=>{
    const rule=applicable.find(candidate=>exactName(member.name,candidate));if(!rule)return member;
    const next=replaceSlots(member,rule);if(next!==member)changedRules.add(rule);return next;
   });
   const featured=entry.pickupMembers?.filter(member=>member.role!=='rate-up'&&member.role!=='candidate');
   const rootName=featured?.length===1?featured[0].name:entry.title,rootRule=applicable.find(rule=>exactName(rootName,rule));
   let root=rootRule?replaceSlots(entry,rootRule):entry;if(root!==entry&&rootRule)changedRules.add(rootRule);
   if(changedRules.size){
    const related=[...entry.relatedSources||[]];
    for(const rule of changedRules)for(const [url,title]of [[rule.asset.imageSource,'Reviewed pickup illustration'],...rule.previous.map(old=>[old.image,'Previous complete image original'])])if(!related.some(source=>source.url===url))related.push({kind:url===rule.asset.imageSource&&rule.assetSourceKind?rule.assetSourceKind:['umamusume','hi3'].includes(rule.gameId)?'official':'community',url,title});
    result={...root,...members?{pickupMembers:members}:{},relatedSources:related};
   }
  }
 }
 if(reviewedPickupGroupFallback(entry)&&entry.image===groupPosterOriginal){
  const poster:ArtworkAsset={image:groupPosterImage,imageSource:entry.sourceUrl,imageVerified:true,imageKind:'banner',imageLocale:'ja',width:936,height:228,verifiedAt:'2026-10-30T00:00:00Z',imageCaption:{ko:'동일 회차의 공식 일본어 서포트 카드 모집 배너 전체입니다. 개별 카드 원화가 아닌 단체 모집 그림입니다.',en:'Complete official Japanese support scout banner for this rotation; group announcement artwork, not separate card illustrations.',ja:'同じ開催回の公式サポートカードガチャ全体バナー。個別カード原画ではなく募集告知画像です。',zh:'本轮官方日文支援卡招募完整横幅，为整组招募公告图，不是各张卡片的独立原画。'}};
  result={...result,...poster,previewArtwork:undefined,previewBounds:undefined,textFreePreview:false,relatedSources:[...result.relatedSources||[],{kind:'official',url:groupPosterOriginal,title:'Previous complete notice image original'}]};
 }
 // Keep the known native costume label when the source's English variant is None.
 if(entry.id==='review-umamusume-jp-20261026-daiwa'&&entry.gameId==='umamusume'&&entry.region==='jp'&&entry.sourceUrl==='https://umamusume.jp/news/detail?id=3511'&&entry.image==='https://media.gametora.com/umamusume/characters/render/trainee/idle/100903.png'&&entry.imageSource==='https://gametora.com/umamusume/characters/100903-daiwa-scarlet'&&!entry.editor?.fields.some(field=>field==='title'||field.startsWith('title.')||field==='pickupMembers'||field.startsWith('pickupMembers.'))){
  const clean=(name:Localized)=>name.en==='Daiwa Scarlet [None]'&&name.ja==='ダイワスカーレット [陣風の花紺青]'?{...name,en:'Daiwa Scarlet [陣風の花紺青]'}:name;
  const title=clean(result.title),members=result.pickupMembers?.map(member=>{const name=clean(member.name);return name===member.name?member:{...member,name};});
  if(title!==result.title||members?.some((member,i)=>member!==result.pickupMembers?.[i]))result={...result,title,...members?{pickupMembers:members}:{}};
 }
 return result;
}

/** This exact multi-card notice has a verified group poster, not three card originals. */
const groupPosterOriginal='https://prd-info-umamusume.akamaized.net/announce/3511/Header/announce_banner_3478.png?c=20261020173925';
const groupPosterImage='https://prd-info-umamusume.akamaized.net/announce/3511/Header/gacha_banner_30479.png?c=20261020173925';
export function reviewedPickupGroupFallback(entry:Entry){
 if(entry.id!=='review-umamusume-jp-20261026-support'||entry.gameId!=='umamusume'||entry.region!=='jp'||entry.kind!=='weapon'||entry.poolType!=='support'||entry.sourceUrl!=='https://umamusume.jp/news/detail?id=3511'||artworkEdited(entry))return false;
 if(![groupPosterOriginal,groupPosterImage].includes(entry.image||'')||entry.imageSource!==entry.sourceUrl||entry.imageVerified!==true||entry.imageLocale!=='ja')return false;
 const names=['[いとどめでたき、まつりかな]吾妻','[Time of Departure]マヤノトップガン','[巫女]吾妻'],members=entry.pickupMembers;
 return members?.length===3&&members.every((member,i)=>member.name.ja===names[i]&&member.role==='featured'&&trulyMissing(member)&&!member.localizedArtwork);
}

/** Kept separate from codex framing; useful for pickup-only validation. */
export const reviewedPickupArtworkRules:readonly Rule[]=rules;
