import{test}from'node:test';import assert from'node:assert/strict';import{mkdtempSync,mkdirSync,writeFileSync,rmSync}from'node:fs';import{tmpdir}from'node:os';import{join,dirname}from'node:path';
import{publicReadVersions,rosterVersionFiles,wuwaVersionFiles}from'../scripts/prepare-public-read-versions.mjs';
test('presentation releases preserve validated read models; one game original changes only its own roster version',()=>{
 const root=mkdtempSync(join(tmpdir(),'gagether-model-versions-')),write=(p,value)=>{mkdirSync(dirname(join(root,p)),{recursive:true});writeFileSync(join(root,p),typeof value==='string'?value:JSON.stringify(value))};
 try{
  for(const p of new Set([...rosterVersionFiles,...wuwaVersionFiles,'app/api/data/route.ts','package.json','pnpm-lock.yaml']))write(p,'source '+p);
  for(const dir of ['db','drizzle'])mkdirSync(join(root,dir),{recursive:true});const rosters=[{gameId:'gfl2',characters:[{id:'same-id',name:'source'}]},{gameId:'hsr',characters:[{id:'same-id',name:'other game'}]},{gameId:'zzz',characters:[]},{gameId:'nikke',characters:[]},{gameId:'nte',characters:[]}];write('content/character-rosters/bootstrap.json',rosters);
  for(const p of ['content/character-rosters/artwork-manifest.json','content/roster-detail-icons.json','content/character-rosters/rejected-artwork.json','content/character-rosters/restricted-artwork.json','content/wuwa-reference.json','content/wuwa-reference-splashes.json','content/wuwa-character-growth.json','content/wuwa-announced-roster.json','content/zzz-signature-weapons.json','content/zzz-combat-catalog.json','content/nte-announced-roster.json','content/hsr-announced-roster.json'])write(p,[]);
  write('lib/zzz-signature-weapons.ts','source signature renderer');write('lib/reviewed-roster-names.ts','source native names');
  const initial=publicReadVersions(root);write('components/card.tsx','presentation changed');write('app/globals.css','colors changed');assert.deepEqual(publicReadVersions(root),initial);
  rosters[0].characters[0].name='new native original';write('content/character-rosters/bootstrap.json',rosters);const changed=publicReadVersions(root);assert.notEqual(changed.rosters.gfl2,initial.rosters.gfl2);assert.equal(changed.rosters.hsr,initial.rosters.hsr);assert.equal(changed.rosters.wuwa,initial.rosters.wuwa);
  write('content/zzz-signature-weapons.json',{exactNewWeapon:'native'});const signature=publicReadVersions(root);assert.notEqual(signature.rosters.zzz,changed.rosters.zzz);assert.equal(signature.rosters.hsr,changed.rosters.hsr);assert.equal(signature.rosters.wuwa,changed.rosters.wuwa);
  write('content/wuwa-announced-roster.json',[{id:'announced-new'}]);const announced=publicReadVersions(root);assert.notEqual(announced.rosters.wuwa,signature.rosters.wuwa);assert.equal(announced.rosters.zzz,signature.rosters.zzz);
  write('content/nte-announced-roster.json',[{id:'announced-elyms'}]);const nte=publicReadVersions(root);assert.notEqual(nte.rosters.nte,announced.rosters.nte);assert.equal(nte.rosters.zzz,announced.rosters.zzz);
  write('lib/roster-detail-catalog.ts','decoder protocol changed');assert.notEqual(publicReadVersions(root).rosters.hsr,changed.rosters.hsr);
 }finally{rmSync(root,{recursive:true,force:true});}
});
