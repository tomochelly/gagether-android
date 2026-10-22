'use client';
import {useEffect,useRef,useState} from 'react';
import {Moon,Sun,Type,X} from 'lucide-react';
import type {Locale} from '@/lib/types';
import {applyDisplayPreferences,defaultDisplay,DISPLAY_PREFERENCES_KEY,displayText,parseDisplayPreferences,textScales,type DisplayPreferences} from '@/lib/display-preferences';

export default function DisplaySettings({locale}:{locale:Locale}){
 const [preferences,setPreferences]=useState<DisplayPreferences>(defaultDisplay),[open,setOpen]=useState(false),[ready,setReady]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);const t=displayText[locale];
 useEffect(()=>{try{const p=parseDisplayPreferences(localStorage.getItem(DISPLAY_PREFERENCES_KEY));setPreferences(p);applyDisplayPreferences(p);}catch{}setReady(true);
 const sync=(e:StorageEvent)=>{if(e.key===DISPLAY_PREFERENCES_KEY){const p=parseDisplayPreferences(e.newValue);setPreferences(p);applyDisplayPreferences(p);}};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 function change(p:DisplayPreferences){setPreferences(p);applyDisplayPreferences(p);try{localStorage.setItem(DISPLAY_PREFERENCES_KEY,JSON.stringify(p));}catch{}}
 const close=()=>{setOpen(false);trigger.current?.focus();};
 return <><button ref={trigger} className="display-settings-trigger" onClick={()=>setOpen(true)} aria-haspopup="dialog" aria-label={t.settings} title={t.settings}><Type size={18}/><span>{t.settings}</span></button>
 <dialog ref={dialog} className="display-settings-dialog" aria-labelledby="display-settings-title" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===dialog.current){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}}}>
  <header><h2 id="display-settings-title">{t.settings}</h2><button onClick={close} aria-label={t.close}><X size={20}/></button></header>
  <fieldset disabled={!ready}><legend>{t.theme}</legend><div className="display-options">{(['dark','light'] as const).map(theme=><button key={theme} aria-pressed={preferences.theme===theme} onClick={()=>change({...preferences,theme})}>{theme==='light'?<Sun size={18}/>:<Moon size={18}/>}<span>{t[theme]}</span></button>)}</div></fieldset>
  <fieldset disabled={!ready}><legend>{t.size} <strong>{preferences.textScale}%</strong></legend><div className="text-scale-options">{textScales.map(textScale=><button key={textScale} aria-pressed={preferences.textScale===textScale} onClick={()=>change({...preferences,textScale})}>{textScale}%</button>)}</div></fieldset>
  <p className="display-sample" aria-live="polite">{t.sample}</p><p className="display-remember">{t.remember}</p><button className="display-reset" onClick={()=>change({...preferences,textScale:100})}>{t.reset}</button>
 </dialog></>;
}
