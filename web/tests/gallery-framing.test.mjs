import './load-typescript.mjs';import {test} from 'node:test';import assert from 'node:assert/strict';
import audit from '../content/gallery-subject-bounds.json' with {type:'json'};
import runtime from '../content/gallery-framing-runtime.json' with {type:'json'};
import heads from '../content/gallery-protected-heads.json' with {type:'json'};
const {safeGalleryFrame,safePortraitFrame,gallerySubject,galleryBackground}=await import('../lib/gallery-framing.ts');
test('audited transparent subjects remain wholly inside both diagonal silhouettes at narrow/wide sizes and native DPR',()=>{
 assert.equal(runtime.entries.length,Object.keys(audit.entries).length);assert.deepEqual(runtime.backgrounds,audit.knownBackgroundURLs);assert.ok(Object.keys(audit.entries).length>=905);for(const [url,b]of Object.entries(audit.entries)){
  assert.equal(galleryBackground(url),false);const {sha256,...geometry}=b;assert.deepEqual(gallerySubject(url),geometry);
  for(const [width,height,slant,dpr]of [[190,317,28,1],[166,277,22,2],[440,400,60,1],[240,330,38,2]]){
   const f=safeGalleryFrame(b,{width,height},b,slant,dpr);assert.ok(f,url);assert.ok(f.scale<=1/dpr+1e-8,url);
   for(const [x,y]of [[b.left,b.top],[b.right,b.top],[b.left,b.bottom],[b.right,b.bottom]]){const px=f.left+b.width*x/100*f.scale,py=f.top+b.height*y/100*f.scale;assert.ok(py>=-1e-6&&py<=height+1e-6,url);for(const reversed of [false,true]){const edge=reversed?slant*py/height:slant*(1-py/height);assert.ok(px>=edge-1e-5&&px<=width-(slant-edge)+1e-5,url);}}
  }
 }
 for(const url of audit.knownBackgroundURLs){assert.equal(galleryBackground(url),true);assert.equal(gallerySubject(url),undefined);}
 const f=safeGalleryFrame({width:1800,height:900},{width:190,height:317},undefined,28);assert.ok(f.width<=190-2*(28+6)+1e-8);assert.equal(safeGalleryFrame({width:0,height:1},{width:190,height:317}),undefined);
});
test('reviewed wide-pose closeups keep complete hair and faces inside the slant without enlarging original pixels',()=>{
 assert.equal(Object.keys(heads.entries).length,48);for(const[url,head]of Object.entries(heads.entries)){const b=gallerySubject(url);assert.ok(b,url);for(const[width,height,slant,dpr]of[[212,353,28,1],[166,277,22,2]]){const full=safeGalleryFrame(b,{width,height},b,slant,dpr),f=safePortraitFrame(b,{width,height},b,head,slant,dpr);assert.ok(f.scale>=full.scale-1e-8,url);assert.ok(f.scale<=full.scale*2.25+1e-8,url);assert.ok(f.scale<=1/dpr+1e-8,url);for(const[x,y]of[[head.left,head.top],[head.right,head.top],[head.left,head.bottom],[head.right,head.bottom]]){const px=f.left+b.width*x/100*f.scale,py=f.top+b.height*y/100*f.scale;assert.ok(py>=0&&py<=height,url);for(const reversed of[false,true]){const edge=reversed?slant*py/height:slant*(1-py/height);assert.ok(px>=edge-1e-5&&px<=width-(slant-edge)+1e-5,url);}}}}
});
