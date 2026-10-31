import './load-typescript.mjs';
import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const calls=[];globalThis.syncChangeCalls=calls;
registerHooks({resolve(s,c,n){if(s==='@/lib/store')return {url:'test:sync-store',shortCircuit:true};if(s==='@/lib/write-access')return{url:'test:sync-auth',shortCircuit:true};if(s==='@/lib/official-social-store')return{url:'test:sync-channels',shortCircuit:true};if(s==='@/lib/reward-asset-store')return{url:'test:sync-assets',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='test:sync-store')return{format:'module',source:'export const sameOrigin=r=>r.headers.get("Origin")===new URL(r.url).origin;export const saveEntries=async rows=>{if(rows.length)globalThis.syncChangeCalls.push({entries:rows})};export const saveEntryChanges=async rows=>{if(rows.length)globalThis.syncChangeCalls.push({changes:rows})}',shortCircuit:true};if(u==='test:sync-auth')return{format:'module',source:'export const canWriteData=async r=>r.headers.get("X-Test-Auth")==="owner"',shortCircuit:true};if(u==='test:sync-channels')return{format:'module',source:'export const saveOfficialChannels=async()=>{}',shortCircuit:true};if(u==='test:sync-assets')return{format:'module',source:'export const saveRewardAssets=async()=>true',shortCircuit:true};return n(u,c)}});
const {POST}=await import('../app/api/sync/route.ts');
const e=JSON.parse(readFileSync(new URL('./fixtures/weapon-links.json',import.meta.url))).find(e=>e.id==='wuwa-hsin');
const request=(body,auth=true,origin='https://gagether.wiki')=>new Request('https://gagether.wiki/api/sync',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...auth?{'X-Test-Auth':'owner'}:{}},body:JSON.stringify(body)});
test('full-original changes require existing writer authority, same origin, unique and stable identities',async()=>{
 const change={before:e,after:{...e,summary:{...e.summary,ko:'검토한 새 요약'}}};
 assert.equal((await POST(request({entryChanges:[change]},false))).status,403);assert.equal((await POST(request({entryChanges:[change]},true,'https://evil.example'))).status,403);
 assert.equal((await POST(request({entryChanges:[change,{...change}]}))).status,400);assert.equal((await POST(request({entryChanges:[{...change,after:{...change.after,id:'different'}}]}))).status,400);assert.equal(calls.length,0);
 const r=await POST(request({entryChanges:[change]}));assert.equal(r.status,200);assert.equal((await r.json()).saved,1);assert.equal(calls.length,1);assert.deepEqual(calls[0].changes[0].before.sourceBodies,e.sourceBodies);assert.equal(calls[0].changes[0].after.summary.ko,'검토한 새 요약');
});
