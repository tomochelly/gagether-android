import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {reviewedPickupArtwork,reviewedPickupGroupFallback,reviewedPickupArtworkRules:rules,reviewedPickupFrameGeometry,isReviewedPickupDefaultFrame}=await import('../lib/reviewed-pickup-artwork.ts');
const {artworkForLocale}=await import('../lib/artwork.ts');
const {spotlightSlides}=await import('../lib/spotlight.ts');
const {pickupCards}=await import('../lib/pickup-cards.ts');
const {pickupArtwork}=await import('../lib/pickup-artwork.ts');
const {upcomingArtwork}=await import('../lib/upcoming-pickups.ts');
const {frameGeometry}=await import('../lib/image-framing.ts');
const {rosterArts}=await import('../lib/character-roster.ts');
const locales=['ko','en','ja','zh'],loc=s=>Object.fromEntries(locales.map(l=>[l,s])),now=Date.parse('2026-10-30T00:00:00Z');
const makeName=rule=>({...loc(Object.values(rule.name)[0]),...rule.name});
const oldArt=rule=>rule.previous[0]?{...rule.previous[0],imageVerified:true,imageKind:'splash',imageLocale:'neutral'}:{};
function entryFor(rule){const name=makeName(rule),art=oldArt(rule);return {id:rule.entryId,gameId:rule.gameId,region:rule.region,kind:'pickup',poolType:'character',sourceUrl:rule.sourceUrl,sourceTitle:'Exact source',title:name,summary:loc('Reviewed source'),startAt:'2026-10-01T00:00:00Z',endAt:'2026-11-15T00:00:00Z',verifiedAt:'2026-10-30T00:00:00Z',...art,pickupMembers:[{name,type:'new',role:'featured',...art,localizedArtwork:Object.fromEntries(locales.map(l=>[l,{...art,width:710,height:399,verifiedAt:'2026-10-29T00:00:00Z'}]))}]};}
const holoRules=rules.filter(r=>r.gameId==='holodreams');
function holoEntry(){const e=entryFor(holoRules[0]);delete e.image;delete e.imageSource;delete e.imageVerified;e.title=loc('Cosplay Night Gacha');e.pickupMembers=holoRules.map(rule=>entryFor(rule).pickupMembers[0]);return e;}

test('five exact Holo card previews use native1920 originals in every language and preserve original edit/detail records',()=>{
 const original=holoEntry(),before=structuredClone(original),cards=pickupCards([original]),slides=spotlightSlides([original],now);
 assert.equal(cards.length,5);assert.equal(slides.length,5);
 for(let i=0;i<5;i++)for(const locale of locales){
  const expected=holoRules[i].asset.image,art=artworkForLocale(cards[i].display,locale);
  assert.equal(art.image,expected);assert.equal(art.width,1920);assert.equal(art.height,1080);
  assert.equal(artworkForLocale(slides[i].art,locale).image,expected);
  assert.equal(pickupArtwork(original,locale)[i].art.image,expected);
  assert.equal(pickupArtwork(original,locale,'full')[i].art.image,holoRules[i].previous[0].image);
  assert.strictEqual(cards[i].entry,original);assert.strictEqual(slides[i].entry,original);
  assert.ok(cards[i].display.relatedSources.some(source=>source.url===holoRules[i].previous[0].image));
 }
 assert.deepEqual(original,before);
});

test('wrong rotation/source/outfit and later owner artwork remain reference-identical',()=>{
 const original=holoEntry();
 for(const changed of [{...original,id:'different'},{...original,region:'jp'},{...original,sourceUrl:'https://gamewith.jp/different'},...['image','pickupMembers','localizedArtwork.en','imageFraming.banner','previewFocus'].map(field=>({...original,editor:{revision:9,fields:[field]}}))])assert.strictEqual(reviewedPickupArtwork(changed),changed);
 const outfit={...original,pickupMembers:original.pickupMembers.map(m=>({...m,name:{...m.name,ja:m.name.ja+'別衣装'}}))};assert.strictEqual(reviewedPickupArtwork(outfit),outfit);
 const replacement={...original,pickupMembers:original.pickupMembers.map(m=>({...m,image:'/api/media/later.png',imageSource:'https://gagether.wiki/api/media/later.png',localizedArtwork:undefined}))};assert.strictEqual(reviewedPickupArtwork(replacement),replacement);
});

test('explicit cleared locale slots and custom locale originals override reviewed root replacements',()=>{
 for(const locale of locales){
  const original=holoEntry(),clear={image:'',imageVerified:false,imageLocale:locale,width:1,height:1,verifiedAt:'2026-10-30T00:00:00Z'};
  original.pickupMembers[0].localizedArtwork[locale]=clear;
  const view=reviewedPickupArtwork(original);assert.strictEqual(view.pickupMembers[0].localizedArtwork[locale],clear);assert.equal(artworkForLocale(view.pickupMembers[0],locale).image,undefined);
  const custom={image:'/api/media/custom.png',imageSource:'https://gagether.wiki/api/media/custom.png',imageVerified:true,imageLocale:locale,width:1000,height:1000,verifiedAt:'2026-10-30T00:00:00Z'};
  original.pickupMembers[0].localizedArtwork[locale]=custom;assert.strictEqual(reviewedPickupArtwork(original).pickupMembers[0].localizedArtwork[locale],custom);assert.equal(artworkForLocale(reviewedPickupArtwork(original).pickupMembers[0],locale).image,custom.image);
 }
});

