import{readFileSync,writeFileSync}from'node:fs';
export function combatDisplay(data){return {version:data.version,researchedAt:data.researchedAt,snapshots:data.snapshots.map(s=>({gameId:s.gameId,modeId:s.modeId,regionScope:s.regionScope,version:s.version,phaseVersion:s.phaseVersion,phaseName:s.phaseName,asOf:s.asOf,sampleSize:s.sampleSize,sampleUnit:s.sampleUnit,stage:s.stage,sourceUrl:s.sourceUrl,credit:s.credit,license:s.license,denominator:s.denominator,teams:s.teams.map(t=>({rank:t.rank,members:t.members.map(m=>({id:m.id,name:m.name,icon:m.icon,rosterMatched:m.rosterMatched})),usageRate:t.usageRate,observations:t.observations})),enemies:s.enemies}))};}
const original=JSON.parse(readFileSync('content/combat-research.json','utf8')),display=combatDisplay(original);
writeFileSync('content/combat-display.json',JSON.stringify(display)+'\n');
console.log(JSON.stringify({combatDisplaySnapshots:display.snapshots.length,fullResearchPreserved:true}));
