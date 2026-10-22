import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const {artworkForLocale,textOnlyEntry}=await import('../lib/artwork.ts');
const {eventState,collaborationActive,activeGameCollaborations,eventEndingSoon,hasPullRewards}=await import('../lib/event-presentation.ts');
const {EventClock,EventBadges}=await import('../components/event-overview.tsx');
const {byId}=await import('../lib/games.ts');
const {safeChannel}=await import('../lib/official-social.ts');
const text={ko:'검수',en:'Reviewed',ja:'確認済み',zh:'已核实'},now=Date.parse('2026-10-20T16:00:00Z');
const base={id:'verified-event',gameId:'wuwa',kind:'event',region:'global',server:'Asia · UTC+8',title:text,summary:text,startAt:'2026-10-15T10:00:00+08:00',endAt:'2026-10-22T04:00:00+08:00',sourceUrl:'https://wutheringwaves.kurogames.com/kr/main/news',sourceTitle:'Test',publishedAt:null,verifiedAt:'2026-10-20T12:00:00Z'};
test('full images never cross languages or fall back to unrelated game artwork',()=>{
 const art={image:'https://example.com/en.png',imageVerified:true,imageLocale:'en',originalLanguageFallback:true,imageCaption:text};
 for(const locale of ['ko','ja','zh']){assert.equal(artworkForLocale(art,locale,'full').image,undefined);assert.equal(artworkForLocale({...art,previewArtwork:{...art}},locale,'preview').image,undefined);}
 assert.equal(artworkForLocale({...art,localizedArtwork:{ko:{...art,image:'https://example.com/ko.png',imageLocale:'ko'}}},'ko','full').image,'https://example.com/ko.png');
 assert.equal(artworkForLocale({...art,imageLocale:'neutral'},'ko','full').image,art.image);
 assert.equal(artworkForLocale({...art,imageLocale:undefined},'ko','full').image,undefined);
 assert.equal(textOnlyEntry({...base,kind:'update'},'ko','full'),true);
});
test('collaboration badges use confirmed participation window and selected actual service',()=>{
 const event={...base,collaboration:{partner:text,scope:'ingame',sourceUrls:[base.sourceUrl],verifiedAt:base.verifiedAt}};
 assert.equal(collaborationActive(event,now),true);assert.equal(collaborationActive(event,Date.parse(base.endAt)),false);
 assert.equal(collaborationActive({...event,startAt:null},now),false);
 assert.equal(collaborationActive({...event,sourceKind:'community'},now),false);
 assert.equal(activeGameCollaborations([event],byId.wuwa,'global',now).length,1);
 assert.equal(activeGameCollaborations([{...event,gameId:'arknights',region:'jp'}],byId.arknights,'kr',now).length,0);
});
test('date-only events stay date-only, expire in source service day, never get a seconds clock',()=>{
 const e={...base,region:'cn',startAt:null,endAt:null,startDate:'2026-10-15',endDate:'2026-10-21'};
 assert.equal(eventState(e,Date.parse('2026-10-21T15:59:59Z')),'active');assert.equal(eventState(e,Date.parse('2026-10-21T16:00:00Z')),'ended');
 const html=renderToStaticMarkup(React.createElement(EventClock,{entry:e,locale:'ko',now}));assert.match(html,/종료 시각 미공개/);assert.doesNotMatch(html,/00초|00:00|00분/);
 assert.equal(eventEndingSoon(e,now),true);
});
test('only reviewed pull rewards trigger emphasis, unrelated resource names do not',()=>{
 const reward={name:text,sourceUrl:base.sourceUrl,sourceKind:'official'};
 assert.equal(hasPullRewards({...base,rewards:[reward]}),false);assert.equal(hasPullRewards({...base,rewards:[{...reward,category:'resource'}]}),false);
 assert.equal(hasPullRewards({...base,rewards:[{...reward,category:'gacha-currency'}]}),true);
 const html=renderToStaticMarkup(React.createElement(EventBadges,{entry:{...base,rewards:[{...reward,category:'gacha-ticket'}]},locale:'ko'}));assert.match(html,/가챠 재화 보상/);
});
test('official social posts cannot link a different account or a different video thumbnail',()=>{
 const c={id:'official',gameId:'wuwa',region:'global',locale:'ko',platform:'x',url:'https://x.com/Wuthering_Waves',evidenceUrls:[base.sourceUrl],verifiedAt:base.verifiedAt,checkedAt:base.verifiedAt,posts:[]};
 const p={url:'https://x.com/Wuthering_Waves/status/123',verifiedAt:base.verifiedAt};assert.equal(safeChannel({...c,posts:[p]}),true);assert.equal(safeChannel({...c,posts:[{...p,url:'https://x.com/other/status/123'}]}),false);
 const yt={...c,platform:'youtube',url:'https://www.youtube.com/@WutheringWaves',posts:[{...p,url:'https://www.youtube.com/watch?v=ABCDEFGHIJK',youtubeId:'ABCDEFGHIJK',thumbnailUrl:'https://i.ytimg.com/vi/WRONGWRONG1/hqdefault.jpg'}]};assert.equal(safeChannel(yt),false);
});
