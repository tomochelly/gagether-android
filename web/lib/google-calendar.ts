import type {Entry,Game,Locale} from './types';
import {entryTitle,regionLabel} from './presentation';

export const calendarScope='https://www.googleapis.com/auth/calendar.events.owned';
export const calendarUi={
 ko:{title:'Google 캘린더에 추가',connect:'Google 계정 연결',add:'내 기본 캘린더에 추가',review:'Google에서 확인 후 저장',close:'닫기',busy:'처리 중…',done:'캘린더에 추가했어요.',exists:'이미 추가된 일정이에요. 기존 일정은 변경하지 않았어요.',open:'Google 캘린더 열기',error:'완료 여부를 확인하지 못했어요. 다시 시도해도 같은 항목은 중복 생성되지 않아요.',authError:'연결하지 못했어요. 팝업과 캘린더 권한을 확인해주세요.',expired:'연결이 만료됐어요. Google 계정을 다시 연결해주세요.',switch:'다른 계정 연결',disconnect:'연결 권한 해제',revokeError:'권한 해제를 확인하지 못했어요. Google 계정 설정에서 해제할 수 있어요.',permissions:'Google 계정의 연결 관리',allDay:'종일 일정 · 시각 미확인',note:'선택한 일정을 기본 캘린더에 추가합니다. 이후 일정 변경은 자동으로 동기화되지 않습니다.',privacy:'캘린더 연동 개인정보 안내',scope:'Google 권한은 소유한 캘린더의 일정 조회·생성·수정·삭제를 포함합니다. GAGETHER는 선택한 일정의 추가와 중복 확인에만 사용합니다.',blocked:'공식 시작·종료 일정이 모두 확인된 항목만 추가할 수 있어요. 예상 일정과 방송 예약은 제외합니다.',browser:'앱에서는 브라우저로 열어 Google 캘린더에 추가해주세요.',web:'브라우저로 열기',reminders:'알림 없음 — 추가 후 Google 캘린더에서 설정할 수 있어요.'},
 en:{title:'Add to Google Calendar',connect:'Connect Google account',add:'Add to my primary calendar',review:'Review and save in Google',close:'Close',busy:'Working…',done:'Added to your calendar.',exists:'This event is already in your calendar. It was not changed.',open:'Open Google Calendar',error:'Could not confirm completion. Retrying will not create a duplicate of this item.',authError:'Could not connect. Check popup settings and calendar permission.',expired:'Connection expired. Connect your Google account again.',switch:'Connect another account',disconnect:'Revoke connection',revokeError:'Could not confirm revocation. You can remove access in Google account settings.',permissions:'Manage Google connections',allDay:'All day · time unverified',note:'Adds this event to your primary calendar. Later schedule changes are not synced automatically.',privacy:'Calendar integration privacy',scope:'Google permission includes viewing, creating, changing and deleting events on calendars you own. GAGETHER uses it only to add selected events and check duplicates.',blocked:'Only official schedules with a confirmed start and end can be added. Forecasts and broadcast reservations are excluded.',browser:'In the app, open this page in your browser to add to Google Calendar.',web:'Open in browser',reminders:'No reminders — you can configure them in Google Calendar after adding.'},
 ja:{title:'Google カレンダーに追加',connect:'Google アカウントを接続',add:'メインカレンダーに追加',review:'Google で確認して保存',close:'閉じる',busy:'処理中…',done:'カレンダーに追加しました。',exists:'追加済みの予定です。既存の予定は変更していません。',open:'Google カレンダーを開く',error:'完了を確認できませんでした。再試行しても同じ項目は重複作成されません。',authError:'接続できませんでした。ポップアップとカレンダー権限を確認してください。',expired:'接続の有効期限が切れました。Google アカウントを再接続してください。',switch:'別のアカウントを接続',disconnect:'接続権限を解除',revokeError:'解除を確認できませんでした。Google アカウント設定から解除できます。',permissions:'Google の接続を管理',allDay:'終日・時刻未確認',note:'選択した予定をメインカレンダーに追加します。その後の日程変更は自動同期されません。',privacy:'カレンダー連携のプライバシー',scope:'Google の権限には、自分が所有するカレンダーの予定の閲覧・作成・変更・削除が含まれます。GAGETHER は選択した予定の追加と重複確認にのみ使用します。',blocked:'開始・終了が確認できた公式日程のみ追加できます。予想日程と配信予約は対象外です。',browser:'アプリではブラウザで開いて Google カレンダーに追加してください。',web:'ブラウザで開く',reminders:'通知なし — 追加後に Google カレンダーで設定できます。'},
 zh:{title:'添加到 Google 日历',connect:'连接 Google 账号',add:'添加到我的主日历',review:'在 Google 中确认并保存',close:'关闭',busy:'处理中…',done:'已添加到日历。',exists:'此日程已添加，未修改现有日程。',open:'打开 Google 日历',error:'无法确认是否完成。重试不会重复创建同一条目。',authError:'连接失败，请检查弹窗设置和日历权限。',expired:'连接已过期，请重新连接 Google 账号。',switch:'连接其他账号',disconnect:'撤销连接权限',revokeError:'无法确认是否已撤销，可在 Google 账号设置中移除权限。',permissions:'管理 Google 连接',allDay:'全天 · 时刻未核实',note:'将所选日程添加到主日历。之后的时间变更不会自动同步。',privacy:'日历集成隐私说明',scope:'Google 权限包含查看、创建、更改和删除您拥有的日历中的日程。GAGETHER 仅用于添加所选日程及检查重复项。',blocked:'仅可添加开始和结束均已确认的官方日程，不包含预测日程和直播预约。',browser:'在应用中，请通过浏览器打开此页面以添加到 Google 日历。',web:'在浏览器中打开',reminders:'无提醒 — 添加后可在 Google 日历中设置。'}
} as const;
export type CalendarEvent={summary:string;description:string;start:{dateTime:string}|{date:string};end:{dateTime:string}|{date:string};transparency:'transparent';reminders:{useDefault:false;overrides:[]};extendedProperties:{private:{gagetherEntry:string;gagetherRegion:string}}};
const validDate=(s?:string):s is string=>!!s&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const validInstant=(s?:string|null):s is string=>!!s&&/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(s)&&Number.isFinite(Date.parse(s));
export function calendarEvent(entry:Entry,game:Game,locale:Locale):CalendarEvent|null{
 if(entry.hidden||entry.broadcast||entry.sourceKind==='community'||entry.pickupArchive?.status==='forecast')return null;
 let start:CalendarEvent['start'],end:CalendarEvent['end'];
 if(validInstant(entry.startAt)&&validInstant(entry.endAt)&&Date.parse(entry.endAt)>Date.parse(entry.startAt)){
  start={dateTime:entry.startAt};end={dateTime:entry.endAt};
 }else{
  // Never silently discard one known clock or manufacture midnight for a missing one.
  if(entry.startAt||entry.endAt)return null;
  const a=entry.pickupArchive?.startDate||entry.startDate,b=entry.pickupArchive?.endDate||entry.endDate;
  if(!validDate(a)||!validDate(b)||b<a)return null;
  start={date:a};end={date:new Date(Date.parse(b)+86400000).toISOString().slice(0,10)};
 }
 return {summary:`[${game.name[locale]}] ${entryTitle(entry,locale)}`,description:[entry.summary[locale],regionLabel(game,entry.region,locale),calendarUi[locale].note,entry.sourceUrl,'https://gagether.wiki/?entry='+encodeURIComponent(entry.id)].filter(Boolean).join('\n\n'),start,end,transparency:'transparent',reminders:{useDefault:false,overrides:[]},extendedProperties:{private:{gagetherEntry:entry.id,gagetherRegion:entry.region}}};
}
export async function calendarEventId(entry:Pick<Entry,'gameId'|'region'|'id'>){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(['gagether-calendar-v1',entry.gameId,entry.region,entry.id])));
 return 'gagether'+Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
}
export function calendarTemplateUrl(event:CalendarEvent){
 const compact=(d:CalendarEvent['start'])=>'date'in d?d.date.replaceAll('-',''):new Date(d.dateTime).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 return 'https://calendar.google.com/calendar/render?'+new URLSearchParams({action:'TEMPLATE',text:event.summary,details:event.description,dates:compact(event.start)+'/'+compact(event.end)});
}
export class CalendarRequestError extends Error{constructor(public status:number){super('Calendar request failed');}}
export async function insertCalendarEvent(token:string,id:string,event:CalendarEvent,request:typeof fetch=fetch){
 const url='https://www.googleapis.com/calendar/v3/calendars/primary/events';
 const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
 const response=await request(url,{method:'POST',headers,body:JSON.stringify({...event,id}),signal:AbortSignal.timeout(20000)});
 if(response.status===409){
  // Read only the exact app-created ID, never list the visitor's personal events.
  const existing=await request(url+'/'+id,{headers,signal:AbortSignal.timeout(20000)});
  if(!existing.ok)throw new CalendarRequestError(existing.status);
  const body=await existing.json() as {id?:unknown;status?:unknown;htmlLink?:unknown}|null;if(!body||body.id!==id||body.status==='cancelled')throw new CalendarRequestError(409);
  return {duplicate:true,url:safeCalendarUrl(body.htmlLink)};
 }
 if(!response.ok)throw new CalendarRequestError(response.status);
 const body=await response.json() as {id?:unknown;htmlLink?:unknown}|null;if(!body||body.id!==id)throw new CalendarRequestError(502);
 return {duplicate:false,url:safeCalendarUrl(body.htmlLink)};
}
function safeCalendarUrl(value:unknown){try{const u=new URL(String(value));if(u.protocol==='https:'&&['calendar.google.com','www.google.com'].includes(u.hostname))return u.href;}catch{}return 'https://calendar.google.com/calendar/';}
