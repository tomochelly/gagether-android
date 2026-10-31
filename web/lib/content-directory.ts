import type {Metadata} from 'next';
import type {Entry,Game,Locale,Region} from './types';
import {games} from './games';
import {brandOrigin,searchBrand} from './brand';
import {supportedLocales,defaultRegionForLocale} from './visitor-locale';
import {effectiveRegion} from './presentation';
import {contentInAudience} from './content-audience';
import {discoverableEntry} from './discovery';
import {linkedWeaponOnly} from './linked-weapon-presentation';
export const directoryKinds=['all','pickup','weapon','event','package','update'] as const;
export type DirectoryKind=typeof directoryKinds[number];
export const directoryCopy={
 ko:{title:'전체 콘텐츠',description:'게임별 픽업·복각 기록, 이벤트 보상, 패키지와 업데이트 공지를 찾아보세요. 캐릭터별 스킬·스테이터스·일러스트는 도감에서 확인할 수 있습니다.',all:'전체',pickup:'픽업·복각',weapon:'무기·장비',event:'이벤트·보상',package:'패키지·가격',update:'업데이트·PV',calendar:'픽업 캘린더',characters:'캐릭터 도감',leaks:'유출·차기 버전 정보',browse:'기록·공지 전체 보기',previous:'이전',next:'다음',page:'페이지',empty:'이 분류의 공개 자료가 없습니다.',region:'서비스',global:'글로벌',kr:'한국',jp:'일본',cn:'중국'},
 en:{title:'All content',description:'Browse game banner and rerun records, event rewards, packs and update notices. Character skills, stats and illustrations are available in each character database.',all:'All',pickup:'Banners & reruns',weapon:'Weapons & equipment',event:'Events & rewards',package:'Packs & prices',update:'Updates & PVs',calendar:'Banner calendar',characters:'Character database',leaks:'Leaks & next-version news',browse:'All records & notices',previous:'Previous',next:'Next',page:'Page',empty:'No public records in this category.',region:'Service',global:'Global',kr:'Korea',jp:'Japan',cn:'China'},
 ja:{title:'すべてのコンテンツ',description:'ゲーム別のガチャ・復刻履歴、イベント報酬、パック、アップデート情報を探せます。キャラクターのスキル・ステータス・イラストは各図鑑をご覧ください。',all:'すべて',pickup:'ガチャ・復刻',weapon:'武器・装備',event:'イベント・報酬',package:'パック・価格',update:'更新情報・PV',calendar:'ガチャカレンダー',characters:'キャラクター図鑑',leaks:'リーク・次期バージョン情報',browse:'履歴・お知らせ一覧',previous:'前へ',next:'次へ',page:'ページ',empty:'この分類の公開資料はありません。',region:'サービス',global:'グローバル',kr:'韓国',jp:'日本',cn:'中国'},
 zh:{title:'全部内容',description:'按游戏查看卡池与复刻记录、活动奖励、礼包及更新公告。角色技能、数值与立绘可在各游戏图鉴中查看。',all:'全部',pickup:'卡池与复刻',weapon:'武器与装备',event:'活动与奖励',package:'礼包与价格',update:'更新与PV',calendar:'卡池日历',characters:'角色图鉴',leaks:'爆料与下版本信息',browse:'全部记录与公告',previous:'上一页',next:'下一页',page:'页',empty:'该分类暂无公开资料。',region:'服务器',global:'国际服',kr:'韩服',jp:'日服',cn:'国服'}
};
export function directoryPage(value:unknown){return value===undefined?1:typeof value==='string'&&/^[1-9]\d{0,3}$/.test(value)?Number(value):null;}
export function directoryPath(locale:Locale,gameId?:string,options:{region?:Region;kind?:DirectoryKind;page?:number}={}){
 const base=`/${locale}${gameId?'/games/'+encodeURIComponent(gameId):''}/browse`,game=games.find(g=>g.id===gameId),q=new URLSearchParams();
 if(game&&options.region&&effectiveRegion(game,options.region)!==effectiveRegion(game,defaultRegionForLocale(locale)))q.set('region',effectiveRegion(game,options.region));
 if(options.kind&&options.kind!=='all')q.set('kind',options.kind);if(options.page&&options.page!==1)q.set('page',String(options.page));
 return base+(q.size?'?'+q.toString():'');
}
export function directoryEntries(entries:Entry[],game:Game,locale:Locale,region:Region,kind:DirectoryKind,page:number){
 const rows=entries.filter(e=>!linkedWeaponOnly(e)&&discoverableEntry(e,locale)&&contentInAudience(e,game,region,locale)&&(kind==='all'||(e.poolType==='support'?'pickup':e.kind)===kind)).sort((a,b)=>{
  const date=(e:Entry)=>e.publishedAt||e.startAt||e.startDate||e.endAt||e.endDate||'';return date(b).localeCompare(date(a))||a.id.localeCompare(b.id);
 });
 const pageSize=60,pages=Math.max(1,Math.ceil(rows.length/pageSize));return {rows:rows.slice((page-1)*pageSize,page*pageSize),total:rows.length,pages};
}
export function directoryMetadata(locale:Locale,game?:Game,options:{region?:Region;kind?:DirectoryKind;page?:number;availableLocales?:Locale[];total?:number}={}):Metadata{
 const t=directoryCopy[locale],title=[game?.name[locale],options.kind&&options.kind!=='all'?t[options.kind]:t.title,options.page&&options.page>1?t.page+' '+options.page:undefined,searchBrand(locale)].filter(Boolean).join(' · '),url=brandOrigin+directoryPath(locale,game?.id,options);
 return {title,description:(game?game.name[locale]+' · ':'')+t.description,alternates:{canonical:url,languages:Object.fromEntries((options.availableLocales||supportedLocales).map(l=>[l,brandOrigin+directoryPath(l,game?.id,options)]))},robots:{index:options.total!==0,follow:true},openGraph:{type:'website',url,title,description:t.description,siteName:searchBrand(locale)}};
}
