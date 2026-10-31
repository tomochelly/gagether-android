// Node-only test loader. Production uses the existing Vinext/Vite build.
import {registerHooks} from 'node:module';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import ts from 'typescript';
const root=fileURLToPath(new URL('../',import.meta.url));
registerHooks({
 resolve(specifier,context,next){
  let candidate;
  if(specifier.startsWith('@/'))candidate=path.join(root,specifier.slice(2));
  else if(specifier.startsWith('.')&&context.parentURL?.startsWith('file:'))candidate=fileURLToPath(new URL(specifier,context.parentURL));
  if(candidate?.startsWith(root)&&!candidate.includes('/node_modules/')){
   const found=[candidate,candidate+'.ts',candidate+'.tsx',path.join(candidate,'index.ts')].find(p=>/\.(ts|tsx)$/.test(p)&&existsSync(p));
   if(found)return {url:pathToFileURL(found).href,shortCircuit:true};
  }
  return next(specifier,context);
 },
 load(url,context,next){
  if(url.startsWith('file:')&&/\.tsx?$/.test(url)&&fileURLToPath(url).startsWith(root))return {format:'module',source:ts.transpileModule(readFileSync(fileURLToPath(url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText,shortCircuit:true};
  return next(url,context);
 }
});
