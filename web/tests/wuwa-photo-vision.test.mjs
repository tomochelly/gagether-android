import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import c from '../content/wuwa-equipment-catalog.json' with {type:'json'};
const {echoStatRect,echoTextContrast,mergeEchoOcr,echoUnreadableRects}=await import('../lib/wuwa-photo-vision.ts');
const {parsePhotoText}=await import('../lib/wuwa-photo-import.ts');
const line=(text,y,x=10)=>({text,confidence:80,bbox:{x0:x,y0:y,x1:x+180,y1:y+12}});
const data=lines=>({text:lines.map(v=>v.text).join('\n'),confidence:80,blocks:[{paragraphs:[{lines}]}]});

test('local contrast removes a broad background without changing original RGBA and keeps thin text strokes',()=>{
 const pixels=new Uint8ClampedArray(40*40*4);for(let i=0;i<pixels.length;i+=4){pixels[i]=pixels[i+1]=pixels[i+2]=70;pixels[i+3]=255;}
 for(let y=8;y<32;y++)for(let x=19;x<21;x++){const i=(y*40+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=200;}
 const original=pixels.slice(),out=echoTextContrast(pixels,40,40);
 assert.deepEqual(pixels,original);assert.equal(out[(20*40+20)*4],0);assert.equal(out[(2*40+2)*4],255);assert.equal(out.length,pixels.length);assert.equal(out.at(-1),255);
 assert.throws(()=>echoTextContrast(pixels,2401,2401));
});
test('a stat retry requires observed aligned lines and covers unreadable rows without supplying any stat',()=>{
 const base=data([line('공격력 30.0%',50),line('공격력 100',70),line('크리티컬 8.7%',90),line('형체가 겹침',110)]);
 const rect=echoStatRect(base,c,240,300,25);assert.ok(rect);assert.ok(rect.y<=50);assert.ok(rect.y+rect.h>170);assert.ok(rect.x>=0&&rect.x+rect.w<=240);
 assert.equal(echoStatRect(data([line('공격력 30.0%',50),line('공격력 100',70)]),c,240,300,25),null);
 assert.equal(echoStatRect(data([line('공격력 30.0%',50),line('공격력 100',70,80),line('크리티컬 8.7%',90)]),c,400,300,25),null);
});
test('same-position complete OCR rows repair missing labels without pairing a neighbouring label and number',()=>{
 const base=data([line('공격력 30.0%',20),line('력 10.9%',40),line('??? 10.1%',60)]),retry=data([line('방어력 10.9%',40),line('공격력 10.1%',60)]);
 const result=mergeEchoOcr(base,[{data:retry,rect:{x:0,y:0,w:240,h:120},scale:1}],c,3,25,5);
 assert.deepEqual(parsePhotoText(result.text,c).rows.map(r=>[r.key,r.value]),[['atkPercent',30],['defPercent',10.9],['atkPercent',10.1]]);assert.deepEqual(result.conflicts,[]);
 const split=mergeEchoOcr(data([line('??? 10.1%',20)]),[{data:data([line('공격력',20),line('10.1%',40)]),rect:{x:0,y:0,w:240,h:120},scale:1}],c,3,25,5);
 assert.equal(parsePhotoText(split.text,c).rows.length,0);
});
test('conflicting legal OCR values require review and transformed coordinates stay on their original row',()=>{
 const base=data([line('크리티컬 8.7%',40)]),retry=data([{...line('크리티컬 6.3%',40),bbox:{x0:20,y0:40,x1:380,y1:64}}]);
 const result=mergeEchoOcr(base,[{data:retry,rect:{x:0,y:20,w:240,h:120},scale:2}],c,3,25,5);
 assert.deepEqual(result.conflicts,['critRate']);assert.equal(result.text,'크리티컬 8.7%');
 const absent={text:'공격력 30.0%',confidence:75};assert.deepEqual(mergeEchoOcr(absent,[],c,3,25,5),{text:absent.text,conflicts:[]});
});
test('single-line retries are bounded to two incomplete numeric rows inside the stat table',()=>{
 const base=data([line('크리티컬 8.7%',20),line('력 10.9%',40),line('?? 10.1%',60),line('?? 8.4%',80),line('피해 설명 10.1%',200)]),rect={x:0,y:10,w:200,h:90};
 const rows=echoUnreadableRects(base,c,rect);assert.equal(rows.length,2);assert.ok(rows[0].y<40&&rows[0].y+rows[0].h>52);assert.ok(rows.every(r=>r.x===0&&r.w===200&&r.y+r.h<100));
 assert.deepEqual(echoUnreadableRects(data([line('공격력 10.1%',20)]),c,rect),[]);
});
