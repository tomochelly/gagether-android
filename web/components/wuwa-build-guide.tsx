'use client';
import {PageReference} from './page-references';
import {useEffect,useState} from 'react';
import type {CharacterBuildGuide} from '@/lib/wuwa-build-data';
import type {Locale} from '@/lib/types';
import {characterPath} from '@/lib/character-roster';
import RosterSourceLink from './roster-source-link';
const words={
 ko:{title:'추천 세팅',source:'커뮤니티 가이드',sets:'에코 · 소나타',main:'주옵션',sub:'부옵션 우선순위',team:'추천 조합',cost:'코스트',guide:'가이드 원문',asOf:'원문 갱신',review:'검토 버전',calculation:'계산 버전',basis:'추천 기준 · 원문',none:'이 캐릭터의 추천 자료는 아직 없습니다.',example:'가이드의 조합 예시 · 선택률 통계 아님',notes:'운용 조건'},
 en:{title:'Build guide',source:'Community guide',sets:'Echo · Sonata',main:'Main stats',sub:'Substat priority',team:'Suggested teams',cost:'Cost',guide:'Original guide',asOf:'Source updated',review:'Review patch',calculation:'Calculation patch',basis:'Build assumptions · original',none:'No build guide is saved for this character.',example:'Guide examples · not usage statistics',notes:'Conditions'},
 ja:{title:'おすすめ育成',source:'コミュニティ攻略',sets:'音骸・ハーモニー',main:'メインステータス',sub:'サブステータス優先度',team:'編成例',cost:'コスト',guide:'攻略原文',asOf:'原文更新',review:'検討バージョン',calculation:'計算バージョン',basis:'前提・英語原文',none:'このキャラクターの育成資料は未収録です。',example:'攻略の編成例・使用率統計ではありません',notes:'運用条件'},
 zh:{title:'配装推荐',source:'社区攻略',sets:'声骸 · 合鸣',main:'主词条',sub:'副词条优先级',team:'配队示例',cost:'费用',guide:'攻略原文',asOf:'原文更新',review:'评测版本',calculation:'计算版本',basis:'前提 · 英文原文',none:'尚未收录此角色的配装攻略。',example:'攻略配队示例 · 非使用率统计',notes:'使用条件'}
};
const statLabels:Record<string,[string,string,string]>={
 'Energy Regen':['공명 효율','共鳴効率','共鸣效率'],'CRIT Rate':['크리티컬 확률','クリティカル率','暴击率'],'CRIT DMG':['크리티컬 피해','クリティカルダメージ','暴击伤害'],
 'Basic Attack DMG':['일반 공격 피해','通常攻撃ダメージ','普攻伤害'],'Heavy Attack DMG':['강공격 피해','重撃ダメージ','重击伤害'],'Resonance Skill DMG':['공명 스킬 피해','共鳴スキルダメージ','共鸣技能伤害'],'Resonance Liberation DMG':['공명 해방 피해','共鳴解放ダメージ','共鸣解放伤害'],
 'Liberation DMG':['공명 해방 피해','共鳴解放ダメージ','共鸣解放伤害'],
 'Healing Bonus':['치유 보너스','回復効果','治疗效果'],'Aero DMG':['기류 피해','気動ダメージ','气动伤害'],'Spectro DMG':['회절 피해','回折ダメージ','衍射伤害'],'Havoc DMG':['인멸 피해','消滅ダメージ','湮灭伤害'],'Fusion DMG':['용융 피해','焦熱ダメージ','热熔伤害'],'Glacio DMG':['응결 피해','凝縮ダメージ','冷凝伤害'],'Electro DMG':['전도 피해','電導ダメージ','导电伤害'],
 'Until Satisfied':['필요량까지','必要量まで','达到需求'],'ATK':['공격력','攻撃力','攻击力'],'DEF':['방어력','防御力','防御力'],'HP':['HP','HP','生命值']
};
function stat(value:string,locale:Locale){if(locale==='en')return value;let text=value;for(const [key,labels]of Object.entries(statLabels).sort((a,b)=>b[0].length-a[0].length))text=text.replaceAll(key,labels[locale==='ko'?0:locale==='ja'?1:2]);return text;}
function Icon({src}:{src:string|undefined}){const[failed,setFailed]=useState(false);return src&&!failed?<img src={src} alt="" width={42} height={42} loading="lazy" decoding="async" onError={()=>setFailed(true)}/>:null;}
declare const __PATCHWORK_BUILD__:string;
const revision=typeof __PATCHWORK_BUILD__==='string'?__PATCHWORK_BUILD__:'development';
const completed=new Map<string,CharacterBuildGuide>();
export default function WuwaBuildGuide({characterId,locale}:{characterId:string;locale:Locale}){
 const key=revision+'|'+characterId,[data,setData]=useState<CharacterBuildGuide|undefined>(()=>completed.get(key)),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{const controller=new AbortController(),saved=completed.get(key);setData(saved);setFailed(false);if(saved)return;const timer=setTimeout(()=>{setFailed(true);controller.abort();},12000);void fetch('/api/wuwa/builds?'+new URLSearchParams({id:characterId,revision}),{credentials:'omit',cache:'default',signal:controller.signal}).then(async r=>{clearTimeout(timer);if(!r.ok)throw Error();const value=await r.json() as CharacterBuildGuide;if(value.gameId!=='wuwa'||value.builds[0]?.characterId!==characterId)throw Error();if(!controller.signal.aborted){completed.set(key,value);if(completed.size>20)completed.delete(completed.keys().next().value!);setData(value);}}).catch(()=>{clearTimeout(timer);if(!controller.signal.aborted)setFailed(true);});return()=>{clearTimeout(timer);controller.abort();};},[key,attempt]);
 if(!data)return <p role="status">{failed?<button onClick={()=>setAttempt(n=>n+1)}>{({ko:'다시 불러오기',en:'Retry',ja:'再読み込み',zh:'重新加载'})[locale]}</button>:({ko:'추천 세팅 불러오는 중…',en:'Loading build guide…',ja:'育成資料を読み込み中…',zh:'正在加载配装推荐…'})[locale]}</p>;
 return <WuwaBuildGuideContent characterId={characterId} locale={locale} data={data}/>;
}
export function WuwaBuildGuideContent({characterId,locale,data}:{characterId:string;locale:Locale;data:CharacterBuildGuide}){
 const t=words[locale],build=data.builds.find(b=>b.characterId===characterId);
 if(!build)return <p>{t.none}</p>;
 return <div className="wuwa-build-guide"><header><span>{t.source} · Prydwen</span><span>{t.review} {build.sourceReviewPatch} · {t.calculation} {build.sourceBuildPatch}</span></header>
  <section><h3>{t.sets}</h3><div className="build-set-list">{build.variants.map((variant,i)=><article key={variant.id}><span className="build-rank">{i+1}</span><div className="build-echo"><Icon src={variant.mainEcho.icon}/><span><small>{t.sets}</small><strong>{variant.mainEcho.name[locale]}</strong></span></div><div className="build-set-pieces">{[variant.set,...variant.complementarySets].map(set=><div key={set.id}><Icon src={set.icon}/><span>{set.name[locale]} <b>×{set.pieces}</b></span></div>)}</div></article>)}</div></section>
  <section><h3>{t.main}<small>{build.costLayout}</small></h3><div className="build-main-stats">{build.mainStats.map((row,i)=><div key={i}><small>{t.cost} {row.cost}</small><strong>{stat(row.value,locale)}</strong></div>)}</div></section>
  <section className="build-substats"><h3>{t.sub}</h3><p>{stat(build.substats,locale)}</p></section>
  {'notes'in build&&build.notes&&<section><h3>{t.notes}</h3><p lang={locale==='ko'?'ko':'en'}>{locale==='ko'?build.notes.ko:build.notes.en}</p>{locale!=='ko'&&locale!=='en'&&<small>EN · Original</small>}</section>}
  <section><h3>{t.team}</h3><p className="build-caption">{t.example}</p><div className="build-team-list">{build.teams.map((team,i)=><article key={team.id}><small>{String(i+1).padStart(2,'0')}</small><div>{team.slots.map((ids,slot)=><div className="build-team-slot" key={slot}>{ids.map(id=>{const c=data.characters.find(c=>c.id===id);return c?<a href={characterPath(locale,'wuwa',id)} key={id}><Icon src={c.icon||undefined}/><span>{c.name[locale]}</span></a>:<span key={id}>{id}</span>;})}</div>)}</div></article>)}</div></section>
  <PageReference locale={locale}><footer><RosterSourceLink href={build.sourceUrl} locale={locale}>{t.guide} · Prydwen</RosterSourceLink><span>{t.asOf} {build.sourceUpdatedDate}</span><details><summary>{t.basis}</summary><p>Lv.{data.basis.level} · 5★ S{data.basis.fiveStarSequence} · 4★ S{data.basis.fourStarSequence}</p><p lang="en">{data.basis.gearAssumption}</p><p lang="en">{build.substats}</p></details></footer></PageReference>
 </div>;
}
