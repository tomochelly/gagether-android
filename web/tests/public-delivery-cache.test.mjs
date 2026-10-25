import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';
const {openPublicDeliveryCache}=await import('../lib/public-delivery-cache.ts');
test('namespaced production opens an isolated named cache without accessing disabled default and retries within each request',async()=>{
 let opened=0;const cache={};const storage={get default(){throw Error('disabled in namespaced Workers')},async open(name){assert.equal(name,'gagether-public-reads-v1');opened++;return cache}};
 assert.equal(await openPublicDeliveryCache(storage),cache);assert.equal(await openPublicDeliveryCache(storage),cache);assert.equal(opened,2);assert.equal(await openPublicDeliveryCache(),undefined);
});
