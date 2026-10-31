import type {Catalog,Item,Locale,Message,Region,Session,Subscription} from './types';
import {regions,topics,offsets} from './types';
import {escapeText,safeUrl} from './security';
import {regionText,t,topicText} from './i18n';
export const row=(...components:Record<string,unknown>[])=>({type:1,components});
export const button=(label:string,id:string,style=2)=>({type:2,label:label.slice(0,80),style,custom_id:id});
const select=(id:string,placeholder:string,options:Record<string,unknown>[],max=1)=>({type:3,custom_id:id,placeholder,options,min_values:1,max_values:Math.min(max,options.length)});
export const message=(content:string,components:Record<string,unknown>[]=[]):Message=>({content,components,allowed_mentions:{parse:[]}});
export function itemState(item:Item,now:number,requested:Region='kr'){
  if(item.forecast)return 'forecast';
  if(item.endAt&&Date.parse(item.endAt)<=now)return 'ended';
  if(item.startAt&&Date.parse(item.startAt)>now)return 'upcoming';
  const today=new Date(now+({kr:9,jp:9,cn:8,global:0}[requested])*3600000).toISOString().slice(0,10);
  if(!item.endAt&&item.endDate&&item.endDate<today)return 'ended';
  if(!item.startAt&&item.startDate&&item.startDate>today)return 'upcoming';
  return 'current';
}
export function clock(value:string|null|undefined,relative=false){
  const n=value?Date.parse(value):NaN;return Number.isFinite(n)?`<t:${Math.floor(n/1000)}:${relative?'R':'f'}>`:'';
}
function window(item:Item,locale:Locale){
  return [item.startAt?`${t('start',locale)} ${clock(item.startAt)}`:item.startDate,item.endAt?`${t('end',locale)} ${clock(item.endAt)} · ${clock(item.endAt,true)}`:item.endDate].filter(Boolean).join('\n');
}
export function itemEmbed(item:Item,catalog:Catalog,origin:string,now:number){
  const game=catalog.games.find(g=>g.id===item.gameId),locale=catalog.locale;
  const members=item.members.filter(m=>m.role==='featured'||m.role==='candidate');
  const image=safeUrl(members.find(m=>m.image)?.image||item.image,origin);
  const source=safeUrl(item.sourceUrl,origin),url=safeUrl(item.url,origin);
  const description=[members.length?members.map(m=>escapeText(m.name,80)).join(' / ').slice(0,250):'',item.broadcast?`${item.broadcast.live?'🔴 LIVE':t(item.broadcast.status==='ended'?'ended':'upcoming',locale)} ${clock(item.broadcast.programStartAt||item.broadcast.scheduledAt)}`:window(item,locale),escapeText(item.summary,300)].filter(Boolean).join('\n\n');
  return {title:escapeText(item.title,200),description:description.slice(0,750),url,
    color:parseInt((game?.color||'#9eb663').replace('#',''),16),
    author:{name:`${game?.name||item.gameId} · ${regionText(catalog.requestedRegion,locale)}`.slice(0,80),...(source?{url:source}:{})},
    footer:{text:(item.broadcast?'GAGETHER':`GAGETHER · ${t(itemState(item,now,catalog.requestedRegion),locale)}${item.sourceKind==='community'?' · Community':''}`).slice(0,60)},
    ...(image?{thumbnail:{url:image}}:{}),
  };
}
export type Tab='overview'|'pickup'|'events'|'notices'|'broadcast'|'archive';
export function gameView(catalog:Catalog,gameId:string,tab:Tab,page:number,origin:string,now:number):Message{
  const game=catalog.games.find(g=>g.id===gameId),l=catalog.locale,r=catalog.requestedRegion;
  if(!game)return message(t('empty',l));
  let items=catalog.entries.filter(e=>e.gameId===gameId);
  if(tab==='broadcast'||tab==='archive')items=items.filter(e=>e.broadcast&&(tab==='archive'?e.broadcast.status==='ended':e.broadcast.status==='scheduled'||e.broadcast.live));
  else if(tab==='notices')items=items.filter(e=>!e.broadcast&&e.kind==='update');
  else if(tab==='pickup')items=items.filter(e=>(e.kind==='pickup'||e.kind==='weapon')&&itemState(e,now,r)!=='ended');
  else if(tab==='events')items=items.filter(e=>(e.kind==='event'||e.kind==='package')&&itemState(e,now,r)!=='ended');
  else items=items.filter(e=>e.broadcast?e.broadcast.live||e.broadcast.status==='scheduled':itemState(e,now,r)!=='ended');
  const sorted=items.sort((a,b)=>{
    const rank=(e:Item)=>e.broadcast?.live?-1:itemState(e,now,r)==='current'?0:itemState(e,now,r)==='upcoming'?1:2;
    return (tab==='notices'||tab==='archive'?0:rank(a)-rank(b))||(Date.parse(b.publishedAt||'')||0)-(Date.parse(a.publishedAt||'')||0)||a.id.localeCompare(b.id);
  });
  const maxPage=Math.max(0,Math.ceil(sorted.length/3)-1),current=Math.max(0,Math.min(page,maxPage));
  const id=(target:string,p=0)=>`v:${gameId}:${r}:${l}:${target}:${p}`;
  const available=regions.filter(x=>x!=='cn'||game.regions.includes('cn'));
  const components=[row(...(['overview','pickup','events','notices','broadcast'] as const).map(k=>button(t(k,l),id(k),tab===k?1:2))),
    row(select(`r:${gameId}:${l}:${tab}`,t('chooseService',l),available.map(region=>({label:regionText(region,l),value:region,default:region===r})))),
    row(button(t('previous',l),id(tab,current-1)),button(`${current+1}/${maxPage+1}`,id(tab,current)),button(t('more',l),id(tab,current+1)),button(t('ended',l),id('archive'))),
    row({type:2,style:5,label:t('site',l),url:safeUrl(`/${l}/games/${gameId}?region=${r}`,origin)})];
  return {...message(`**${escapeText(game.name)}** · ${regionText(r,l)}${sorted.length?'':'\n'+t('empty',l)}`,components),embeds:sorted.slice(current*3,current*3+3).map(e=>itemEmbed(e,catalog,origin,now))};
}
export function searchView(catalog:Catalog,term:string,page:number,origin:string,now:number):Message{
  const normalize=(s:string)=>s.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,'');
  const q=normalize(term),l=catalog.locale;
  const items=catalog.entries.filter(e=>normalize([e.title,e.summary,...e.members.map(m=>m.name)].join(' ')).includes(q)).sort((a,b)=>(Date.parse(b.publishedAt||b.startAt||'')||0)-(Date.parse(a.publishedAt||a.startAt||'')||0));
  const p=Math.max(0,Math.min(page,Math.ceil(items.length/3)-1));
  // Search navigation is stateless but bounded to Discord's 100-character custom_id limit.
  const encoded=encodeURIComponent(term),base=`q:${catalog.requestedRegion}:${l}:`;
  const components=(base+encoded).length<90?[row(button(t('previous',l),base+Math.max(0,p-1)+':'+encoded),button(t('more',l),base+(p+1)+':'+encoded))]:[];
  return {...message(`**${t('searchTitle',l)} · ${escapeText(term,100)}** (${items.length})${items.length?'':'\n'+t('empty',l)}`,components),embeds:items.slice(p*3,p*3+3).map(e=>itemEmbed(e,catalog,origin,now))};
}
export const wizardSteps=['games','region','topics','offsets','language','channel','save'] as const;
export function wizardView(session:Session,catalog:Catalog):Message{
  const s=session.settings,l=s.locale,step=wizardSteps[session.revision],id=`w:${session.id}:${session.revision}:${step}`;
  let control:Record<string,unknown>;
  if(step==='games')control=select(id,t('games',l),catalog.games.map(g=>({label:g.name.slice(0,100),value:g.id})),15);
  else if(step==='region')control=select(id,t('chooseService',l),regions.filter(r=>r!=='cn'||s.games.every(id=>catalog.games.find(g=>g.id===id)?.regions.includes('cn'))).map(r=>({label:regionText(r,l),value:r})));
  else if(step==='topics')control=select(id,t('topics',l),topics.map(topic=>({label:topicText(topic,l),value:topic})),topics.length);
  else if(step==='offsets')control=select(id,t('offsets',l),offsets.map(n=>({label:t(n===1440?'day':n===60?'hour':n===30?'half':n===15?'quarter':'at',l),value:String(n)})),offsets.length);
  else if(step==='language')control=select(id,t('language',l),[{label:'한국어',value:'ko'},{label:'English',value:'en'},{label:'日本語',value:'ja'},{label:'中文',value:'zh'}]);
  else if(step==='channel')control={type:8,custom_id:id,placeholder:t('channel',l),channel_types:[0,5],min_values:1,max_values:1};
  else return message(`**${t('alerts',l)}**\n${t('ready',l)}\n\n${s.games.map(id=>catalog.games.find(g=>g.id===id)?.name||id).join(' / ')}\n${regionText(s.region,l)} · ${s.locale}\n${s.topics.map(topic=>topicText(topic,l)).join(' / ')}\n${s.offsets.map(n=>t(n===1440?'day':n===60?'hour':n===30?'half':n===15?'quarter':'at',l)).join(' / ')}\n<#${s.channelId}>`,[row(button(t('save',l),id,3))]);
  return message(`**${t('alerts',l)} · ${session.revision+1}/6**`,[row(control)]);
}
export function subscriptionList(subscriptions:Subscription[],locale:Locale,held:number):Message{
  if(!subscriptions.length)return message(t('noSubscriptions',locale),[row(button(t('newAlert',locale),'a:new',3))]);
  return message(`**${t('alerts',locale)}**${held?'\n⚠ '+t('held',locale)+': '+held:''}\n\n${subscriptions.slice(0,20).map(s=>`${s.enabled?'🟢':'⚪'} <#${s.channelId}> · ${s.games.join(' / ')} · ${regionText(s.region,locale)}`).join('\n')}`,
    [row(select('a:select',t('choose',locale),subscriptions.slice(0,25).map(s=>({label:`${s.enabled?t('on',locale):t('off',locale)} · ${s.games.join(', ')} · ${s.region}`.slice(0,100),value:s.id})))),row(button(t('newAlert',locale),'a:new',3))]);
}
