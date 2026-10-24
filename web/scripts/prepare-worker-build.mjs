import {existsSync,mkdirSync,mkdtempSync,renameSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';
const root=process.cwd(),manifest=JSON.parse(readFileSync('.openai/hosting.json','utf8'));if(!manifest.project_id||manifest.static)throw Error('Expected the existing Worker Site checkout');
// Preserve generated output for diagnosis; original public assets and source stay in place.
let backup;if(existsSync('dist')){backup=join(mkdtempSync(join(tmpdir(),'gagether-worker-build-')),'dist');renameSync(resolve('dist'),backup);}
mkdirSync('.sites-runtime',{recursive:true});writeFileSync('.sites-runtime/build-start.json',JSON.stringify({root,startedAt:Date.now(),backup}));console.log(JSON.stringify({freshWorkerBuild:true,previousGeneratedOutputPreserved:!!backup}));
