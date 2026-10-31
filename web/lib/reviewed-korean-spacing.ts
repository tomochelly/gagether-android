import reviewed from '../content/reviewed-korean-spacing.json' with {type:'json'};
const exact=new Map(reviewed.replacements.map(row=>[row.before,row.after]));
type Span=[number,number];
function protectedSpans(text:string){
 const spans:Span[]=[];
 const add=(pattern:RegExp)=>{for(const match of text.matchAll(pattern))spans.push([match.index!,match.index!+match[0].length]);};
 // Code and link destinations are opaque, including balanced relative links.
 for(let at=0;at<text.length;at++)if(text[at]==='`'||text.slice(at,at+3)==='~~~'){
  const start=at,char=text[at];while(text[at+1]===char)at++;const marker=text.slice(start,at+1),end=text.indexOf(marker,at+1);
  const stop=end>=0?end+marker.length:marker.length>=3?text.length:(text.indexOf('\n',at+1)<0?text.length:text.indexOf('\n',at+1));spans.push([start,stop]);at=stop-1;
 }
 for(let start=text.indexOf('](');start>=0;start=text.indexOf('](',start+2)){
  let depth=1,at=start+2;for(;at<text.length&&text[at]!=='\n';at++){if(text[at]==='\\'){at++;continue;}if(text[at]==='(')depth++;else if(text[at]===')'&&!--depth){at++;break;}}spans.push([start,at]);
 }
 add(/^[ \t]{0,3}\[[^\]\r\n]+\]:[^\r\n]*/gm);
 add(/(?:https?:\/\/|www\.)[^\s<>"`]+/gi);
 add(/[\p{L}\p{N}._%+!#$&'*=/^`{|}~-]+@(?:[\p{L}\p{N}-]+\.)+[\p{L}]{2,}/gu);
 add(/\b(?:[a-z\d-]+\.)+[a-z]{2,}(?:\/[^\s<>"`]*)?/gi);
 add(/\b\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?/g);
 add(/\b(?=[A-Z\d_-]*[A-Z])[A-Z\d][A-Z\d_-]{2,63}\b/g);
 const merged:Span[]=[];for(const span of spans.sort((a,b)=>a[0]-b[0]||b[1]-a[1])){const last=merged.at(-1);if(last&&span[0]<=last[1])last[1]=Math.max(last[1],span[1]);else merged.push(span);}return merged;
}
const timeValid=(value:string)=>{const parts=value.split(':').map(Number);return parts[0]<24&&parts[1]<60&&(parts.length<3||parts[2]<60);};
const datePrefix=/(?:은|는|이|가|을|를|에|로|부터|까지|후|전|종료|시작|공개|기간|일시|마감)$/;
function numericGrammar(text:string){
 return text
  .replace(/(?<![\dA-Za-z])(?:(\d{4})년[ \t]*)?(\d{1,2})월[ \t]*(\d{1,2})일(?:[ \t]*(\d{1,2}:\d{2}(?::\d{2})?))?/g,(whole,year,month,day,time,offset,original)=>{
   if(+month<1||+month>12||+day<1||+day>31||time&&!timeValid(time))return whole;
   const gap=datePrefix.test(original.slice(0,offset))?' ':'';return gap+(year?year+'년 ':'')+month+'월 '+day+'일'+(time?' '+time:'');
  })
  .replace(/(?<![\dA-Za-z])(\d{4})년(\d{1,2})월/g,(whole,year,month)=>+month>=1&&+month<=12?year+'년 '+month+'월':whole)
  .replace(/(은|는|이|가|을|를|에|로|부터|까지|후|전)(\d{1,2}:\d{2}(?::\d{2})?)(?![\d.:])/g,(whole,particle,time)=>timeValid(time)?particle+' '+time:whole)
  .replace(/(^|[\s([,;·])(시즌|레벨)(\d+)(?![\dA-Za-z_:/%−-]|\.\d)(?=$|[\s)\],;.!?·~～–—]|[은는이가을를의에로부터까지])/g,'$1$2 $3')
  .replace(/(최대|최소|총|캐릭터)(\d+)(시간|부대|단계|명|개|회|종|장|점|팀|층|일|분|초)(?![A-Za-z\d])/g,'$1 $2$3')
  .replace(/,(?=(?:시즌|레벨) \d)/g,', ');
}
/** Only Korean calendar/count grammar is normalized; opaque spans remain literal. */
export function koreanNumericSpacing(text:string){
 if(!/[가-힣]/.test(text))return text;
 let result='',at=0;for(const[start,end]of protectedSpans(text)){result+=numericGrammar(text.slice(at,start))+text.slice(start,end);at=end;}return result+numericGrammar(text.slice(at));
}
/** Exact reviewed prose first, then bounded calendar/count spacing. No stored data changes. */
export function reviewedKoreanSpacing(text:string){return koreanNumericSpacing(exact.get(text)??text);}
