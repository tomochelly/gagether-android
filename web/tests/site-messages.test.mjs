import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
const {default:Notices}=await import('../components/site-announcements.tsx');
const {default:Banner}=await import('../components/app-download-banner.tsx');
const {defaultAnnouncements,visibleAnnouncements,safeAnnouncementLink}=await import('../lib/site-announcements.ts');
const {settingsSchema}=await import('../lib/editor-schema.ts');
const {androidRelease}=await import('../lib/app-release.ts');
test('notice schema protects four-language text, IDs, dates and links; an explicit empty list stays empty',()=>{
 assert.equal(settingsSchema.safeParse({announcements:defaultAnnouncements,announcementSeconds:7}).success,true);
 assert.deepEqual(visibleAnnouncements([],'ko'),[]);
 for(const href of ['javascript:alert(1)','//evil.test','https://user:pass@evil.test','/\\evil','http://example.test'])assert.equal(safeAnnouncementLink(href),false);
 for(const href of ['/download','https://www.php.net/'])assert.equal(safeAnnouncementLink(href),true);
 for(const bad of [{...defaultAnnouncements[0],publishedDate:'2026-02-30'},{...defaultAnnouncements[0],body:{...defaultAnnouncements[0].body,ja:''}},{...defaultAnnouncements[0],href:'javascript:alert(1)'}])assert.equal(settingsSchema.safeParse({announcements:[bad]}).success,false);
 assert.equal(settingsSchema.safeParse({announcements:[defaultAnnouncements[0],defaultAnnouncements[0]]}).success,false);
});
test('all four download banners use matching localized paths and only the verified release URL',()=>{
 for(const locale of ['ko','en','ja','zh']){const html=renderToStaticMarkup(React.createElement(Banner,{locale}));assert.ok(html.includes('/'+locale+'/download'));assert.ok(html.includes(androidRelease.version));const direct=renderToStaticMarkup(React.createElement(Banner,{locale,direct:true}));assert.ok(direct.includes(androidRelease.downloadUrl));}
});
test('actual notice component rotates, pauses on focus and reduced motion, and opens safe localized detail',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),saved=new Map();const replace=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};
 for(const key of ['window','document','HTMLElement','Node','Event','MouseEvent'])replace(key,dom.window[key]);replace('IS_REACT_ACT_ENVIRONMENT',true);
 let timer,cleared=0,reduced=false,change;replace('matchMedia',()=>({get matches(){return reduced;},addEventListener(_t,fn){change=fn;},removeEventListener(){}}));replace('setInterval',fn=>{timer=fn;return 99;});replace('clearInterval',()=>{timer=null;cleared++;});
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};const root=createRoot(document.getElementById('root'));
 try{await act(async()=>root.render(React.createElement(Notices,{locale:'ja'})));assert.equal(document.querySelector('.notice-position').textContent,'1/2');await act(async()=>timer());assert.equal(document.querySelector('.notice-position').textContent,'2/2');await act(async()=>document.querySelector('.site-announcement-title').focus());assert.equal(timer,null);await act(async()=>document.querySelector('.site-announcement-title').click());assert.equal(document.querySelector('dialog').open,true);assert.match(document.querySelector('dialog h2').textContent,/日本/);await act(async()=>document.querySelector('dialog header button').click());await act(async()=>document.activeElement.blur());reduced=true;await act(async()=>change());assert.equal(timer,null);assert.ok(cleared>0);await act(async()=>root.render(React.createElement(Notices,{locale:'ko',items:[]})));assert.equal(document.querySelector('.site-announcements'),null);
 }finally{await act(async()=>root.unmount());dom.window.close();for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
