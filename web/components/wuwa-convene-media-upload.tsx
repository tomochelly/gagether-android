'use client';
import {useState} from 'react';
type Clip={id:string;sha256:string;bytes:number};
const names:Record<string,string>={'1312':'쇄명','1109':'루실라','1509':'린네'};
export default function ConveneMediaUpload({clips}:{clips:Clip[]}){
 const [files,setFiles]=useState<File[]>([]),[busy,setBusy]=useState(false),[notes,setNotes]=useState<string[]>([]);
 async function upload(){
  if(busy)return;setBusy(true);setNotes([]);
  try{
   for(const file of files){
    if(file.size>24*1024*1024)throw Error('파일이 업로드 한도를 넘었습니다.');
    const bytes=await file.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
    const clip=clips.find(c=>c.sha256===hash&&c.bytes===file.size);
    if(!clip)throw Error('검수된 영상 파일과 일치하지 않습니다: '+file.name);
    const url='/api/wuwa/convene-media/'+hash;
    const response=await fetch(url,{method:'POST',headers:{'Content-Type':'video/mp4'},body:bytes,credentials:'same-origin'});
    const result=await response.json() as {ok?:boolean;sha256?:string;bytes?:number};
    if(!response.ok||!result.ok||result.sha256!==hash||result.bytes!==file.size)throw Error(names[clip.id]+' 업로드 실패');
    const read=await fetch(url,{headers:{Range:'bytes=0-65535'},cache:'no-store'});
    const part=new Uint8Array(await read.arrayBuffer()),original=new Uint8Array(bytes,0,Math.min(65536,bytes.byteLength));
    if(read.status!==206||part.length!==original.length||part.some((v,i)=>v!==original[i]))throw Error(names[clip.id]+' 재생 파일 확인 실패');
    setNotes(old=>[...old,names[clip.id]+' · 업로드와 재생 파일 확인 완료']);
   }
  }catch(e){setNotes(old=>[...old,e instanceof Error?e.message:'영상을 등록하지 못했습니다.']);}
  finally{setBusy(false);}
 }
 return <main style={{maxWidth:850,margin:'60px auto',padding:24}}><h1>튜닝 등장 영상 등록</h1><p>쇄명 편집본과 린네·루실라 QHD 영상을 등록합니다. 검수된 파일만 사용할 수 있습니다.</p><p>등록 대상: {clips.map(c=>names[c.id]).join(' · ')}</p><input type="file" aria-label="검수된 튜닝 영상 파일" accept="video/mp4" multiple disabled={busy} onChange={e=>setFiles(Array.from(e.target.files||[]))}/><p>{files.map(f=>f.name).join(' · ')}</p><button disabled={busy||!files.length} onClick={()=>void upload()} style={{padding:'12px 24px',border:'1px solid',marginBlock:20}}>{busy?'등록 중…':'영상 업로드'}</button><div role="status">{notes.map((n,i)=><p key={i}>{n}</p>)}</div><p><a href="/ko/games/wuwa/convene">튜닝 시뮬레이터로 돌아가기</a></p></main>;
}

