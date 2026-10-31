import {announcedCharacterPreview} from './roster-availability';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
import artwork from '../content/character-rosters/artwork-manifest.json' with {type:'json'};
import {retainCharacterFacts} from './roster-fact-retention';
export {retainCharacterFacts} from './roster-fact-retention';
import {pinRosterFactIcons} from './roster-detail-icons';
import {rosterArtUrl,type RosterArtPlacement} from './roster-art-framing';
import type {CharacterRoster,RosterCharacter} from './character-roster';
import {retainEndfieldRosterIcons} from './endfield-roster-icons';
import {retainEndfieldPotentialRewardArt} from './endfield-potential-reward-art';
import {withZzzSignatureWeapon} from './zzz-signature-weapons';
import {reviewedRosterName,reviewedRosterAdditions} from './reviewed-roster-names';

const snapshots=new Map((bootstrap as CharacterRoster[]).map(r=>[r.gameId,r]));
// Build once per isolate. Each read touches only this character's exact assets,
// instead of scanning every game's immutable manifest for every image/frame.
const characterArtwork=new Map<string,typeof artwork>();
for(const asset of artwork){const key=asset.gameId+'|'+asset.characterId;const rows=characterArtwork.get(key);if(rows)rows.push(asset);else characterArtwork.set(key,[asset]);}
const locales=['ko','en','ja','zh'] as const;
const fillCopy=(primary:RosterCharacter['name'],extra:RosterCharacter['name'])=>Object.fromEntries(locales.map(l=>[l,primary[l]||extra[l]])) as RosterCharacter['name'];
/** A pinned byte-identical original keeps its owner's exact framing on reads. */
export function pinRosterArtworkFrames(gameId:string,id:string,frames:RosterArtPlacement[]){
 const aliases=new Map((characterArtwork.get(gameId+'|'+id)||[]).map(a=>(a as {delivery?:string}).delivery==='source-original'?[rosterArtUrl(a.publicUrl),a.url]:[rosterArtUrl(a.url),a.publicUrl])),mapped=new Map<string,{row:RosterArtPlacement;direct:boolean}>();
 for(const row of frames){const url=aliases.get(rosterArtUrl(row.url))||row.url,key=rosterArtUrl(url),direct=url===row.url,old=mapped.get(key);if(!old||direct||!old.direct)mapped.set(key,{row:url===row.url?row:{...row,url},direct});}
 return [...mapped.values()].map(v=>v.row);
}
function invalidReversePanel(c:RosterCharacter){
 return c.stats?.some(s=>['hp','atk','reality_def','mental_def'].includes(s.id)&&(!Number.isFinite(Number(s.value))||Number(s.value)>100000||Number(s.value)<0))||false;
}
function cleanReverseStats(c:RosterCharacter):RosterCharacter{
 const number=(id:string)=>{const s=c.stats?.find(s=>s.id===id);return s?Number(s.value.replace('%','').trim()):NaN;};
 // A 0/0 critical pair in the source is a missing optional panel, not a
 // character with zero basic critical damage. Other valid facts remain.
 return number('crit_rate')===0&&number('crit_dmg')===0?{...c,stats:c.stats?.filter(s=>!['crit_rate','crit_dmg'].includes(s.id))}:c;
}
export function enrichCharacterRoster(data:CharacterRoster):CharacterRoster{
 const reference=snapshots.get(data.gameId);if(!reference)return data;
 const nativeSourceUrls=reference.sourceUrls;
 const nativeUpgrade=data.gameId==='arknights'&&!data.sourceVersion?.startsWith('arknights-native-sha256:');
 const known=new Map(reference.characters.map(raw=>{const c=data.gameId==='reverse1999'?cleanReverseStats(raw):raw;return [c.id,data.gameId==='reverse1999'&&invalidReversePanel(c)?{...c,stats:undefined}:c];}));
 const characters=data.characters.map(raw=>{
  let c=data.gameId==='reverse1999'?cleanReverseStats(raw):raw;
  if(data.gameId==='hsr'&&/^80(?:0[1-9]|10)$/.test(c.id)&&Object.values(c.name).some(v=>v.includes('{NICKNAME}'))){
   const path=c.traits?.find(t=>t.id==='path')?.value;const headings={ko:'개척자',en:'Trailblazer',ja:'開拓者',zh:'开拓者'};
   c={...c,name:{...c.name}};for(const l of locales)if(c.name[l].includes('{NICKNAME}'))c.name[l]=headings[l]+(path?.[l]?' · '+path[l]:'');
  }
  const reference=known.get(c.id),extra=data.gameId==='reverse1999'&&reference?cleanReverseStats(reference):reference;known.delete(c.id);
  // A bad upstream identity join can contaminate both the localized name and
  // the whole panel. Use only this exact source ID's valid reference facts.
  if(data.gameId==='reverse1999'&&invalidReversePanel(c))c={...c,...extra?{name:fillCopy(extra.name,c.name),nameSources:{...c.nameSources,...extra.nameSources}}:{},stats:extra?.stats};
  if(!extra)return c;
  if(data.gameId==='endfield')c=retainEndfieldPotentialRewardArt(retainEndfieldRosterIcons(c,extra),extra);
  const merged=retainCharacterFacts(c,extra);
  // Only this exact stable character's saved legacy original may be upgraded.
  // Unknown new source images and separate owner overrides keep their priority.
  if(['genshin','reverse1999','limbus','trickcal'].includes(data.gameId)){
   const knownLegacy=c.image&&extra.image&&c.image.url!==extra.image.url&&extra.images?.some(a=>a.url===c.image!.url);
   return knownLegacy?{...merged,image:extra.image}:merged;
  }
  if(data.gameId!=='arknights')return merged;
  // A stale persisted client mirror must not remove verified releases when a
  // current four-client reference supplies the same exact operator identity.
  const regions=[...new Set([...extra.regions||[],...c.regions||[]])];
  const legacy=c.image&&/^https:\/\/raw\.githubusercontent\.com\/Aceship\/Arknight-Images\/main\/characters\//.test(c.image.url);
  const image=legacy&&extra.image?extra.image:merged.image;
  const names={...merged.name},nameSources={...merged.nameSources};
  const clients={ko:['kr','kr'],en:['global','en'],ja:['jp','jp'],zh:['cn','cn']} as const;
  for(const locale of locales){const[service,client]=clients[locale],file=['char_1001_amiya2','char_1037_amiya3'].includes(c.id)?'char_patch_table':'character_table',url=`https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/${client}/gamedata/excel/${file}.json`;
   if(extra.regions?.includes(service)&&extra.name[locale]&&nativeSourceUrls.includes(url)&&(nativeUpgrade||c.nameSources?.[locale]?.kind==='translation')){names[locale]=extra.name[locale];nameSources[locale]={kind:'community',url};}
  }
  return {...merged,name:names,nameSources,...regions.length?{regions}:{},image,images:[...new Map([...(merged.images||[]),...legacy&&c.image?[{...c.image,locale:'neutral' as const}]:[]].filter(a=>a.url!==image?.url).map(a=>[a.url,a])).values()]};
 });
 characters.push(...known.values());characters.push(...reviewedRosterAdditions(data.gameId,characters));characters.sort((a,b)=>a.id.localeCompare(b.id,'en',{numeric:true}));
 const pin=(id:string,a:RosterCharacter['image'])=>{if(!a)return a;const saved=characterArtwork.get(data.gameId+'|'+id)?.find(s=>s.url===a.url&&(s as {delivery?:string}).delivery!=='source-original');return saved?{...a,url:saved.publicUrl}:a;};
 const pinned=characters.map(c=>pinRosterFactIcons({...c,image:pin(c.id,c.image),...(c.images?{images:c.images.map(a=>pin(c.id,a)!)}:{}),...c.artworkFrames?{artworkFrames:pinRosterArtworkFrames(data.gameId,c.id,c.artworkFrames)}:{}},data.gameId));
 const current=data.detailCatalog,prior=reference.detailCatalog;
 let detailCatalog=current||prior;
 if(current?.version===3&&prior?.version===3)detailCatalog={...current,forms:{...prior.forms,...current.forms}};
 if(current?.version===1&&prior?.version===1){
  const forms={...prior.forms,...Object.fromEntries(Object.entries(current.forms).map(([id,f])=>[id,{...prior.forms[id],...f,horseId:f.horseId||prior.forms[id]?.horseId}]))},allSkills={...prior.skills,...current.skills},refs=new Set(Object.values(forms).flatMap(f=>[...f.skillRefs||[],...Object.values(f.regionalSkillRefs||{}).flatMap(r=>r||[])]));
  detailCatalog={...current,forms,skills:Object.fromEntries([...refs].map(ref=>[ref,allSkills[ref]])),horses:{...prior.horses,...current.horses}};
 }
 return {...data,...nativeUpgrade?{sourceName:reference.sourceName,sourceVersion:reference.sourceVersion,checkedAt:reference.checkedAt}:{},...detailCatalog?{detailCatalog}:{},characters:pinned.map(c=>announcedCharacterPreview(reviewedRosterName(data.gameId,data.gameId==='zzz'?withZzzSignatureWeapon(c):c))),sourceUrls:[...new Set([...data.sourceUrls,...reference.sourceUrls])].slice(0,40),coverage:{...data.coverage,...nativeUpgrade?{nativeNameCounts:reference.coverage.nativeNameCounts,sourceReleaseFlags:reference.coverage.sourceReleaseFlags}:{},includedCount:characters.length}};
}
