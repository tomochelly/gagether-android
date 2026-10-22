import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
import {createHash} from 'node:crypto';
const objects=new Map();let writes=0;
const testKey='test-updater-key-not-a-real-credential';
globalThis.__rewardTestEnv={GAGETHER_SYNC_TOKEN_SHA256:createHash('sha256').update(testKey).digest('hex'),BUCKET:{
 async get(key){const v=objects.get(key);return v?{body:v.bytes}:null},
 async put(key,bytes,options){writes++;objects.set(key,{bytes,options})}
}};
registerHooks({resolve(s,c,n){
 if(s==='cloudflare:workers')return {url:'data:text/javascript,export const env=globalThis.__rewardTestEnv',shortCircuit:true};
 if(s==='./editor-access')return {url:'data:text/javascript,export async function editorIdentity(){return null}',shortCircuit:true};
 return n(s,c);
}});
const {rewardAsset,rewardAssetKey}=await import('../lib/reward-assets.ts');
const {GET}=await import('../app/api/reward-icons/[id]/route.ts');
const {POST}=await import('../app/api/sync/route.ts');
const bytes=readFileSync(new URL('./fixtures/clear-drop.png',import.meta.url)),asset=rewardAsset('clear-drop');
const upload={id:asset.id,data:bytes.toString('base64')};
const post=(body,authorized=true,origin='https://gagether.wiki')=>POST(new Request('https://gagether.wiki/api/sync',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(authorized?{'X-Gagether-Sync-Token':testKey}:{})},body:JSON.stringify(body)}));
const read=(id=asset.id,version=asset.sha256,headers={})=>GET(new Request(`https://gagether.wiki/api/reward-icons/${id}?v=${version}`,{headers}),{params:Promise.resolve({id})});
test('only authorized exact reviewed bytes can enter the isolated reward namespace',async()=>{
 assert.equal((await read()).status,503);
 assert.equal((await post({rewardAssets:[upload]},false)).status,403);
 assert.equal((await post({rewardAssets:[upload]},true,'https://other.example')).status,403);
 assert.equal((await post({rewardAssets:[{...upload,id:'../owner/upload'}]})).status,400);
 const corrupted=Buffer.from(bytes);corrupted[corrupted.length-1]^=1;
 assert.equal((await post({rewardAssets:[upload,{...upload,data:corrupted.toString('base64')}]})).status,400);
 assert.equal(writes,0,'whole batch is validated before storing any asset');
 const response=await post({rewardAssets:[upload]});assert.equal(response.status,200);
 assert.equal((await response.json()).rewardAssetsSaved,1);assert.equal(writes,1);
 assert.deepEqual([...objects.keys()],[rewardAssetKey(asset)]);
 assert.ok(rewardAssetKey(asset).startsWith('reviewed-rewards/'));
 const publicResponse=await read();assert.equal(publicResponse.status,200);assert.equal(publicResponse.headers.get('Content-Type'),'image/png');
 assert.match(publicResponse.headers.get('Cache-Control'),/immutable/);
 assert.equal(createHash('sha256').update(new Uint8Array(await publicResponse.arrayBuffer())).digest('hex'),asset.sha256);
 assert.equal((await read(asset.id,asset.sha256,{'If-None-Match':`"${asset.sha256}"`})).status,304);
 assert.equal((await read(asset.id,'wrong-version')).status,404);
 assert.equal((await read('unknown')).status,404);
});
