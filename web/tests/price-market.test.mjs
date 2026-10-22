import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {formatPrice,packageInMarket,priceMarketLabel}=await import('../lib/price-presentation.ts');
const jp={kind:'package',gameId:'wuwa',region:'global',marketRegion:'jp',price:{amount:1220,currency:'JPY',platform:'Unspecified'}};
test('shared schedules do not leak Japanese cash offers into Korean listings',()=>{
 assert.equal(packageInMarket(jp,'ko'),false);
 assert.equal(packageInMarket(jp,'ja'),true);
 assert.equal(packageInMarket({...jp,marketRegion:'kr'},'ko'),true);
 for(const l of ['ko','en','ja','zh'])assert.equal(packageInMarket({...jp,marketRegion:'global',price:{...jp.price,currency:'USD'}},l),l==='en'||l==='zh');
 assert.equal(packageInMarket({...jp,gameId:'bluearchive',region:'jp'},'ko','jp'),true,'explicit Japanese service preserves Japanese offer');
 assert.equal(packageInMarket({...jp,kind:'event'},'ko'),false,'local events also respect territory');
});
test('localized prices retain their actual currency and exact amount',()=>{
 const before=JSON.stringify(jp);
 assert.match(formatPrice(jp,'ko'),/1,220.*엔/);
 assert.doesNotMatch(formatPrice(jp,'ko'),/원|KRW|JPY/);
 assert.equal(priceMarketLabel(jp,'ko'),'일본 판매가');
 assert.match(formatPrice({...jp,price:{...jp.price,currency:'KRW',amount:12000}},'ko'),/12,000.*원/);
 assert.equal(JSON.stringify(jp),before);
});
