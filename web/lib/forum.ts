import {z} from 'zod';
import {games} from './games';
import type {Locale} from './types';
export const forumLocales=['ko','en','ja','zh'] as const;
export const forumCategories=['discussion','question','guide','showcase','news','leak'] as const;
export const forumId=z.string().uuid();
export const forumGame=z.string().refine(v=>games.some(g=>g.id===v),'Unknown game');
export const forumLocale=z.enum(forumLocales);
export const forumCategory=z.enum(forumCategories);
export const forumPath=(locale:Locale,gameId?:string,id?:string)=>`/${locale}/community${id?'/'+id:gameId?'?game='+gameId:''}`;
export const forumTitles={ko:'커뮤니티',en:'Community',ja:'コミュニティ',zh:'社区'};
export function forumLink(value:string){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password&&!u.port&&!/^(localhost|\d+\.\d+\.\d+\.\d+|\[)/i.test(u.hostname)?u.href:undefined;}catch{return;}}
export type ForumMark={type:'bold'|'italic'|'underline'|'strike'|'code'|'link'|'textStyle';attrs?:Record<string,unknown>};
export type ForumNode={type:string;text?:string;attrs?:Record<string,unknown>;marks?:ForumMark[];content?:ForumNode[]};
export type ForumDoc=ForumNode&{type:'doc'};
const nodeKinds=new Set(['doc','paragraph','heading','text','hardBreak','blockquote','bulletList','orderedList','listItem','codeBlock','horizontalRule','image','table','tableRow','tableHeader','tableCell']);
const markKinds=new Set(['bold','italic','underline','strike','code','link','textStyle']);
export const emptyForumDoc:ForumDoc={type:'doc',content:[{type:'paragraph'}]};
/** Validate a small structured document; raw HTML, arbitrary styles and tracking images never reach a renderer. */
export function parseForumDoc(value:unknown):ForumDoc{
 let nodes=0,characters=0,images=0;const scan=(raw:unknown,depth:number):ForumNode=>{
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||depth>12||++nodes>2500)throw Error('Invalid document');
  const n=raw as ForumNode;if(Object.keys(n).some(k=>!['type','text','attrs','marks','content'].includes(k))||!nodeKinds.has(n.type))throw Error('Unsupported document node');
  const out:ForumNode={type:n.type};
  if(n.type==='text'){if(typeof n.text!=='string'||!n.text||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(n.text))throw Error('Invalid text');characters+=n.text.length;out.text=n.text;}
  else if(n.text!==undefined)throw Error('Unexpected text');
  if(n.attrs){if(typeof n.attrs!=='object'||Array.isArray(n.attrs))throw Error('Invalid attributes');const a=n.attrs,b:Record<string,unknown>={};
   for(const [k,v]of Object.entries(a)){
    if(v===null)continue;
    if(k==='textAlign'&&['paragraph','heading'].includes(n.type)&&['left','center','right','justify'].includes(String(v)))b[k]=v;
    else if(k==='level'&&n.type==='heading'&&[1,2,3].includes(Number(v)))b[k]=Number(v);
    else if(k==='start'&&n.type==='orderedList'&&Number.isInteger(v)&&Number(v)>=1&&Number(v)<=999)b[k]=v;
    else if(k==='language'&&n.type==='codeBlock'&&typeof v==='string'&&/^[\w+-]{0,30}$/.test(v))b[k]=v;
    else if(k==='src'&&n.type==='image'&&typeof v==='string'&&/^\/api\/forum\/media\/[a-f0-9-]{36}$/.test(v))b[k]=v;
    else if(['alt','title'].includes(k)&&n.type==='image'&&typeof v==='string'&&v.length<=300)b[k]=v;
    else if(['colspan','rowspan'].includes(k)&&['tableCell','tableHeader'].includes(n.type)&&Number.isInteger(v)&&Number(v)>=1&&Number(v)<=8)b[k]=v;
    else if(k==='colwidth'&&['tableCell','tableHeader'].includes(n.type)&&Array.isArray(v)&&v.length<=8&&v.every(x=>Number.isInteger(x)&&x>=30&&x<=1000))b[k]=v;
    else throw Error('Unsupported attribute');
   }out.attrs=b;
  }
  if(n.type==='image'&&(!out.attrs?.src||++images>10))throw Error('Invalid image');
  if(n.marks){if(n.type!=='text'||!Array.isArray(n.marks)||n.marks.length>7)throw Error('Invalid marks');out.marks=n.marks.map(m=>{
   if(!m||!markKinds.has(m.type)||Object.keys(m).some(k=>!['type','attrs'].includes(k)))throw Error('Unsupported mark');const out:ForumMark={type:m.type};
   if(m.type==='link'){const href=typeof m.attrs?.href==='string'&&forumLink(m.attrs.href);if(!href)throw Error('Invalid link');out.attrs={href};}
   else if(m.type==='textStyle'){const a:Record<string,unknown>={};for(const [k,v]of Object.entries(m.attrs||{})){if(v===null)continue;if(k==='color'&&typeof v==='string'&&/^#[a-f0-9]{6}$/i.test(v))a.color=v;else if(k==='fontSize'&&typeof v==='string'&&/^(12|14|16|18|20|24|28|32)px$/.test(v))a.fontSize=v;else throw Error('Unsupported text style');}out.attrs=a;}
   else if(m.attrs&&Object.keys(m.attrs).some(k=>m.attrs![k]!==null))throw Error('Unexpected mark attributes');return out;
  });}
  if(n.content!==undefined){if(!Array.isArray(n.content)||['text','hardBreak','horizontalRule','image'].includes(n.type))throw Error('Invalid child nodes');out.content=n.content.map(v=>scan(v,depth+1));}
  return out;
 };const doc=scan(value,0);if(doc.type!=='doc'||!doc.content?.length||characters>20000||JSON.stringify(doc).length>150000)throw Error('Document limit');
 const block=new Set(['paragraph','heading','blockquote','bulletList','orderedList','codeBlock','horizontalRule','image','table']);
 const check=(n:ForumNode)=>{const children=n.content||[];if(n.type==='doc'&&children.some(c=>!block.has(c.type))||['paragraph','heading','codeBlock'].includes(n.type)&&children.some(c=>!['text','hardBreak'].includes(c.type))||['bulletList','orderedList'].includes(n.type)&&children.some(c=>c.type!=='listItem')||n.type==='table'&&(children.length>30||children.some(c=>c.type!=='tableRow'))||n.type==='tableRow'&&(children.length>8||children.some(c=>!['tableCell','tableHeader'].includes(c.type))))throw Error('Invalid document structure');children.forEach(check);};check(doc);return doc as ForumDoc;
}
export function forumText(doc:ForumNode):string{return doc.type==='text'?doc.text||'':doc.type==='hardBreak'?'\n':doc.type==='image'?'':(doc.content||[]).map(forumText).join(['doc','blockquote','listItem','bulletList','orderedList','table','tableRow','tableCell','tableHeader'].includes(doc.type)?'\n':'');}
export function forumMediaIds(doc:ForumNode):string[]{return [...new Set([...(doc.type==='image'?[String(doc.attrs!.src).split('/').at(-1)!]:[]),...(doc.content||[]).flatMap(forumMediaIds)])];}
export type ForumPost={id:string;gameId:string;category:typeof forumCategories[number];locale:Locale;title:string;author:string;anonymous?:boolean;ipPrefix?:string;createdAt:number;updatedAt:number;revision:number;spoiler:boolean;mine:boolean;likes:number;liked:boolean;comments:number;doc?:ForumDoc;excerpt?:string;locked?:boolean;translation?:{title:string;doc?:ForumDoc;excerpt?:string;status:'translated'|'partial'|'pending'|'unavailable';locale:Locale};};
export type ForumComment={id:string;postId:string;parentId:string|null;author:string;anonymous?:boolean;ipPrefix?:string;body:string;locale:Locale;createdAt:number;revision:number;mine:boolean;removed:boolean;translation?:string};
export const forumCreate=z.object({action:z.literal('save'),id:forumId,gameId:forumGame,category:forumCategory,locale:forumLocale,title:z.string().trim().min(2).max(160),author:z.string().trim().min(2).max(40).regex(/^[^<>\u0000-\u001f]+$/),doc:z.unknown(),spoiler:z.boolean(),revision:z.number().int().min(0)}).strict();
