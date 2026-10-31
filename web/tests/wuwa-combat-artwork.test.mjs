import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import art from '../content/wuwa-combat-artwork.json' with {type:'json'};
import reference from '../content/wuwa-reference.json' with {type:'json'};
const {combatEnemyImage,combatIcon}=await import('../lib/wuwa-combat-artwork.ts');
function dimensions(b){const chunk=b.toString('ascii',12,16);if(chunk==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(chunk==='VP8L'){const v=b.readUInt32LE(21);return [(v&16383)+1,((v>>>14)&16383)+1];}if(chunk==='VP8 ')return [b.readUInt16LE(26)&16383,b.readUInt16LE(28)&16383];throw Error('Unknown WebP header');}
test('all combat originals retain exact commit-bound Git bytes, dimensions and immutable public identities',()=>{
 assert.equal(art.repository,'DommyMM/wuwabuild');assert.match(art.commit,/^[a-f0-9]{40}$/);assert.equal(art.images.length,64);assert.equal(new Set(art.images.map(a=>a.image)).size,64);
 for(const a of art.images){const b=fs.readFileSync('public'+a.image);assert.equal(b.length,a.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),a.sha256);assert.equal(createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),a.gitBlobSha);assert.deepEqual(dimensions(b),[a.width,a.height]);assert.equal(a.sourceUrl,'https://raw.githubusercontent.com/'+art.repository+'/'+art.commit+'/'+a.sourcePath);assert.equal(a.image,'/combat-icons/'+a.sha256+'.webp');}
});
test('Echo alternatives require the original enemy ID, source and all four exact names; other forms never borrow art',()=>{
 const all=reference.cycles.flatMap(c=>c.floors.flatMap(f=>f.enemies)),images=new Set(art.images.map(a=>a.image));
 for(const a of art.echoAlternatives){const e=all.find(e=>e.id===a.enemyId&&e.icon===a.source);assert.ok(e);assert.deepEqual(e.name,a.name);assert.ok(images.has(a.image));assert.equal(combatEnemyImage(e),a.image);const differentName={...e,name:{...e.name,en:e.name.en+' (different form)'}};assert.equal(combatEnemyImage(differentName),e.icon);assert.equal(combatEnemyImage({...e,id:'different-enemy'}),e.icon);}
 const fleurdelys=all.find(e=>e.name.en==='Fleurdelys');assert.ok(fleurdelys);assert.match(combatEnemyImage(fleurdelys),/^\/api\/wuwa\/combat-images\//);
 for(const a of art.exact){assert.ok(images.has(a.image));assert.equal(combatIcon(a.source),a.image);}
 assert.equal(combatIcon('https://example.invalid/other-image.webp'),'https://example.invalid/other-image.webp');assert.equal(combatIcon(undefined),undefined);
});
test('current tower, wastes and matrix improve image coverage without modifying original enemy facts',()=>{
 const before=structuredClone(reference),expected={'tower-of-adversity:41':27,'tower-of-adversity:42':25,'whimpering-wastes:22':78,'whimpering-wastes:23':78,'endstate-matrix:8':19};
 for(const[id,count]of Object.entries(expected)){const cycle=reference.cycles.find(c=>c.id===id);assert.ok(cycle);assert.equal(cycle.floors.flatMap(f=>f.enemies).filter(e=>(/^\/combat-icons\/|^\/api\/wuwa\/combat-images\//).test(combatEnemyImage(e)||'')).length,count,id);}
 assert.deepEqual(reference,before);
});
