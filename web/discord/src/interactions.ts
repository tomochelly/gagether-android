import type {Catalog,Env,Interaction,Locale,Message,Region,Settings,Topic} from './types';
import {locales,regions,topics,offsets} from './types';
import {actor,canManage,canPost,snowflake} from './security';
import {BotStore,Conflict} from './store';
import {loadCatalog} from './catalog';
import {discordRequest} from './rest';
import {localeFor,t,regionText} from './i18n';
import {button,gameView,message,row,searchView,subscriptionList,wizardSteps,wizardView,type Tab} from './views';

export const gameCommands:Record<string,string>={
  '명조':'wuwa','블아':'bluearchive','명일방주':'arknights','원신':'genshin','스타레일':'hsr',
  '젠레스':'zzz','니케':'nikke','우마무스메':'umamusume','소녀전선2':'gfl2','엔드필드':'endfield',
  '이환':'nte','트릭컬':'trickcal','붕괴3':'hi3','리버스':'reverse1999','스텔라소라':'stellasora',
};
const validTabs:Tab[]=['overview','pickup','events','notices','broadcast','archive'];
const picked=(i:Interaction)=>i.data?.values||[];
const one=(i:Interaction)=>picked(i)[0]||'';
const validRegion=(r:string):r is Region=>regions.includes(r as Region);
const validLocale=(l:string):l is Locale=>locales.includes(l as Locale);

export function initialResponse(interaction:Interaction){
  if(interaction.type===2&&interaction.data?.name==='검색'&&!interaction.data.options?.some(o=>o.name==='검색어'&&o.value)){
    const l=localeFor(interaction.locale);
    return {type:9,data:{custom_id:'search',title:t('search',l),components:[row({type:4,custom_id:'query',label:t('query',l),style:1,min_length:1,max_length:100,required:true})]}};
  }
  return interaction.type===3?{type:6}:{type:5,data:{flags:interaction.data?.name==='알림'?64:undefined}};
}

