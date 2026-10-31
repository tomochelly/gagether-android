'use client';
import {useEffect,useState} from 'react';
type Row={id:string;entry:string;member:string;body:string;stars:number;reports:number};
export default function CommunityModeration(){
 const [rows,setRows]=useState<Row[]|null>(null),[error,setError]=useState(false),[busy,setBusy]=useState(false);
 async function load(){setError(false);try{const r=await fetch('/api/owner/community',{cache:'no-store'});if(!r.ok)throw Error();setRows((await r.json() as {reviews:Row[]}).reviews);}catch{setError(true);}}
 useEffect(()=>{void load();},[]);
 async function hide(r:Row){setBusy(true);try{const res=await fetch('/api/community',{method:'POST',headers:{'Content-Type':'application/json','X-Gagether-Auth':'1'},body:JSON.stringify({entry:r.entry,member:r.member,id:r.id,action:'moderate'})});if(!res.ok)throw Error();await load();}catch{setError(true);}finally{setBusy(false);}}
 return <main className="account-page"><a href="/owner">← 관리 화면</a><h1>신고된 의견</h1><p>최근 신고 상위 50개 · 숨긴 의견은 공개 별점 집계에서도 제외됩니다.</p>{error&&<p role="alert">불러오지 못했습니다. <button onClick={load}>다시 시도</button></p>}{rows===null?<p>불러오는 중…</p>:rows.length===0?<p>검토할 신고가 없습니다.</p>:<div className="community-opinions">{rows.map(r=><article key={r.id}><a href={'/?entry='+encodeURIComponent(r.entry)}>{r.member}</a><p>{r.body}</p><footer><span>★ {r.stars} · 신고 {r.reports}</span><button disabled={busy} onClick={()=>hide(r)}>숨기기</button></footer></article>)}</div>}</main>;
}
