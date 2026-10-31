import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const {historyGameFilter}=await import('../lib/history-game-filter.ts');
const {default:PickupHistory}=await import('../components/pickup-history.tsx');
const {CatalogContext}=await import('../components/catalog-context.tsx');
const {catalogGames,catalogUi}=await import('../lib/editorial.ts');
const {effectiveRegion}=await import('../lib/presentation.ts');
const {ownerUi}=await import('../lib/owner-ui.ts');
const {historyText}=await import('../lib/pickup-history.ts');
const games=catalogGames({}),byId=Object.fromEntries(games.map(g=>[g.id,g]));
const [favorite,other]=games;
const local=text=>({ko:text,en:text,ja:text,zh:text});
const entries=[favorite,other].map((game,i)=>({id:'history-'+i,gameId:game.id,kind:'pickup',poolType:'character',region:effectiveRegion(game,game.regions[0]),title:local('Record '+i),summary:local(''),sourceUrl:'https://example.com/notice',sourceTitle:'Notice',sourceKind:'official',startAt:null,endAt:null,pickupArchive:{status:'past',startDate:'2020-01-01',endDate:'2020-01-10'}}));
function render(props={},locale='ko'){
 return renderToStaticMarkup(createElement(CatalogContext.Provider,{value:{games,byId,t:catalogUi(locale,{}),settings:{},canEdit:false,editMode:false,simpleMode:false,openEditor(){}}},createElement(PickupHistory,{entries,locale,region:favorite.regions[0],onOpen(){},...props})));
}
const options=html=>[...html.match(/<div class="history-filters"><select[^>]*>(.*?)<\/select>/s)[1].matchAll(/<option value="([^"]+)"/g)].map(match=>match[1]);
const heading=html=>html.match(/<header class="history-heading">.*?<p>(.*?)<\/p>/s)[1];

test('favorite-only options match the record scope, including games with no records',()=>{
 const html=render({myOnly:true,favorites:[favorite.id,other.id],entries:entries.slice(0,1)});
 assert.deepEqual(options(html),['all',favorite.id,other.id]);
 const single=render({myOnly:true,favorites:[favorite.id]});
 assert.deepEqual(options(single),['all',favorite.id]);
 assert.ok(single.includes('Record 0'));assert.ok(!single.includes('Record 1'));
 assert.deepEqual(options(render({myOnly:false,favorites:[favorite.id]})),['all',...games.map(g=>g.id)]);
});

test('enabling the filter or removing the selected favorite resets an invalid selection',()=>{
 assert.equal(historyGameFilter(games,other.id,false,[favorite.id]).selectedGameId,other.id);
 assert.equal(historyGameFilter(games,other.id,true,[favorite.id]).selectedGameId,'all');
 assert.equal(historyGameFilter(games,favorite.id,true,[favorite.id]).selectedGameId,favorite.id);
 assert.equal(historyGameFilter(games,favorite.id,true,[]).selectedGameId,'all');
 assert.equal(historyGameFilter(games,'removed-game',false,[]).selectedGameId,'all');
});

test('empty favorites explain how to choose games instead of claiming no pickup announcements',()=>{
 for(const locale of ['ko','en','ja','zh']){
  const html=render({myOnly:true,favorites:[]},locale);
  assert.deepEqual(options(html),['all']);
  assert.equal(heading(html),ownerUi[locale].myGames);
  assert.ok(html.includes(ownerUi[locale].noGames));
  assert.ok(!html.includes('Record 0'));assert.ok(!html.includes('Record 1'));
  assert.equal(heading(render({},locale)),historyText[locale].allGames);
 }
});

test('the selected game drives the localized heading; direct game pages ignore favorites',()=>{
 for(const locale of ['ko','en','ja','zh']){
  const selected=historyGameFilter(games,other.id,false,[]).selectedGameId;
  const html=render({gameId:selected,myOnly:true,favorites:[],region:other.regions[0]},locale);
  assert.ok(heading(html).startsWith(byId[selected].name[locale]+' · '));
  assert.ok(html.includes('Record 1'));assert.ok(!html.includes('Record 0'));
  assert.equal(historyGameFilter(games,'all',true,[],other.id).selectedGameId,other.id);
 }
});
