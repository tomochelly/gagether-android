import './load-typescript.mjs';import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import missing from '../ops/qa/maintenance-missing-art.json' with {type:'json'};
import snapshot from '../content/character-rosters/bootstrap.json' with {type:'json'};
const report=missing;
const {enrichCharacterRoster}=await import('../lib/character-roster-enrichment.ts');
const {rosterArt,characterRosterSchema}=await import('../lib/character-roster.ts');
const {hydrateRosterDetails}=await import('../lib/roster-detail-catalog.ts');
test('15 missing exact forms recover in sparse saved rosters and deferred details, preserve native bytes and never overwrite new owner source images',async()=>{
 assert.equal(report.verified.length,15);
 for(const r of report.verified){
  const original=readFileSync(r.localPath);assert.equal(original.length,r.bytes);assert.equal(createHash('sha256').update(original).digest('hex'),r.sha256);
  const source=snapshot.find(g=>g.gameId===r.gameId),saved=structuredClone(source),c=saved.characters.find(c=>c.id===r.id);delete c.image;delete c.images;
  const repaired=enrichCharacterRoster(saved);characterRosterSchema.parse(repaired);
  const row=repaired.characters.find(c=>c.id===r.id),full=await hydrateRosterDetails(repaired,row);
  for(const locale of ['ko','en','ja','zh'])assert.equal(rosterArt(full,locale,'global')?.url,r.url,r.gameId+':'+r.id+':'+locale);
  assert.equal(rosterArt(row,'ko','global').width,r.width);
  c.image={url:'https://example.org/owner-original.png',sourceUrl:c.sourceUrl,kind:'splash',locale:'neutral'};
  assert.equal(enrichCharacterRoster(saved).characters.find(c=>c.id===r.id).image.url,c.image.url);
 }
 const limbus=snapshot.find(g=>g.gameId==='limbus'),poster=limbus.characters.find(c=>c.id==='191');assert.ok(poster.images.some(a=>a.locale==='en'&&a.kind==='card'));
 assert.equal(rosterArt(poster,'en').kind,'splash');
 assert.equal(limbus.characters.filter(c=>!rosterArt(c,'ko','global')).length,0);
 assert.equal(snapshot.find(g=>g.gameId==='stellasora').characters.filter(c=>!rosterArt(c,'ko','global')).length,0);
});
