import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
globalThis.ownerRouteTest={signedIn:true,owner:true,calls:[]};
registerHooks({resolve(s,c,n){const mocks={'@/app/chatgpt-auth':'auth','@/lib/editor-access':'identity','@/lib/request-locale':'locale','@/components/radar':'radar','next/navigation':'navigation'};return mocks[s]?{url:'test:owner-home-'+mocks[s],shortCircuit:true}:n(s,c)},load(u,c,n){const source={
 'test:owner-home-auth':'export async function requireChatGPTUser(path){globalThis.ownerRouteTest.calls.push(path);if(!globalThis.ownerRouteTest.signedIn)throw Error("LOGIN");}',
 'test:owner-home-identity':'export async function editorIdentity(){return globalThis.ownerRouteTest.owner?{userId:"owner"}:null;}',
 'test:owner-home-locale':'export async function requestLocale(){return {locale:"ko",manual:true}}',
 'test:owner-home-radar':'export default function Radar(){return null}',
 'test:owner-home-navigation':'export function notFound(){throw Error("NOT_FOUND");}'
 }[u];return source?{format:'module',source,shortCircuit:true}:n(u,c)}});
const {default:Home}=await import('../components/owner-home.tsx');
const {default:Page,metadata}=await import('../app/owner/page.tsx');
test('owner home has distinct translated tools and direct notification/editor destinations',()=>{
 const titles={ko:'운영자 페이지',en:'Site management',ja:'運営者ページ',zh:'网站管理'};
 for(const [locale,title]of Object.entries(titles)){
  const d=new JSDOM(renderToStaticMarkup(React.createElement(Home,{locale}))).window.document;
  assert.equal(d.querySelector('h1').textContent,title);
  assert.equal(d.querySelectorAll('.owner-home-tools>a').length,8);
  assert.equal(d.querySelectorAll('a a, a button').length,0);
  assert.ok(d.querySelector('a[href="/owner/push"]'));
  assert.ok(d.querySelector('a[href="/owner?view=site"]'));
  assert.ok(d.querySelector(`nav a[href="/${locale}"]`));
 }
});
test('owner home and retained canvas both require sign-in and owner identity',async()=>{
 assert.deepEqual(metadata.robots,{index:false,follow:false});
 for(const view of [undefined,'site']){
  globalThis.ownerRouteTest.signedIn=false;globalThis.ownerRouteTest.owner=true;
  await assert.rejects(()=>Page({searchParams:Promise.resolve({view})}),/LOGIN/);
  globalThis.ownerRouteTest.signedIn=true;globalThis.ownerRouteTest.owner=false;
  await assert.rejects(()=>Page({searchParams:Promise.resolve({view})}),/NOT_FOUND/);
 }
 globalThis.ownerRouteTest.owner=true;
 const home=await Page({searchParams:Promise.resolve({})});assert.equal(home.type,Home);
 const canvas=await Page({searchParams:Promise.resolve({view:'site'})});assert.equal(canvas.props.ownerMode,true);assert.equal(canvas.props.initialPending,true);
 assert.equal(globalThis.ownerRouteTest.calls.at(-1),'/owner?view=site');
});
