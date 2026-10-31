import {env} from 'cloudflare:workers';
import {hashToken} from './google-login';
import {forumText,type ForumDoc,type ForumNode,type ForumPost,type ForumComment} from './forum';
import type {PostRow} from './forum-store';
import type {Locale} from './types';
type Translation=NonNullable<ForumPost['translation']>;
const keyFor=async(row:PostRow,locale:Locale)=>'forum-translation:'+await hashToken(row.content_hash+'|'+locale);
export async function readForumTranslation(row:PostRow,locale:Locale,full:boolean):Promise<Translation|undefined>{if(row.locale===locale)return;const stored=await env.DB!.prepare('SELECT payload FROM operations_health WHERE key=?').bind(await keyFor(row,locale)).first<{payload:string}>();if(!stored)return {title:row.title,status:'pending',locale};const value=JSON.parse(stored.payload) as Translation;return full?value:{title:value.title,excerpt:value.excerpt,status:value.status,locale};}
const segments=(text:string)=>{const out:string[]=[];let part='';for(const c of text){if(part.length+c.length>400){out.push(part);part='';}part+=c;}if(part)out.push(part);return out;};
function pieces(doc:ForumNode){const values:string[]=[];const scan=(node:ForumNode,code=false)=>{const raw=code||node.type==='codeBlock'||!!node.marks?.some(m=>m.type==='code');if(node.type==='text'&&!raw&&node.text)values.push(...segments(node.text));node.content?.forEach(c=>scan(c,raw));};scan(doc);return values;}
/** Only persisted public post text reaches translation. Cache keys include the exact content hash and target language. */
export async function translateForumRow(row:PostRow,locale:Locale,fetcher:typeof fetch=fetch){
 if(row.locale===locale)return {status:'original'};const doc=JSON.parse(row.document) as ForumDoc,work=[...segments(row.title),...pieces(doc)],known=new Map<string,string>(),pending:string[]=[];let available=1200,limited=false;
 for(const text of [...new Set(work)]){const key='forum-text:'+await hashToken(row.locale+'|'+locale+'|'+text),old=await env.DB!.prepare('SELECT payload FROM operations_health WHERE key=?').bind(key).first<{payload:string}>();if(old){known.set(text,JSON.parse(old.payload));continue;}if(text.length>available){pending.push(text);continue;}available-=text.length;
  // Share the provider's existing anonymous daily allowance across leaks and forum translations.
  const budget='leaks:translation-budget:'+new Date().toISOString().slice(0,10),reserved=await env.DB!.prepare("INSERT INTO operations_health(key,payload) VALUES(?,json_object('used',?)) ON CONFLICT(key) DO UPDATE SET payload=json_object('used',CAST(json_extract(operations_health.payload,'$.used') AS INTEGER)+?) WHERE CAST(json_extract(operations_health.payload,'$.used') AS INTEGER)+?<=4500").bind(budget,text.length,text.length,text.length).run();if(!reserved.meta.changes){limited=true;pending.push(text);break;}
  try{const chunks:string[]=[];let part='';for(const c of text){if(new TextEncoder().encode(part+c).length>480){chunks.push(part);part='';}part+=c;}if(part)chunks.push(part);const translated:string[]=[];
   for(const chunk of chunks){const params=new URLSearchParams({q:chunk,langpair:(row.locale==='zh'?'zh-CN':row.locale)+'|'+(locale==='zh'?'zh-CN':locale),mt:'1'}),r=await fetcher('https://api.mymemory.translated.net/get?'+params,{redirect:'error',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();const raw=await r.text();if(raw.length>100000)throw Error();const data=JSON.parse(raw),v=data.responseData?.translatedText;if(data.quotaFinished||Number(data.responseStatus)!==200||typeof v!=='string'||!v.trim()||v.length>10000||/MYMEMORY WARNING|INVALID LANGUAGE PAIR|QUERY LENGTH LIMIT EXCEEDED/i.test(v))throw Error();translated.push(v.replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&'));}
   const result=translated.join('');known.set(text,result);await env.DB!.prepare('INSERT INTO operations_health(key,payload) VALUES(?,?) ON CONFLICT(key) DO NOTHING').bind(key,JSON.stringify(result)).run();
  }catch{limited=true;pending.push(text);break;}
 }
 const output=structuredClone(doc);const replace=(node:ForumNode,code=false)=>{const raw=code||node.type==='codeBlock'||!!node.marks?.some(m=>m.type==='code');if(node.type==='text'&&!raw&&node.text)node.text=segments(node.text).map(t=>known.get(t)||t).join('');node.content?.forEach(c=>replace(c,raw));};replace(output);
 const complete=work.every(t=>known.has(t)),value:Translation&{sourceHash:string}={sourceHash:row.content_hash,title:segments(row.title).map(t=>known.get(t)||t).join(''),doc:output,excerpt:forumText(output).slice(0,220),locale,status:complete?'translated':known.size?'partial':limited?'unavailable':'pending'};
 // An edited post uses a different immutable hash; this can never overwrite its translation.
 await env.DB!.prepare("INSERT INTO operations_health(key,payload) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload WHERE json_extract(operations_health.payload,'$.status')<>'translated'").bind(await keyFor(row,locale),JSON.stringify(value)).run();return {status:value.status,more:!complete&&!limited};
}

export async function forumCommentRow(comment:ForumComment){return {locale:comment.locale,title:'',document:JSON.stringify({type:'doc',content:[{type:'paragraph',content:[{type:'text',text:comment.body}]}]}),plain_text:comment.body,content_hash:await hashToken('forum-comment:'+comment.locale+'|'+comment.body)} as PostRow;}
export async function readCommentTranslation(comment:ForumComment,locale:Locale){if(comment.removed||comment.locale===locale)return;const translated=await readForumTranslation(await forumCommentRow(comment),locale,true);return translated?.doc&&['translated','partial'].includes(translated.status)?forumText(translated.doc):undefined;}
