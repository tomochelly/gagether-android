import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const {sourceDocument,decodeSourceHtml}=await import('../lib/collection-review.ts');
const {bodyFromDocument,importBody,sourceBodyFor,bodyRewards}=await import('../lib/source-bodies.ts');
const {entrySchema,safeExtras}=await import('../lib/content-schema.ts');
const {regionalDetail,regionalOfficialSources}=await import('../lib/regional-notices.ts');
const {cleanDisplayText,displayTitle}=await import('../lib/content-display.ts');
const {availableInLocale,retainEntityDetails}=await import('../lib/presentation.ts');
const {catalogEntry}=await import('../lib/catalog-index.ts');
const {games}=await import('../lib/games.ts');
const {default:SourceArticle}=await import('../components/source-article.tsx');
const time='2026-10-22T08:00:00Z',url='https://bluearchive.jp/news/newsJump/700';
const blank={ko:'',en:'',ja:'',zh:''};
const base={id:'quick-bluearchive-jp-700',gameId:'bluearchive',region:'jp',server:'jp',kind:'update',title:{...blank,ja:'アップデート'},summary:{...blank,ko:'공식 새 공지입니다. 상세 조건과 현지화는 검수 중입니다.'},sourceUrl:url,sourceTitle:'アップデート',sourceLocale:'ja',sourceKind:'official',verifiedAt:time,publishedAt:'2026-10-22',startAt:null,endAt:null};
const doc={id:'a'.repeat(64),gameId:'bluearchive',region:'jp',locale:'ja',url,title:'アップデート',publishedAt:'2026-10-22',sourceAccess:'body',bodyHash:'b'.repeat(64),images:[],checkedAt:time};

test('escaped regional HTML is decoded without execution; tables, links and full long bodies survive',()=>{
 const raw=String.raw`\u003cp\u003e参加条件: 任務2-3クリア\u003c/p\u003e\u003ctable\u003e\u003ctr\u003e\u003ctd\u003e報酬\u003c/td\u003e\u003ctd\u003e150\u003c/td\u003e\u003c/tr\u003e\u003c/table\u003e\u003cimg src=\"https://example.com/current-ja.jpg\"\u003e\u003ca href=\"https://example.com/join?a=1&amp;b=2\"\u003e参加する\u003c/a\u003e`;
 const parsed=sourceDocument(raw,url);assert.equal(parsed.access,'body');assert.match(parsed.text,/参加条件/);assert.match(parsed.text,/報酬 · 150/);assert.equal(parsed.images[0],'https://example.com/current-ja.jpg');assert.equal(parsed.links[0].url,'https://example.com/join?a=1&b=2');assert.ok(!parsed.text.includes('u003c'));
 assert.match(decodeSourceHtml(String.raw`\\u003cp\\u003efull\\u003c/p\\u003e`),/^<p>full<\/p>$/);
 assert.equal(sourceDocument('<p>'+('文字'.repeat(60000))+'</p>',url).text.length,120000);
});

