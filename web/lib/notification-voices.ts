import type {Entry,Locale,Localized} from './types';
// Small, reviewed pilot. These are GAGETHER-written lines, never official dialogue.
// Korean promotional text was available in community reproductions; official social/video
// bodies were inaccessible. Do not upgrade sourceKind or claim video/audio review.
export const notificationVoices=[
 {id:'wuwa-chisa-default-ko',gameId:'wuwa',name:'Chisa',locale:'ko' as Locale,
  sourceUrl:'https://www.inven.co.kr/board/party/6196/1928',sourceKind:'community' as const,
  sourceTitle:'공명자 아카이브 미리보기 | 치사',evidence:'Short, restrained wording in the reproduced promotional introduction.',
  reviewedAt:'2026-10-16T23:51:38Z',watched:false as const,styleInferred:true,
  line:'일정, 확인해 둘게. 잊지 않도록.'},
 {id:'wuwa-iuno-default-ko',gameId:'wuwa',name:'Iuno',locale:'ko' as Locale,
  sourceUrl:'https://www.inven.co.kr/board/party/6196/1687?vtype=pc',sourceKind:'community' as const,
  sourceTitle:'공명자 아카이브 미리보기 | 유노',evidence:'Pauses and future/choice motifs in the reproduced promotional introduction.',
  reviewedAt:'2026-10-16T23:51:38Z',watched:false as const,styleInferred:true,
  line:'다가올 시간은… 놓치지 않을게. 선택은 네게 맡길게.'}
];
export type NotificationCharacter={id:string;entryId:string;name:Localized;voice?:{locale:Locale;line:string;sourceUrl:string;sourceKind:string;reviewedAt:string;original:false}};
export function notificationCharacters(entry:Entry,locale:Locale):NotificationCharacter[]{
 if(entry.kind!=='pickup'||entry.poolType!=='character'||entry.selectionCount)return [];
 return (entry.pickupMembers||[]).filter(m=>m.role===undefined||m.role==='featured').map(m=>{
  const voice=notificationVoices.find(v=>v.gameId===entry.gameId&&v.name===m.name.en&&v.locale===locale);
  return {id:entry.gameId+':'+m.name.en,entryId:entry.id,name:m.name,...voice?{voice:{locale,line:voice.line,sourceUrl:voice.sourceUrl,sourceKind:voice.sourceKind,reviewedAt:voice.reviewedAt,original:false as const}}:{}};
 });
}
