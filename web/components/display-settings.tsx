'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {Minus,Moon,Plus,Settings,Sun,Type,X} from 'lucide-react';
import type {Locale} from '@/lib/types';
import {applyDisplayPreferences,defaultDisplay,defaultOrbitDisplay,DISPLAY_PREFERENCES_KEY,ORBIT_DISPLAY_PREFERENCES_KEY,displayText,parseDisplayPreferences,textScales,type DisplayPreferences} from '@/lib/display-preferences';

export default function DisplaySettings({locale,scope='classic'}:{locale:Locale;scope?:'classic'|'orbit'}){
 const key=scope==='orbit'?ORBIT_DISPLAY_PREFERENCES_KEY:DISPLAY_PREFERENCES_KEY,fallback=scope==='orbit'?defaultOrbitDisplay:defaultDisplay;
 const [preferences,setPreferences]=useState<DisplayPreferences>(fallback),[open,setOpen]=useState(false),[ready,setReady]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const titleId=useId(),dialogId=useId(),t=displayText[locale],scaleIndex=textScales.indexOf(preferences.textScale),dark=preferences.theme==='dark';
 useEffect(()=>{try{const p=parseDisplayPreferences(localStorage.getItem(key),fallback);setPreferences(p);applyDisplayPreferences(p);}catch{}setReady(true);
 const sync=(e:StorageEvent)=>{if(e.key===key){const p=parseDisplayPreferences(e.newValue,fallback);setPreferences(p);applyDisplayPreferences(p);}};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[key,fallback]);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 function change(p:DisplayPreferences){setPreferences(p);applyDisplayPreferences(p);try{localStorage.setItem(key,JSON.stringify(p));}catch{}}
 const close=()=>{setOpen(false);trigger.current?.focus();};
 return <>
  <div className="display-quick-controls">
   <button type="button" className="theme-switch" role="switch" aria-checked={dark} aria-label={t.darkMode} title={`${t.theme}: ${dark?t.dark:t.light}`} disabled={!ready} onClick={()=>change({...preferences,theme:dark?'light':'dark'})}>
    <span className="theme-switch-track" aria-hidden="true"><span className="theme-switch-thumb"/><Sun size={15}/><Moon size={15}/></span>
   </button>
   <button type="button" ref={trigger} className="display-settings-trigger" onClick={()=>setOpen(true)} aria-haspopup="dialog" aria-controls={dialogId} aria-expanded={open} aria-label={t.settings} title={t.settings}><Settings size={19} aria-hidden="true"/></button>
  </div>
  <dialog id={dialogId} ref={dialog} className="display-settings-dialog" aria-labelledby={titleId} onClose={()=>setOpen(false)} onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===dialog.current){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}}}>
   <header><h2 id={titleId}><Settings size={20} aria-hidden="true"/>{t.settings}</h2><button type="button" onClick={close} aria-label={t.close}><X size={20}/></button></header>
   <fieldset disabled={!ready}><legend><Type size={17} aria-hidden="true"/>{t.size}</legend>
    <div className="text-scale-stepper"><button type="button" disabled={scaleIndex===0} onClick={()=>change({...preferences,textScale:textScales[scaleIndex-1]})} aria-label={t.smaller}><Minus size={18}/></button><strong aria-live="polite" aria-atomic="true">{preferences.textScale}%</strong><button type="button" disabled={scaleIndex===textScales.length-1} onClick={()=>change({...preferences,textScale:textScales[scaleIndex+1]})} aria-label={t.larger}><Plus size={18}/></button></div>
    <div className="text-scale-options">{textScales.map(textScale=><button type="button" key={textScale} aria-pressed={preferences.textScale===textScale} onClick={()=>change({...preferences,textScale})}>{textScale}%</button>)}</div>
   </fieldset>
   <div className="display-preview"><span>{t.preview}</span><p className="display-sample">{t.sample}</p></div>
   <div className="display-settings-footer"><p className="display-remember">{t.remember}</p><button type="button" className="display-reset" onClick={()=>change({...preferences,textScale:100})}>{t.reset}</button></div>
  </dialog>
 </>;
}
