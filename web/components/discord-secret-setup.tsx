'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {KeyRound,LockKeyhole,RefreshCw} from 'lucide-react';
import {encryptDiscordSecret,type DiscordHandoffStatus} from '@/lib/secret-handoff';
export default function DiscordSecretSetup(){
 const [data,setData]=useState<DiscordHandoffStatus|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[submitted,setSubmitted]=useState(false);const input=useRef<HTMLInputElement>(null),locked=useRef(false);
 async function load(){const r=await fetch('/api/owner/discord-setup',{cache:'no-store'});if(!r.ok)throw Error();setData(await r.json() as DiscordHandoffStatus);}
 useEffect(()=>{load().catch(()=>setError('설정 화면을 불러오지 못했어요. 관리자 계정으로 로그인했는지 확인하고 다시 시도해주세요.'));},[]);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(locked.current||!data?.ready||!data.clientId||!data.keyId||!data.publicKey||!input.current)return;
  locked.current=true;setBusy(true);setError('');
  try{
   const ciphertext=await encryptDiscordSecret(input.current.value.trim(),{clientId:data.clientId,keyId:data.keyId,publicKey:data.publicKey,redirectUri:data.redirectUri});
   const r=await fetch('/api/owner/discord-setup',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','X-Gagether-Auth':'1'},body:JSON.stringify({clientId:data.clientId,keyId:data.keyId,revision:data.revision,ciphertext})});
   if(!r.ok){if(r.status===409)await load();throw Error();}
   input.current.value='';setSubmitted(true);await load();
  }catch{setError('등록하지 못했어요. Client Secret 값을 확인한 뒤 다시 시도해주세요. 설정이 바뀌었다면 먼저 새로고침해주세요.');}finally{setBusy(false);locked.current=false;}
 }
 return <main className="account-page discord-setup-page"><a className="account-back" href="/owner">← 관리자 화면</a><section className="account-panel"><span className="account-brand">GAGETHER</span><h1><KeyRound size={25} aria-hidden="true"/>Discord 로그인 연결</h1><p>Discord 개발자 포털의 OAuth2 화면에서 <strong>Client Secret</strong>을 복사해 아래에 입력해주세요.</p>{data&&<dl className="discord-setup-facts"><div><dt>Application ID</dt><dd>{data.clientId||'등록 전'}</dd></div><div><dt>반환 주소</dt><dd><code>{data.redirectUri}</code></dd></div></dl>}
  {!data&&!error&&<p role="status">설정 불러오는 중…</p>}
  {data?.configured?<div className="discord-setup-status" role="status"><LockKeyhole size={20} aria-hidden="true"/><p>서버에 로그인 키가 등록되어 있어요. <a href="/account?locale=ko">로그인 화면 열기</a></p></div>:data?.ready?<><form onSubmit={e=>void submit(e)} autoComplete="off"><label className="discord-secret-label" htmlFor="discord-client-secret">Client Secret</label><input ref={input} id="discord-client-secret" name="discord-client-secret" type="password" autoComplete="off" maxLength={256} required spellCheck={false} autoCapitalize="none" disabled={busy}/><button type="submit" className="discord-signin-button" disabled={busy}>{busy?'암호화해서 전달 중…':'비밀키 등록 요청'}</button></form>{(submitted||data.pending)&&<p className="discord-setup-status" role="status">암호화된 등록 요청을 받았어요. 이 대화에 <strong>“입력했어”</strong>라고 알려주면 서버 연결을 마무리할게요. 아직 로그인 활성화 전이며, 요청은 1시간 동안 유효해요.</p>}</>:data&&<p role="status">입력창을 준비하고 있어요. 이 대화에 알려주면 설정을 확인할게요.</p>}
  {error&&<p role="alert">{error}</p>}<button type="button" className="display-reset discord-setup-refresh" disabled={busy} onClick={()=>{setError('');load().catch(()=>setError('다시 불러오지 못했어요. 잠시 후 시도해주세요.'));}}><RefreshCw size={15} aria-hidden="true"/>상태 새로고침</button><p className="account-local-note">키는 이 브라우저에서 암호화된 후 전달됩니다. 입력값은 채팅·공개 페이지·기기 저장소에 저장하지 않아요. 서버 연결이 끝나거나 요청이 만료되면 임시 전달값을 정리합니다.</p></section></main>;
}
