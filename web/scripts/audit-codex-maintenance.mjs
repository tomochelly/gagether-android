import '../tests/load-typescript.mjs';
import fs from 'node:fs';
const {rosterArts,rosterSelection}=await import('../lib/character-roster.ts');
const {rosterGalleryFocus}=await import('../lib/roster-gallery-focus.ts');
const {gallerySubject,galleryBackground,galleryProtectedHead}=await import('../lib/gallery-framing.ts');
const {rosterArtUrl}=await import('../lib/roster-art-framing.ts');
const cwd='./';
const read=p=>JSON.parse(fs.readFileSync(cwd+p));
const manifest=read('content/character-rosters/artwork-manifest.json'), sources=new Map();
for(const r of manifest)for(const u of [r.url,r.publicUrl,r.path?.replace(/^public/,'')].filter(Boolean))sources.set(rosterArtUrl(u),r);
const result={checkedAt:new Date().toISOString(),scope:'Read-only canonical bootstrap and runtime presentation registries; no external live availability claim, no owner override reads.',games:[],candidates:[]};
for(const g of read('content/character-rosters/bootstrap.json')){
 const kinds={},r={gameId:g.gameId,characters:g.characters.length,locales:{},artKinds:kinds,selectedGalleryFocus:0,selectedAlphaBounds:0,selectedProtectedHead:0,selectedUnknownFullBody:0,selectedLocalManifest:0,selectedOriginalDimensions:0,missing:[],portraitOnly:[],noFraming:[]};
 for(const locale of ['ko','en','ja','zh']){let missing=0;const type={};for(const c of g.characters){const arts=rosterArts(c,locale);if(!arts.length)missing++;else type[arts[0].kind]=(type[arts[0].kind]||0)+1;}r.locales[locale]={missing,kinds:type};}
 for(const c of g.characters){const art=rosterArts(c,'ko')[0];if(!art){r.missing.push({id:c.id,name:c.name.ko||c.name.en});continue;}kinds[art.kind]=(kinds[art.kind]||0)+1;const focus=rosterGalleryFocus(g.gameId,art.url),bounds=gallerySubject(art.url),head=galleryProtectedHead(art.url);r.selectedGalleryFocus+=!!focus;r.selectedAlphaBounds+=!!bounds;r.selectedProtectedHead+=!!head;r.selectedOriginalDimensions+=!!(art.width&&art.height);r.selectedLocalManifest+=sources.has(rosterArtUrl(art.url));if(art.kind==='portrait')r.portraitOnly.push({id:c.id,name:c.name.ko||c.name.en,url:art.url});if(!focus&&!bounds){r.noFraming.push({id:c.id,name:c.name.ko||c.name.en,url:art.url,kind:art.kind,width:art.width,height:art.height});if(art.kind==='full-body')r.selectedUnknownFullBody++;}}
 r.serviceLocaleCoverage={};
 for(const requested of ['global','kr','jp','cn']){const selection=rosterSelection(g,requested);r.serviceLocaleCoverage[requested]={selectedService:selection.service,characters:selection.characters.length,missingByLocale:Object.fromEntries(['ko','en','ja','zh'].map(locale=>[locale,selection.characters.filter(c=>!rosterArts(c,locale,selection.service).length).map(c=>c.id)]))};}
 result.games.push(r);
}
const wuwa=read('content/wuwa-reference.json');
result.games.push({gameId:'wuwa',characters:wuwa.characters.length,note:'Separate reviewed full-original pipeline unchanged; native metadata/schema and existing regressions checked, not a new full visual review.'});
result.totals={games:result.games.length,commonRosterCharacters:result.games.filter(g=>g.gameId!=='wuwa').reduce((n,g)=>n+g.characters,0)};
fs.writeFileSync(process.argv[2]||'ops/qa/maintenance-art-after.json',JSON.stringify(result,null,2)+'\n');
for(const g of result.games.filter(g=>g.gameId!=='wuwa'))console.log(JSON.stringify({game:g.gameId,total:g.characters,kinds:g.artKinds,missing:g.missing.length,missingByLocale:Object.fromEntries(Object.entries(g.locales).map(([k,v])=>[k,v.missing])),focus:g.selectedGalleryFocus,bounds:g.selectedAlphaBounds,heads:g.selectedProtectedHead,noFraming:g.noFraming.length,unknownFull:g.selectedUnknownFullBody,dim:g.selectedOriginalDimensions}));
