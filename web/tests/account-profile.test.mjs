import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {emptyProfile,mergeProfile,parseProfile}=await import('../lib/account-profile.ts');
const note=(title='original')=>({id:'note-1',date:'2026-10-21',kind:'memo',title,body:'private',createdAt:'2026-10-21T00:00:00Z',updatedAt:'2026-10-21T00:00:00Z'});
const p=fields=>parseProfile({...emptyProfile(),...fields});
test('new device imports guest records without replacing cloud order',()=>{
 const merged=mergeProfile(null,p({favorites:['wuwa'],order:['wuwa','zzz'],notes:[note()]}),p({favorites:['zzz'],order:['zzz','wuwa']}));
 assert.deepEqual(merged.favorites,['wuwa','zzz']);assert.deepEqual(merged.order,['zzz','wuwa']);assert.equal(merged.notes.length,1);
});
test('stale unchanged device cannot resurrect remote deletions',()=>{
 const base=p({favorites:['wuwa'],saved:['entry-1'],notes:[note()]});
 assert.deepEqual(mergeProfile(base,base,emptyProfile()),emptyProfile());
 const mine=p({favorites:['wuwa','zzz'],notes:[note()]});
 assert.deepEqual(mergeProfile(base,mine,emptyProfile()).favorites,['zzz']);
});
test('independent changes combine, local removal applies, cloud order survives unchanged local order',()=>{
 const base=p({favorites:['wuwa'],order:['wuwa','zzz']});
 const local=p({favorites:['hi3'],order:base.order});
 const remote=p({favorites:['wuwa','zzz'],order:['zzz','wuwa']});
 const merged=mergeProfile(base,local,remote);assert.deepEqual(merged.favorites,['hi3','zzz']);assert.deepEqual(merged.order,remote.order);
});
test('simultaneous edits and delete-versus-edit preserve content without repeated copies',()=>{
 const base=p({notes:[note()]}),local=p({notes:[note('phone')]}),remote=p({notes:[note('desktop')]});
 const merged=mergeProfile(base,local,remote);assert.deepEqual(merged.notes.map(n=>n.title).sort(),['desktop','phone']);
 assert.deepEqual(mergeProfile(base,local,merged),merged);
 assert.equal(mergeProfile(base,emptyProfile(),remote).notes[0].title,'desktop');
 assert.equal(mergeProfile(base,local,emptyProfile()).notes[0].title,'phone');
});
test('invalid and oversized records fail instead of truncating user data',()=>{
 assert.throws(()=>p({favorites:['wuwa','wuwa']}));assert.throws(()=>p({notes:[{...note(),body:'x'.repeat(2001)}]}));
 assert.throws(()=>p({notes:Array.from({length:1000},(_,i)=>({...note(),id:'n'+i,body:'x'.repeat(2000)}))}));
 assert.equal(p({notes:[{...note(),gameId:'reverse1999',region:'cn'}]}).notes[0].region,'cn');
});
