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

/** Game-fixed examples, authored for GAGETHER rather than official dialogue. */
export const gameNotificationStyles=[
 {gameId:'wuwa',speaker:{ko:'아브',en:'Abby',ja:'アブ',zh:'阿布'},address:{ko:'방랑자',en:'Rover',ja:'漂泊者',zh:'漂泊者'},line:{ko:'방랑자, 픽업 종료까지 3시간 남았어! 잊지 말라구!',en:'Rover, the banner ends in 3 hours!',ja:'漂泊者、ピックアップ終了まであと3時間だよ！',zh:'漂泊者，招募还有3小时结束！'}},
 {gameId:'bluearchive',speaker:{ko:'블루 아카이브',en:'Blue Archive',ja:'ブルーアーカイブ',zh:'蔚蓝档案'},address:{ko:'선생님',en:'Sensei',ja:'先生',zh:'老师'},line:{ko:'선생님, 모집 종료까지 3시간 남았어요!',en:'Sensei, recruitment ends in 3 hours!',ja:'先生、募集終了まであと3時間です！',zh:'老师，招募还有3小时结束！'}},
 {gameId:'nikke',speaker:{ko:'니케',en:'NIKKE',ja:'NIKKE',zh:'NIKKE'},address:{ko:'지휘관',en:'Commander',ja:'指揮官',zh:'指挥官'},line:{ko:'지휘관, 모집 종료까지 3시간 남았습니다.',en:'Commander, recruitment ends in 3 hours.',ja:'指揮官、募集終了まであと3時間です。',zh:'指挥官，招募还有3小时结束。'}},
 {gameId:'umamusume',speaker:{ko:'우마무스메',en:'Umamusume',ja:'ウマ娘',zh:'赛马娘'},address:{ko:'트레이너',en:'Trainer',ja:'トレーナー',zh:'训练员'},line:{ko:'트레이너, 픽업 종료까지 3시간 남았어요!',en:'Trainer, the banner ends in 3 hours!',ja:'トレーナー、ピックアップ終了まであと3時間です！',zh:'训练员，招募还有3小时结束！'}}
];
