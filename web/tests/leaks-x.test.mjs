import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import bootstrap from '../content/leaks/bootstrap.json' with {type:'json'};
const x=await import('../lib/leaks-x.ts'),model=await import('../lib/leaks.ts');
const read=id=>JSON.parse(readFileSync(new URL('./fixtures/leaks-x/'+id+'.json',import.meta.url),'utf8')),at='2026-10-25T00:00:00Z';
test('public X embed binds exact authored account and post, preserves declared originals and never treats availability as video viewing',()=>{
 const raw=read('2114039529564713238'),post=x.parseXPost(raw,raw.id_str,at);assert.equal(post.videos.length,1);assert.equal(post.videos[0].width,3840);assert.equal(post.videos[0].height,2160);assert.equal(post.videos[0].variants.length,5);assert.equal(post.publishedAt,'2026-10-24T17:01:15.000Z');assert.equal(x.classifiedXLeak(post),true);
 assert.throws(()=>x.parseXPost({...raw,user:{...raw.user,id_str:'different-author'}},raw.id_str,at),/identity/);assert.throws(()=>x.parseXPost(raw,'2113963023681388685',at),/identity/);
 const attack=structuredClone(raw);attack.mediaDetails[0].video_info.variants.find(v=>v.content_type==='video/mp4').url='https://evil.example/track.mp4';assert.throws(()=>x.parseXPost(attack,raw.id_str,at),/CDN/);assert.equal(x.classifiedXLeak({...post,fullText:'Official announcement giveaway'}),false);
 const photoRaw=read('2113963023681388685'),photos=x.parseXPost(photoRaw,photoRaw.id_str,at);assert.equal(photos.imageUrls.length,4);assert.ok(photos.imageUrls.every(u=>u.includes('name=orig')));assert.deepEqual(x.discoverXPostIds('https://x.com/WuWa_Verse1/status/2113963023681388685 https://x.com/WuWa_Verse12/status/2114039529564713238'),['2113963023681388685']);
 for(const item of bootstrap.filter(i=>i.sourceUrl.startsWith(x.wuwaXSource.profileUrl+'/status/'))){model.leakSchema.parse(item);for(const video of item.videos||[]){assert.equal(video.watched,false);assert.equal(video.playbackVerified,false);assert.ok(video.variants.some(v=>v.url===video.url));assert.throws(()=>model.leakVideoSchema.parse({...video,sourcePostId:'2113000000000000000'}),/identity/);}}
});