test('saved per-surface placement is retained and new default frames protect complete reviewed heads',()=>{
 const original=holoEntry(),saved={banner:{x:61,y:35,zoom:1.7,fit:'cover'},card:{x:48,y:37,zoom:1.1,fit:'contain'}};
 original.pickupMembers[0].imageFraming=saved;for(const slot of Object.values(original.pickupMembers[0].localizedArtwork))slot.imageFraming=saved;
 const view=reviewedPickupArtwork(original);assert.strictEqual(view.pickupMembers[0].imageFraming,saved);for(const locale of locales)assert.strictEqual(artworkForLocale(view.pickupMembers[0],locale).imageFraming,saved);
 for(const rule of rules){const e=entryFor(rule);delete e.pickupMembers[0].localizedArtwork;const art=reviewedPickupArtwork(e).pickupMembers[0];
  for(const [kind,box]of Object.entries({banner:{width:1200,height:620},card:{width:350,height:420},mobile:{width:390,height:320}})){
   const frame=art.imageFraming[kind],g=frameGeometry(rule.asset,box,frame),left=g.left+g.width*rule.head.left/100,right=g.left+g.width*rule.head.right/100,top=g.top+g.height*rule.head.top/100,bottom=g.top+g.height*rule.head.bottom/100;
   assert.ok(left>=-.001&&right<=box.width+.001&&top>=-.001&&bottom<=box.height+.001,rule.entryId+' '+kind);
   assert.ok(g.width<=rule.asset.width+.001&&g.height<=rule.asset.height+.001,'defaults retain native pixels');
   assert.ok(isReviewedPickupDefaultFrame(art,frame));
   const highDpr=reviewedPickupFrameGeometry(art,rule.asset,{width:3840,height:2160},frame,3);assert.ok(highDpr.width<=rule.asset.width/3+.001&&highDpr.height<=rule.asset.height/3+.001);
   for(const actual of [{width:144,height:81},{width:104,height:58.5},{width:390,height:320}]){const actualGeometry=reviewedPickupFrameGeometry(art,rule.asset,actual,frame,2);assert.ok(actualGeometry.left+actualGeometry.width*rule.head.left/100>=-.001);assert.ok(actualGeometry.left+actualGeometry.width*rule.head.right/100<=actual.width+.001);assert.ok(actualGeometry.top+actualGeometry.height*rule.head.top/100>=-.001);assert.ok(actualGeometry.top+actualGeometry.height*rule.head.bottom/100<=actual.height+.001);}
  }
 }
 const art={...rules[0].asset,imageFraming:saved};assert.equal(isReviewedPickupDefaultFrame(art,saved.banner),false);assert.deepEqual(reviewedPickupFrameGeometry(art,rules[0].asset,{width:3840,height:2160},saved.banner,3),frameGeometry(rules[0].asset,{width:3840,height:2160},saved.banner,3));
});

test('Chrono fills only genuinely absent exact outfit artwork while explicit clears and other service remain intact',()=>{
 const rule=rules.find(r=>r.fillMissing),original=entryFor(rule);delete original.pickupMembers[0].localizedArtwork;
 for(const locale of locales){assert.equal(artworkForLocale(original,locale).image,rule.asset.image);assert.equal(pickupArtwork(original,locale)[0].art.image,rule.asset.image);assert.equal(artworkForLocale(original,locale,'full').image,undefined);}
 const cleared={...original,image:'',imageVerified:false,pickupMembers:[{...original.pickupMembers[0],image:'',imageVerified:false}]};assert.strictEqual(reviewedPickupArtwork(cleared),cleared);
 assert.strictEqual(reviewedPickupArtwork({...original,region:'global'}).image,undefined);
 const future={...original,pickupArchive:{status:'forecast'}};assert.equal(upcomingArtwork(future.pickupMembers[0],future,'en').image,rule.asset.image);
});

