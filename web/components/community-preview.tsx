'use client';
import {useEffect,useRef,useState} from 'react';
import {communityMembers,type CommunitySummary} from '@/lib/community';
import {communityTarget,subscribeSummary,refreshCommunitySummaries} from '@/lib/community-summary-client';
import type {Entry,Locale} from '@/lib/types';
const words={ko:{title:'별점 · 의견',empty:'첫 평가를 남겨 주세요',comments:'의견',ratings:'명 평가',loading:'평가 확인 중…',error:'평가 다시 보기',more:'평가·의견 보기',choose:'캐릭터 선택',none:'아직 한줄 의견이 없어요'},en:{title:'Ratings · Opinions',empty:'Be the first to rate',comments:'opinions',ratings:'ratings',loading:'Loading ratings…',error:'View ratings',more:'View ratings and opinions',choose:'Choose character',none:'No written opinions yet'},ja:{title:'星評価・感想',empty:'最初の評価をどうぞ',comments:'感想',ratings:'件の評価',loading:'評価を確認中…',error:'評価を再表示',more:'評価・感想を見る',choose:'キャラクターを選択',none:'まだ感想がありません'},zh:{title:'评分 · 感想',empty:'来留下首个评分',comments:'感想',ratings:'人评分',loading:'正在加载评分…',error:'查看评分',more:'查看评分和感想',choose:'选择角色',none:'暂无文字感想'}};
export default function CommunityPreview({entry,locale,onOpen}:{entry:Entry;locale:Locale;onOpen:(member:string)=>void}){
 const members=communityMembers(entry),[selected,setSelected]=useState(''),[visible,setVisible]=useState(false),ref=useRef<HTMLDivElement>(null);
 const member=members.find(m=>m.key===selected)||members[0],t=words[locale];
 const [value,setValue]=useState<{data:CommunitySummary|null;error:boolean}>({data:null,error:false});
 useEffect(()=>{const element=ref.current;if(!element)return;if(typeof IntersectionObserver==='undefined'){setVisible(true);return;}const observer=new IntersectionObserver(([e])=>setVisible(e.isIntersecting),{rootMargin:'80px'});observer.observe(element);return()=>observer.disconnect();},[]);
 useEffect(()=>{setValue({data:null,error:false});if(!visible||!member)return;let active=true,off:(()=>void)|undefined;
 void communityTarget(entry,member.key).then(target=>{if(active)off=subscribeSummary(target,entry.id,setValue);}).catch(()=>{if(active)setValue({data:null,error:true});});
 const refresh=()=>{if(document.visibilityState==='visible')refreshCommunitySummaries();};window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
 return()=>{active=false;off?.();window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};},[entry.id,entry.gameId,entry.region,member?.key,visible]);
 if(!member)return null;const {data,error}=value;
 return <div ref={ref} className="card-community">
 {members.length>1&&<select aria-label={t.choose} value={member.key} onChange={e=>setSelected(e.target.value)}>{members.map((m,i)=><option key={m.key} value={m.key}>{m.name[locale]||`${t.choose} ${i+1}`}</option>)}</select>}
 <button type="button" className="card-community-main" onClick={()=>onOpen(member.key)} aria-label={t.more+(member.name[locale]?' · '+member.name[locale]:'')}>
 <span className="card-community-label">{t.title}</span>
 <span className="card-community-score"><span className="card-community-stars" aria-hidden="true">☆☆☆☆☆<span style={{width:`${(data?.average||0)*20}%`}}>★★★★★</span></span><strong>{data?.average!=null?data.average.toFixed(1):'—'}</strong><small>/ 5</small></span>
 <span className="card-community-count">{data?`${data.count} ${t.ratings} · ${t.comments} ${data.comments}`:error?t.error:t.loading}</span>
 <span className={'card-community-excerpt'+(data?.excerpt?' has-opinion':'')}>{data?.excerpt||(!data?'':data.count?t.none:t.empty)}</span>
 </button></div>;
}
