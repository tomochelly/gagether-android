'use client';
import {useState} from 'react';
import {Film,ChevronDown} from 'lucide-react';
import type {Locale} from '@/lib/types';
import {wuwaCharacterVideos,preferredWuwaClips} from '@/lib/wuwa-character-videos';
import {VideoPlayer} from './video-library';
const copy={ko:{title:'스킬 모션 · 캐릭터 영상',demo:'전투 시연',intro:'캐릭터 소개',pv:'캐릭터 PV'},en:{title:'Skill motions · Character videos',demo:'Combat demonstration',intro:'Character introduction',pv:'Character trailer'},ja:{title:'スキルモーション・キャラクター映像',demo:'戦闘実演',intro:'キャラクター紹介',pv:'キャラクターPV'},zh:{title:'技能动作 · 角色影像',demo:'战斗演示',intro:'角色介绍',pv:'角色PV'}};
export default function WuwaSkillVideos({characterId,sourceIds,locale}:{characterId:string;sourceIds:number[];locale:Locale}){
 const [open,setOpen]=useState(false),[chosen,setChosen]=useState(''),clips=preferredWuwaClips(wuwaCharacterVideos(characterId,sourceIds),locale),t=copy[locale];
 const selected=clips.find(v=>v.youtubeId===chosen)||clips[0];if(!selected)return null;
 return <details className="reference-skill-section character-video-disclosure" onToggle={e=>setOpen(e.currentTarget.open)}><summary><Film size={18}/>{t.title}<span>{clips.length}</span><ChevronDown size={16}/></summary>{open&&<section className="entry-videos">{clips.length>1&&<div className="entry-video-tabs">{clips.map(v=><button type="button" aria-pressed={selected.youtubeId===v.youtubeId} key={v.youtubeId} onClick={()=>setChosen(v.youtubeId)}>{v.format==='demo'?t.demo:v.format==='intro'?t.intro:t.pv}</button>)}</div>}<VideoPlayer key={selected.youtubeId+locale} clip={selected} locale={locale}/><h4>{selected.title[locale]||selected.originalTitle}</h4><small className="video-channel">{selected.channel}</small></section>}</details>;
}
