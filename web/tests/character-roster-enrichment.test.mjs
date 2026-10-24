import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retainCharacterFacts,enrichCharacterRoster} from '../lib/character-roster-enrichment.ts';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
const copy=s=>({ko:s,en:s,ja:s,zh:s});
test('sparse and empty source fields preserve exact-ID localized names, full originals and service-specific stats',()=>{
 const stat={id:'hp',label:copy('HP'),value:'100',basis:copy('Lv.1')};
 const old={id:'same-form',name:copy('Known'),nameSources:{ko:{url:'https://example.org/native',kind:'community'}},image:{url:'https://example.org/full',kind:'splash',sourceUrl:'https://example.org'},stats:[stat],regionalStats:{jp:[stat]},sections:[{id:'skill',title:copy('Skill'),body:copy('Published text')}],sourceUrl:'https://example.org',sourceKind:'community'};
 const incoming={...old,name:{ko:'',en:'Known',ja:'',zh:''},nameSources:undefined,image:{...old.image,kind:'portrait',url:'https://example.org/portrait'},stats:[],regionalStats:{jp:[]},sections:[]};
 const saved=retainCharacterFacts(incoming,old);assert.equal(saved.name.ko,'Known');assert.equal(saved.nameSources.ko.kind,'community');assert.equal(saved.image.url,old.image.url);assert.equal(saved.stats[0].value,'100');assert.equal(saved.regionalStats.jp[0].value,'100');assert.equal(saved.sections[0].body.ko,'Published text');
 const renamed=retainCharacterFacts({...incoming,name:copy('New native'),stats:[{...stat,value:'123'}]},old);assert.equal(renamed.name.ko,'New native');assert.equal(renamed.nameSources.ko,undefined);assert.equal(renamed.stats[0].value,'123');
});
test('bootstrap enrichment never attaches another source ID and leaves new factual source values intact',()=>{
 const data=structuredClone(bootstrap.find(r=>r.gameId==='bluearchive'));const known=data.characters[0],base=known.stats[0];known.name.ko='New native';known.stats=[{...base,value:'123456'}];
 const extra={...structuredClone(known),id:'unknown-new-source-form',name:copy('New form'),stats:undefined,image:undefined};data.characters.push(extra);data.coverage.includedCount=data.characters.length;
 const result=enrichCharacterRoster(data);assert.equal(result.characters.find(c=>c.id===known.id).stats[0].value,'123456');assert.equal(result.characters.find(c=>c.id===known.id).name.ko,'New native');assert.equal(result.characters.find(c=>c.id===extra.id).stats,undefined);assert.equal(result.characters.find(c=>c.id===extra.id).image,undefined);assert.equal(data.characters.at(-1).id,extra.id);
});
