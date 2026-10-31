import {games} from './games';
import type {Locale} from './types';
import configuration from '../content/android-push.json' with {type:'json'};
export type PushDraft={id:string;revision:number;gameId:string;locale:Locale;title:string;body:string;updatedAt?:number};
export function validPushDraft(value:unknown):value is PushDraft{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;const d=value as PushDraft;
 return Object.keys(d).every(k=>['id','revision','gameId','locale','title','body'].includes(k))&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(d.id)&&Number.isSafeInteger(d.revision)&&d.revision>=0&&games.some(g=>g.id===d.gameId)&&['ko','en','ja','zh'].includes(d.locale)&&typeof d.title==='string'&&d.title.trim().length>0&&d.title.length<=100&&typeof d.body==='string'&&d.body.trim().length>0&&d.body.length<=500&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(d.title+d.body);
}
/** Public game announcements only; no identity, account IDs or private device tokens. */
export function pushAudience(gameId:string,locale:Locale){
 if(!games.some(g=>g.id===gameId)||!['ko','en','ja','zh'].includes(locale))throw Error('Unknown push audience');
 return {gameId,locale,topic:`gagether_game_${gameId}_${locale}_v1`,path:`/${locale}/games/${gameId}`,requires:['app-push-opt-in','my-games-membership','locale-match','android-notification-permission']};
}
export const pushReadiness={ready:false,provider:'FCM',projectId:configuration.projectId,reason:'Android 앱을 Firebase에 등록했어요. 서버 발송 권한 연결과 새 앱의 수신 검수가 끝나면 발송을 켤 수 있어요.'} as const;
