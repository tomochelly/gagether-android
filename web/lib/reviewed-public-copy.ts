import reviewed from '../content/reviewed-public-copy.json' with {type:'json'};
import {reviewedKoreanSpacing} from './reviewed-korean-spacing';
const exact=new Map<string,string>();
for(const row of reviewed.replacements){exact.set(row.before,row.after);exact.set(reviewedKoreanSpacing(row.before),row.after);}
const sentenceKey=(text:string)=>text.trim().replace(/[.!。！]+$/,'').trim();
const processOnly=new Set(reviewed.replacements.filter(row=>!row.after).map(row=>sentenceKey(row.before)));
/** Complete reviewed text only: adding or editing a fact invalidates the match. */
export const reviewedPublicCopy=(text:string|undefined)=>text===undefined?undefined:exact.get(text);
export const reviewedProcessSentence=(text:string)=>processOnly.has(sentenceKey(text));
/** Only delimited terminal source labels are removed, never game-name substrings. */
export function withoutPublicSourceSuffix(text:string){
 return text.replace(/\s*[·・|｜]\s*(?:(?:한국(?:어)?|일본(?:어)?|중국(?:어)?|영문|영어)\s*(?:공식\s*)?(?:공지\s*)?원문|(?:Korean|Japanese|Chinese|English|KR|JP|CN|EN)\s+(?:official\s+)?(?:(?:notice\s+)?original|source)|(?:韓国|日本|中国|英語)(?:語|版)?(?:公式)?(?:告知)?(?:原文|出典)|(?:韩国|韓國|日本|中国|中國|英文|英语|英語)(?:官方)?(?:公告)?(?:原文|来源|來源))\s*$/i,'');
}
