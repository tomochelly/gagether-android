import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
const {fillThumbnailFrame,thumbnailRows}=await import('../lib/thumbnail-framing.ts');
const {thumbnailMembers,pickupThumbnailHead,canUseRosterThumbnail}=await import('../lib/pickup-thumbnail.ts');
const {default:Montage}=await import('../components/pickup-montage.tsx');
const {default:Thumbnail}=await import('../components/pickup-thumbnail.tsx');
const {frameGeometry}=await import('../lib/image-framing.ts');
const name=s=>({ko:s,en:s,ja:s,zh:s});
const member=i=>({name:name('Candidate '+i),role:'candidate',image:'https://example.org/member-'+i+'.png',imageSource:'https://example.org',imageVerified:true,imageLocale:'neutral',imageKind:'character'});
const pool={id:'selected',gameId:'arknights',region:'kr',kind:'pickup',poolType:'standard',title:name('Choice pool'),selectionCount:3,pickupMembers:Array.from({length:6},(_,i)=>member(i))};
test('portrait, wide and mobile preview frames cover the box while retaining reviewed face bounds',()=>{
 const cases=[{image:{width:2160,height:2560},head:{left:38,top:13,right:61,bottom:29},boxes:[{width:1660,height:410},{width:1120,height:410},{width:390,height:320},{width:180,height:320}]},{image:{width:1024,height:839},head:{left:32,top:30,right:45,bottom:46},boxes:[{width:350,height:200},{width:220,height:200}]},{image:{width:1920,height:1080},head:{left:30,top:10,right:55,bottom:50},boxes:[{width:260,height:410},{width:170,height:320}]}];
 for(const {image,head,boxes}of cases)for(const box of boxes){const f=fillThumbnailFrame(image,box,head);assert.ok(f.width>=box.width-.01);assert.ok(f.height>=box.height-.01);assert.ok(f.left<=.01&&f.top<=.01);assert.ok(f.left+f.width>=box.width-.01&&f.top+f.height>=box.height-.01);assert.ok(f.left+f.width*head.left/100>=-.01);assert.ok(f.left+f.width*head.right/100<=box.width+.01);assert.ok(f.top+f.height*head.top/100>=-.01);assert.ok(f.top+f.height*head.bottom/100<=box.height+.01);}
});
test('explicit saved placement wins, mismatched face source dimensions are ignored, and invalid sizes never yield broken geometry',()=>{
 const image={width:1200,height:800},box={width:300,height:200},frame={fit:'contain',x:27,y:48,zoom:1.7},before=JSON.stringify(frame);
 assert.deepEqual(fillThumbnailFrame(image,box,undefined,undefined,frame),frameGeometry(image,box,frame));assert.equal(JSON.stringify(frame),before);
 assert.deepEqual(fillThumbnailFrame(image,box,{left:30,top:20,right:50,bottom:40,width:600,height:1500}),fillThumbnailFrame(image,box));assert.equal(fillThumbnailFrame(image,{width:0,height:200}),undefined);
});
test('five, six and thirty-six candidates fill balanced rows with no empty slot and remain one canonical pool',()=>{
 for(const count of [2,3,4,5,6,7,12,36]){const members=Array.from({length:count},(_,i)=>member(i)),e={...pool,pickupMembers:members},before=JSON.stringify(e);assert.equal(thumbnailRows(count).reduce((a,b)=>a+b,0),count);assert.ok(Math.max(...thumbnailRows(count))-Math.min(...thumbnailRows(count))<=1);assert.equal(thumbnailMembers(e,e.title).length,count);assert.equal(thumbnailMembers(e,members[0].name).length,0);
  for(const locale of ['ko','en','ja','zh']){const d=new JSDOM(renderToStaticMarkup(React.createElement(Montage,{entry:e,membersOverride:members,locale,thumbnail:true,fill:true}))).window.document;assert.equal(d.querySelectorAll('.thumbnail-montage-panel').length,count);assert.equal(d.querySelectorAll('.thumbnail-image img').length,count);assert.ok([...d.querySelectorAll('.thumbnail-montage-row')].every(row=>row.children.length>0));assert.equal(d.querySelector('.pickup-montage').getAttribute('data-candidates'),String(count));}
  assert.equal(JSON.stringify(e),before);
 }
});
test('single thumbnails retain full original and owner placement while authoritative cleared locale images stay blank',()=>{
 const art={image:'https://example.org/original.png',imageSource:'https://example.org',imageLocale:'neutral',imageVerified:true,imageKind:'character',imageFraming:{card:{fit:'contain',x:23,y:50,zoom:2}},previewArtwork:{image:'https://example.org/crop.png',imageVerified:true,imageLocale:'neutral'}},e={...pool,selectionCount:undefined,pickupMembers:[member(0)],title:member(0).name};
 const original=JSON.stringify(art),render=a=>new JSDOM(renderToStaticMarkup(React.createElement(Thumbnail,{entry:e,art:a,name:e.title,locale:'ko'}))).window.document;
 assert.equal(render(art).querySelector('img').src,art.image);assert.equal(render({...art,localizedArtwork:{ko:{imageVerified:false}}}).querySelectorAll('img').length,0);assert.equal(JSON.stringify(art),original);
});
test('additional face envelopes are tied to exact source identities and recorded dimensions',()=>{
 const d=JSON.parse(readFileSync(new URL('../content/pickup-thumbnail-focus.json',import.meta.url),'utf8'));
 for(const r of d.entries){const h=pickupThumbnailHead(r.gameId,{image:r.image});assert.deepEqual(h,{...r.head,width:r.width,height:r.height});assert.match(r.sha256,/^[a-f0-9]{64}$/);assert.equal(pickupThumbnailHead('unrelated',{image:r.image}),undefined);}
});

test('candidate composition keeps localized clears and saved card positions authoritative',()=>{
 assert.equal(canUseRosterThumbnail(member(0),'en'),true);
 assert.equal(canUseRosterThumbnail({...member(0),localizedArtwork:{en:{imageVerified:false}}},'en'),false);
 assert.equal(canUseRosterThumbnail({...member(0),localizedArtwork:{ja:{imageVerified:false}}},'en','ja'),false);
 assert.equal(canUseRosterThumbnail({...member(0),imageFraming:{card:{fit:'contain',x:30,y:40,zoom:2}}},'ko'),false);
});

test('a wide head envelope never shrinks a narrow thumbnail below cover',()=>{
 for(const box of [{width:270,height:410},{width:180,height:320}]){const f=fillThumbnailFrame({width:1920,height:1080},box,{left:20,top:5,right:80,bottom:90});assert.ok(f.width>=box.width&&f.height>=box.height);assert.ok(f.left<=0&&f.top<=0);assert.ok(f.left+f.width>=box.width-.01&&f.top+f.height>=box.height-.01);}
});
