import type {Locale} from './types';
export const searchCopy={
 ko:{title:'통합 검색',search:'검색',placeholder:'캐릭터, 픽업, 이벤트, 전투 콘텐츠 검색',all:'모든 게임',schedules:'일정·공지',characters:'캐릭터',features:'바로 이용',community:'커뮤니티',empty:'검색 결과가 없습니다.',hint:'두 글자 이상 입력해 주세요.',partial:'일부 자료를 불러오지 못했어요. 다시 검색해 주세요.',home:'대시보드',more:'더 보기'},
 en:{title:'Search GAGETHER',search:'Search',placeholder:'Characters, banners, events or combat',all:'All games',schedules:'Schedules & news',characters:'Characters',features:'Tools & challenges',community:'Community',empty:'No results found.',hint:'Enter at least two characters.',partial:'Some sources could not load. Please try again.',home:'Dashboard',more:'More'},
 ja:{title:'サイト内検索',search:'検索',placeholder:'キャラクター・ガチャ・イベント・戦闘を検索',all:'全ゲーム',schedules:'日程・お知らせ',characters:'キャラクター',features:'ツール・戦闘',community:'コミュニティ',empty:'検索結果がありません。',hint:'2文字以上入力してください。',partial:'一部の情報を読み込めませんでした。再検索してください。',home:'ダッシュボード',more:'もっと見る'},
 zh:{title:'全站搜索',search:'搜索',placeholder:'搜索角色、卡池、活动或战斗玩法',all:'所有游戏',schedules:'日程与公告',characters:'角色',features:'工具与战斗',community:'社区',empty:'没有找到结果。',hint:'请输入至少两个字符。',partial:'部分资料加载失败，请重试。',home:'首页',more:'更多'}
};
export const searchKey=(value:string)=>value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,'');
export function searchScore(query:string,title:string,body=''){
 const q=searchKey(query),t=searchKey(title);if(!q)return 0;return t===q?100:t.startsWith(q)?60:t.includes(q)?40:searchKey(body).includes(q)?10:0;
}
export type SearchHit={id:string;gameId:string;title:string;detail?:string;href:string;score:number};
export function searchFeatures(locale:Locale,query:string,gameId?:string):SearchHit[]{
 const items=[
  ['nte','convene',['이환 가챠 시뮬레이터','NTE Gacha Simulator','異環 ガチャシミュレーター','异环抽卡模拟器'],'Neverness to Everness 주사위 보드 스카버러 마켓 Scarborough Fair'],
  ['wuwa','convene',['명조 가챠 시뮬레이터','Wuthering Waves Gacha Simulator','鳴潮 集音シミュレーター','鸣潮唤取模拟器'],'convene 뽑기'],
  ['nikke','convene',['니케 가챠 시뮬레이터','NIKKE Gacha Simulator','NIKKE ガチャシミュレーター','妮姬抽卡模拟器'],'recruit 모집'],
  ['wuwa','combat/tower-of-adversity',['역경의 탑 파티·조합','Tower of Adversity Teams','逆境深塔 編成','逆境深塔配队'],'명조 Wuthering Waves 鳴潮 鸣潮'],
  ['wuwa','combat/whimpering-wastes',['죽음의 노래와 바닷속 폐허 파티·조합','Whimpering Wastes Teams','死の歌と海の廃墟 編成','死歌与海墟配队'],'명조 해역 Wuthering Waves'],
  ['wuwa','combat/endstate-matrix',['종말 매트릭스 파티·조합','Aftermath Matrix Teams','終末マトリクス 編成','终末矩阵配队'],'명조 Wuthering Waves'],
  ['zzz','combat',['시유 방어전 세팅·전투 기록','Shiyu Defense Builds & Records','式輿防衛戦 育成・記録','式舆防卫战配装与记录'],'젠레스 존 제로 젠존제 Zenless Zone Zero'],
  ['gfl2','combat',['소녀전선2 전투 세팅·기록','Girls’ Frontline 2 Builds & Records','ドールズフロントライン2 育成・記録','少女前线2配装与战斗记录'],'흙먼지 전선 Girls Frontline']
 ] as const,idx=({ko:0,en:1,ja:2,zh:3}as const)[locale];
 return items.filter(r=>!gameId||r[0]===gameId).map(r=>({id:r[0]+r[1],gameId:r[0],title:r[2][idx],href:`/${locale}/games/${r[0]}/${r[1]}`,score:searchScore(query,r[2][idx],r[2].join(' ')+' '+r[3])})).filter(r=>r.score).sort((a,b)=>b.score-a.score);
}
