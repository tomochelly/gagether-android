import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import reviewed from '../content/reviewed-roster-information.json' with {type:'json'};
const {reviewedRosterInformation}=await import('../lib/reviewed-roster-information.ts');
const {rosterCharacterSchema,rosterArt,rosterArts}=await import('../lib/character-roster.ts');
const {RosterPicture,CharacterFacts}=await import('../components/character-roster.tsx');
const rana=()=>({id:'26017',sourceId:'rana',name:{ko:'라나',en:'Rana',ja:'ラナ',zh:'รานะ'},nameSources:{},images:[],regions:['jp'],sourceUrl:'https://ba.joexyz.online/api/students',sourceKind:'community'});
const sinclair=()=>({id:'195',sourceId:'195',name:{ko:'싱클레어',en:'Sinclair',ja:'シンクレア',zh:''},image:structuredClone(reviewed.limbus.original),images:['en','ja'].map(locale=>({...structuredClone(reviewed.limbus.original),locale})),sourceUrl:reviewed.limbus.sourceUrl,sourceKind:'community'});

test('exact Japanese Rana receives the complete official card and source-declared Chinese name without altering source rows',()=>{
 const raw=rana(),before=JSON.stringify(raw),out=reviewedRosterInformation('bluearchive',raw);
 rosterCharacterSchema.parse(out);assert.equal(JSON.stringify(raw),before);
 assert.equal(out.name.zh,'拉娜');assert.deepEqual(out.nameSources.zh,{url:raw.sourceUrl,kind:'community'});
 assert.equal(out.image.kind,'card');assert.equal(out.image.locale,'ja');assert.equal(out.image.width,1091);assert.equal(out.image.height,1454);
 for(const locale of ['ko','en','ja','zh'])assert.equal(rosterArt(out,locale,'jp').url,reviewed.bluearchive.image.url);
 assert.equal(rosterArt(out,'en','global'),undefined);assert.deepEqual(reviewedRosterInformation('bluearchive',out),out);
 // No correction can change the actual JP-only release flags.
 assert.deepEqual(out.regions,['jp']);
});

test('Rana corrections leave other identities, services, owner art, names and provenance authoritative',()=>{
 for(const change of [{id:'26018'},{sourceId:'someone-else'},{sourceUrl:'https://example.test/owner'},{regions:['jp','global']},{name:{...rana().name,ja:'別人'}}]){
  const raw={...rana(),...change};assert.equal(reviewedRosterInformation('bluearchive',raw),raw);
 }
 const raw=rana();assert.equal(reviewedRosterInformation('limbus',raw),raw);
 for(const owner of [{image:{url:'https://example.test/owner.png',sourceUrl:raw.sourceUrl,kind:'full-body',locale:'neutral'}},{images:[{url:'https://example.test/owner.png',sourceUrl:raw.sourceUrl,kind:'full-body'}]}]){
  const result=reviewedRosterInformation('bluearchive',{...raw,...owner});assert.equal(result.image,owner.image);assert.equal(result.images,owner.images||raw.images);
 }
 const ownerName={...raw,name:{...raw.name,zh:'自訂名字'}};assert.equal(reviewedRosterInformation('bluearchive',ownerName).name.zh,'自訂名字');
 const ownerSource={...raw,nameSources:{zh:{url:'https://example.test/owner-name',kind:'community'}}};assert.equal(reviewedRosterInformation('bluearchive',ownerSource).name.zh,'รานะ');
});

test('only the exact Limbus195 original can fill a Chinese gap and eligible localized art always wins',()=>{
 const raw=sinclair(),before=JSON.stringify(raw),fallback=rosterArts(raw,'zh','global');
 assert.equal(fallback.length,1);assert.equal(fallback[0],raw.image);assert.equal(fallback[0].locale,'ko');assert.equal(JSON.stringify(raw),before);
 for(const locale of ['ko','en','ja'])assert.equal(rosterArt(raw,locale,'global').locale,locale);
 const localized={url:'https://example.test/zh.png',sourceUrl:raw.sourceUrl,kind:'splash',locale:'zh'};
 assert.deepEqual(rosterArts({...raw,images:[...raw.images,localized]},'zh','global'),[localized]);
 for(const change of [{id:'196'},{sourceId:'196'},{sourceUrl:'https://example.test/other-source'},{image:{...raw.image,url:'https://example.test/owner.png'}},{image:{...raw.image,caption:{...raw.image.caption,zh:'Owner caption'}}},{image:{...raw.image,width:801}}])assert.equal(rosterArts({...raw,...change},'zh','global').length,0);
 assert.equal(rosterArts(raw,'zh','cn').length,0);assert.equal(rosterArts(raw,'zh','kr').length,1);assert.equal(rosterArt(raw,'zh','kr').locale,'ko');
});