test('import publishes native content immediately, preserves reviewed fields and is idempotent',()=>{
 const body=bodyFromDocument(doc,{text:'参加条件: 任務2-3クリア\n報酬: 青輝石150個',images:['https://example.com/current-ja.jpg','https://example.com/logo.png','https://nng-phinf.pstatic.net/something/01-%EA%B3%B5%EC%A7%80%EC%82%AC%ED%95%AD.png']});
 assert.equal(body.images.length,1);const old={...base,detailSections:[{title:{...blank,ko:'기존 설명'},body:{...blank,ko:'기존 상세'}}],image:'/assets/existing.png',previewFocus:{x:40,y:50,zoom:1},videos:[{youtubeId:'abcdefghijk',kind:'version',title:{...blank,ja:'更新PV'},locale:'ja',channel:'Official',sourceUrl:'https://www.youtube.com/watch?v=abcdefghijk',verifiedAt:time,official:true,metadataVerified:true,watched:false}]};
 const next=importBody(old,body);assert.equal(next.verifiedAt,old.verifiedAt);assert.deepEqual(next.detailSections,old.detailSections);assert.equal(next.image,old.image);assert.deepEqual(next.previewFocus,old.previewFocus);assert.deepEqual(next.videos,old.videos);assert.equal(next.sourceBodies.ja.text,body.text);assert.equal(next.title.en,'');assert.equal(next.sourceBodies.ja.imageVerified,undefined);
 assert.strictEqual(importBody(next,{...body,importedAt:'2026-10-23T01:00:00Z'}),next);assert.equal(bodyFromDocument({...doc,sourceAccess:'blocked'},{text:'Access denied'}),null);
 assert.equal(entrySchema.safeParse(next).success,true);assert.equal(safeExtras(next),true);assert.equal(catalogEntry(next).sourceBodies,undefined);assert.deepEqual(retainEntityDetails({...next,sourceBodies:undefined},next).sourceBodies,next.sourceBodies);
});

test('every game can publish native text without translation; independent service art remains native',()=>{
 for(const game of games)for(const locale of ['ko','en','ja','zh']){
  const e={...base,id:'custom-'+game.id,gameId:game.id,region:game.regions[0]};assert.equal(availableInLocale(e,locale),true);assert.equal(displayTitle(e,locale),'アップデート');
 }
 const body=bodyFromDocument(doc,{text:'参加方法の本文です。',images:['https://example.com/current-ja.jpg']});
 const e=importBody(base,body);assert.equal(availableInLocale(e,'ko'),true);assert.deepEqual(sourceBodyFor(e,'ko').images,body.images,'selected JP service uses Japanese images');
 const shared={...e,gameId:'wuwa',region:'global'};assert.deepEqual(sourceBodyFor(shared,'ko').images,[],'shared KR view must not borrow Japanese poster');assert.equal(sourceBodyFor(shared,'ko').body.text,body.text);
 const html=renderToStaticMarkup(React.createElement(SourceArticle,{entry:e,locale:'ko'}));assert.match(html,/参加方法/);assert.doesNotMatch(html,/검수 중|현지화 확인|imageVerified/);
 assert.equal(cleanDisplayText(base.summary.ko),'');assert.equal(cleanDisplayText('날짜 기준 · 시각 미공개'),'');assert.equal(cleanDisplayText('참여 조건: 계정 레벨 30'),'참여 조건: 계정 레벨 30');
});

test('explicit reward pairs use actual catalog icons and never infer from headline or invent an amount',()=>{
 const b={locale:'ja',sourceUrl:url,sourceKind:'official',bodyHash:'b'.repeat(64),importedAt:time,images:[],text:'ログインすると青輝石 × 150 個 を獲得できます。'};
 const rewards=bodyRewards(base,b);assert.equal(rewards[0].quantity,'150');assert.equal(rewards[0].category,'gacha-currency');assert.ok(rewards[0].icon.image);assert.equal(rewards[0].acquisition,'conditional');
 assert.equal(bodyRewards({...base,sourceTitle:'青輝石150個'},{...b,text:'イベントのお知らせです。'}).length,0);
});

