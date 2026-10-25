import{test}from'node:test';import assert from'node:assert/strict';import{mkdtempSync,mkdirSync,writeFileSync,rmSync}from'node:fs';import{tmpdir}from'node:os';import{join,dirname}from'node:path';
import{publicReadVersions,rosterVersionFiles,wuwaVersionFiles}from'../scripts/prepare-public-read-versions.mjs';
test('presentation releases preserve validated read models; one game original changes only its own roster version',()=>{
 const root=mkdtempSync(join(tmpdir(),'gagether-model-versions-')),write=(p,value)=>{mkdirSync(dirname(join(root,p)),{recursive:true});writeFileSync(join(root,p),typeof value==='string'?value:JSON.stringify(value))};
 try{
  for(const p of new Set([...rosterVersionFiles,...wuwaVersionFiles,'app/api/data/route.ts','package.json','pnpm-lock.yaml']))write(p,'source '+p);
  for(const dir of ['db','drizzle'])mkdirSync(join(root,dir),{recursive:true});const rosters=[{gameId:'gfl2',characters:[{id:'same-id',name:'source'}]},{gameId:'hsr',characters:[{id:'same-id',name:'other game'}]}];write('content/character-rosters/bootstrap.json',rosters);
  for(const p of ['content/character-rosters/artwork-manifest.json','content/roster-detail-icons.json','content/character-rosters/rejected-artwork.json','content/character-rosters/restricted-artwork.json','content/wuwa-reference.json','content/wuwa-reference-splashes.json','content/wuwa-character-growth.json'])write(p,[]);
  const initial=publicReadVersions(root);write('components/card.tsx','presentation changed');write('app/globals.css','colors changed');assert.deepEqual(publicReadVersions(root),initial);
  rosters[0].characters[0].name='new native original';write('content/character-rosters/bootstrap.json',rosters);const changed=publicReadVersions(root);assert.notEqual(changed.rosters.gfl2,initial.rosters.gfl2);assert.equal(changed.rosters.hsr,initial.rosters.hsr);assert.equal(changed.rosters.wuwa,initial.rosters.wuwa);
  write('lib/roster-detail-catalog.ts','decoder protocol changed');assert.notEqual(publicReadVersions(root).rosters.hsr,changed.rosters.hsr);
 }finally{rmSync(root,{recursive:true,force:true});}
});
