'use client';
import {PERSONAL_APPLIED,personalChanged} from '@/lib/personal-storage-events';
import {useCallback,useEffect,useState} from 'react';
import {NoteStoreError,PERSONAL_NOTES_KEY,readNotes,saveNote,removeNote,type NoteDraft,type NoteErrorCode,type PersonalNote} from '@/lib/personal-notes';

export function usePersonalNotes(){
 const [notes,setNotes]=useState<PersonalNote[]>([]),[ready,setReady]=useState(false),[error,setError]=useState<NoteErrorCode|null>(null);
 const reload=useCallback(()=>{try{setNotes(readNotes(window.localStorage));setError(null);setReady(true);}catch(e){setError(e instanceof NoteStoreError?e.code:'unavailable');setReady(false);}},[]);
 useEffect(()=>{reload();const changed=(e:StorageEvent)=>{if(e.key===PERSONAL_NOTES_KEY||e.key===null)reload();};window.addEventListener('storage',changed);window.addEventListener(PERSONAL_APPLIED,reload);return()=>{window.removeEventListener('storage',changed);window.removeEventListener(PERSONAL_APPLIED,reload);};},[reload]);
 const save=useCallback((draft:NoteDraft,previous?:PersonalNote)=>{const result=saveNote(window.localStorage,draft,previous);setNotes(result);setError(null);personalChanged();},[]);
 const remove=useCallback((note:PersonalNote)=>{setNotes(removeNote(window.localStorage,note));setError(null);personalChanged();},[]);
 return {notes,ready,error,reload,save,remove};
}
export type PersonalNotesStore=ReturnType<typeof usePersonalNotes>;
