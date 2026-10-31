'use client';
import {useEffect,useSyncExternalStore} from 'react';
import {startAccountSync,subscribeSync,syncSnapshot,syncNow} from '@/lib/account-sync-client';
import type {Locale} from '@/lib/types';
const labels={
 ko:{checking:'동기화 확인 중',guest:'이 기기에 저장',syncing:'계정에 동기화 중…',synced:'계정 동기화 완료',offline:'오프라인 · 연결 후 동기화',error:'동기화 대기 · 다시 시도',help:'이전에 사용한 로그인 방법과 같은 계정으로 내 게임, 게임 순서, 저장한 항목과 개인 메모·계획·뽑기 기록을 가져옵니다. 테마·글자 크기·언어는 기기별 설정입니다.'},
 en:{checking:'Checking sync',guest:'Saved on this device',syncing:'Syncing account…',synced:'Account synced',offline:'Offline · sync when connected',error:'Sync pending · retry',help:'Use the same sign-in method and account as before to sync My games, game order, saved entries and personal notes, plans and pull records. Theme, text size and language stay device-specific.'},
 ja:{checking:'同期を確認中',guest:'この端末に保存',syncing:'アカウントに同期中…',synced:'アカウント同期済み',offline:'オフライン・接続後に同期',error:'同期保留・再試行',help:'以前と同じログイン方法とアカウントで、マイゲーム、並び順、保存項目、個人メモ・計画・ガチャ記録を同期します。テーマ・文字サイズ・言語は端末ごとの設定です。'},
 zh:{checking:'正在检查同步',guest:'保存在此设备',syncing:'正在同步账户…',synced:'账户已同步',offline:'离线 · 联网后同步',error:'同步待处理 · 重试',help:'使用与之前相同的登录方式和账户，同步我的游戏、游戏顺序、收藏及个人备忘、计划和抽卡记录。主题、字号和语言保留为设备设置。'}
};
export default function AccountSyncStatus({locale,detail=false}:{locale:Locale;detail?:boolean}){
 const state=useSyncExternalStore(subscribeSync,syncSnapshot,()=> 'checking' as const);useEffect(startAccountSync,[]);const t=labels[locale];
 return <div className={'account-sync-state '+(detail?'is-detail':'')}><span role="status">{state==='error'?<button type="button" onClick={()=>void syncNow()}>{t.error}</button>:t[state]}</span>{detail&&<p>{t.help}</p>}</div>;
}
