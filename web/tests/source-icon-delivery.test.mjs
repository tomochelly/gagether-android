import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync}from'node:fs';import {tmpdir}from'node:os';import path from'node:path';import {createHash}from'node:crypto';
import {omitSourceIconCopies}from'../scripts/omit-source-icon-copies.mjs';
test('source glyph delivery preserves immutable native originals and shared static uses, rejecting unverified sources and changed bytes',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'gfl2-source-icon-')),body=Buffer.from('checked original icon bytes'),sha=createHash('sha256').update(body).digest('hex'),relative='public/roster-detail-icons/'+sha+'.png',dist=path.join(dir,'dist'),file=path.join(dir,relative),copy=path.join(dist,'client',relative.slice(7));mkdirSync(path.dirname(file),{recursive:true});mkdirSync(path.dirname(copy),{recursive:true});writeFileSync(file,body);writeFileSync(copy,body);
 const a={gameId:'gfl2',delivery:'source-original',sourceKind:'community',httpStatus:200,url:'https://gfl2.help/static/images/hp_icon.png',publicUrl:'https://gagether.wiki/'+relative.slice(7),path:relative,sha256:sha,bytes:body.length,width:64,height:64},cwd=process.cwd();
 try{process.chdir(dir);
  for(const bad of [{...a,gameId:'hsr'},{...a,url:'https://unverified.example.org/static/images/icon.png'},{...a,httpStatus:403},{...a,sha256:'0'.repeat(64)}]){assert.throws(()=>omitSourceIconCopies(dist,[bad]));assert.ok(existsSync(copy));}
  assert.equal(omitSourceIconCopies(dist,[a,{...a,delivery:undefined}]).count,0);assert.ok(existsSync(copy));
  writeFileSync(copy,'changed');assert.throws(()=>omitSourceIconCopies(dist,[a]),/differs/);writeFileSync(copy,body);
  assert.equal(omitSourceIconCopies(dist,[a]).count,1);assert.equal(existsSync(copy),false);assert.deepEqual(readFileSync(file),body);assert.equal(omitSourceIconCopies(dist,[a]).count,0);
 }finally{process.chdir(cwd);rmSync(dir,{recursive:true,force:true})}
});
