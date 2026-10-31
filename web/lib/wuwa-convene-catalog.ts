import type {Entry} from './types';
import type {WuwaCharacter} from './wuwa-reference';
import type {ConveneCatalog,ConveneItem} from './wuwa-convene';
import {fullCharacterArt} from './wuwa-reference-art';
import weapons from '../content/wuwa-convene-weapons.json' with {type:'json'};
import nativeCards from '../content/wuwa-convene-character-cards.json' with {type:'json'};

const standard=['1104','1203','1301','1405','1503'];
const reviewed=['1312','1109','1509'];
const rateUps=['1504','1602','1202'];
const canonical=(s:string)=>s.normalize('NFKC').trim().toLowerCase();
const matches=(name:Entry['title'],c:WuwaCharacter)=>Object.keys(name).some(l=>name[l as keyof typeof name]&&c.name[l as keyof typeof name]&&canonical(name[l as keyof typeof name])===canonical(c.name[l as keyof typeof name]));
const key=(id:string)=>'character:'+id;
export function createWuwaConveneCatalog(entries:Entry[],characters:WuwaCharacter[],now:number):ConveneCatalog{
 const byId=new Map(characters.map(c=>[c.id,c]));
 const banners:ConveneCatalog['banners']=[];
 for(const id of reviewed){
  const c=byId.get(id);if(!c||c.rarity!==5)continue;
  // This first experiment supports the reviewed3.7 second-half rotation only.
  // Future pools must be checked rather than silently borrowing these items.
  const candidates=entries.filter(e=>e.gameId==='wuwa'&&e.region==='global'&&e.kind==='pickup'&&e.poolType!=='weapon'&&e.sourceKind==='official'&&e.startAt&&e.endAt&&e.startAt.slice(0,10)==='2026-10-22'&&e.endAt.slice(0,10)==='2026-11-11'&&Date.parse(e.startAt)<=now&&now<Date.parse(e.endAt)&&e.pickupMembers?.some(m=>m.role==='featured'&&m.rarity===5&&matches(m.name,c)));
  candidates.sort((a,b)=>Date.parse(b.verifiedAt||'')-Date.parse(a.verifiedAt||''));
  const e=candidates.find(e=>{const members=e.pickupMembers!.filter(m=>m.role==='rate-up'&&m.rarity===4);return members.length===3&&rateUps.every(id=>{const four=byId.get(id);return four?.rarity===4&&members.some(m=>matches(m.name,four));});});
  if(e)banners.push({id:e.id,featuredId:key(c.id),rateUpIds:rateUps.map(key),startAt:e.startAt!,endAt:e.endAt!,sourceUrl:e.sourceUrl});
 }
 const needed=new Set([...standard,...characters.filter(c=>c.rarity===4).map(c=>c.id),...reviewed]);
 const cards=nativeCards as Record<string,{url:string;width:number;height:number}>;
 const items:ConveneItem[]=characters.filter(c=>needed.has(c.id)).map(c=>{
  // Lumi's community full-splash is a fan illustration. Use her declared in-game standing art.
  const official=c.id==='1504'?cards['1504']:undefined;
  const art=official?{...official,sourceUrl:c.sourceUrl}:fullCharacterArt[c.id],portrait=c.portraits[0];
  return {id:key(c.id),kind:'character',rarity:c.rarity as 4|5,name:c.name,sourceUrl:art?.sourceUrl||c.sourceUrl,image:art?.url||portrait?.fullArtwork,icon:portrait?.icon,cardImage:cards[c.id]?.url,...art?{width:art.width,height:art.height,focus:'focus'in art?art.focus:undefined}:{},element:c.element.name,type:c.weapon.name};
 });
 for(const w of weapons.weapons)items.push({...w,id:'weapon:'+w.id,kind:'weapon',rarity:w.rarity as 3|4,image:w.icon,icon:w.icon,width:256,height:256});
 const result:ConveneCatalog={version:1,checkedAt:new Date(now).toISOString(),banners,items,standardFiveIds:standard.map(key),fourIds:items.filter(i=>i.rarity===4).map(i=>i.id),threeIds:items.filter(i=>i.rarity===3).map(i=>i.id),rulesSource:'https://wutheringwaves.kurogames.com/kr/main/news/detail/763',poolSources:[weapons.poolSourceUrl,weapons.sourceUrl,'https://wutheringwaves.kurogames.com/en/main/news/detail/5668']};
 if(!result.threeIds.length||!result.fourIds.some(id=>id.startsWith('weapon:'))||standard.some(id=>!byId.has(id)))throw Error('Incomplete reviewed convene pool');
 return result;
}
let saved:{until:number;value:ConveneCatalog}|undefined;
let inFlight:Promise<ConveneCatalog>|undefined;
export async function readWuwaConveneCatalog(now=Date.now()){
 if(saved&&now<saved.until)return saved.value;
 if(inFlight)return inFlight;
 inFlight=(async()=>{const [{readData},{readWuwaReference}]=await Promise.all([import('./store'),import('./wuwa-reference-store')]);const [catalog,reference]=await Promise.all([readData({index:true,gameId:'wuwa'}),readWuwaReference()]);const value=createWuwaConveneCatalog(catalog.entries,reference.data.characters,now);saved={value,until:Math.min(now+30_000,...value.banners.map(b=>Date.parse(b.endAt)))};return value;})();
 try{return await inFlight;}finally{inFlight=undefined;}
}