test('JP three-card notice renders one honest group poster in four UI locales, without inventing individual card images',()=>{
 const names=['[いとどめでたき、まつりかな]吾妻','[Time of Departure]マヤノトップガン','[巫女]吾妻'],sourceUrl='https://umamusume.jp/news/detail?id=3511';
 const e={id:'review-umamusume-jp-20261026-support',gameId:'umamusume',region:'jp',kind:'weapon',poolType:'support',sourceUrl,imageSource:sourceUrl,image:'https://prd-info-umamusume.akamaized.net/announce/3511/Header/announce_banner_3478.png?c=20261020173925',imageVerified:true,imageLocale:'ja',imageKind:'banner',title:loc('SSR 吾妻 / SSR マヤノトップガン'),pickupMembers:names.map(n=>({name:loc(n),type:'new',role:'featured'})),startAt:'2026-10-26T12:00:00+09:00',endAt:'2026-11-19T11:59:00+09:00'};
 const before=structuredClone(e);assert.equal(reviewedPickupGroupFallback(e),true);assert.equal(spotlightSlides([e],now).length,1);assert.equal(pickupCards([e]).length,1);
 for(const locale of locales){const art=pickupArtwork(e,locale);assert.equal(art.length,1);assert.match(art[0].art.image,/gacha_banner_30479\.png/);assert.equal(art[0].art.imageLocale,'ja');assert.equal(artworkForLocale(e,locale,'full','ja').image,e.image);}
 assert.deepEqual(e,before);assert.ok(e.pickupMembers.every(m=>!m.image));
 assert.equal(reviewedPickupGroupFallback({...e,sourceUrl:'https://umamusume.jp/news/detail?id=OTHER'}),false);
 const clear=structuredClone(e);clear.pickupMembers[0].localizedArtwork={ja:{image:'',imageVerified:false}};assert.equal(reviewedPickupGroupFallback(clear),false);
});

test('Reverse exact character previews retain locale/service guards and full announcement originals',()=>{
 for(const rule of rules.filter(r=>r.gameId==='reverse1999')){const e=entryFor(rule);e.localizedArtwork=Object.fromEntries(rule.previous.map((old,i)=>[locales[i],{...old,imageVerified:true,imageLocale:'neutral',width:1202,height:210,verifiedAt:'2026-10-29T00:00:00Z'}]));
  const view=reviewedPickupArtwork(e);for(const locale of locales){assert.equal(artworkForLocale(view,locale).image,rule.asset.image);assert.equal(artworkForLocale(e,locale,'full').image,(e.localizedArtwork[locale]||e).image);}
  assert.equal(spotlightSlides([e],now)[0].entry,e);
 }
});

test('Daiwa None cleanup uses exact source/native costume and leaves owner names and codex untouched',()=>{
 const e={id:'review-umamusume-jp-20261026-daiwa',gameId:'umamusume',kind:'pickup',region:'jp',sourceUrl:'https://umamusume.jp/news/detail?id=3511',image:'https://media.gametora.com/umamusume/characters/render/trainee/idle/100903.png',imageSource:'https://gametora.com/umamusume/characters/100903-daiwa-scarlet',title:{...loc(''),en:'Daiwa Scarlet [None]',ja:'ダイワスカーレット [陣風の花紺青]'}};
 assert.equal(reviewedPickupArtwork(e).title.en,'Daiwa Scarlet [陣風の花紺青]');const edited={...e,editor:{fields:['title.en']}};assert.strictEqual(reviewedPickupArtwork(edited),edited);
 const rosterFile=new URL('../content/character-rosters/bootstrap.json',import.meta.url),bytes=fs.readFileSync(rosterFile),c={id:'separate-codex-row',name:makeName(holoRules[0]),image:{url:holoRules[0].previous[0].image,sourceUrl:holoRules[0].sourceUrl,kind:'card',locale:'neutral'}};
 const arts=rosterArts(c,'en');reviewedPickupArtwork(holoEntry());assert.deepEqual(rosterArts(c,'en'),arts);assert.ok(fs.readFileSync(rosterFile).equals(bytes));assert.ok(arts.every(a=>a.url!==holoRules[0].asset.image));
 const good={...e,id:'already-good',gameId:'hsr'};assert.strictEqual(reviewedPickupArtwork(good),good);assert.strictEqual(artworkForLocale({...good,imageVerified:true,imageLocale:'neutral'},'en').image,good.image);
});

test('HI3 text-heavy pickup posters use the preserved neutral original while good Japanese slots and full views stay unchanged',()=>{
 for(const rule of rules.filter(r=>r.gameId==='hi3')){
  const e=entryFor(rule),member=e.pickupMembers[0];
  const japanese={...rule.asset,previewFocus:{x:42,y:48,zoom:1}};
  member.localizedArtwork.ja=japanese;
  const before=structuredClone(e);
  const view=reviewedPickupArtwork(e);
  for(const locale of ['ko','en','zh']){const art=artworkForLocale(view.pickupMembers[0],locale);assert.equal(art.image,rule.asset.image);assert.equal(art.imageLocale,'neutral');assert.ok(art.imageFraming.banner);assert.equal(artworkForLocale(member,locale,'full').image,rule.previous[0].image);}
  assert.strictEqual(view.pickupMembers[0].localizedArtwork.ja,japanese);
  assert.deepEqual(artworkForLocale(view.pickupMembers[0],'ja'),artworkForLocale(member,'ja'));
  assert.ok(view.relatedSources.some(s=>s.url===rule.asset.imageSource&&s.kind==='official'));
  assert.deepEqual(e,before);
  const clear={image:'',imageVerified:false,imageLocale:'en'};member.localizedArtwork.en=clear;
  assert.strictEqual(reviewedPickupArtwork(e).pickupMembers[0].localizedArtwork.en,clear);
  const owner={...e,editor:{fields:['localizedArtwork.ko']}};assert.strictEqual(reviewedPickupArtwork(owner),owner);
 }
});
