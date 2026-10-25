// Inert extraction of declared JSON data. Never executes a downloaded module.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require(process.env.TYPESCRIPT_PATH||'typescript');
const input=process.argv[2];
if(!input)throw new Error('A downloaded source module is required');
const source=fs.readFileSync(input,'utf8');
if(Buffer.byteLength(source)>10_000_000)throw new Error('Source module too large');
const tree=ts.createSourceFile(input,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const bindings=new Map(),exports=new Map();
function literal(node){
 if(ts.isStringLiteralLike(node)||ts.isNoSubstitutionTemplateLiteral(node))return node.text;
 if(ts.isNumericLiteral(node))return Number(node.text);
 if(node.kind===ts.SyntaxKind.TrueKeyword)return true;
 if(node.kind===ts.SyntaxKind.FalseKeyword)return false;
 if(node.kind===ts.SyntaxKind.NullKeyword)return null;
 if(ts.isIdentifier(node)&&bindings.has(node.text))return bindings.get(node.text);
 if(ts.isArrayLiteralExpression(node))return node.elements.map(literal);
 if(ts.isObjectLiteralExpression(node))return Object.fromEntries(node.properties.map(p=>{
  if(!ts.isPropertyAssignment(p)||!p.name||ts.isComputedPropertyName(p.name))throw new Error('Nonliteral object');
  return [p.name.text,literal(p.initializer)];
 }));
 if(ts.isPrefixUnaryExpression(node)&&node.operator===ts.SyntaxKind.MinusToken)return -literal(node.operand);
 if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&node.expression.expression.getText(tree)==='JSON'&&node.expression.name.text==='parse'&&node.arguments.length===1){
  const value=literal(node.arguments[0]);if(typeof value!=='string')throw new Error('Nonliteral JSON');return JSON.parse(value);
 }
 throw new Error('Source contains an executable/nonliteral initializer: '+ts.SyntaxKind[node.kind]);
}
for(const statement of tree.statements){
 if(ts.isVariableStatement(statement))for(const d of statement.declarationList.declarations){
  if(!ts.isIdentifier(d.name)||!d.initializer)throw new Error('Unexpected source binding');
  bindings.set(d.name.text,literal(d.initializer));
 }
 else if(ts.isExportDeclaration(statement)&&statement.exportClause&&ts.isNamedExports(statement.exportClause))for(const e of statement.exportClause.elements)exports.set(e.name.text,e.propertyName?.text||e.name.text);
 else throw new Error('Unexpected source statement');
}
const result={};for(const name of ['characters','ascension','passives','skill_scaling','properties','labels']){
 const binding=exports.get(name);if(!binding||!bindings.has(binding))throw new Error('Missing catalog '+name);result[name]=bindings.get(binding);
}
if(!Array.isArray(result.characters)||result.characters.length<40)throw new Error('Catalog identity inventory too small');
process.stdout.write(JSON.stringify(result));
