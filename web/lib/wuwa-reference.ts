import type {RosterArtPlacement} from './roster-art-framing';
import growth from '../content/wuwa-character-growth.json' with {type:'json'};
import {fullCharacterArt,declaredFullArtwork} from './wuwa-reference-art';
import type {Locale,Localized} from './types';

export type WuwaReferencePart='characters'|'combat'|'statistics';
export type WuwaIconFact={id:number;name:Localized;icon?:string};
export type WuwaStats={hp:number;atk:number;def:number;crit:number;critDamage:number};
export type WuwaCharacter={artworkFrames?:RosterArtPlacement[];id:string;sourceIds:number[];name:Localized;rarity:number;element:WuwaIconFact;weapon:WuwaIconFact;portraits:{id:number;icon?:string;artwork?:string;fullArtwork?:string}[];tags:{name:Localized;icon?:string}[];stats:WuwaStats;stats90?:WuwaStats;skills:{id:number;type:number;name:Localized;icon?:string;values:{name:Localized;levels:string[]}[]}[];chains:{id:number;name:Localized;description?:Localized;icon?:string}[];debut?:{date:string;sourceUrl:string;sourceKind:'official'|'community'};sourceUrl:string};
export type WuwaEnemy={id:string;name:Localized;icon?:string;elements:number[];level?:number;count?:number;wave?:number;resistanceTags?:Localized[]};
export type WuwaFloor={id:string;area:number;floor:number;name:Localized;recommendedElements:number[];enemies:WuwaEnemy[];buffs:{name:Localized;text:Localized;icon?:string}[]};
export type WuwaCombatCycle={id:string;modeId:string;name:Localized;startDate:string|null;endDate:string|null;conditions?:Localized;floors:WuwaFloor[];sourceUrl:string};
export type WuwaStatisticsSource={name:string;url:string;metrics:string[];scope:Localized;access:'public-page'|'restricted-details';checkedAt:string};
export type WuwaReference={version:1;gameId:'wuwa';service:'global';sourceVersion:string;updatedAt:string;characters:WuwaCharacter[];cycles:WuwaCombatCycle[];statistics:{available:false;sources:WuwaStatisticsSource[]};sources:{name:string;url:string;kind:'community';checkedAt:string}[];coverage:{characterForms:number;sourceCharacters:number;debutDates:number;combatCycles:number;notes:Localized}};
const langs={ko:'ko',en:'en',ja:'ja',zh:'zh-Hans'} as const;
export const wuwaText=(value:any):Localized=>Object.fromEntries(Object.entries(langs).map(([l,k])=>[l,plainText(value?.[k]||'')])) as Localized;
export function plainText(value:unknown,max=2000){return typeof value==='string'?value.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim().slice(0,max):'';}
export const localText=(ko:string,en:string,ja:string,zh:string):Localized=>({ko,en,ja,zh});
const assetRoot='https://raw.githubusercontent.com/DommyMM/wuwabuild/main/public';
/** Only the source's fixed, public game-asset directory is accepted. */
export function wuwaBuildAsset(value:unknown){return typeof value==='string'&&/^\/assets\/UIResources\/[A-Za-z0-9_./-]+\.(?:webp|png)$/.test(value)&&!value.includes('..')?assetRoot+value:undefined;}
export function wuwaUnrealAsset(value:unknown){if(typeof value!=='string'||!value.startsWith('/Game/Aki/UI/UIResources/'))return undefined;return wuwaBuildAsset('/assets/UIResources/'+value.slice('/Game/Aki/UI/UIResources/'.length).split('.')[0]+'.webp');}
/** This is the independent provider's published public frontend asset resolver. */
export function wuwaWutherAsset(value:unknown){if(typeof value!=='string'||!/^\/Game\/Aki\/UI\/UIResources\/[A-Za-z0-9_./-]+$/.test(value)||value.includes('..'))return undefined;let path=value.slice('/Game/Aki'.length).replace(/\/([^/]+)\.\1$/,'/$1.png');if(!/\.(png|webp|jpg)$/i.test(path))path+='.png';return 'https://wutherin.cn-nb1.rains3.com'+path.replace(/\.(png|jpg)$/i,'.webp');}
export function wuwaPublicAsset(value:unknown){if(typeof value!=='string')return undefined;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&['wutherin.cn-nb1.rains3.com','raw.githubusercontent.com'].includes(u.hostname)?u.href:undefined;}catch{return undefined;}}
/** Source curves are scaled by10000; integer panels truncate, without equipment/tree/sequence bonuses. */
export function wuwaLevel90Stats(stats:WuwaStats,curve:{HP:number;ATK:number;DEF:number}=growth.CHARACTER_CURVE['90']):WuwaStats{
 if(Object.values(stats).some(n=>!Number.isFinite(n)||n<0)||!curve||[curve.HP,curve.ATK,curve.DEF].some(n=>!Number.isFinite(n)||n<10000||n>300000))throw Error('Invalid character growth curve');
 return {hp:Math.floor(stats.hp*curve.HP/10000),atk:Math.floor(stats.atk*curve.ATK/10000),def:Math.floor(stats.def*curve.DEF/10000),crit:stats.crit,critDamage:stats.critDamage};
}
/** Native source markup and parameter placeholders become inert, readable plain text. */
export function wuwaChainDescription(value:any,params:unknown[]=[]):Localized{
 return Object.fromEntries(Object.entries(langs).map(([locale,key])=>{const text=typeof value?.[key]==='string'?value[key]:'';return [locale,plainText(text.replace(/\{(\d+)(?::[^}]*)?\}/g,(_:string,n:string)=>typeof params[Number(n)]==='string'?params[Number(n)] as string:'{'+n+'}'),12000)]})) as Localized;
}
const rovers=new Map([[1501,'rover-spectro'],[1502,'rover-spectro'],[1604,'rover-havoc'],[1605,'rover-havoc'],[1406,'rover-aero'],[1408,'rover-aero'],[1309,'rover-electro'],[1310,'rover-electro']]);
export function normalizeWuwaCharacters(rows:any[],releases:any[],disabled:number[]=[],fullSplashes:Record<string,string>={},curve90:{HP:number;ATK:number;DEF:number}=growth.CHARACTER_CURVE['90']):WuwaCharacter[]{
 if(!Array.isArray(rows)||rows.length<30||rows.length>200)throw Error('Character inventory is incomplete or invalid');
 const output=new Map<string,WuwaCharacter>(),seen=new Set<number>();
 for(const row of rows){
  if(!Number.isInteger(row.id)||seen.has(row.id)||![4,5].includes(row.rarity?.id))throw Error('Invalid or duplicate resonator ID');seen.add(row.id);if(disabled.includes(row.id))continue;
  const name=wuwaText(row.name);if(Object.values(name).some(v=>!v||/^\d+$/.test(v)))throw Error('Missing native character name');
  const id=rovers.get(row.id)||String(row.id),prior=output.get(id);
  if(prior){prior.sourceIds.push(row.id);prior.portraits.push({id:row.id,icon:wuwaBuildAsset(row.icon?.iconRound),artwork:wuwaBuildAsset(row.icon?.banner),fullArtwork:fullCharacterArt[String(row.id)]?.originalUrl||declaredFullArtwork(fullSplashes[String(row.id)])});continue;}
  const releaseName=rovers.has(row.id)?'Rover-'+row.element.name.en:row.name.en;
  const release=releases.find(r=>r.nameEn===releaseName),date=release?.date;
  const element={id:row.element.id,name:wuwaText(row.element.name),icon:wuwaBuildAsset(row.element.icon?.['1'])};
  if(rovers.has(row.id))for(const l of Object.keys(langs) as Locale[])name[l]=({ko:'방랑자',en:'Rover',ja:'漂泊者',zh:'漂泊者'})[l]+' · '+element.name[l];
  const stats={hp:Number(row.stats?.life),atk:Number(row.stats?.atk),def:Number(row.stats?.def),crit:Number(row.stats?.crit),critDamage:Number(row.stats?.critDamage)};
  if(Object.values(stats).some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid level-one base stats');
  const sourceUrl='https://wuwa.build/characters/'+row.id;
  output.set(id,{id,sourceIds:[row.id],name,rarity:row.rarity.id,element,weapon:{id:row.weapon.id,name:wuwaText(row.weapon.name),icon:wuwaBuildAsset(row.weapon.icon)},portraits:[{id:row.id,icon:wuwaBuildAsset(row.icon?.iconRound),artwork:wuwaBuildAsset(row.icon?.banner),fullArtwork:fullCharacterArt[String(row.id)]?.originalUrl||declaredFullArtwork(fullSplashes[String(row.id)])}],tags:(row.tags||[]).map((t:any)=>({name:wuwaText(t.name),icon:wuwaBuildAsset(t.icon)})),stats,stats90:wuwaLevel90Stats(stats,curve90),skills:(row.moves||[]).map((m:any)=>({id:m.id,type:m.type,name:wuwaText(m.name),icon:wuwaBuildAsset(row.skillIcons?.[({1:'normal-attack',2:'skill',3:'liberation',4:'intro',5:'circuit',6:'outro'} as Record<number,string>)[m.type]]),values:(m.values||[]).map((v:any)=>({name:wuwaText(v.name),levels:(v.values||[]).map((x:unknown)=>plainText(x,150))}))})),chains:(row.chains||[]).map((c:any)=>({id:c.id,name:wuwaText(c.name),description:wuwaChainDescription(c.description,c.param),icon:wuwaBuildAsset(c.icon)})),...(typeof date==='string'&&/^\d{4}-\d\d-\d\d$/.test(date)?{debut:{date,sourceUrl:release.sourceUrl,sourceKind:release.sourceKind==='official'?'official' as const:'community' as const}}:{}),sourceUrl});
 }
 return [...output.values()].sort((a,b)=>a.id.localeCompare(b.id,'en',{numeric:true}));
}
export function wuwaCycleState(cycle:Pick<WuwaCombatCycle,'startDate'|'endDate'>,date:string){return cycle.startDate&&cycle.startDate>date?'upcoming':cycle.endDate&&cycle.endDate<=date?'past':cycle.startDate&&cycle.startDate<=date&&cycle.endDate&&date<cycle.endDate?'current':'archive';}
/** Select by published calendar bounds, never by largest configured season ID. */
export function currentWuwaCycles(cycles:WuwaCombatCycle[],date:string){return cycles.filter(c=>wuwaCycleState(c,date)==='current');}
export function normalizeWutherTower(data:Record<Locale,any>):WuwaCombatCycle{
 const ko=data.ko,number=String(ko?.SeasonInfo?.Id);if(!/^\d+$/.test(number)||!/^\d{4}-\d\d-\d\d$/.test(ko.Begin)||!/^\d{4}-\d\d-\d\d$/.test(ko.End))throw Error('Invalid tower period');
 for(const locale of Object.keys(langs) as Locale[])if(data[locale]?.Begin!==ko.Begin||data[locale]?.End!==ko.End||String(data[locale]?.SeasonInfo?.Id)!==number)throw Error('Localized tower periods differ');
 const floors:WuwaFloor[]=[];
 const text=(fn:(d:any)=>unknown)=>Object.fromEntries((Object.keys(langs) as Locale[]).map(l=>[l,plainText(fn(data[l]))])) as Localized;
 for(const [area,a] of Object.entries(ko.Area||{}) as [string,any][])for(const [floor,f] of Object.entries(a.Floor||{}) as [string,any][]){
  const at=(d:any)=>d.Area?.[area]?.Floor?.[floor];
  for(const l of Object.keys(langs) as Locale[])if(!at(data[l])||JSON.stringify(Object.keys(at(data[l]).Monsters||{}).sort())!==JSON.stringify(Object.keys(f.Monsters||{}).sort()))throw Error('Localized enemy roster differs');
  const enemies=(f.MonsterOrder||Object.keys(f.Monsters||{})).map((id:number|string)=>{const row=f.Monsters[String(id)];if(!row)throw Error('Enemy reference is missing');return {id:String(id),name:text(d=>at(d).Monsters[String(id)]?.Name),icon:wuwaWutherAsset(row.Icon),elements:Array.isArray(row.ElementArray)?row.ElementArray.filter((v:unknown)=>Number.isInteger(v)):[],...(Number.isFinite(row.Level)&&row.Level>0?{level:row.Level}:{})};});
  floors.push({id:String(f.Id),area:Number(area),floor:Number(floor),name:text(d=>at(d).AreaName),recommendedElements:f.RecommendElement||[],enemies,buffs:Object.entries(f.Buffs||{}).map(([id,b]:[string,any])=>({name:text(d=>at(d).Buffs?.[id]?.Name),text:text(d=>at(d).Buffs?.[id]?.Desc),icon:wuwaWutherAsset(b.Icon)}))});
 }
 if(!floors.length||floors.some(f=>!f.enemies.length))throw Error('Empty tower floor roster');
 return {id:'tower-of-adversity:'+number,modeId:'tower-of-adversity',name:localText('역경의 탑 · 시즌 '+number,'Tower of Adversity · Season '+number,'逆境深塔 · シーズン'+number,'逆境深塔 · 第'+number+'期'),startDate:ko.Begin,endDate:ko.End,floors,sourceUrl:'https://wuther.in/ko/toa/'};
}
export function normalizeWutherSlash(data:Record<Locale,any>):WuwaCombatCycle{
 const ko=data.ko,number=String(ko?.SeasonInfo?.Id);if(!/^\d+$/.test(number)||!/^\d{4}-\d\d-\d\d$/.test(ko.Begin)||!/^\d{4}-\d\d-\d\d$/.test(ko.End))throw Error('Invalid wastes period');
 for(const l of Object.keys(langs) as Locale[])if(data[l]?.Begin!==ko.Begin||data[l]?.End!==ko.End||String(data[l]?.SeasonInfo?.Id)!==number)throw Error('Localized wastes periods differ');
 const text=(fn:(d:any)=>unknown)=>Object.fromEntries((Object.keys(langs) as Locale[]).map(l=>[l,plainText(fn(data[l]))])) as Localized;
 const floors:WuwaFloor[]=[];
 for(const [area,a] of Object.entries(ko.Id||{}) as [string,any][])for(const [n,[floor,f]] of Object.entries(a.Floor||{}).entries() as any){
  const at=(d:any)=>d.Id?.[area]?.Floor?.[floor];
  for(const l of Object.keys(langs) as Locale[])if(!at(data[l])||JSON.stringify(Object.keys(at(data[l]).Monsters||{}).sort())!==JSON.stringify(Object.keys(f.Monsters||{}).sort()))throw Error('Localized wastes enemies differ');
  floors.push({id:String(floor),area:Number(area),floor:Number(n)+1,name:text(d=>d.Id[area].Title),recommendedElements:[],enemies:Object.entries(f.Monsters||{}).map(([id,m]:[string,any])=>({id,name:text(d=>at(d).Monsters[id].Name),icon:wuwaWutherAsset(m.Icon),elements:m.ElementArray||[],...(m.Level>0?{level:m.Level}:{})})),buffs:[{name:localText('구역 효과','Area effect','エリア効果','区域效果'),text:text(d=>d.Id[area].Desc)},{name:localText('편성 효과','Team effect','編成効果','编队效果'),text:text(d=>at(d).Desc)},...Object.entries(f.Buffs||{}).map(([id,b]:[string,any])=>({name:text(d=>at(d).Buffs?.[id]?.Name),text:text(d=>at(d).Buffs?.[id]?.Desc),icon:wuwaWutherAsset(b.Icon)}))].filter(b=>Object.values(b.text).some(Boolean))});
 }
 if(!floors.length)throw Error('Empty wastes stages');
 return {id:'whimpering-wastes:'+number,modeId:'whimpering-wastes',name:localText('죽음의 노래와 바닷속 폐허 · '+number,'Whimpering Wastes · '+number,'死の歌が纏う海の廃墟 · '+number,'冥歌海墟 · '+number),startDate:ko.Begin,endDate:ko.End,floors,sourceUrl:'https://wuther.in/ko/whiwa/'};
}
export function normalizeWutherMatrix(data:Record<Locale,any>):WuwaCombatCycle{
 const ko=data.ko,number=String(ko?.CycleId);if(!/^\d+$/.test(number)||!Array.isArray(ko.Levels)||!ko.Levels.length)throw Error('Invalid matrix cycle');
 for(const l of Object.keys(langs) as Locale[])if(String(data[l]?.CycleId)!==number||data[l]?.Levels?.length!==ko.Levels.length)throw Error('Localized matrix cycles differ');
 const text=(fn:(d:any)=>unknown)=>Object.fromEntries((Object.keys(langs) as Locale[]).map(l=>[l,plainText(fn(data[l]))])) as Localized;
 const floors:WuwaFloor[]=ko.Levels.map((f:any,i:number)=>{const at=(d:any)=>d.Levels[i];for(const l of Object.keys(langs) as Locale[])if(String(at(data[l]).Id)!==String(f.Id)||at(data[l]).Waves.length!==f.Waves.length)throw Error('Localized matrix waves differ');return {id:String(f.Id),area:i+1,floor:1,name:text(d=>at(d).Name),recommendedElements:[],enemies:(f.Waves||[]).map((m:any,w:number)=>({id:String(m.MonsterId)+':'+m.Id,name:text(d=>at(d).Waves[w].Name),icon:wuwaWutherAsset(m.Icon),elements:m.ElementArray||[],wave:m.Wave,resistanceTags:(m.TagIds||[]).filter((id:number)=>(ko.Tags||[]).some((t:any)=>t.Id===id)).map((id:number)=>text(d=>d.Tags.find((t:any)=>t.Id===id)?.Name))})),buffs:(f.SelectableBuffIds||[]).filter((id:number)=>ko.Buffs.some((b:any)=>b.Id===id)).map((id:number)=>({name:text(d=>d.Buffs.find((b:any)=>b.Id===id)?.Name),text:text(d=>d.Buffs.find((b:any)=>b.Id===id)?.Desc),icon:wuwaWutherAsset(ko.Buffs.find((b:any)=>b.Id===id)?.Icon)}))};});
 return {id:'endstate-matrix:'+number,modeId:'endstate-matrix',name:text(d=>d.Name+' · '+d.StageName),startDate:null,endDate:null,conditions:text(d=>d.EntryCondition?.HintText),floors,sourceUrl:'https://wuther.in/ko/matrix/'};
}
export function validateWuwaCharacter(c:WuwaCharacter){if(!c.id||![4,5].includes(c.rarity)||!Array.isArray(c.sourceIds)||!c.sourceIds.length||!c.stats||Object.values(c.stats).some(n=>!Number.isFinite(n)||n<0)||(c.stats90&&Object.values(c.stats90).some(n=>!Number.isFinite(n)||n<0))||!Array.isArray(c.skills)||!Array.isArray(c.chains)||!Array.isArray(c.portraits)||(Object.keys(langs) as Locale[]).some(l=>!c.name?.[l]||!c.element?.name?.[l]||!c.weapon?.name?.[l]))throw Error('Invalid resonator identity or base stats');return c;}
export function validateWuwaReference(data:WuwaReference){
 if(!data||data.version!==1||data.gameId!=='wuwa'||data.service!=='global'||!Array.isArray(data.characters)||!data.characters.length||!Array.isArray(data.cycles)||new Set(data.characters.map(c=>c.id)).size!==data.characters.length)throw Error('Invalid reference snapshot');
 for(const c of data.characters)validateWuwaCharacter(c);
 if(!data.coverage||data.coverage.characterForms!==data.characters.length||typeof data.sourceVersion!=='string'||!data.updatedAt||!Array.isArray(data.sources)||!data.sources.length)throw Error('Invalid snapshot coverage');
 const cycleIds=new Set<string>();for(const c of data.cycles){if(!c.id||!Array.isArray(c.floors)||!c.floors.length||cycleIds.has(c.id)||c.startDate&&c.endDate&&c.startDate>=c.endDate)throw Error('Invalid challenge cycle');cycleIds.add(c.id);for(const f of c.floors)if(!Array.isArray(f.enemies)||!Array.isArray(f.buffs)||f.enemies.some(e=>!e.id||!e.name||(Object.keys(langs) as Locale[]).some(l=>!e.name[l])))throw Error('Unresolved enemy identity');}
 if(data.statistics?.available!==false||!Array.isArray(data.statistics?.sources))throw Error('Aggregate numbers require a separately validated denominator');
 return data;
}
