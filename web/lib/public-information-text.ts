import {reviewedKoreanSpacing} from './reviewed-korean-spacing';
import {reviewedPublicCopy,reviewedProcessSentence,withoutPublicSourceSuffix} from './reviewed-public-copy';
/** Exact editorial process labels are presentation noise, not game facts.
 * Never apply this projection to source originals or persist it as an Entry. */
const labels=new Set([
 '운영자 설정','커뮤니티 참고','커뮤니티 참조','한국 공지 원문','한국어 공지 원문','일본 공지 원문','일본어 공지 원문','중국 공지 원문','중국어 공지 원문','영문 공지 원문',
 'owner-defined','owner defined','community reference',
 '運営者設定','コミュニティ参考','コミュニティ参照',
 '管理者设定','管理者設定','社区参考','社群參考'
]);
const generated=[
 /^공식 공지와 방송 소개에서 확인한 주요 내용을 모았습니다$/,
 /^Highlights from the official announcements and program introduction$/i,
 /^公式告知と番組紹介で確認できる主な内容をまとめました$/,
 /^整理官方公告与节目介绍中已公开的主要内容$/,
 /^운영자가 (?:직접 )?(?:입력|설정|등록)한 (?:(?:초기화|반복|주기) )?(?:일정|정보|콘텐츠)(?:입니다|이에요)?$/,
 /^운영자가 (?:직접 )?(?:입력|설정|등록)했습니다$/,
 /^(?:이 |해당 )?(?:일정|정보|콘텐츠)(?:은|는) 운영자가 (?:직접 )?(?:입력|설정|등록)한 (?:일정|정보|콘텐츠)(?:입니다|이에요)$/,
 /^Reset schedule entered by the owner$/i,
 /^(?:This )?(?:(?:reset|repeating|recurring) )?(?:schedule|information|content|entry) (?:was |is )?(?:manually )?(?:entered|configured|set|registered) by the (?:site )?(?:owner|administrator)$/i,
 /^This is an owner-defined (?:schedule|entry|recurring schedule)$/i,
 /^運営者が(?:直接)?(?:入力|設定|登録)した(?:(?:リセット|繰り返し|反復|定期))?(?:日程|予定|情報|コンテンツ)(?:です)?$/,
 /^(?:管理者|管理员|管理員)(?:直接)?(?:输入|輸入|设定|設定|设置|設置|登记|登記)的(?:(?:重置|重复|重複|周期|週期))?(?:日程|时间表|時間表|信息|資訊|内容|內容)$/
];
const comparable=(text:string)=>text.trim().replace(/^(?:[-*•]\s+)/,'').replace(/[.!。！]+$/,'').trim();
export function isPublicInformationFiller(text:string){
 const value=comparable(text);
 return !!value&&(reviewedProcessSentence(text)||labels.has(value.toLowerCase())||generated.some(pattern=>pattern.test(value)));
}
function cleanLine(line:string):string|null{
 if(!line.trim())return line;
 if(isPublicInformationFiller(line))return null;
 // Only drop complete, fixed process sentences. Amounts, dates, conditions,
 // unknown-effect warnings and any unrecognized owner prose remain literal.
 const spans=line.split(/(?<=[.!?。！？])(?=\s|[\p{L}])/u),kept=spans.filter(span=>!isPublicInformationFiller(span));
 let value=kept.length===spans.length?line:kept.join('').trim();
 // A source-language heading is not a participation condition. Strip only the
 // fixed leading label, leaving all actual dates, quantities and prose intact.
 value=value.replace(/^(?:한국(?:어)?|일본(?:어)?|중국(?:어)?|영문) 공지 원문\s*[:：·]\s*/, '');
 if(!value.trim())return null;
 // Old cycle descriptions joined a provenance label to a useful interval.
 // Remove exact label tokens and retain the existing separator between facts.
 const pieces=value.split(/(\s*[·•|・]\s*)/),facts:number[]=[];
 for(let i=0;i<pieces.length;i+=2)if(!labels.has(comparable(pieces[i]).toLowerCase()))facts.push(i);
 if(facts.length*2-1!==pieces.length)value=facts.map((index,n)=>(n?pieces[index-1]:'')+pieces[index]).join('');
 return value.trim()?value:null;
}
/** Read-only editorial projection with bounded Korean calendar/count spacing.
 * Other prose remains literal. Original source bodies are always exempt. */
export function cleanPublicInformationText(text:string|undefined,options:{sourceOriginal?:boolean}={}){
 if(!text||options.sourceOriginal)return text||'';
 text=reviewedKoreanSpacing(withoutPublicSourceSuffix(reviewedPublicCopy(text)??text));
 const newline=text.includes('\r\n')?'\r\n':'\n',lines=text.split(/\r?\n/),cleaned=lines.map(cleanLine);
 if(cleaned.every((line,index)=>line===lines[index]))return text;
 const result:string[]=[];
 for(let i=0;i<cleaned.length;i++){
  const line=cleaned[i];if(line!==null){result.push(line);continue;}
  const before:string[]=[];while(result.length&&!result.at(-1)!.trim())before.unshift(result.pop()!);
  let after:string[]=[];
  while(i+1<cleaned.length&&(cleaned[i+1]===null||!cleaned[i+1]!.trim())){
   i++;if(cleaned[i]===null)after=[];else after.push(cleaned[i]!);
  }
  // Join the former paragraphs without adding new blank gaps. Blank spacing
  // elsewhere in the authored text is left exactly as it was.
  if(result.length&&i+1<cleaned.length)result.push(...(before.length>=after.length?before:after));
 }
 return result.join(newline);
}
