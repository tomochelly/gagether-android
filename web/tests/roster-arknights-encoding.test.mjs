import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import {gzipSync} from 'node:zlib';import {createHash} from 'node:crypto';
const {characterRosterSchema,rosterDirectory,rosterArts}=await import('../lib/character-roster.ts');
const {hydrateRosterDetails}=await import('../lib/roster-detail-catalog.ts');
const C=s=>({ko:s,en:s,ja:s,zh:s}),source='https://example.org/native',art=(id,regions)=>({url:source+'/'+id+'.png',sourceUrl:source,kind:'splash',locale:'neutral',variantId:id,regions,preview:{url:source+'/'+id+'b.png'}});
function fixture(){
 const id='char_1_exact',stats=[{id:'hp',label:C('HP'),value:'1480',basis:C('Exact native Elite2 max checkpoint')}],details={sourceUrl:source+'/exact',image:{...art('elite-2',['kr','cn']),width:2248,height:2248,variantLabel:C('Elite2')},images:[{...art('elite-0',['kr','cn']),kind:'full-body'}],nameSources:{ko:{url:source+'/name',kind:'community'}},regionalStats:{kr:stats,cn:[{...stats[0],value:'1500'}]},regionalStatProgression:{kr:{sourceUrl:source,sourceKind:'community',basis:C('Source endpoints'),levelLabel:C('Level'),stageLabel:C('Elite'),defaultLevel:80,stages:[{id:2,label:C('Elite2')}],stats:[{id:'hp',label:C('HP')}],rows:[{stage:2,level:1,values:{hp:'1000'}},{stage:2,level:80,values:{hp:'1480'}}]}},regionalSkillTables:{kr:[{id:'exact-skill',name:C('Native skill'),type:C('Skill'),sourceUrl:source,sourceKind:'community',basis:C('Mastery III'),regions:['kr'],description:C('Original native prose'),values:[{id:'sp',label:C('SP'),levels:['30']}]}]}};
 const bytes=Buffer.from(JSON.stringify({id,sourceId:id,details})),form={sourceId:id,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,payload:gzipSync(bytes).toString('base64')};
 return{details,data:characterRosterSchema.parse({gameId:'arknights',sourceName:'Native four-client fixture',sourceUrls:[source],checkedAt:'2026-10-25T00:00:00Z',characters:[{id,sourceId:id,name:C('Exact native operator'),regions:['kr','cn'],image:art('elite-2',['kr','cn']),sourceUrl:source,sourceKind:'community'}],coverage:{sourceCount:1,includedCount:1},detailCatalog:{version:3,sourceUrl:source,checkedAt:'2026-10-25T00:00:00Z',forms:{[id]:form}}})};
}
test('Arknights deferred blocks restore exact service stats, original artwork variants and provenance without expanding the directory',async()=>{
 const {data,details}=fixture(),directory=rosterDirectory(data);assert.equal(directory.detailCatalog,undefined);assert.equal(directory.characters[0].regionalSkillTables,undefined);assert.equal(directory.characters[0].detailsDeferred,true);assert.equal(directory.characters[0].image.preview.url,source+'/elite-2b.png');
 const full=await hydrateRosterDetails(data,data.characters[0]);assert.deepEqual(full.regionalStats,details.regionalStats);assert.deepEqual(full.regionalSkillTables,details.regionalSkillTables);assert.equal(full.sourceUrl,details.sourceUrl);assert.deepEqual(full.image,details.image);assert.deepEqual(full.images,details.images);assert.deepEqual(full.nameSources,details.nameSources);
 assert.equal(rosterArts(full,'ko','kr').length,2);assert.equal(rosterArts(full,'ko','jp').length,0);assert.equal(rosterArts(full,'ko','cn')[0].variantId,'elite-2');
});
test('another operator, modified packed bytes and non-Arknights catalog ownership cannot pass exact detail validation',async()=>{
 const {data}=fixture(),c=data.characters[0],form=data.detailCatalog.forms[c.id];
 const bad={...data,detailCatalog:{...data.detailCatalog,forms:{[c.id]:{...form,payload:gzipSync(Buffer.from(JSON.stringify({id:'another-operator',sourceId:c.id,details:{}}))).toString('base64')}}}};
 await assert.rejects(()=>hydrateRosterDetails(bad,c),/size mismatch|hash mismatch/);
 assert.equal(characterRosterSchema.safeParse({...data,gameId:'nikke'}).success,false);
 assert.equal(characterRosterSchema.safeParse({...data,detailCatalog:{...data.detailCatalog,forms:{[c.id]:{...form,sourceId:'another-operator'}}}}).success,false);
});
test('Amiya class-conversion panels offer playable Elite2 while preserving lower original template checkpoints',async()=>{
 const React=await import('react'),{renderToString}=await import('react-dom/server'),{JSDOM}=await import('jsdom'),{default:Stats}=await import('../components/roster-stat-details.tsx'),{data}=fixture(),full=await hydrateRosterDetails(data,data.characters[0]);
 const progression=full.regionalStatProgression.kr;progression.stages=[{id:0,label:C('Elite0')},{id:1,label:C('Elite1')},{id:2,label:C('Elite2')}];progression.rows.unshift({stage:0,level:1,values:{hp:'500'}});const source=JSON.stringify(progression);
 for(const id of ['char_1001_amiya2','char_1037_amiya3']){const dom=new JSDOM(renderToString(React.createElement(Stats,{character:{...full,id},locale:'ko',service:'kr',gameId:'arknights'})));const select=dom.window.document.querySelector('select[aria-label="Elite"]');assert.deepEqual([...select.options].map(o=>o.value),['2']);dom.window.close();}
 assert.equal(JSON.stringify(progression),source);
 const dom=new JSDOM(renderToString(React.createElement(Stats,{character:full,locale:'ko',service:'kr',gameId:'arknights'})));assert.equal(dom.window.document.querySelector('select[aria-label="Elite"]').options.length,3);dom.window.close();
});
test('gallery uses the separately declared preview, while explicit owner framing retains the full native source',async()=>{
 const React=await import('react'),{renderToString}=await import('react-dom/server'),{JSDOM}=await import('jsdom'),{RosterPicture}=await import('../components/character-roster.tsx'),{data}=fixture(),character=data.characters[0];
 for(const manual of [false,true]){const row=manual?{...character,artworkFrames:[{url:character.image.url,gallery:{x:50,y:50,zoom:1.25,fit:'contain'}}]}:character,dom=new JSDOM(renderToString(React.createElement(RosterPicture,{character:row,locale:'ko',service:'kr'})));assert.equal(dom.window.document.querySelector('img').getAttribute('src'),manual?character.image.url:character.image.preview.url);dom.window.close();}
});
test('declared previews work with the existing image JSON contract and retain original framing identity',async()=>{
 const {readFileSync}=await import('node:fs'),pairs=JSON.parse(readFileSync(new URL('../content/arknights-preview-images.json',import.meta.url),'utf8')),{declaredRosterPreview}=await import('../lib/roster-preview.ts');
 assert.equal(new Set(pairs.map(([url])=>url)).size,pairs.length);assert.ok(pairs.length>0);
 for(const [original,preview]of pairs){assert.equal(preview,original.replace(/\.png$/,'b.png'));assert.deepEqual(declaredRosterPreview(original),{url:preview});}
 const React=await import('react'),{renderToString}=await import('react-dom/server'),{JSDOM}=await import('jsdom'),{RosterPicture}=await import('../components/character-roster.tsx'),{data}=fixture(),original=pairs[0][0];
 const character={...data.characters[0],image:{url:original,sourceUrl:source,kind:'splash'}};
 const dom=new JSDOM(renderToString(React.createElement(RosterPicture,{character,locale:'ko',service:'kr'})));assert.equal(dom.window.document.querySelector('img').getAttribute('src'),pairs[0][1]);dom.window.close();
 assert.equal(declaredRosterPreview('https://example.org/not-declared.png'),undefined);
});
