/** Parse inert published localization objects; never evaluate third-party JS. */
import fs from 'node:fs';
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url),input=process.argv[2],output=process.argv[3];
const ts=await import(process.env.TYPESCRIPT_PATH||process.argv[4]||'typescript').then(m=>m.default||m);
const file=ts.createSourceFile('remote.js',fs.readFileSync(input,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
function name(n){return ts.isIdentifier(n)||ts.isStringLiteral(n)?n.text:''}
function str(n){return n&&(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))?n.text:null}
const out=[];
function walk(n){if(ts.isObjectLiteralExpression(n)){
 const role=n.properties.find(p=>ts.isPropertyAssignment(p)&&name(p.name)==='role');
 if(role&&ts.isObjectLiteralExpression(role.initializer)){
  const b=role.initializer.properties.find(p=>ts.isPropertyAssignment(p)&&name(p.name)==='Berenica');
  if(b){const roles={};for(const p of role.initializer.properties){if(!ts.isPropertyAssignment(p)||!ts.isObjectLiteralExpression(p.initializer))continue;const x={};for(const q of p.initializer.properties){if(ts.isPropertyAssignment(q)&&str(q.initializer)!==null)x[name(q.name)]=str(q.initializer);}roles[name(p.name)]=x;}out.push(roles);}
 }
}ts.forEachChild(n,walk)}walk(file);if(out.length<4)throw Error('Official localization objects missing');fs.writeFileSync(output,JSON.stringify(out,null,2));
