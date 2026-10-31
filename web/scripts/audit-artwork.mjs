// Read-only pre-release audit. URLs are candidates until an actual HTTP/visual review.
import '../tests/load-typescript.mjs';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const {artworkAudit}=await import('../lib/artwork-audit.ts');
const {games}=await import('../lib/games.ts');
const {currentVersion}=await import('../lib/version-hero.ts');
const {spotlightSlides}=await import('../lib/spotlight.ts');
const {effectiveRegion}=await import('../lib/presentation.ts');
const {artworkForLocale,serviceArtworkLocale}=await import('../lib/artwork.ts');
const [input,output,at]=process.argv.slice(2);
if(!input||!output)throw Error('Usage: node scripts/audit-artwork.mjs DATA_JSON REPORT_JSON [ISO_TIME]');
const data=JSON.parse(readFileSync(input,'utf8')),now=at?Date.parse(at):Date.now();
if(!Number.isFinite(now)||!Array.isArray(data.entries))throw Error('Invalid clock or catalog');
const artwork=artworkAudit(data.entries,now),references=new Map();
for(const game of games)for(const region of new Set(game.regions.map(r=>effectiveRegion(game,r)))){
 const scope=data.entries.filter(e=>e.gameId===game.id&&e.region===region&&!e.hidden),hero=currentVersion(scope,game,region,now);
 for(const row of [...(hero?[hero]:[]),...spotlightSlides(scope,now,game.id).map(s=>s.art)])for(const locale of ['ko','en','ja','zh']){
  const art=artworkForLocale(row,locale,'full',serviceArtworkLocale(region,game.id));if(!art.image||!art.imageVerified)continue;
  const ref={id:row.id,gameId:game.id,region,locale};references.set(art.image,[...references.get(art.image)||[],ref]);
 }
}
const images=[...references].map(([image,usedBy])=>({image,usedBy,...image.startsWith('/assets/')?{sourceFilePresent:existsSync('public'+image)}:{}}));
const report={checkedAt:new Date(now).toISOString(),scope:'15 games; each canonical service; ko/en/ja/zh; current version and current/nearest upcoming featured subjects',note:'Storage/classification audit only. HTTP availability and visual identity need separate evidence. No data mutated.',gameCount:games.length,rows:artwork.length,needsReview:artwork.filter(r=>r.status==='needs-review').length,artwork,images};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({games:report.gameCount,rows:report.rows,needsReview:report.needsReview,uniqueImages:images.length,missingFiles:images.filter(i=>i.sourceFilePresent===false).map(i=>i.image)}));