test('ordinary official body adapters use exact identities, correct languages and real response fields',async()=>{
 const uma={...base,gameId:'umamusume',id:'3523',locale:'ja',url:'https://umamusume.jp/news/detail?id=3523'};
 assert.equal(await regionalDetail(uma,async()=>Response.json({response_code:1,detail:{message:'<p>ジュエル150個</p>'}})),'<p>ジュエル150個</p>');
 const wuwa={...uma,gameId:'wuwa',id:'5572',locale:'ko',url:'https://wutheringwaves.kurogames.com/kr/main/news/detail/5572'};
 assert.equal(await regionalDetail(wuwa,async u=>{assert.match(u,/G152\/kr\/article\/5572.json/);return Response.json({articleId:5572,gameId:'G152-kr',articleContent:'Full current body'}); }),'Full current body');
 await assert.rejects(()=>regionalDetail(wuwa,async()=>Response.json({articleId:7,gameId:'G152-kr',articleContent:'wrong'})),/identity mismatch/);
 const kakao={...uma,gameId:'nte',id:'114974942',locale:'ko',url:'https://pf.kakao.com/_uSxfcG/114974942'};
 const body=await regionalDetail(kakao,async()=>Response.json({id:114974942,author:{id:'_uSxfcG'},is_private:false,status:'published',contents:[{t:'text',v:'조건 <레벨30>'}],media:[{type:'image',url:'https://example.com/ko.jpg'}]}));assert.match(body,/&lt;레벨30&gt;/);assert.match(body,/ko.jpg/);
 for(const locale of ['ja','en']){
  const n={...uma,gameId:'nikke',id:'f'.repeat(32),locale,url:'https://nikke-'+(locale==='ja'?'jp':'en')+'.com/newsdetail.html?content_id='+'f'.repeat(32)};
  assert.equal(await regionalDetail(n,async(u,init)=>{assert.equal(init.headers['X-Language'],locale);return Response.json({code:0,data:{content_id:n.id,content:'native body'}}); }),'native body');
  const sources=regionalOfficialSources.filter(s=>s.gameId==='nikke'&&s.locale===locale);assert.equal(sources.length,2);let labels=[];
  for(const s of sources)await s.load(async(u,init)=>{labels.push(JSON.parse(init.body).secondary_label_id);assert.equal(JSON.parse(init.body).disable_use_default_language,true);return Response.json({code:0,data:{info_content:[{content_id:n.id,title:'native',pub_timestamp:1792656000}]}});});assert.deepEqual(labels,[496,892]);
 }
 const ak={...uma,gameId:'arknights',region:'cn',locale:'zh',id:'6242',url:'https://ak.hypergryph.com/news/6242'};
 const stream='<script>self.__next_f.push('+JSON.stringify([1,'1a:T123,<p>维护内容与补偿 合成玉100</p>'])+')</script>';
 assert.match(await regionalDetail(ak,async()=>new Response(stream)),/维护内容/);
});

 test('Korean Blue Archive uses its own exact official thread body, not a JavaScript shell',async()=>{
 const n={gameId:'bluearchive',region:'kr',locale:'ko',id:'12345',url:'https://forum.nexon.com/bluearchive/board_view?board=1018&thread=12345'};
 const f=async()=>Response.json({threadId:12345,boardId:1018,communityId:148,user:{isAdmin:true},isDelete:false,isWebHide:false,content:'<p>공식 한국 공지의 전체 본문입니다.</p>'});
 assert.match(await regionalDetail(n,f),/전체 본문/);await assert.rejects(()=>regionalDetail(n,async()=>Response.json({threadId:12345,boardId:7,content:'wrong'})),/identity mismatch/);
 assert.equal(await regionalDetail({...n,url:n.url.replace('1018','7')},f),undefined);
 const b=bodyFromDocument({...doc,title:'実際の日本語タイトル'},{text:'参加条件の全文です。'});const e=importBody({...base,sourceLocale:'ko',sourceTitle:'한국어 제목',title:blank},b);assert.equal(e.title.ja,'実際の日本語タイトル');assert.equal(e.title.ko,'');
 });

 test('Arknights Global reads its native current body from the observed public frontend API',async()=>{
 const n={gameId:'arknights',region:'global',locale:'en',id:'4980',url:'https://www.arknights.global/news/4980'};const body=await regionalDetail(n,async u=>{assert.equal(u,'https://www.arknights.global/api/resource/news/detail?id=4980');return Response.json({code:0,data:{id:4980,content:'<p>Full native Global notice.</p>'}});});assert.match(body,/Full native Global/);await assert.rejects(()=>regionalDetail(n,async()=>Response.json({code:0,data:{id:7,content:'wrong'}})),/identity mismatch/);
 });
