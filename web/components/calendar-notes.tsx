'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {CalendarPlus,LockKeyhole,NotebookPen,Pencil,Plus,Sparkles,Trash2,X} from 'lucide-react';
import type {Locale,Region} from '@/lib/types';
import {effectiveRegion,regionLabel,scheduleRegions} from '@/lib/presentation';
import {NoteStoreError,validNoteDraft,type NoteDraft,type NoteKind,type PersonalNote} from '@/lib/personal-notes';
import {personalUi} from '@/lib/personal-ui';
import {useCatalog} from './catalog-context';
import type {PersonalNotesStore} from './use-personal-notes';

const icons={memo:NotebookPen,pull:Sparkles,plan:CalendarPlus};
export function CalendarNotes({notes,store,locale,onAdd,onEdit}:{notes:PersonalNote[];store:PersonalNotesStore;locale:Locale;onAdd:()=>void;onEdit:(note:PersonalNote)=>void}){
 const l=personalUi[locale],{byId,t}=useCatalog();
 if(store.error)return <div className="personal-notes-empty" role="alert"><p>{l[store.error]}</p><button onClick={store.reload}>{l.retry}</button></div>;
 if(!store.ready)return <p className="personal-notes-empty" role="status">{l.loading}</p>;
 return <div className="personal-note-list">{notes.map(note=>{const Icon=icons[note.kind],game=note.gameId?byId[note.gameId]:undefined;return <button className={'personal-note-row note-'+note.kind} key={note.id} onClick={()=>onEdit(note)} aria-label={l.edit+' · '+note.title}><Icon size={17}/><span><small>{l[note.kind]} · {game?game.name[locale]:l.general}{game&&note.region?' · '+regionLabel(game,note.region,locale,t):''}</small><strong>{note.title}</strong>{note.body&&<span className="personal-note-excerpt">{note.body}</span>}</span><Pencil size={14}/></button>;})}{!notes.length&&<div className="personal-notes-empty"><NotebookPen size={22}/><p>{l.empty}</p><button onClick={onAdd}><Plus size={15}/>{l.add}</button></div>}</div>;
}

export function CalendarNoteEditor({note,date,gameId,region,locale,store,onClose,onSaved}:{note?:PersonalNote;date:string;gameId?:string;region:Region;locale:Locale;store:PersonalNotesStore;onClose:()=>void;onSaved:(date:string,message:string)=>void}){
 const {games,byId,t}=useCatalog(),l=personalUi[locale],uid=useId(),dialog=useRef<HTMLDialogElement>(null);
 const [draft,setDraft]=useState<NoteDraft>(()=>note?{date:note.date,gameId:note.gameId,region:note.region,kind:note.kind,title:note.title,body:note.body}:{date,gameId,region:gameId?effectiveRegion(byId[gameId],region):undefined,kind:'memo',title:'',body:''});
 const [error,setError]=useState(''),[confirmDelete,setConfirmDelete]=useState(false);
 const game=draft.gameId?byId[draft.gameId]:undefined;
 useEffect(()=>{
  const el=dialog.current,prior=document.activeElement as HTMLElement|null,overflow=document.documentElement.style.overflow;
  el?.showModal();document.documentElement.style.overflow='hidden';el?.querySelector<HTMLInputElement>('[name="note-title"]')?.focus({preventScroll:true});
  return()=>{el?.close();document.documentElement.style.overflow=overflow;if(prior?.isConnected)prior.focus({preventScroll:true});};
 },[]);
 const change=(patch:Partial<NoteDraft>)=>{setDraft(d=>({...d,...patch}));setError('');setConfirmDelete(false);};
 const showError=(e:unknown)=>setError(e instanceof NoteStoreError?l[e.code]:l.unavailable);
 const save=()=>{if(!validNoteDraft(draft)){setError(l.invalidForm);return;}try{store.save(draft,note);onSaved(draft.date,l.saved);}catch(e){showError(e);}};
 const remove=()=>{if(!note)return;try{store.remove(note);onSaved(date,l.deleted);}catch(e){showError(e);}};
 return <dialog ref={dialog} className="personal-note-dialog" aria-labelledby={uid+'-heading'} aria-describedby={uid+'-privacy'} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===dialog.current)onClose();}}><form onSubmit={e=>{e.preventDefault();save();}}>
  <header><div><NotebookPen size={19}/><h2 id={uid+'-heading'}>{note?l.edit:l.add}</h2></div><button type="button" aria-label={l.close} onClick={onClose}><X size={21}/></button></header>
  <div className="personal-note-fields"><div className="note-kind-options" role="group" aria-label={l.notes}>{(['memo','pull','plan'] as NoteKind[]).map(kind=>{const Icon=icons[kind];return <button type="button" key={kind} aria-pressed={draft.kind===kind} onClick={()=>change({kind})}><Icon size={15}/>{l[kind]}</button>;})}</div>
   <div className="note-field-grid"><label htmlFor={uid+'-date'}>{l.date}<input id={uid+'-date'} type="date" value={draft.date} min="1900-01-01" max="2199-12-31" required onChange={e=>change({date:e.target.value})}/></label><label htmlFor={uid+'-game'}>{l.game}<select id={uid+'-game'} value={draft.gameId||''} onChange={e=>{const id=e.target.value;change({gameId:id||undefined,region:id?effectiveRegion(byId[id],region):undefined});}}><option value="">{l.general}</option>{games.map(g=><option key={g.id} value={g.id}>{g.name[locale]}</option>)}</select></label></div>
   {game&&game.serviceMode!=='shared-global'&&<label htmlFor={uid+'-region'}>{l.server}<select id={uid+'-region'} value={draft.region||effectiveRegion(game,region)} onChange={e=>change({region:e.target.value as Region})}>{scheduleRegions(game).map(r=><option key={r} value={r}>{regionLabel(game,r,locale,t)}</option>)}</select></label>}
   <label htmlFor={uid+'-title'}>{draft.kind==='pull'?l.pullTitle:l.title}<input id={uid+'-title'} name="note-title" type="text" value={draft.title} maxLength={120} required placeholder={draft.kind==='pull'?l.pullHint:l.titleHint} onChange={e=>change({title:e.target.value})}/></label>
   <label htmlFor={uid+'-body'}>{l.body}<textarea id={uid+'-body'} value={draft.body} rows={4} maxLength={2000} placeholder={l.bodyHint} onChange={e=>change({body:e.target.value})}/><small className="note-character-count">{draft.body.length.toLocaleString()} / 2,000</small></label>
   <p className="note-privacy" id={uid+'-privacy'}><LockKeyhole size={13}/><span>{l.private}<small>{l.localNote}</small></span></p>
   {error&&<p className="note-error" role="alert">{error}</p>}
  </div>
  <footer>{confirmDelete?<div className="note-delete-confirm" role="alert"><p>{l.confirmDelete}</p><button type="button" onClick={()=>setConfirmDelete(false)}>{l.cancel}</button><button type="button" className="note-delete" onClick={remove}>{l.deleteConfirm}</button></div>:<>{note&&<button type="button" className="note-delete" onClick={()=>setConfirmDelete(true)}><Trash2 size={15}/>{l.delete}</button>}<div className="note-form-actions"><button type="button" onClick={onClose}>{l.cancel}</button><button type="submit" className="note-save">{l.save}</button></div></>}</footer>
 </form></dialog>;
}
