'use client';
import {nikkeRecruitEnabled} from '@/lib/nikke-recruit-media';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,ChevronDown,MessageCircle,Sparkles,Swords,X} from 'lucide-react';
import type {Game,Locale} from '@/lib/types';

const copy={
 ko:{label:'바로 체험',combat:'전투 세팅·기록',simulator:'가챠 시뮬레이터',community:'커뮤니티',combatHelp:'내 세팅을 저장하고, 다른 유저의 파티와 전투 기록을 살펴보세요.',simulatorHelp:'명조·이환·니케의 가챠를 체험해 보세요.',setups:'내 세팅',records:'전투 기록',stats:'파티 통계',close:'닫기'},
 en:{label:'Explore',combat:'Builds & records',simulator:'Gacha simulators',community:'Community',combatHelp:'Save your builds and explore community teams and battle records.',simulatorHelp:'Try the Wuthering Waves, NTE and NIKKE gacha simulators.',setups:'Builds',records:'Records',stats:'Team stats',close:'Close'},
 ja:{label:'使ってみる',combat:'育成・戦闘記録',simulator:'ガチャ体験',community:'コミュニティ',combatHelp:'育成設定を保存し、ほかのプレイヤーの編成や戦闘記録を見てみましょう。',simulatorHelp:'鳴潮・異環・NIKKEのガチャを体験できます。',setups:'育成設定',records:'戦闘記録',stats:'編成統計',close:'閉じる'},
 zh:{label:'立即体验',combat:'配装与战斗记录',simulator:'抽卡模拟器',community:'社区',combatHelp:'保存个人配装，查看其他玩家的队伍和战斗记录。',simulatorHelp:'体验《鸣潮》《异环》和《NIKKE》的抽卡模拟器。',setups:'我的配装',records:'战斗记录',stats:'队伍统计',close:'关闭'}
};
export default function FeatureShortcuts({locale,games,favorites=[]}:{locale:Locale;games:Game[];favorites?:string[]}){
 const t=copy[locale],[opened,setOpened]=useState<'combat'|'simulator'|null>(null),root=useRef<HTMLElement>(null),combat=useRef<HTMLButtonElement>(null),simulator=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!opened)return;const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpened(null);},escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpened(null);(opened==='combat'?combat:simulator).current?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[opened]);
 useEffect(()=>setOpened(null),[locale]);
 const listed=(ids:string[])=>ids.map(id=>games.find(g=>g.id===id)).filter((g):g is Game=>!!g).sort((a,b)=>Number(favorites.includes(b.id))-Number(favorites.includes(a.id)));
 return <nav ref={root} className="feature-shortcuts" aria-label={t.label}>
  <span className="feature-shortcuts-label">{t.label}</span><div className="feature-shortcuts-actions">
   <button ref={combat} type="button" aria-expanded={opened==='combat'} aria-controls="feature-combat-options" onClick={()=>setOpened(opened==='combat'?null:'combat')}><Swords size={16}/><span>{t.combat}</span><ChevronDown size={12}/></button>
   <button ref={simulator} type="button" aria-expanded={opened==='simulator'} aria-controls="feature-simulator-options" onClick={()=>setOpened(opened==='simulator'?null:'simulator')}><Sparkles size={16}/><span>{t.simulator}</span><ChevronDown size={12}/></button>
   <a href={`/${locale}/community`}><MessageCircle size={16}/><span>{t.community}</span><ArrowUpRight size={12}/></a>
  </div>
  {(['combat','simulator']as const).map(kind=><section key={kind} hidden={opened!==kind} className="feature-shortcuts-panel" id={`feature-${kind}-options`} aria-label={t[kind]}><header><p>{kind==='combat'?t.combatHelp:t.simulatorHelp}</p><button type="button" aria-label={t.close} onClick={()=>{setOpened(null);(kind==='combat'?combat:simulator).current?.focus();}}><X size={17}/></button></header>
   <div className="feature-shortcuts-games">{listed(kind==='combat'?['wuwa','zzz','gfl2']:['wuwa','nte',...(nikkeRecruitEnabled?['nikke']:[])]).map(game=><div key={game.id}><strong>{game.name[locale]}</strong>{kind==='combat'?<div>{(['setups','records','stats']as const).map(view=><a key={view} href={`/${locale}/games/${game.id}/combat?view=${view}`}>{t[view]}<ArrowUpRight size={11}/></a>)}</div>:<a href={`/${locale}/games/${game.id}/convene`}>{t.simulator}<ArrowUpRight size={12}/></a>}</div>)}</div>
  </section>)}
 </nav>;
}
