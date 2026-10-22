'use client';
import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {ArrowDown,ArrowUp,GripVertical,ListOrdered,RotateCcw,X} from 'lucide-react';
import {GAME_ORDER_KEY,moveGame,normalizeGameOrder,readGameOrder} from '@/lib/game-order';
import {PERSONAL_APPLIED,personalChanged} from '@/lib/personal-storage-events';
import type {Game,Locale} from '@/lib/types';

const copy={
 ko:{title:'게임 순서',help:'끌어서 옮기거나 화살표를 누르세요. 자동 저장되며 Google 로그인 시 기기 간 동기화돼요.',up:'위로',down:'아래로',reset:'기본 순서',close:'완료',error:'순서를 저장하지 못했어요. 브라우저 저장소 설정을 확인해 주세요.',locked:'저장된 순서를 읽지 못했어요. 기존 값은 보존했습니다.'},
 en:{title:'Game order',help:'Drag a game or use the arrows. Saved automatically; synced across devices when signed in with Google.',up:'Move up',down:'Move down',reset:'Default order',close:'Done',error:'Could not save the order. Check browser storage settings.',locked:'The saved order could not be read. Existing data was preserved.'},
 ja:{title:'ゲームの並び順',help:'ドラッグまたは矢印で移動できます。自動保存し、Googleログイン時は端末間で同期します。',up:'上へ',down:'下へ',reset:'初期順序',close:'完了',error:'保存できませんでした。ブラウザの保存設定をご確認ください。',locked:'保存済みの並び順を読み込めませんでした。既存データは保持しています。'},
 zh:{title:'游戏排序',help:'拖动游戏或使用箭头调整，自动保存，Google登录后在设备间同步。',up:'上移',down:'下移',reset:'默认排序',close:'完成',error:'无法保存排序，请检查浏览器存储设置。',locked:'无法读取已保存的排序，原有数据已保留。'},
};
export function useGameOrder(games:Game[]){
 const ids=useMemo(()=>games.map(g=>g.id),[games]),[order,setOrder]=useState<string[]>([]),[error,setError]=useState<'locked'|'error'|null>(null);
 const writable=useRef(true);
 useEffect(()=>{const read=()=>{try{const result=readGameOrder(localStorage.getItem(GAME_ORDER_KEY),ids);setOrder(result.order);writable.current=result.writable;setError(result.writable?null:'locked');}catch{writable.current=false;setError('error');}};read();const sync=(e:StorageEvent)=>{if(e.key===GAME_ORDER_KEY)read();};window.addEventListener('storage',sync);window.addEventListener(PERSONAL_APPLIED,read);return()=>{window.removeEventListener('storage',sync);window.removeEventListener(PERSONAL_APPLIED,read);};},[ids.join('|')]);
 const ordered=useMemo(()=>normalizeGameOrder(order,ids),[order,ids]);
 const sortedGames=useMemo(()=>ordered.map(id=>games.find(g=>g.id===id)!),[games,ordered]);
 const update=(next:string[])=>{if(!writable.current)return;const clean=normalizeGameOrder(next,ids);setOrder(clean);try{localStorage.setItem(GAME_ORDER_KEY,JSON.stringify({version:1,ids:clean}));personalChanged();setError(null);}catch{setError('error');}};
 return {games:sortedGames,order:ordered,update,error,locked:!writable.current,reset:()=>update(ids)};
}
export default function GameOrderControl({games,locale,order,onChange,onReset,error,locked}:{games:Game[];locale:Locale;order:string[];onChange:(ids:string[])=>void;onReset:()=>void;error:'locked'|'error'|null;locked:boolean}){
 const [open,setOpen]=useState(false),[dragged,setDragged]=useState<string|null>(null),ref=useRef<HTMLDialogElement>(null),id=useId(),t=copy[locale];
 useEffect(()=>{const d=ref.current;if(open&&!d?.open)d?.showModal();else if(!open&&d?.open)d.close();},[open]);
 return <><button type="button" className="game-order-trigger" onClick={()=>setOpen(true)} aria-label={t.title} title={t.title}><ListOrdered size={15}/><span>{t.title}</span></button><dialog ref={ref} className="game-order-dialog" aria-labelledby={id} onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}><header><h2 id={id}>{t.title}</h2><button type="button" aria-label={t.close} onClick={()=>setOpen(false)}><X size={20}/></button></header><p>{t.help}</p>{error&&<p role="alert" className="game-order-error">{t[error]}</p>}<ol>{games.map((g,i)=><li key={g.id} draggable={!locked} className={dragged===g.id?'is-dragging':''} onDragStart={e=>{setDragged(g.id);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',g.id);}} onDragEnd={()=>setDragged(null)} onDragOver={e=>{if(dragged)e.preventDefault();}} onDrop={e=>{e.preventDefault();if(dragged)onChange(moveGame(order,dragged,i));setDragged(null);}}><GripVertical size={16} aria-hidden="true"/><img src={g.icon||g.logo} alt="" loading="lazy"/><span>{g.name[locale]}</span><button type="button" disabled={locked||i===0} aria-label={g.name[locale]+' · '+t.up} onClick={()=>onChange(moveGame(order,g.id,i-1))}><ArrowUp size={17}/></button><button type="button" disabled={locked||i===games.length-1} aria-label={g.name[locale]+' · '+t.down} onClick={()=>onChange(moveGame(order,g.id,i+1))}><ArrowDown size={17}/></button></li>)}</ol><footer><button type="button" disabled={locked} onClick={onReset}><RotateCcw size={15}/>{t.reset}</button><button type="button" onClick={()=>setOpen(false)}>{t.close}</button></footer></dialog></>;
}
