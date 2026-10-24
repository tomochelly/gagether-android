// Parse literal data from official published bundles. Never evaluate fetched JS.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [mode,inputPath,outputPath,tsModule]=process.argv.slice(2);
if(!mode||!inputPath||!outputPath||!tsModule)throw Error('Usage: node parse-official.mjs cn|endfield input output /path/to/typescript/lib/typescript.js');
const {default:ts}=await import(pathToFileURL(path.resolve(tsModule)).href);
const unwrap=n=>ts.isParenthesizedExpression(n)?unwrap(n.expression):n;
function literal(n,vars={}){
 n=unwrap(n);
 if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))return n.text;
 if(ts.isNumericLiteral(n))return Number(n.text);
 if(ts.isIdentifier(n)){
  if(n.text==='undefined')return null;
  if(Object.prototype.hasOwnProperty.call(vars,n.text))return vars[n.text];
  throw Error('Unknown literal identifier: '+n.text);
 }
 if(n.kind===ts.SyntaxKind.NullKeyword)return null;
 if(n.kind===ts.SyntaxKind.TrueKeyword)return true;
 if(n.kind===ts.SyntaxKind.FalseKeyword)return false;
 if(ts.isArrayLiteralExpression(n))return n.elements.map(x=>literal(x,vars));
 if(ts.isObjectLiteralExpression(n))return Object.fromEntries(n.properties.map(p=>{
  if(!ts.isPropertyAssignment(p)||!p.name||!('text'in p.name))throw Error('Nonliteral object property');
  return[p.name.text,literal(p.initializer,vars)];
 }));
 if(ts.isPrefixUnaryExpression(n)&&n.operator===ts.SyntaxKind.MinusToken)return -literal(n.operand,vars);
 throw Error('Unsupported literal AST: '+ts.SyntaxKind[n.kind]);
}
function source(file,text){return ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS)}
if(mode==='cn'){
 const html=fs.readFileSync(inputPath,'utf8');
 const code=html.match(/<script[^>]*>\s*window\.__NUXT__=([\s\S]*?)<\/script>/)?.[1];
 if(!code)throw Error('No literal Nuxt payload');
 const tree=source('payload.js','const result='+code);
 const call=unwrap(tree.statements[0].declarationList.declarations[0].initializer);
 if(!ts.isCallExpression(call))throw Error('Nuxt payload is not a literal IIFE');
 const fn=unwrap(call.expression);
 if(!ts.isFunctionExpression(fn))throw Error('Unexpected Nuxt payload function');
 const vars={};
 fn.parameters.forEach((p,i)=>{if(!ts.isIdentifier(p.name))throw Error('Unexpected parameter');vars[p.name.text]=literal(call.arguments[i],vars)});
 const returned=fn.body.statements.find(ts.isReturnStatement)?.expression;
 if(!returned||!ts.isObjectLiteralExpression(returned))throw Error('No Nuxt literal return object');
 const data=returned.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.text==='data');
 if(!data)throw Error('No Nuxt data property');
 fs.writeFileSync(outputPath,JSON.stringify({data:literal(data.initializer,vars)}));
}else if(mode==='endfield'){
 const manifest=JSON.parse(fs.readFileSync(inputPath,'utf8'));
 const arrays=[],dicts=[],artMaps=[],metadata=[];
 for(const item of manifest){
  const tree=source(item.file,fs.readFileSync(item.file,'utf8'));
  const bindings=new Map(),illustrationNames=new Set();
  function visit(node){
   if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer)bindings.set(node.name.text,[...(bindings.get(node.name.text)||[]),node.initializer]);
   if(ts.isPropertyAssignment(node)&&node.name?.text==='illust'&&ts.isElementAccessExpression(node.initializer)&&ts.isIdentifier(node.initializer.expression))illustrationNames.add(node.initializer.expression.text);
   if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&node.expression.expression.getText(tree)==='JSON'&&node.expression.name.text==='parse'&&node.arguments.length===1){
    const arg=node.arguments[0];
    if(ts.isStringLiteral(arg)||ts.isNoSubstitutionTemplateLiteral(arg)){
     let value;try{value=JSON.parse(arg.text)}catch{}
     if(Array.isArray(value)&&value.length&&value.every(x=>x&&typeof x==='object'&&['key','camp','race','rarity','prof','elem'].every(k=>k in x)))arrays.push({url:item.url,value});
     else if(value&&typeof value==='object'&&!Array.isArray(value)&&value['operator.content.perlica.name']&&value['operator.content.endministrator1.name'])dicts.push({url:item.url,value});
    }
   }
   if(ts.isObjectLiteralExpression(node)){
    try{
     const obj=literal(node);
     if(typeof obj.src==='string'&&Number.isFinite(obj.width)&&Number.isFinite(obj.height))metadata.push({...obj,sourceUrl:item.url});
    }catch{}
   }
   ts.forEachChild(node,visit);
  }
  visit(tree);
  for(const name of illustrationNames){
   if(!bindings.has(name))throw Error('Declared illustration binding missing');
   for(const initializer of bindings.get(name)){
    if(!ts.isObjectLiteralExpression(initializer))continue;
    const value={};let valid=true;
    for(const property of initializer.properties){
     if(!ts.isPropertyAssignment(property)||!property.name?.text){valid=false;break}
     if(ts.isStringLiteral(property.initializer))value[property.name.text]=property.initializer.text;
     else if(!property.name.text.startsWith('endministrator')){valid=false;break}
    }
    if(valid&&typeof value.perlica==='string')artMaps.push({url:item.url,value});
   }
  }
 }
 const core=arrays.sort((a,b)=>b.value.length-a.value.length)[0];
 if(!core||core.value.length<25)throw Error('No complete native Endfield core literal');
 const byLocale={};
 // Native official labels identify the actual locale dictionary rather than bundle order.
 const perlicaNames={ko:['펠리카'],en:['Perlica'],ja:['ペリカ'],zh:['佩丽卡']};
 for(const [locale,names]of Object.entries(perlicaNames)){
  const matching=dicts.filter(d=>names.includes(d.value['operator.content.perlica.name'])&&(locale!=='en'||d.value['common.back']==='Back')&&core.value.every(c=>typeof d.value['operator.content.'+c.key+'.name']==='string'));
  if(matching.length!==1)throw Error('Ambiguous or missing native dictionary '+locale+' count='+matching.length);
  byLocale[locale]=matching[0];
 }
 const maps=artMaps.filter(m=>core.value.every(c=>c.key.startsWith('endministrator')||typeof m.value[c.key]==='string'));
 if(maps.length!==1)throw Error('Ambiguous full illustration map count='+maps.length);
 const art={...maps[0].value};
 for(const c of core.value.filter(c=>c.key.startsWith('endministrator'))){
  const matches=metadata.filter(x=>x.src.match(new RegExp('/'+c.key+'\\.[a-z0-9]+\\.png$'))&&x.height>500&&x.width>500);
  const unique=[...new Map(matches.map(x=>[x.src,x])).values()];
  if(unique.length!==1)throw Error('Missing/ambiguous Endministrator full original '+c.key);
  art[c.key]=unique[0].src;
 }
 fs.writeFileSync(outputPath,JSON.stringify({core,locales:byLocale,artMapSource:maps[0].url,art,metadata}));
}else throw Error('Unsupported parser mode');
