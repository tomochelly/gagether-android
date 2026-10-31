import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {dashboardGroups,previewGameEntries,groupAgendaRows,dashboardEntryDate}=await import('../lib/dashboard-groups.ts');
const words=s=>({ko:s,en:s,ja:s,zh:s});
const entry=(id,extra={})=>({id,gameId:'wuwa',region:'global',kind:'pickup',title:words(id),...extra});
const now=Date.parse('2026-10-31T12:00:00Z');
test('dashboard grouping retains game order and originals; favorites lead and weapon-only rows stay out',()=>{
 const rows=[entry('a'),entry('a'),entry('hidden',{hidden:true}),entry('weapon',{kind:'weapon'}),entry('support',{kind:'weapon',poolType:'support',gameId:'uma'}),entry('b',{gameId:'nikke'})],before=JSON.stringify(rows),games=['wuwa','nikke','uma','hsr'].map(id=>({id,name:words(id)}));
 const groups=dashboardGroups(rows,games,['uma']);assert.deepEqual(groups.map(g=>g.game.id),['uma','wuwa','nikke']);assert.deepEqual(groups.flatMap(g=>g.entries.map(e=>e.id)),['support','a','b']);assert.equal(groups[1].entries[0],rows[0]);assert.equal(JSON.stringify(rows),before);
});
test('collapsed previews balance pickups with updates, retain input ordering, and never lose the remaining list',()=>{
 const rows=[entry('package',{kind:'package'}),entry('a'),entry('b'),entry('c'),entry('news1',{kind:'update'}),entry('news2',{kind:'update'}),entry('news3',{kind:'update'})],before=[...rows];
 assert.deepEqual(previewGameEntries(rows).map(e=>e.id),['a','b','news1','news2']);assert.equal(previewGameEntries(rows,1).length,1);assert.deepEqual(previewGameEntries(rows,0),[]);assert.deepEqual(rows,before);assert.equal(previewGameEntries(rows,10),rows);
 assert.deepEqual(previewGameEntries(rows.filter(e=>e.kind==='update')).map(e=>e.id),['news1','news2','news3']);
});
test('agenda groups service separately without losing start/end markers, order or date precision',()=>{
 const e=entry('clock',{startAt:'2026-11-01T01:00:00Z',endAt:'2026-11-01T02:00:00Z'}),rows=[{entry:e,action:'start',at:e.startAt},{entry:entry('other',{gameId:'nikke'}),action:'end',at:'2026-11-01'},{entry:e,action:'end',at:e.endAt},{entry:entry('jp',{region:'jp'}),action:'start',at:'2026-11-01'}];
 const groups=groupAgendaRows(rows);assert.deepEqual(groups.map(g=>g.key),['wuwa:global','nikke:global','wuwa:jp']);assert.deepEqual(groups[0].rows,[rows[0],rows[2]]);assert.equal(groups[0].rows[0],rows[0]);assert.equal(groups[1].rows[0].at,'2026-11-01');
});
test('date captions pair with the correct exact endpoint and never convert date-only values',()=>{
 assert.deepEqual(dashboardEntryDate(entry('next',{startDate:'2026-11-01',endDate:'2026-11-10'}),now),{at:'2026-11-01',kind:'starts'});
 assert.deepEqual(dashboardEntryDate(entry('live',{startDate:'2026-10-01',endDate:'2026-11-10'}),now),{at:'2026-11-10',kind:'ends'});
 assert.deepEqual(dashboardEntryDate(entry('past',{startDate:'2026-10-01',endDate:'2026-10-20'}),now),{at:'2026-10-20',kind:'ended'});
 assert.deepEqual(dashboardEntryDate(entry('notice',{kind:'update',publishedAt:'2026-10-30T23:20:00Z'}),now),{at:'2026-10-30T23:20:00Z',kind:'notice'});
});
