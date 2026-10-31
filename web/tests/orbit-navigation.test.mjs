import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';
const {orbitDirections,orbitTargets,qRotate,turnOrbit,nearestOrbit}=await import('../lib/orbit-motion.ts');
const {hasOrbitGacha,orbitLocation,orbitTabFor}=await import('../lib/orbit.ts');
const {catalogLocaleHeaders,catalogLocation}=await import('../lib/catalog-paths.ts');
const {accountReturnTo}=await import('../lib/discord-login.ts');
test('all six faces can become front; rotation stays normalized through arbitrary gestures',()=>{
 for(let i=0;i<6;i++){assert.equal(nearestOrbit(orbitTargets[i]),i);assert.ok(qRotate(orbitDirections[i],orbitTargets[i])[2]>.999);}
 let q=orbitTargets[0];for(let i=0;i<2000;i++)q=turnOrbit(q,.031,-.017);assert.ok(Math.abs(Math.hypot(...q)-1)<1e-10);assert.ok(nearestOrbit(q,5)<5);
 assert.equal(nearestOrbit(turnOrbit(orbitTargets[0],0,Math.PI/2)),4);assert.equal(nearestOrbit(turnOrbit(orbitTargets[0],0,-Math.PI/2)),5);
});
test('only existing simulators are exposed and links retain game, section and service',()=>{
 for(const id of ['wuwa','nte','nikke'])assert.equal(hasOrbitGacha(id),true);
 for(const id of ['zzz','endfield','silver-palace','unknown'])assert.equal(hasOrbitGacha(id),false);
 const url=new URL(orbitLocation('ja','nte','codex','combat','jp'),'https://gagether.wiki');assert.equal(url.pathname,'/orbit/ja');assert.equal(url.searchParams.get('region'),'jp');assert.equal(url.searchParams.get('tab'),'combat');
});

test('deep links normalize tabs without exposing unsupported content groups',()=>{assert.equal(orbitTabFor('schedule','overview'),'overview');assert.equal(orbitTabFor('schedule','characters'),'calendar');assert.equal(orbitTabFor('gacha','calendar'),'current');assert.equal(orbitTabFor('pickups','weapons'),'weapons');});
test('Orbit owns its namespace and login returns locally without changing classic routing',()=>{
 for(const locale of ['ko','en','ja','zh']){
  const path=orbitLocation(locale,'wuwa','pickups','banners','global');
  assert.equal(catalogLocaleHeaders(new Request('https://gagether.wiki'+path,{headers:{'x-gagether-route-locale':'en'}})).get('x-gagether-route-locale'),locale);
  assert.equal(catalogLocation('/orbit/'+locale),null);
  assert.equal(accountReturnTo(path),path);
  assert.equal(catalogLocation('/'+locale).locale,locale);
 }
 for(const path of ['/orbit/ko?returnTo=https://evil.test','//evil.test/orbit/ko','/orbit/ko/%2f%2fevil.test','/orbit/xx','/orbit/ko?game=wuwa#evil'])assert.equal(accountReturnTo(path),'/');
 assert.equal(catalogLocaleHeaders(new Request('https://gagether.wiki/orbit/unknown',{headers:{'x-gagether-route-locale':'ko'}})).get('x-gagether-route-locale'),null);
});