test('the fallback keeps the existing visible Korean-original badges in both gallery and detail',()=>{
 const row=sinclair(),picture=new JSDOM(renderToStaticMarkup(React.createElement(RosterPicture,{character:row,locale:'zh',service:'global',gameId:'limbus'}))),detail=new JSDOM(renderToStaticMarkup(React.createElement(CharacterFacts,{character:row,locale:'zh',service:'global',gameId:'limbus'})));
 try{
  assert.equal(picture.window.document.querySelector('img.roster-card-image').getAttribute('src'),row.image.url);
  assert.match(picture.window.document.querySelector('.roster-art-language').textContent,/原文/);
  assert.match(detail.window.document.querySelector('.roster-detail-language').textContent,/原文/);
  assert.equal(detail.window.document.querySelector('.roster-detail-art img').getAttribute('src'),row.image.url);
 }finally{picture.window.close();detail.window.close()}
});

test('opening the fallback original exposes its unchanged image and honest Chinese caption',async()=>{
 const row=sinclair(),dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),saved=new Map();let root;
 const set=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true})};
 for(const key of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event'])set(key,dom.window[key]);set('IS_REACT_ACT_ENVIRONMENT',true);
 HTMLDialogElement.prototype.showModal=function(){this.open=true};
 try{
  const {createRoot}=await import('react-dom/client');
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(CharacterFacts,{character:row,locale:'zh',service:'global',gameId:'limbus'}))});
  await act(async()=>document.querySelector('.roster-detail-art .art-zoom-trigger').click());
  assert.equal(document.querySelector('.image-lightbox[open] img').getAttribute('src'),row.image.url);
  assert.equal(document.querySelector('.image-lightbox footer p').textContent,row.image.caption.zh);
  assert.equal(document.querySelector('.image-lightbox-toolbar a').getAttribute('href'),row.image.url);
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key]}}
});

// Exercise all public-read branches without touching source storage or credentials.
let slice=false;
const sourceRoster=()=>({gameId:'bluearchive',sourceName:'Verified original fixture',sourceUrls:[rana().sourceUrl],checkedAt:'2026-10-30T00:00:00Z',characters:[rana()],coverage:{sourceCount:1,includedCount:1}});
globalThis.__reviewedRosterPublicFixture={view:()=>({data:sourceRoster(),hash:'source-hash',delivery:'persistent'}),slice:()=>slice?{data:sourceRoster(),source:sourceRoster()}:null};
registerHooks({
 resolve(s,c,next){if(c.parentURL?.endsWith('/lib/roster-public-read.ts')){
  const mocks={'@/lib/public-roster-cache':'cache','@/lib/roster-read-revision':'revision','@/lib/write-access':'auth','./roster-public-slices':'slices','@/lib/roster-art-framing-store':'view','./roster-detail-catalog':'details','@/lib/roster-detail-catalog':'details'};
  if(mocks[s])return {url:'test:reviewed-roster-'+mocks[s],shortCircuit:true};
 }return next(s,c)},
 load(u,c,next){const prefix='test:reviewed-roster-';if(!u.startsWith(prefix))return next(u,c);const sources={
  cache:'export const publicRosterResponse=(request,options)=>options.read("reviewed-revision");',
  revision:'export const currentRosterReadRevision=async()=>"reviewed-revision";',
  auth:'export const canWriteData=async()=>false;',
  slices:'export const readPublicRosterSlice=async()=>globalThis.__reviewedRosterPublicFixture.slice();export const savePublicRosterSlices=async()=>{throw Error("Unexpected source write")};',
  view:'export const readCharacterRosterView=async()=>globalThis.__reviewedRosterPublicFixture.view();',
  details:'export const hydrateRosterDetails=async(data,character)=>({...character,sections:[{id:"original",title:{ko:"",en:"Original",ja:"",zh:""},body:{ko:"",en:"Keep original complete prose",ja:"",zh:""}}]});'
 };return {format:'module',source:sources[u.slice(prefix.length)],shortCircuit:true}}
});
test('directory, complete character and cached character-slice public reads apply the projection after hydration',async()=>{
 const {readPublicCharacterRoster}=await import('../lib/roster-public-read.ts');
 for(const id of [undefined,'26017']){
  for(const cached of id?[false,true]:[false]){
   slice=cached;const response=await readPublicCharacterRoster(new Request('https://gagether.wiki/api/characters?game=bluearchive'+(id?'&id='+id:'')));
   assert.equal(response.status,200);const body=await response.json(),row=id?body.character:body.data.characters[0];
   assert.equal(row.image.url,reviewed.bluearchive.image.url);assert.equal(row.name.zh,'拉娜');rosterCharacterSchema.parse(row);
   if(id)assert.equal(row.sections[0].body.en,'Keep original complete prose');
  }
 }
 assert.equal(sourceRoster().characters[0].image,undefined);assert.equal(sourceRoster().characters[0].name.zh,'รานะ');
});