export async function handleInteraction(env:Env,i:Interaction,now=Date.now()):Promise<Message>{
  const store=new BotStore(env.DB),user=actor(i),guild=i.guild_id,l=localeFor(i.locale);
  if(!guild)return message(t('guildOnly',l));
  if(!snowflake(guild)||!snowflake(user))return message(t('invalid',l));
  const defaultRegion:Region=l==='ko'?'kr':l==='ja'?'jp':'global';
  let region=await store.preference(guild,user)||defaultRegion;
  const catalog=(locale:Locale=l,r:Region=region)=>loadCatalog(env,locale,r,now);
  const id=i.data?.custom_id||'',parts=id.split(':'),action=parts[0];
  if(i.data?.name==='알림'||action==='a'||action==='w'||action==='toggle'){
    if(!canManage(i))return message(t('manageOnly',l));
    if(i.data?.name==='알림')return message(`**${t('alerts',l)}**`,[row(button(t('newAlert',l),'a:new',3),button(t('list',l),'a:list'))]);
    if(id==='a:new')return wizardView(await store.newSession(guild,user,l,now),await catalog());
    if(id==='a:list'){
      const held=await env.DB.prepare("SELECT count(*) AS count FROM outbox WHERE guild_id=? AND state IN ('uncertain','failed')").bind(guild).first<{count:number}>();
      return subscriptionList(await store.subscriptions(guild),l,held?.count||0);
    }
    if(id==='a:select'){
      const sub=(await store.subscriptions(guild)).find(s=>s.id===one(i));if(!sub)return message(t('invalid',l));
      return message(`**${t('alerts',l)}**\n<#${sub.channelId}> · ${sub.games.join(' / ')} · ${regionText(sub.region,l)}`,
        [row(button(t(sub.enabled?'disable':'enable',l),`toggle:${sub.revision}:${sub.enabled?'0':'1'}:${sub.id}`,sub.enabled?4:3)),row(button(t('list',l),'a:list'))]);
    }
    if(action==='toggle'){
      const revision=Number(parts[1]),enabled=parts[2]==='1',subId=parts.slice(3).join(':');
      if(!Number.isSafeInteger(revision)||!['0','1'].includes(parts[2]))return message(t('invalid',l));
      await store.toggle(subId,guild,user,revision,enabled,now);
      return message(t(enabled?'resumed':'stopped',l),[row(button(t('list',l),'a:list'))]);
    }
    if(action==='w'){
      const revision=Number(parts[2]),step=parts[3];
      if(!Number.isInteger(revision)||revision<0||revision>6||wizardSteps[revision]!==step)return message(t('invalid',l));
      const session=await store.session(parts[1],guild,user,revision,now),s=session.settings;
      const feed=await catalog(s.locale,s.region),values=picked(i);
      if(step==='games'){
        if(!values.length||values.length>15||new Set(values).size!==values.length||values.some(v=>!feed.games.some(g=>g.id===v)))return message(t('invalid',l));
        s.games=values;
      }else if(step==='region'){
        const r=one(i);if(!validRegion(r)||r==='cn'&&s.games.some(id=>!feed.games.find(g=>g.id===id)?.regions.includes('cn')))return message(t('invalid',l));s.region=r;
      }else if(step==='topics'){
        if(!values.length||values.length>topics.length||values.some(v=>!topics.includes(v as Topic)))return message(t('invalid',l));s.topics=[...new Set(values)] as Topic[];
      }else if(step==='offsets'){
        if(!values.length||values.length>offsets.length||values.some(v=>!offsets.includes(Number(v))))return message(t('invalid',l));s.offsets=[...new Set(values.map(Number))];
      }else if(step==='language'){
        const lang=one(i);if(!validLocale(lang))return message(t('invalid',l));s.locale=lang;
      }else if(step==='channel'){
        const channel=one(i),resolved=i.data?.resolved?.channels?.[channel];
        if(!snowflake(channel)||!resolved||![0,5].includes(resolved.type)||!canPost(resolved.app_permissions))return message(t('permission',s.locale));
        // A signed selection proves permissions, and REST verifies actual guild membership.
        const actual=await discordRequest(env,`/channels/${channel}`);
        if(actual?.guild_id!==guild||![0,5].includes(Number(actual.type)))return message(t('invalid',s.locale));s.channelId=channel;
        const existing=(await store.subscriptions(guild)).find(value=>value.id===[guild,channel,s.region,s.locale].join(':'));
        s.baseRevision=existing?.revision||0;
      }else if(step==='save'){
        if(!validSettings(s,feed))return message(t('invalid',s.locale));
        const count=(await store.subscriptions()).length;
        if(count>=50)return message('알림 설정 한도에 도달했습니다. 기존 설정을 수정해 주세요.');
        await store.commit(session,now);return message(t('saved',s.locale),[row(button(t('list',s.locale),'a:list'))]);
      }
      return wizardView(await store.advance(session),await catalog(s.locale,s.region));
    }
    return message(t('invalid',l));
  }
  if(i.type===2&&i.data?.name&&gameCommands[i.data.name]){
    const gameId=gameCommands[i.data.name],r=await store.preference(guild,user,gameId)||defaultRegion;
    return gameView(await catalog(l,r),gameId,'overview',0,env.GAGETHER_ORIGIN,now);
  }
  if(i.data?.name==='검색'||i.type===5&&id==='search'){
    const query=i.data?.options?.find(o=>o.name==='검색어')?.value||i.data?.components?.flatMap(r=>r.components).find(c=>c.custom_id==='query')?.value;
    if(!query?.trim()||query.length>100)return message(t('invalid',l));return searchView(await catalog(),query.trim(),0,env.GAGETHER_ORIGIN,now);
  }
  if(action==='v'){
    const [,gameId,r,locale,tab,page]=parts;
    if(!validRegion(r)||!validLocale(locale)||!validTabs.includes(tab as Tab))return message(t('invalid',l));
    return gameView(await catalog(locale,r),gameId,tab as Tab,Number(page)||0,env.GAGETHER_ORIGIN,now);
  }
  if(action==='r'){
    const [,gameId,locale,tab]=parts,r=one(i);
    if(!validLocale(locale)||!validRegion(r)||!validTabs.includes(tab as Tab))return message(t('invalid',l));
    const data=await catalog(locale,r),game=data.games.find(g=>g.id===gameId);
    if(!game||r==='cn'&&!game.regions.includes('cn'))return message(t('invalid',l));
    await store.remember(guild,user,r,gameId);region=r;
    return gameView(data,gameId,tab as Tab,0,env.GAGETHER_ORIGIN,now);
  }
  if(action==='q'){
    const [,r,locale,page,...query]=parts;
    if(!validRegion(r)||!validLocale(locale))return message(t('invalid',l));
    const term=decodeURIComponent(query.join(':'));if(!term||term.length>100)return message(t('invalid',l));
    return searchView(await catalog(locale,r),term,Number(page)||0,env.GAGETHER_ORIGIN,now);
  }
  return message(t('help',l));
}

export function validSettings(s:Settings,feed:Catalog){
  return s.games.length>0&&s.games.length<=15&&s.games.every(id=>feed.games.some(g=>g.id===id&&(s.region!=='cn'||g.regions.includes('cn'))))&&validRegion(s.region)&&validLocale(s.locale)&&s.topics.length>0&&s.topics.every(k=>topics.includes(k))&&s.offsets.length>0&&s.offsets.every(n=>offsets.includes(n))&&snowflake(s.channelId);
}
export const interactionError=(error:unknown,locale:Locale)=>message(t(error instanceof Conflict?'expired':'unavailable',locale));
