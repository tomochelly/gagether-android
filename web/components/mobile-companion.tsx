'use client';
import {useEffect,useRef,useState} from 'react';
import {Bell,BellRing,Check,ChevronDown,RefreshCw,Smartphone,Star,X} from 'lucide-react';
import {mobileDefaults,webRevision,type MobilePreferences} from '@/lib/mobile';
import {mobileText} from '@/lib/mobile-i18n';
import {appSettingsCopy} from '@/lib/app-settings-copy';
import {isLocale} from '@/lib/visitor-locale';
import {notificationText} from '@/lib/notification-i18n';
import {reminderRules,cleanOffsets} from '@/lib/notification-settings';
import {broadcastReminderText} from '@/lib/broadcast-reminder-i18n';
import {notificationVoices} from '@/lib/notification-voices';
import {ReminderControls} from './reminder-controls';
import {useCatalog} from './catalog-context';
import {regionLabel,scheduleRegions} from '@/lib/presentation';
import type {Locale,Region} from '@/lib/types';
import type {EditorData} from './editor-panel';

type NativeStatus={supportedGameIds?:string[];systemLocale?:Locale;exactAlarmsAllowed?:boolean;scheduledCount?:number;lastNotificationAt?:number;lastTestScheduledAt?:number;lastTestDeliveredAt?:number;scheduleError?:string;reminderConfigVersion?:number;appVersion?:string;notificationsGranted?:boolean;widgetSupported?:boolean;lastSyncAt?:number;preferences?:MobilePreferences;error?:string};
declare global {interface Window {PatchworkNative?:{postMessage:(message:string)=>void;onmessage:((event:{data:string})=>void)|null};__patchworkBack?:()=>boolean}}
const regionKey=(regions:Partial<Record<string,Region>>)=>JSON.stringify(Object.entries(regions).sort(([a],[b])=>a.localeCompare(b)));
const send=(type:string,payload?:unknown)=>window.PatchworkNative?.postMessage(JSON.stringify({version:1,type,payload}));
export default function MobileCompanion({onNativeLocale,locale,open,onClose,onData,favorites,favoriteRegions,favoriteRegion,preferencesReady,onFavorites,onFavoriteRegions}:{onNativeLocale?:(locale:Locale,manual:boolean)=>void;locale:Locale;open:boolean;onClose:()=>void;onData:(data:Partial<EditorData>)=>void;favorites:string[];favoriteRegions:Partial<Record<string,Region>>;favoriteRegion:Region;preferencesReady:boolean;onFavorites:(games:string[])=>void;onFavoriteRegions:(regions:Record<string,Region>)=>void}){
 const {games,t}=useCatalog();const l=mobileText[locale],n=notificationText[locale],a=appSettingsCopy[locale],b=broadcastReminderText[locale];
 const [prefs,setPrefs]=useState<MobilePreferences>(()=>mobileDefaults(locale));const [status,setStatus]=useState<NativeStatus>({});const [native,setNative]=useState(false);const [message,setMessage]=useState('');const [syncing,setSyncing]=useState(false);const [loaded,setLoaded]=useState(false);
 const supportedGames=games.filter(g=>!native||(status.supportedGameIds?status.supportedGameIds.includes(g.id):!['limbus','dna','holodreams'].includes(g.id)));
 const prefsRef=useRef(prefs),onNativeLocaleRef=useRef(onNativeLocale);prefsRef.current=prefs;onNativeLocaleRef.current=onNativeLocale;
 const favoritesRef=useRef(favorites);favoritesRef.current=favorites;
 const onDataRef=useRef(onData),localeRef=useRef(locale),revision=useRef(''),lastFeed=useRef<unknown>(null),busy=useRef(false);onDataRef.current=onData;localeRef.current=locale;
 const sync=async(force=false)=>{
  if(busy.current||document.hidden)return;send('hello');busy.current=true;setSyncing(true);
  try{
   const requestLocale=localeRef.current;
   const r=await fetch(`/api/mobile/data?locale=${requestLocale}${!force&&revision.current?'&since='+revision.current:''}`,{cache:'no-store'});if(!r.ok)throw new Error('sync');
   const feed=await r.json() as {schemaVersion:number;webRevision:string;revision:string;unchanged?:boolean};if(feed.schemaVersion!==1||typeof feed.revision!=='string')throw new Error('schema');
   if(requestLocale!==localeRef.current){revision.current='';return;}
   if(feed.webRevision!==webRevision&&feed.webRevision!=='development'&&webRevision!=='development'){location.reload();return;}
   if(!feed.unchanged){
    if(revision.current&&revision.current!==feed.revision)window.dispatchEvent(new Event('gagether:data-changed')); 
    revision.current=feed.revision;lastFeed.current=feed;send('snapshot',feed);
   }
   if(force)send('sync');setMessage('');
  }catch{if(force)setMessage(mobileText[localeRef.current].offline);}finally{busy.current=false;setSyncing(false);}
 };
 useEffect(()=>{
  const bridge=window.PatchworkNative;setNative(!!bridge);
  if(bridge){bridge.onmessage=event=>{try{const result=JSON.parse(event.data);if(result.type==='state'){
   setStatus(result);
   if(result.preferences){
    const modern=(result.reminderConfigVersion||0)>=3;
    const mode=modern&&result.preferences.localeMode!=='manual'?'system':'manual';
    const actual=modern&&isLocale(result.preferences.locale)?result.preferences.locale:localeRef.current;
    const next={...mobileDefaults(actual),...result.preferences,locale:actual,localeMode:mode,followMyGames:result.preferences.followMyGames??favoritesRef.current.length>0,notificationRules:reminderRules(result.preferences.notificationRules,result.preferences)} as MobilePreferences;
    setPrefs(next);prefsRef.current=next;
    if(modern)onNativeLocaleRef.current?.(actual,mode==='manual');
    else if(result.preferences.locale!==localeRef.current)send('preferences',next);
   }setLoaded(true);
  }else if(result.type==='error')setMessage(result.message||mobileText[localeRef.current].offline);}catch{}};send('hello');}
  else setLoaded(true);
  const manual=(event:Event)=>{const lang=(event as CustomEvent).detail;if(!isLocale(lang))return;const next={...prefsRef.current,locale:lang,localeMode:'manual' as const};prefsRef.current=next;setPrefs(next);send('preferences',next);};
  window.addEventListener('gagether:app-language',manual);
  void sync();const timer=setInterval(()=>void sync(),20000);const resume=()=>{if(!document.hidden){send('hello');void sync(true);}};document.addEventListener('visibilitychange',resume);
  return()=>{clearInterval(timer);window.removeEventListener('gagether:app-language',manual);document.removeEventListener('visibilitychange',resume);if(bridge)bridge.onmessage=null;};
 },[]);
 useEffect(()=>{if(!loaded)return;if(prefs.locale!==locale&&((status.reminderConfigVersion||0)<3||prefs.localeMode==='manual')){const next={...prefs,locale};setPrefs(next);send('preferences',next);}revision.current='';void sync(true);},[locale,loaded]);
 useEffect(()=>{if(open)send('hello');},[open]);
 const change=(patch:Partial<MobilePreferences>)=>{const next={...prefs,...patch,locale:patch.locale||locale};prefsRef.current=next;setPrefs(next);send('preferences',next);if(patch.localeMode)onNativeLocaleRef.current?.(next.locale,next.localeMode==='manual');if(lastFeed.current)send('snapshot',lastFeed.current);};
 const advanced=(status.reminderConfigVersion||0)>=2;
 const favoriteSignature=JSON.stringify([favorites.slice().sort(),favoriteRegions,favoriteRegion]);
 useEffect(()=>{
  if(!native||!loaded||!advanced||!preferencesReady||!prefs.followMyGames)return;
  const wanted=favorites.filter(id=>supportedGames.some(g=>g.id===id));
  const regions=Object.fromEntries(wanted.map(id=>{const game=games.find(g=>g.id===id)!;const candidate=favoriteRegions[id]||favoriteRegion;return [id,scheduleRegions(game).includes(candidate)?candidate:scheduleRegions(game)[0]||'global'];})) as Record<string,Region>;
  if(JSON.stringify(prefs.games.slice().sort())!==JSON.stringify(wanted.slice().sort())||regionKey(prefs.gameRegions)!==regionKey(regions))change({games:wanted,gameRegions:regions,region:favoriteRegion==='cn'?'global':favoriteRegion});
 },[native,loaded,advanced,preferencesReady,prefs.followMyGames,favoriteSignature,JSON.stringify(prefs.games),JSON.stringify(prefs.gameRegions),JSON.stringify(supportedGames.map(g=>g.id))]);
 const changeGames=(selected:string[])=>{if(advanced&&prefs.followMyGames)onFavorites([...favorites.filter(id=>!supportedGames.some(g=>g.id===id)),...selected]);change({games:selected});};
 const changeRegions=(regions:Record<string,Region>)=>{if(advanced&&prefs.followMyGames)onFavoriteRegions({...favoriteRegions,...regions} as Record<string,Region>);change({gameRegions:regions});};
 const toggle=<T,>(array:T[],item:T)=>array.includes(item)?array.filter(x=>x!==item):[...array,item];
 if(!open)return null;
 return <div className="companion-scrim" onClick={onClose}><section className="companion-panel" role="dialog" aria-modal="true" aria-label={l.title} onClick={e=>e.stopPropagation()}><header><div><small>GAGETHER / ANDROID</small><h2>{l.title}</h2></div><button className="icon-button" aria-label={l.close} onClick={onClose}><X size={22}/></button></header><div className="companion-scroll"><p className="companion-intro">{l.intro}</p>{!native&&<div className="companion-notice"><Smartphone size={18}/>{l.notApp}</div>}<fieldset disabled={!native||!loaded}>
 <label className="companion-main-toggle"><span><BellRing size={21}/><strong>{l.enabled}</strong></span><input type="checkbox" checked={prefs.enabled} onChange={e=>{change({enabled:e.target.checked});if(e.target.checked&&!status.notificationsGranted)send('permission');}}/></label><p className="companion-hint">{l.enableNote}</p>
 <button className="companion-permission" onClick={()=>send(status.notificationsGranted?'systemSettings':'permission')}>{status.notificationsGranted?<Check size={15}/>:<Bell size={15}/>} {status.notificationsGranted?l.permissionOk:l.permission}</button>
 {(status.reminderConfigVersion||0)>=3&&<section><label className="companion-option"><strong>{a.language}</strong><select aria-label={a.language} value={prefs.localeMode==='system'?'system':prefs.locale} onChange={e=>{const value=e.target.value,system=value==='system';change({localeMode:system?'system':'manual',locale:system?(status.systemLocale||locale):value as Locale});}}><option value="system">{a.system}</option>{(['ko','en','ja','zh'] as Locale[]).map(lang=><option key={lang} value={lang}>{({ko:'한국어',en:'English',ja:'日本語',zh:'中文'})[lang]}</option>)}</select></label><p className="companion-hint">{a.languageNote}</p><button className="companion-permission" onClick={()=>send('exactAlarmSettings')} disabled={status.exactAlarmsAllowed}>{status.exactAlarmsAllowed?<Check size={15}/>:<Bell size={15}/>} {status.exactAlarmsAllowed?a.exactOk:a.exact}</button><p className="companion-hint">{a.exactNote}</p><div className="companion-status"><span>{a.scheduled}</span><strong>{status.scheduledCount??0}</strong></div>{!!status.lastNotificationAt&&<div className="companion-status"><span>{a.posted}</span><strong>{new Intl.DateTimeFormat(locale,{dateStyle:'short',timeStyle:'short'}).format(status.lastNotificationAt)}</strong></div>}</section>}
 <section>{advanced&&<><label className="companion-option"><strong>{n.follow}</strong><input type="checkbox" checked={prefs.followMyGames} onChange={e=>change({followMyGames:e.target.checked})}/></label><p className="companion-hint">{n.followNote}</p></>}<div className="companion-heading"><h3>{l.chooseGames}</h3><button onClick={()=>changeGames(prefs.games.length===supportedGames.length?[]:supportedGames.map(g=>g.id))}>{prefs.games.length===supportedGames.length?l.none:l.all}</button></div><div className="companion-games">{supportedGames.map(g=><div key={g.id} className={prefs.games.includes(g.id)?'chosen':''}><label><input type="checkbox" checked={prefs.games.includes(g.id)} onChange={()=>changeGames(toggle(prefs.games,g.id))}/>{g.icon&&<img className="companion-game-icon" src={g.icon} alt="" width={32} height={32}/>}<span>{g.name[locale]}</span></label>{g.serviceMode!=='shared-global'&&<select aria-label={g.name[locale]+' '+t.server} value={prefs.gameRegions[g.id]||prefs.region} onChange={e=>changeRegions({...prefs.gameRegions,[g.id]:e.target.value as Region})}>{scheduleRegions(g).map(r=><option key={r} value={r}>{regionLabel(g,r,locale,t)}</option>)}</select>}</div>)}</div>{!prefs.games.length&&<p className="companion-hint">{l.selectNote}</p>}</section>
 <section id="broadcast-reminder-settings" className="broadcast-reminder-settings"><label className="companion-option"><strong>{b.title}</strong><input type="checkbox" checked={prefs.broadcastsEnabled} disabled={(status.reminderConfigVersion||0)<4} onChange={e=>change({broadcastsEnabled:e.target.checked})}/></label><p className="companion-hint">{b.note}</p>{(status.reminderConfigVersion||0)<4?<p className="companion-hint">{b.upgrade}</p>:prefs.broadcastsEnabled&&<div className="companion-chips">{[60,15,0].map(minutes=><button key={minutes} aria-pressed={prefs.broadcastOffsets.includes(minutes)} onClick={()=>change({broadcastOffsets:cleanOffsets(toggle(prefs.broadcastOffsets,minutes))})}>{minutes===0?b.at:minutes+' '+b.minutes}</button>)}</div>}</section>
 <section><h3>{l.kinds}</h3><div className="companion-chips">{(['pickup','weapon','event','package'] as const).map(k=><button key={k} aria-pressed={prefs.kinds.includes(k)} onClick={()=>change({kinds:toggle(prefs.kinds,k)})}>{t[k]}</button>)}</div></section>
 {advanced?<><ReminderControls locale={locale} rules={prefs.notificationRules} onChange={notificationRules=>change({notificationRules})}/><section><label className="companion-option"><h3>{n.tone}</h3><input type="checkbox" checked={prefs.characterTone} onChange={e=>change({characterTone:e.target.checked})}/></label><p className="companion-hint">{n.toneNote}</p><p className="companion-hint">{n.pilot}</p>{prefs.characterTone&&locale==='ko'&&<div className="reminder-voice-preview" aria-label={n.preview}>{notificationVoices.map(v=><div key={v.id}><strong>{v.name==='Chisa'?'치사':'유노'}</strong><p>{v.line}</p><a href={v.sourceUrl} target="_blank" rel="noopener noreferrer">{n.source}</a></div>)}</div>}</section></>:<><p className="companion-hint">{n.upgrade}</p><section><h3>{l.offsets}</h3><div className="companion-chips">{[[4320,l.days3],[1440,l.hours24],[60,l.hour1]].map(([value,label])=><button key={value} aria-pressed={prefs.offsets.includes(Number(value))} onClick={()=>change({offsets:toggle(prefs.offsets,Number(value))})}>{label}</button>)}</div><label className="companion-option"><span>{l.starts}</span><input type="checkbox" checked={prefs.starts} onChange={e=>change({starts:e.target.checked})}/></label></section></>}
 <section><label className="companion-option"><h3>{l.quiet}</h3><input type="checkbox" checked={prefs.quietEnabled} onChange={e=>change({quietEnabled:e.target.checked})}/></label>{prefs.quietEnabled&&<div className="companion-hours">{(['quietStart','quietEnd'] as const).map((key,i)=><label key={key}>{i?l.to:l.from}<select value={prefs[key]} onChange={e=>change({[key]:Number(e.target.value)})}>{Array.from({length:24},(_,h)=><option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>)}</select><ChevronDown size={14}/></label>)}</div>}</section>
 <p className="companion-hint">{n.quietNote}</p><section className="companion-widget"><Smartphone size={26}/><h3>{l.widget}</h3><p>{l.widgetNote}</p><button className="primary-button" onClick={()=>send('widget')}>{l.widget}<Star size={15}/></button></section>
 <div className="companion-actions"><button onClick={()=>send('test')}><Bell size={15}/>{l.test}</button><button disabled={syncing} onClick={()=>void sync(true)}><RefreshCw size={15} className={syncing?'spin':''}/>{l.sync}</button></div>
 {(status.lastTestScheduledAt||0)>0&&<p className="companion-hint" role="status">{(status.lastTestDeliveredAt||0)>=(status.lastTestScheduledAt||0)?a.testDelivered:a.testQueued}</p>}
 <p className="companion-hint">{n.testNote}</p></fieldset><div className="companion-status"><span>{l.lastSync}</span><strong>{status.lastSyncAt?new Intl.DateTimeFormat(locale,{dateStyle:'short',timeStyle:'short'}).format(status.lastSyncAt):l.pending}</strong></div><p className="companion-hint"><b>{l.local}</b><br/>{l.localNote}</p>{(message||status.error||status.scheduleError)&&<p role="status" className="companion-error">{message||(status.scheduleError?a.scheduleError:l.offline)}</p>}</div><footer>{l.savedNote}</footer></section></div>;
}
