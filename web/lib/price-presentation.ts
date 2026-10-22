import type {Entry,Locale,Region} from './types';
import {games} from './games';
import {contentInAudience,localeMarket} from './content-audience';
import {rewardCatalog} from './reward-catalog';
const markets:Record<Region,Record<Locale,string>>={
 kr:{ko:'한국 판매가',en:'Korean market',ja:'韓国価格',zh:'韩国售价'},
 jp:{ko:'일본 판매가',en:'Japanese market',ja:'日本価格',zh:'日本售价'},
 global:{ko:'글로벌 공통',en:'Global market',ja:'グローバル共通',zh:'国际服通用'},
 cn:{ko:'중국 판매가',en:'Mainland China market',ja:'中国本土価格',zh:'中国大陆售价'}
};
export function packageInMarket(entry:Entry,locale:Locale,requested:Region=localeMarket(locale)){
 const game=games.find(g=>g.id===entry.gameId);
 return !!game&&contentInAudience(entry,game,requested,locale);
}
export function priceMarketLabel(entry:Entry,locale:Locale){
 return entry.marketRegion?markets[entry.marketRegion][locale]:({ko:'판매 지역 미확인',en:'Market unconfirmed',ja:'販売地域未確認',zh:'销售地区未确认'})[locale];
}
export function formatPrice(entry:Entry,locale:Locale){
 if(!entry.price)return '';
 const {amount,currency}=entry.price;
 const code=currency.trim().toUpperCase();
 if(['KRW','JPY','CNY','USD','EUR','GBP','TWD','HKD'].includes(code)){
  return new Intl.NumberFormat(locale,{style:'currency',currency:code,currencyDisplay:'name',maximumFractionDigits:2}).format(amount);
 }
 const normalized=currency.trim().toLowerCase();
 const premium:Record<string,Record<Locale,string>>={
  'zzz:monochrome':{ko:'모노크롬',en:'Monochrome',ja:'モノクローム',zh:'菲林底片'},
  'hsr:oneiric shards':{ko:'오래된 꿈',en:'Oneiric Shards',ja:'往日の夢華',zh:'古老梦华'},
  'nte:riftcrystal':{ko:'이상 수정',en:'Riftcrystal',ja:'異晶',zh:'异晶'}
 };
 const premiumName=premium[entry.gameId+':'+normalized]?.[locale];
 const item=rewardCatalog.find(r=>r.gameId===entry.gameId&&[...Object.values(r.name),...r.aliases].some(n=>n.toLowerCase()===normalized));
 return `${new Intl.NumberFormat(locale).format(amount)} ${premiumName||item?.name[locale]||currency}`;
}
