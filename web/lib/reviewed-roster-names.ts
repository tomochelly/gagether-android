import hsrAnnouncements from '../content/hsr-announced-roster.json' with {type:'json'};
import nteAnnouncements from '../content/nte-announced-roster.json' with {type:'json'};
import limbusReleases from '../content/limbus-reviewed-releases.json' with {type:'json'};
import type {RosterCharacter} from './character-roster';
const sourceUrl='https://nikke-kr.com/newsdetail.html?content_id=5b8bea6da2a9aa420ca8dc2a04c7968918b9';
const nikke:Record<string,string>={'229':'홍련 : 신살','230':'마리안 : 퀸','231':'라푼젤 : 생츄어리'};
const nikkeNative:Record<string,{en:string;ja:string;zh:string;jaSource:string;zhSource:string}>={
 '229':{en:'Scarlet: Goddeath',ja:'紅蓮：神殺',zh:'紅蓮：弒神',jaSource:'https://nikke-jp.com/newsdetail.html?content_id=8cae0ab1a9e86a44e6aa0eaa4acb16a64883',zhSource:'https://nikke.hotcool.tw/News_detail-237'},
 '230':{en:'Marian: Queen',ja:'マリアン：クイーン',zh:'瑪麗安：女王',jaSource:'https://www.blablalink.com/events/nikke4th/js/GLanguage.js',zhSource:'https://www.blablalink.com/events/nikke4th/js/GLanguage.js'},
 '231':{en:'Rapunzel: Sanctuary',ja:'ラプンツェル：サンクチュアリ',zh:'長髮公主：聖域',jaSource:'https://nikke-jp.com/newsdetail.html?content_id=8cae0ab1a9e86a44e6aa0eaa4acb16a64883',zhSource:'https://nikke.hotcool.tw/News_detail-237'}
};
export function reviewedRosterAdditions(gameId:string,characters:RosterCharacter[]){
 if(gameId==='limbus'){const key=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');return (limbusReleases as RosterCharacter[]).filter(row=>!characters.some(c=>String(c.sourceId)===String(row.sourceId)||c.id===row.id||(['ko','en','ja'] as const).some(l=>!!row.name[l]&&key(c.name[l])===key(row.name[l]))));}
 const announcements=gameId==='nte'?nteAnnouncements:gameId==='hsr'?hsrAnnouncements:[];const same=(a:string,b:string)=>!!a&&!!b&&a.normalize('NFKC').trim().toLowerCase()===b.normalize('NFKC').trim().toLowerCase();
 return (announcements as RosterCharacter[]).filter(row=>!characters.some(c=>c.id===row.id||(['ko','en','ja','zh'] as const).some(l=>same(c.name[l],row.name[l]))));
}
export function reviewedRosterName(gameId:string,c:RosterCharacter):RosterCharacter{
 const native=gameId==='nikke'?nikkeNative[c.id]:undefined;
 if(native&&c.name.en===native.en){
  let next=c;
  const addedSources:string[]=[];
  for(const [locale,value]of [['ja',native.ja],['zh',native.zh]] as const)if(!c.name[locale]&&!c.nameSources?.[locale]){
   const source=locale==='ja'?native.jaSource:native.zhSource;addedSources.push(source);
   next={...next,name:{...next.name,[locale]:value},nameSources:{...next.nameSources,[locale]:{url:source,kind:'official'}}};
  }
  if(next!==c)c={...next,detailSources:[...c.detailSources||[],...[...new Set(addedSources)].filter(url=>!c.detailSources?.some(s=>s.url===url)).map(url=>({url,kind:'official' as const}))]};
 }
 if(gameId==='reverse1999'&&c.id==='135'&&c.name.en==='Hedone'&&c.regions?.length===1&&c.regions[0]==='cn'){
  const url='https://cdn.prydwen.gg/images/re1999/characters/hedone_insight.webp',source='https://www.prydwen.gg/re1999/characters/hedone/';
  return {...c,images:[...c.images||[],...c.images?.some(a=>a.url===url)?[]:[{url,sourceUrl:source,sourceKind:'community' as const,kind:'splash' as const,locale:'neutral' as const,width:800,height:800,caption:{ko:'헤도네 통찰2 전체 일러스트 · 중국 서비스 공개 자료',en:'Hedone Insight II complete illustration · China-service release',ja:'ヘドネー洞察IIイラスト原本・中国版公開資料',zh:'赫多涅洞悉二完整原画 · 国服公开资料'}}]].slice(0,10)};
 }
 if(gameId==='nte'&&c.id==='18'&&c.image?.url.endsWith('/roster-bootstrap/f8a028f6b390a1082c1211e933c5cd1f01a58832ac9505d142499441f89c660c.png')){
  const source='https://nte.perfectworld.com/cn/main.html?nav=2&role=18',image={url:'https://nte.perfectworld.com/public/images/main260618/role-poster-ka.jpg',sourceUrl:source,kind:'card' as const,width:2560,height:1440,locale:'en' as const,sourceKind:'official' as const,caption:{ko:'공식 홈페이지 배경 비주얼 · 영문 장식 문구 포함',en:'Official website visual with English lettering',ja:'公式サイトのビジュアル・英語装飾文字あり',zh:'官网背景视觉图，包含英语装饰文字'}};
  return {...c,image:{...c.image,kind:'full-body'},images:[...c.images||[],...c.images?.some(a=>a.url===image.url)?[]:[image]],detailSources:[...c.detailSources||[],...c.detailSources?.some(a=>a.url===source)?[]:[{url:source,kind:'official' as const}]]};
 }
 if(gameId==='bluearchive'&&!c.image&&['10153','20063'].includes(c.id)){
  const url='https://webusstatic.yo-star.com/bluearchive_jp_web/mainsite/upload/news/2026/10/26/'+(c.id==='10153'?'DuU7HLlZ.png':'pt8CHnt4.png'),source='https://bluearchive.jp/news/newsJump/704';
  return {...c,image:{url,sourceUrl:source,kind:'card',width:1280,height:720,locale:'ja',sourceKind:'official',caption:{ko:'일본 공식 픽업 포스터 · 개별 풀일러스트 미확보',en:'Official Japanese pickup poster; individual full illustration unavailable',ja:'日本版公式ピックアップ告知画像・単体イラスト未取得',zh:'日服官方招募海报；暂未取得单独完整插画'}},detailSources:[...c.detailSources||[],...c.detailSources?.some(s=>s.url===source)?[]:[{url:source,kind:'official' as const}]]};
 }
 const ko=gameId==='nikke'&&!c.name.ko&&!c.nameSources?.ko?nikke[c.id]:undefined;if(!ko)return c;
 return {...c,name:{...c.name,ko},nameSources:{...c.nameSources,ko:{url:sourceUrl,kind:'official'}},detailSources:[...c.detailSources||[],...c.detailSources?.some(s=>s.url===sourceUrl)?[]:[{url:sourceUrl,kind:'official' as const}]]};
}
