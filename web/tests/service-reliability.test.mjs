import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {entryState,liveContent}=await import('../lib/types.ts');
const {pickupPeriod}=await import('../lib/pickup-history.ts');
const {upcomingPickups}=await import('../lib/upcoming-pickups.ts');
const {spotlightSlides}=await import('../lib/spotlight.ts');
const {draftProblems,isNewEntry}=await import('../lib/editor-draft.ts');
const loc=s=>({ko:s,en:s,ja:s,zh:s});
const start=Date.parse('2026-10-22T11:00:00+09:00'),end=Date.parse('2026-11-11T13:00:00+09:00');
const e={id:'rotation',gameId:'wuwa',kind:'pickup',region:'global',title:loc('Suoming'),summary:loc('Official'),sourceKind:'official',sourceUrl:'https://wutheringwaves.kurogames.com/kr/main',sourceTitle:'Official',server:'UTC+9',publishedAt:null,verifiedAt:new Date().toISOString(),startAt:new Date(start).toISOString(),endAt:new Date(end).toISOString(),pickupArchive:{status:'announced',startDate:'2026-10-22',endDate:'2026-11-11'},pickupMembers:[{name:loc('Suoming'),type:'new',role:'featured'}]};
test('one official clock decides banner, active list, upcoming and history at exact boundaries in every language',()=>{
 for(const [at,state,period] of [[start-1,'upcoming','upcoming'],[start,'active','current'],[end-1,'active','current'],[end,'ended','past']]){
  assert.equal(entryState(e,at),state);assert.equal(pickupPeriod(e,at),period);assert.equal(liveContent(e,at),state==='active');
  for(const l of ['ko','en','ja','zh'])assert.equal(upcomingPickups([e],l,at).length,state==='upcoming'?1:0);
  assert.equal(spotlightSlides([e],at).length,state==='ended'?0:1);
 }
 assert.equal(pickupPeriod({...e,pickupArchive:{...e.pickupArchive,status:'past'}},start),'current');
 assert.equal(entryState({...e,startAt:null,endAt:null,pickupArchive:{status:'forecast'}},start),'upcoming');
});
test('new-entry intent comes from persisted catalog, and invalid member/selection input has precise errors',()=>{
 assert.equal(isNewEntry([],e),true);assert.equal(isNewEntry([e],e),false);
 assert.deepEqual(draftProblems(e),[]);
 assert.match(draftProblems({...e,pickupMembers:[{name:loc('2'),type:'unknown'}],selectionCount:2}).join(' '),/pickupMembers.0.name.*selectionCount/);
});
test('all stored official rotations use the same current classification',async()=>{
 const path=process.env.GAGETHER_AUDIT_DATA;
 const entries=path?JSON.parse(readFileSync(path,'utf8')).entries:(await import('../lib/seed.ts')).seedEntries;const now=Date.parse('2026-10-23T05:00:00+09:00');
 for(const entry of entries)if(entry.pickupArchive?.status!=='forecast'&&entry.startAt&&entry.endAt&&['pickup','weapon'].includes(entry.kind)){
  const expected=Date.parse(entry.endAt)<=now?'past':Date.parse(entry.startAt)>now?'upcoming':'current';
  assert.equal(pickupPeriod(entry,now),expected,entry.id);
 }
});


test('retained hidden weapon archives can coexist with their current plain record; duplicate visible characters still fail',async()=>{
 const {registerHooks}=await import('node:module');registerHooks({resolve(s,c,n){return s==='cloudflare:workers'?{url:'data:text/javascript,export const env={}',shortCircuit:true}:n(s,c)}});const {catalogIssues}=await import('../lib/service-health.ts');
 const plain={...e,id:'weapon-current',kind:'weapon',poolType:'weapon',pickupArchive:undefined};const archive={...plain,id:'weapon-archive',pickupArchive:{status:'announced'}};
 assert.equal(catalogIssues([plain,archive],start).some(i=>i.code==='duplicate-rotation'),false);
 assert.equal(catalogIssues([e,{...e,id:'character-duplicate'}],start).some(i=>i.code==='duplicate-rotation'),true);
});
