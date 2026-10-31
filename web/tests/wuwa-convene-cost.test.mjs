import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {defaultConveneCost,conveneCost,parseConveneCost,validConveneCost,convenePrices}=await import('../lib/wuwa-convene-cost.ts');
test('cash is proportional paid-currency equivalent with separate currency benchmarks, never rounded-up orders',()=>{
 const ko=conveneCost(10,defaultConveneCost('ko'));assert.equal(ko.astrite,1600);assert.ok(Math.abs(ko.cash-25920.79207920792)<.0001);
 assert.equal(conveneCost(1,defaultConveneCost('en')).cash,1.98);assert.equal(defaultConveneCost('ja').currency,'JPY');assert.equal(conveneCost(0,defaultConveneCost('ko')).cash,0);
 const custom={version:1,currency:'KRW',packPrice:119000,packUnits:8080};assert.ok(Math.abs(conveneCost(1,custom).cash-2356.4356435643565)<.0001);
 for(const currency of ['KRW','JPY','USD']){assert.equal(convenePrices[currency].packUnits,8080);assert.ok(convenePrices[currency].sourceUrl.startsWith('https://store.playstation.com/'));}
});
test('bounded preferences preserve currency across locale changes and reject corrupted or future settings',()=>{
 const custom={version:1,currency:'USD',packPrice:55,packUnits:9000};assert.deepEqual(parseConveneCost(JSON.stringify(custom),'ko'),{valid:true,value:custom});
 for(const x of [{...custom,version:2},{...custom,currency:'__proto__'},{...custom,packPrice:0},{...custom,packPrice:Infinity},{...custom,packUnits:0},{...custom,packUnits:1.5}])assert.equal(validConveneCost(x),false);
 for(const raw of ['{',' '.repeat(1001),JSON.stringify({...custom,version:3})])assert.equal(parseConveneCost(raw,'ko').valid,false);
 for(const total of [-1,1.5,1000001,NaN])assert.throws(()=>conveneCost(total,custom));
});
