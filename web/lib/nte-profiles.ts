import {sameEditValue} from './inline-edit';
import config from '../content/nte-profile-sources.json' with {type:'json'};
import type {EntityProfile,Entry,Localized,StatRow,GameIcon} from './types';
import {samePickupName} from './pickup-detail';
export const nteProfileSources=config.sources;
const loc=(ko:string,en:string,ja:string,zh:string):Localized=>({ko,en,ja,zh});
const decode=(s:string)=>s.replace(/&quot;|&#0*34;/g,'"').replace(/&#0*39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const attr=(s:string,key:string)=>decode(s.match(new RegExp('\\b'+key+'=["\']([^"\']*)["\']'))?.[1]||'');
const text=(s:string)=>decode(s.replace(/<[^>]*>/g,'')).trim();
const format=(n:number)=>n.toLocaleString('en-US');
export function nteSourceMatches(e:Entry,s:typeof nteProfileSources[number]){return e.gameId===s.gameId&&e.kind===s.kind&&s.regions.includes(e.region)&&(e.pickupMembers?.length?e.pickupMembers.filter(m=>m.role!=='rate-up').some(m=>s.names.some(n=>samePickupName(n,m.name))):s.names.some(n=>samePickupName(n,e.title)));}
function astro(value:any):any{if(Array.isArray(value)){if(value.length===1&&value[0]===0)return undefined;if(value[0]===0)return astro(value[1]);if(value[0]===1&&Array.isArray(value[1]))return value[1].map(astro);throw Error('Unknown Astro value');}return value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,astro(v)])):value;}
function materials(html:string,url:string,at:string):NonNullable<EntityProfile['materials']>{
 const heading=html.match(/<h([23])\b[^>]*>\s*(Ascension|Breakthrough)\s*<\/h\1>/);const marker=heading?.index;
 if(marker===undefined)return [];
 const wrapper=heading![2]==='Ascension'?'div':'details',start=html.lastIndexOf('<'+wrapper,marker);let depth=0,end=html.length;
 for(const t of html.slice(start).matchAll(new RegExp('<\\/?'+wrapper+'\\b[^>]*>','g'))){depth+=t[0].startsWith('</')?-1:1;if(depth===0){end=start+t.index!+t[0].length;break;}}
 html=html.slice(start,end);
 const items=new Map<string,{quantity:number;icon?:GameIcon}>();
 for(const m of html.matchAll(/<button\b([^>]*\bdata-floating-tooltip-title[^>]*)>([\s\S]*?)<\/button>/g)){
  const qty=attr(m[1],'data-floating-tooltip-subtitle').match(/^x(\d+)$/)?.[1],path=attr(m[2].match(/<img\b[^>]*>/)?.[0]||'','src');if(!qty||!path)continue;
  const original=new URL(path,url).href;if(!original.startsWith('https://www.kaiden.gg/img/nte/UI/UI_Icon/item_100/'))continue;
  const known=(config.icons as Record<string,GameIcon>)[original];if(!known)continue;const current=items.get(original);items.set(original,{quantity:(current?.quantity||0)+Number(qty),icon:known});
 }
 if(!items.size)return [];
 return [{id:'ascension-materials',title:loc('돌파 재료','Ascension materials','突破素材','突破材料'),basis:loc('돌파 단계 합계 · 경험치·화폐 제외','Ascension stages total · excludes EXP and currency','突破段階の合計・経験値と通貨を除く','突破阶段合计・不含经验及货币'),items:[...items].map(([image,{quantity,icon}],i)=>({id:'material-'+i,quantity:String(quantity),...(icon?{icon}:{}),sourceUrl:url,sourceKind:'community' as const}))}];
}
export function parseNteProfile(html:string,source:typeof nteProfileSources[number],at:string):EntityProfile{
 if(html.length>2000000)throw Error('Profile response too large');
 const identity=text(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]||'').replace(/\s+(?:Build Guide|Arc Guide)(?:\s*[—-]\s*NTE)?$/i,'');
 if(identity.toLowerCase()!==source.sourceName.toLowerCase())throw Error('Profile identity mismatch');
 const root:EntityProfile={id:source.profileId,name:source.name,category:source.kind==='weapon'?loc('무기','Arc','アーク','弧盘'):loc('캐릭터','Character','キャラクター','角色'),basis:source.kind==='weapon'?loc('Lv.1 / Lv.80 · 효과 R1~R5','Lv.1 / Lv.80 · effect R1–R5','Lv.1 / Lv.80・効果R1～R5','Lv.1 / Lv.80・效果R1～R5'):loc('Lv.1 / Lv.80 · 장비·각성·콘솔·전투 버프 제외','Lv.1 / Lv.80 · no gear, awakenings, console or combat buffs','Lv.1 / Lv.80・装備・覚醒・コンソール・戦闘バフなし','Lv.1 / Lv.80・无装备、觉醒、控制台及战斗增益'),traits:source.traits as EntityProfile['traits'],stats:[],statSourceKind:'community',groups:[],sources:[{kind:'community',url:source.url,title:source.name.en+' · Kaiden',publisher:'Kaiden'}],translatedLocales:['ko','en','ja','zh'],verifiedAt:at};
 const row=(label:Localized,value:string):StatRow=>({label,value});
 if(source.kind==='pickup'){
  const node=html.match(/<[^>]+\bid=["']nte-stats-container["'][^>]*>/)?.[0];if(!node)throw Error('Character stats container missing');
  const values=JSON.parse(attr(node,'data-stats')) as {level:number;hp:number;atk:number;def:number}[];
  if(!Array.isArray(values)||values.length<80||values.some(v=>!Number.isInteger(v.level)||v.level<1||v.level>80||[v.hp,v.atk,v.def].some(n=>!Number.isFinite(n)||n<0||n>10000000))||new Set(values.map(v=>v.level)).size!==80)throw Error('Invalid character level table');
  for(const level of [1,80]){const v=values.find(v=>v.level===level)!;root.stats.push(row(loc(`Lv.${level} · HP`,`Lv.${level} · HP`,`Lv.${level} · HP`,`Lv.${level} · 生命`),format(v.hp)),row(loc(`Lv.${level} · 공격력`,`Lv.${level} · ATK`,`Lv.${level} · 攻撃力`,`Lv.${level} · 攻击力`),format(v.atk)),row(loc(`Lv.${level} · 방어력`,`Lv.${level} · DEF`,`Lv.${level} · 防御力`,`Lv.${level} · 防御力`),format(v.def)));}
  root.groups.push({title:loc('돌파별 기초 수치','Base growth','突破別基礎値','突破基础数值'),body:loc('HP / 공격력 / 방어력','HP / ATK / DEF','HP / 攻撃力 / 防御力','生命 / 攻击 / 防御'),sourceKind:'community',sourceUrls:[source.url],rows:[20,30,40,50,60,70,80].map(level=>{const v=values.find(v=>v.level===level)!;return row(loc('Lv.'+level,'Lv.'+level,'Lv.'+level,'Lv.'+level),[v.hp,v.atk,v.def].map(format).join(' / '));})});

  if(source.url.endsWith('/characters/akane/')){
  const scales=[...html.matchAll(/<[^>]+\bdata-skill-scaling=["'][^>]*>/g)].map(m=>JSON.parse(attr(m[0],'data-skill-scaling')) as string[][]);
  if(scales.length!==4||scales.some(rows=>!Array.isArray(rows)||rows.some(r=>!Array.isArray(r)||r.length<1||r.some(v=>typeof v!=='string'||v.length>200||/[<>]/.test(v)))))throw Error('Character skill scaling changed');
  const titles=[loc('일반 공격','Basic Attack','通常攻撃','普通攻击'),loc('반사 스킬','Redirect Skill','変奏スキル','变奏技能'),loc('궁극기','Ultimate','終結スキル','终结技能'),loc('지원 스킬','Support Skill','支援スキル','支援技能')];
  const labels=[[loc('1타 피해 · 현 에너지','Stage1 damage · String Energy','1段目ダメージ・弦エネルギー','第1段伤害・弦能量'),loc('2타 피해 · 현 에너지','Stage2 damage · String Energy','2段目ダメージ・弦エネルギー','第2段伤害・弦能量')],[loc('배음 시전 피해','Overtone cast damage','倍音発動ダメージ','泛音施放伤害'),loc('잔향 영역 시전 피해','Reverb Field cast damage','残響領域発動ダメージ','混响领域施放伤害')],[loc('1회차 개별 피해','First instance damage','1回目の単発ダメージ','第1次单段伤害'),loc('2회차 피해','Second instance damage','2回目ダメージ','第2次伤害')],[loc('피해 배율','Damage multiplier','ダメージ倍率','伤害倍率')]];
  for(let i=0;i<scales.length;i++)root.groups.push({title:titles[i],body:loc('스킬 Lv.1 / Lv.10','Skill Lv.1 / Lv.10','スキルLv.1 / Lv.10','技能Lv.1 / Lv.10'),sourceKind:'community',sourceUrls:[source.url],rows:scales[i].slice(0,labels[i].length).map((values,j)=>row(labels[i][j],`Lv.1 ${values[0].replaceAll('*','×')} / Lv.10 ${values[9].replaceAll('*','×')}`))});
 }
 }else{
  const table=html.slice(html.indexOf('Base Stats')).split('</table>')[0];if(!table||table.length>10000)throw Error('Arc base stat table missing');
  const rows=[...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].flatMap(m=>{const cells=[...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map(c=>text(c[1]));return cells.length===3?[cells]:[];});
  const statLabels:Record<string,Localized>={ATK:loc('공격력','ATK','攻撃力','攻击力'),HP:loc('HP','HP','HP','生命'),DEF:loc('방어력','DEF','防御力','防御力'),'Crit DMG':loc('치명 피해','Crit DMG','会心ダメージ','暴击伤害'),'Crit Rate':loc('치명 확률','Crit Rate','会心率','暴击率')};
  if(!rows.some(r=>r[0]==='ATK'))throw Error('Arc ATK missing');
  for(const cells of rows.filter(r=>statLabels[r[0]])){const key=cells[0];if(!cells.slice(1).every(v=>/^\d+(?:\.\d+)?%?$/.test(v)))throw Error('Arc stat fields missing');for(let i=1;i<=2;i++){const level=i===1?1:80,label=statLabels[key];root.stats.push(row(loc(`Lv.${level} · ${label.ko}`,`Lv.${level} · ${label.en}`,`Lv.${level} · ${label.ja}`,`Lv.${level} · ${label.zh}`),cells[i]));}}
  if(source.url.endsWith('/arcs/far-side-of-the-moon/')){
  const tag=[...html.matchAll(/<astro-island\b[^>]*>/g)].map(m=>m[0]).find(t=>attr(t,'component-url').includes('NteArcEffect'));if(!tag)throw Error('Arc effects missing');
  const effect=astro(JSON.parse(attr(tag,'props')));if(!Array.isArray(effect.levels)||effect.levels.length!==5)throw Error('Arc rank table missing');
  const keys=['buff_Prism_CritUp','buff_Prism_DamageUp1','buff_Prism_DamageUp2','buff_Prism_LakshanaUp'];
  const labels=[loc('치명 확률','Crit Rate','会心率','暴击率'),loc('반사 스킬 · 중첩당','Redirect · per stack','変奏スキル・1重ごと','变奏技能・每层'),loc('일반 공격 피해','Basic Attack DMG','通常攻撃ダメージ','普通攻击伤害'),loc('상 속성 피해','Lakshana DMG','相属性ダメージ','相属性伤害')];
  root.groups.push({title:loc('무기 효과','Arc effect','アーク効果','弧盘效果'),sourceKind:'community',sourceUrls:[source.url],body:loc('일반 공격 적중 → 반사 스킬 강화 5초 · 최대4중첩 · 0.3초 간격\n반사 스킬 사용 → 일반 공격 강화15초\n두 효과 활성 시 상 속성 강화','Basic hit → Redirect buff 5s · max4 stacks · 0.3s interval\nRedirect cast → basic buff15s\nBoth active → Lakshana buff','通常攻撃命中→変奏強化5秒・最大4重・間隔0.3秒\n変奏発動→通常攻撃強化15秒\n両方有効→相属性強化','普攻命中→变奏强化5秒・最多4层・间隔0.3秒\n施放变奏→普攻强化15秒\n两种效果生效→相属性强化'),rows:keys.map((key,i)=>row(labels[i],effect.levels.map((v:any,index:number)=>{const n=v.values?.find((x:any)=>x.id===key);if(!n||!Number.isFinite(n.value)||n.value<0||n.value>10)throw Error('Arc effect value missing');return `R${index+1} ${Math.round(n.value*10000)/100}%`;}).join(' / ')))});
 }
 }
 root.materials=materials(html,source.url,at);return root;
}
/** Do not overwrite manually authored profiles or another exact outfit. */
export function applyNteProfile(entry:Entry,profile:EntityProfile,previousProfile?:EntityProfile){
 const old=entry.entityDetails?.find(p=>p.id===profile.id||samePickupName(p.name,profile.name));if(old&&!sameEditValue(old,previousProfile))return entry;
 if(old&&sameEditValue({...old,verifiedAt:''},{...profile,verifiedAt:''}))return entry;
 return {...entry,entityDetails:[...(entry.entityDetails||[]).filter(p=>p.id!==profile.id),profile]};
}

/** Source discovery uses exact published names and fixed same-game paths, never guessed slugs. */
export function discoverNteSources(entries:Entry[],html:string,kind:'pickup'|'weapon'){
 const component=kind==='pickup'?'NteCharacterList':'NteArcList',tag=[...html.matchAll(/<astro-island\b[^>]*>/g)].map(m=>m[0]).find(t=>attr(t,'component-url').includes(component));if(!tag)throw Error('NTE list missing');
 const root=astro(JSON.parse(attr(tag,'props'))),cards=kind==='pickup'?root.characters:root.arcs?.map((a:any)=>a.card);if(!Array.isArray(cards)||!cards.length)throw Error('NTE source list empty');
 const norm=(s:string)=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase(),sources:typeof nteProfileSources=[],unmatched:string[]=[];
 for(const entry of entries.filter(e=>e.kind===kind))for(const name of entry.pickupMembers?.filter(m=>m.role!=='rate-up'&&m.role!=='candidate').map(m=>m.name)||[entry.title]){
  if(nteProfileSources.some(s=>s.names.some(n=>samePickupName(n,name))))continue;
  const card=cards.find((c:any)=>typeof c.name==='string'&&name.en&&norm(c.name)===norm(name.en));
  if(!card||!new RegExp('^/nte/'+(kind==='pickup'?'characters':'arcs')+'/[a-z0-9-]+/$').test(card.url||'')){unmatched.push(entry.id+':'+name.en);continue;}
  const source={gameId:'nte',regions:['global'],kind,names:[name],url:'https://www.kaiden.gg'+card.url,profileId:'nte-'+kind+'-'+card.url.split('/').filter(Boolean).at(-1),name,sourceName:card.name,traits:[]};sources.push(source as typeof nteProfileSources[number]);
 }
 return {sources:[...new Map(sources.map(s=>[s.url,s])).values()],unmatched};
}
