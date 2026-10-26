'use client';
import type {Entry,Locale} from '@/lib/types';
import {recurringRepeat,recurringWindow,type RecurringRepeat} from '@/lib/recurring-schedule';
import EditorNumberInput from './editor-number-input';
const words={
 ko:{title:'주기 콘텐츠',enable:'주기 콘텐츠에 등록',mode:'콘텐츠 식별자',cycle:'주기 설명',repeat:'기준일부터 자동 반복',days:'반복 간격 (일)',anchor:'기준 초기화',dateOnly:'날짜만 입력',time:'시각까지 입력 · UTC+9',zone:'날짜 기준 시간대',next:'다음 초기화',hint:'출처 링크 없이 운영자 설정으로 반복할 수 있어요. 일정만 반복하며 보스·시즌 보상은 새로 만들지 않아요.',source:'출처 링크 (선택사항, 한 줄에 하나)'},
 en:{title:'Recurring challenge',enable:'Show in recurring challenges',mode:'Mode identifier',cycle:'Cycle description',repeat:'Repeat from the anchor',days:'Interval (days)',anchor:'Reset anchor',dateOnly:'Date only',time:'Exact time · UTC+9',zone:'Date timezone',next:'Next reset',hint:'Owner-defined repeats do not need a source link. Only the schedule repeats; bosses and seasonal rewards are not generated.',source:'Source links (optional, one per line)'},
 ja:{title:'定期コンテンツ',enable:'定期コンテンツに登録',mode:'コンテンツ識別子',cycle:'周期の説明',repeat:'基準日から自動繰り返し',days:'繰り返し間隔（日）',anchor:'基準リセット',dateOnly:'日付のみ',time:'時刻まで入力 · UTC+9',zone:'日付のタイムゾーン',next:'次のリセット',hint:'出典リンクなしでも運営者設定で繰り返せます。日程のみを繰り返し、ボスやシーズン報酬は生成しません。',source:'出典リンク（任意、1行に1件）'},
 zh:{title:'周期内容',enable:'登记为周期内容',mode:'内容标识',cycle:'周期说明',repeat:'从基准日期自动重复',days:'重复间隔（天）',anchor:'基准重置',dateOnly:'仅日期',time:'精确时间 · UTC+9',zone:'日期时区',next:'下次重置',hint:'无需来源链接即可使用管理者设定的重复日程。仅重复时间，不生成首领或赛季奖励。',source:'来源链接（可选，每行一个）'}
};
const copy=(ko:string,en:string,ja:string,zh:string)=>({ko,en,ja,zh});
const note=copy('운영자가 직접 입력한 초기화 일정','Reset schedule entered by the owner','運営者が入力したリセット日程','管理者输入的重置日程');
const inputDate=(value?:string|null)=>value&&Number.isFinite(Date.parse(value))?new Date(Date.parse(value)+9*3600000).toISOString().slice(0,16):'';
export function editRecurringEnd(entry:Entry,value:string,dateOnly=false):Partial<Entry>{
 return editRecurringEndValue(entry,dateOnly?value:value?value+':00+09:00':'',dateOnly);
}
/** The inline advanced field already contains an ISO timestamp. */
export function editRecurringEndValue(entry:Entry,value:string,dateOnly=false):Partial<Entry>{
 const end=dateOnly?value||undefined:value||null,r=entry.recurring;
 const changes:Partial<Entry>=dateOnly?{endAt:null,endDate:value||undefined}:{endAt:end as string|null,endDate:undefined};
 if(!r)return changes;
 const rule=recurringRepeat(entry),at=new Date().toISOString();
 return {...changes,recurring:{...r,resetAt:dateOnly?null:end as string|null,resetDate:dateOnly?value||undefined:undefined,resetEvidence:{kind:'owner-confirmed',timeZone:'Asia/Seoul',note,verifiedAt:at},...rule?{repeat:{...rule,anchorAt:dateOnly?undefined:end as string||undefined,anchorDate:dateOnly?value||undefined:undefined,confirmedAt:at}}:{}}};
}
export default function RecurringEditor({entry:e,locale,lang,onChange}:{entry:Entry;locale:Locale;lang:Locale;onChange:(changes:Partial<Entry>)=>void}){
 const t=words[locale],r=e.recurring,rule=recurringRepeat(e),dateOnly=!!(rule?.anchorDate||!rule?.anchorAt&&!r?.resetAt&&r?.resetDate),at=new Date().toISOString();
 const patch=(changes:Partial<NonNullable<Entry['recurring']>>)=>r&&onChange({recurring:{...r,...changes}});
 const enable=(checked:boolean)=>onChange({recurring:checked?r||{modeId:e.id.toLowerCase().replace(/[^a-z0-9_-]/g,'-').slice(0,100),cycleLabel:copy('운영자 설정','Owner-defined','運営者設定','管理者设定'),sourceKind:'owner',sourceUrls:e.sourceUrl?[e.sourceUrl]:[],verifiedAt:at,resetAt:e.endAt||undefined,resetDate:e.endAt?undefined:e.endDate}:undefined});
 const repeat=(changes:Partial<RecurringRepeat>)=>{const base:RecurringRepeat=rule||{kind:'owner-defined',enabled:true,intervalDays:28,anchorAt:e.endAt||r?.resetAt||undefined,anchorDate:e.endAt||r?.resetAt?undefined:e.endDate||r?.resetDate,timeZone:r?.resetEvidence?.timeZone||'Asia/Seoul',confirmedAt:at};patch({repeat:{...base,...changes,confirmedAt:at}});};
 const preview=recurringWindow(e,Date.now());
 return <details className="editor-section" open data-editor-section="recurring"><summary>{t.title}</summary><label className="editor-toggle"><input type="checkbox" checked={!!r} onChange={x=>enable(x.target.checked)}/><span>{t.enable}</span></label>{r&&<><div className="editor-grid">
  <label className="editor-field"><span>{t.mode}</span><input aria-label={t.mode} value={r.modeId} onChange={x=>patch({modeId:x.target.value})}/></label>
  <label className="editor-field"><span>{t.cycle}</span><input aria-label={t.cycle} value={r.cycleLabel[lang]} onChange={x=>patch({cycleLabel:{...r.cycleLabel,[lang]:x.target.value}})}/></label>
  <label className="editor-toggle"><input type="checkbox" checked={!!rule?.enabled} onChange={x=>repeat({enabled:x.target.checked})}/><span>{t.repeat}</span></label>
  {rule&&<label className="editor-field"><span>{t.days}</span><EditorNumberInput aria-label={t.days} value={rule.intervalDays} onValueChange={n=>repeat({intervalDays:n||28})} min={1} max={366} allowEmpty={false}/></label>}
  <label className="editor-field"><span>{t.anchor}</span><select aria-label={t.anchor+' · '+t.dateOnly} value={dateOnly?'date':'time'} onChange={x=>{if(x.target.value==='date'){const value=(rule?.anchorDate||r.resetDate||(rule?.anchorAt||r.resetAt?inputDate(rule?.anchorAt||r.resetAt).slice(0,10):''));onChange(editRecurringEnd(e,value,true));}else onChange(editRecurringEnd(e,''));}}><option value="time">{t.time}</option><option value="date">{t.dateOnly}</option></select>
   <input aria-label={t.anchor} type={dateOnly?'date':'datetime-local'} value={dateOnly?rule?.anchorDate||r.resetDate||'':inputDate(rule?.anchorAt||r.resetAt)} onChange={x=>onChange(editRecurringEnd(e,x.target.value,dateOnly))}/></label>
  {dateOnly&&rule&&<label className="editor-field"><span>{t.zone}</span><select aria-label={t.zone} value={rule.timeZone} onChange={x=>repeat({timeZone:x.target.value})}>{['Asia/Seoul','Asia/Tokyo','Asia/Shanghai','Etc/GMT+7','UTC'].map(z=><option key={z}>{z}</option>)}</select></label>}
  <label className="editor-field wide"><span>{t.source}</span><textarea value={r.sourceUrls.join('\n')} onChange={x=>patch({sourceUrls:x.target.value.split('\n').map(s=>s.trim()).filter(Boolean)})}/></label>
 </div><p>{t.hint}</p>{preview&&<p role="status">{t.next} · {preview.endAt?new Intl.DateTimeFormat(locale,{timeZone:'Asia/Seoul',dateStyle:'medium',timeStyle:'short'}).format(new Date(preview.endAt))+' (UTC+9)':preview.endDate}</p>}</>}</details>;
}
