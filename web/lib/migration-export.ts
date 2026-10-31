// Owner-only export primitives. This module never mutates D1 or R2.
import {createHash} from 'node:crypto';

export const exportHeaders={'Cache-Control':'private, no-store, max-age=0','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
export const ident=(name:string)=>'"'+name.replaceAll('"','""')+'"';
export const literal=(value:string)=>"'"+value.replaceAll("'","''")+"'";
export const digest=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
type SchemaRow={type:string;name:string;tbl_name:string;sql:string|null};
type Column={cid:number;name:string;type:string;notnull:number;dflt_value:unknown;pk:number;hidden:number};
type ForeignKey={table:string};
export type ExportTable={name:string;sql:string;columns:Column[];parents:string[];rows:string;latest:Record<string,string|null>;observedAt:string;sequence?:string|null};
export type DatabaseInventory={format:1;observedAt:string;schema:SchemaRow[];tables:ExportTable[];excluded:{name:string;reason:string}[];atomicSnapshot:false;nextOffset:number|null};

export async function databaseInventory(db:D1Database,offset=0):Promise<DatabaseInventory>{
 if(!Number.isSafeInteger(offset)||offset<0||offset>100_000)throw Error('Invalid offset');
 const schema=(await db.prepare('SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name').all<SchemaRow>()).results;
 const tables:ExportTable[]=[],excluded:{name:string;reason:string}[]=[];
 const all=schema.filter(s=>s.type==='table');
 for(const row of all.slice(offset,offset+8)){
  if(row.name.startsWith('_cf_')||row.name.startsWith('sqlite_')){excluded.push({name:row.name,reason:row.name==='sqlite_sequence'?'AUTOINCREMENT high-water values are included in table metadata and restore SQL.':'SQLite / D1 internal storage; retained in schema inventory, not directly importable.'});continue;}
  if(!row.sql)throw Error('Missing table schema');
  if(/^CREATE\s+VIRTUAL\s+TABLE/i.test(row.sql))throw Error('Virtual table export needs a dedicated verified adapter');
  const columns=(await db.prepare(`PRAGMA table_xinfo(${ident(row.name)})`).all<Column>()).results;
  const revisions=columns.filter(c=>/^(revision|old_revision|new_revision|updated_at|updatedAt|last_seen|lastSeen|last_started_at|last_finished_at|checked_at|created_at|at|seq)$/i.test(c.name));
  const stats=await db.prepare(`SELECT CAST(COUNT(*) AS TEXT) AS rows${revisions.map((c,i)=>`,CAST(MAX(${ident(c.name)}) AS TEXT) AS r${i}`).join('')} FROM ${ident(row.name)}`).first<Record<string,string|null>>();
  const parents=(await db.prepare(`PRAGMA foreign_key_list(${ident(row.name)})`).all<ForeignKey>()).results.map(k=>k.table).filter(n=>n!==row.name);
  const sequence=schema.some(s=>s.name==='sqlite_sequence')?await db.prepare('SELECT CAST(seq AS TEXT) AS seq FROM sqlite_sequence WHERE name=?').bind(row.name).first<{seq:string}>():null;
  tables.push({name:row.name,sql:row.sql,columns,parents:[...new Set(parents)],rows:stats!.rows!,latest:Object.fromEntries(revisions.map((c,i)=>[c.name,stats!['r'+i]])),observedAt:new Date().toISOString(),sequence:sequence?.seq??null});
 }
 return {format:1,observedAt:new Date().toISOString(),schema,tables,excluded,atomicSnapshot:false,nextOffset:offset+8<all.length?offset+8:null};
}
export function tableOrder(tables:ExportTable[]){
 const ordered:ExportTable[]=[],visiting=new Set<string>(),done=new Set<string>(),byName=new Map(tables.map(t=>[t.name,t]));
 function visit(t:ExportTable){if(done.has(t.name))return;if(visiting.has(t.name))throw Error('Cyclic foreign keys require a single-transaction restore plan');visiting.add(t.name);for(const p of t.parents){const parent=byName.get(p);if(parent)visit(parent);}visiting.delete(t.name);done.add(t.name);ordered.push(t);}
 for(const t of tables)visit(t);return ordered;
}
export function schemaSQL(inventory:DatabaseInventory,phase:'tables'|'final'){
 if(phase==='tables')return '-- Restore into a NEW EMPTY database. Apply data before indexes/triggers.\n'+tableOrder(inventory.tables).map(t=>t.sql+';').join('\n')+'\n';
 const sequence=inventory.tables.filter(t=>t.sequence!==null&&t.sequence!==undefined).map(t=>`UPDATE sqlite_sequence SET seq=MAX(seq,${t.sequence}) WHERE name=${literal(t.name)};\nINSERT INTO sqlite_sequence(name,seq) SELECT ${literal(t.name)},${t.sequence} WHERE NOT EXISTS(SELECT 1 FROM sqlite_sequence WHERE name=${literal(t.name)});`).join('\n');
 return '-- Run only AFTER every data part; this avoids replaying audit/derived-data triggers.\n'+sequence+'\n'+inventory.schema.filter(s=>['index','trigger','view'].includes(s.type)&&s.sql&&!s.name.startsWith('sqlite_')&&!s.tbl_name.startsWith('_cf_')).sort((a,b)=>['index','view','trigger'].indexOf(a.type)-['index','view','trigger'].indexOf(b.type)).map(s=>s.sql+';').join('\n')+'\n';
}
// SQLite serializes each cell itself: 64-bit integers never pass through JS numbers,
// text is UTF-8 hex (including NUL), and BLOB bytes retain their storage class.
function cellExpression(name:string){const c=ident(name);return `CASE typeof(${c}) WHEN 'null' THEN 'NULL' WHEN 'text' THEN 'CAST(X'''||hex(CAST(${c} AS BLOB))||''' AS TEXT)' WHEN 'blob' THEN 'X'''||hex(${c})||'''' ELSE quote(${c}) END`;}
function rowSQL(table:string,columns:string[],cells:string[]){
 const insert=`INSERT INTO ${ident(table)}(${columns.map(ident).join(',')}) VALUES(${cells.join(',')});\n`;
 if(insert.length<60_000)return insert;
 // Large values are assembled on the destination only, keeping each SQL statement
 // below D1's query size limit without inserting invalid partial JSON/checked rows.
 const helper='_gagether_restore_'+digest(table).slice(0,16),q=ident(helper),parts=[`CREATE TABLE ${q}(n INTEGER PRIMARY KEY,v BLOB);`],values:string[]=[];
 cells.forEach((cell,i)=>{const m=/^(CAST\()?X'([A-F0-9]*)'( AS TEXT\))?$/.exec(cell);if(!m){values.push(cell);return;}const hex=m[2];parts.push(`INSERT INTO ${q}(n,v) VALUES(${i},X'');`);for(let at=0;at<hex.length;at+=48_000)parts.push(`UPDATE ${q} SET v=CAST(v||X'${hex.slice(at,at+48_000)}' AS BLOB) WHERE n=${i};`);values.push(m[1]?`CAST((SELECT v FROM ${q} WHERE n=${i}) AS TEXT)`:`(SELECT v FROM ${q} WHERE n=${i})`);});
 parts.push(`INSERT INTO ${ident(table)}(${columns.map(ident).join(',')}) VALUES(${values.join(',')});`,`DROP TABLE ${q};`);return parts.join('\n')+'\n';
}
export async function databasePart(db:D1Database,name:string,offset:number){
 if(!Number.isSafeInteger(offset)||offset<0||offset>1_000_000_000)throw Error('Invalid offset');
 const table=await db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='table' AND name=? AND name NOT LIKE 'sqlite_%' AND name NOT GLOB '_cf_*'").bind(name).first<{name:string;sql:string}>();
 if(!table||/^CREATE\s+VIRTUAL/i.test(table.sql))throw Error('Unknown table');
 const cols=(await db.prepare(`PRAGMA table_xinfo(${ident(name)})`).all<Column>()).results.filter(c=>!c.hidden);
 const pk=cols.filter(c=>c.pk).sort((a,b)=>a.pk-b.pk).map(c=>ident(c.name));
 const order=pk.length?pk.join(','):'rowid';
 const sizes=(await db.prepare(`SELECT ${cols.map(c=>`COALESCE(length(CAST(${ident(c.name)} AS BLOB)),0)`).join('+')} AS bytes FROM ${ident(name)} ORDER BY ${order} LIMIT 100 OFFSET ?`).bind(offset).all<{bytes:number}>()).results;
 let count=0,bytes=0;for(const row of sizes){if(count&&bytes+row.bytes>400_000)break;bytes+=row.bytes;count++;}
 if(!count)return {sql:'',rows:0,nextOffset:null,observedAt:new Date().toISOString()};
 const rows=(await db.prepare(`SELECT ${cols.map((c,i)=>`${cellExpression(c.name)} AS c${i}`).join(',')} FROM ${ident(name)} ORDER BY ${order} LIMIT ? OFFSET ?`).bind(count,offset).all<Record<string,string>>()).results;
 const sql=rows.map(r=>rowSQL(name,cols.map(c=>c.name),cols.map((_,i)=>r['c'+i]))).join('');
 return {sql,rows:rows.length,nextOffset:offset+rows.length,observedAt:new Date().toISOString()};
}

export function tarHeader(name:string,size:number){
 if(!/^[a-zA-Z0-9_./-]+$/.test(name)||name.includes('..')||name.length>99||!Number.isSafeInteger(size)||size<0||size>8_589_934_591)throw Error('Invalid tar member');
 const header=new Uint8Array(512),encoder=new TextEncoder(),put=(at:number,s:string)=>header.set(encoder.encode(s),at);
 put(0,name);put(100,'0000600\0');put(108,'0000000\0');put(116,'0000000\0');put(124,size.toString(8).padStart(11,'0')+'\0');put(136,'00000000000\0');put(148,'        ');put(156,'0');put(257,'ustar\0');put(263,'00');put(148,header.reduce((a,b)=>a+b,0).toString(8).padStart(6,'0')+'\0 ');return header;
}
export const padding=(size:number)=>new Uint8Array((512-size%512)%512);
export function r2Metadata(o:R2Object){return {key:o.key,size:o.size,etag:o.etag,version:o.version,contentType:o.httpMetadata?.contentType??null,httpMetadata:o.httpMetadata??{},customMetadata:o.customMetadata??{},uploaded:o.uploaded.toISOString(),file:'objects/'+digest(o.key)+'.bin'};}
export async function r2Page(bucket:R2Bucket,cursor?:string){
 // The runtime supports metadata inclusion; the pinned workers-types omit it.
 const options:R2ListOptions & {include:string[]}={limit:20,cursor,include:['httpMetadata','customMetadata']};
 const list=await bucket.list(options);const objects=list.objects.map(r2Metadata);return {objects,nextCursor:list.truncated?list.cursor:null,expected:digest(JSON.stringify(objects)),observedAt:new Date().toISOString()};
}
export function r2Archive(bucket:R2Bucket,page:Awaited<ReturnType<typeof r2Page>>){
 const start=new Date().toISOString(),encoder=new TextEncoder();
 async function* archive(){const manifest=[];
  for(const row of page.objects){const object=await bucket.get(row.key,{onlyIf:{etagMatches:row.etag}});if(!object||!('body'in object)||object.size!==row.size||object.version!==row.version)throw Error('Object changed; create a fresh export plan');const hash=createHash('sha256');let bytes=0;yield tarHeader(row.file,row.size);const reader=object.body.getReader();try{while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.length;hash.update(part.value);yield part.value;}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}if(bytes!==row.size)throw Error('Incomplete object');yield padding(bytes);manifest.push({...row,sha256:hash.digest('hex')});}
  const data=encoder.encode(JSON.stringify({format:1,startedAt:start,finishedAt:new Date().toISOString(),files:manifest,totalBytes:manifest.reduce((n,o)=>n+o.size,0)},null,2)+'\n');yield tarHeader('manifest.json',data.length);yield data;yield padding(data.length);yield new Uint8Array(1024);
 }
 const iterator=archive();return new ReadableStream<Uint8Array>({async pull(controller){try{const next=await iterator.next();if(next.done)controller.close();else controller.enqueue(next.value);}catch{controller.error(new Error('Export interrupted; no complete backup was produced'));}},async cancel(){await iterator.return(undefined);}});
}
