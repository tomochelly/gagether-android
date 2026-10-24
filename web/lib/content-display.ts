import type {Entry,Locale,Localized} from './types';
import {authoredField,normalizeLineBreaks} from './text-appearance';
const waiting=/^(?:현지화 확인 중|.*검수 중입니다\.?|.*상세.*현지화.*검수.*|Localization pending|.*detailed conditions.*under review.*|.*awaiting review\.?|現地表記を確認中|.*詳細条件.*確認中.*|本地化名称核实中|.*详细条件.*正在核实.*)$/i;
export const placeholderText=(text:string|undefined)=>!text?.trim()||waiting.test(text.trim())||/^(공식 새 (공지|소식)입니다\.|Official (news|notice)\.|公式からのお知らせです。|官方最新消息。)/i.test(text.trim());
const workflowCopy=/(?:기재하지|추가하지 않았|보존합니다|검수|재검수|현지화|미확인|미공개|확인되지|명시되지|명확하지|확인하지 못|확인하지 않았|확인한 것으로|시청 확인|시청·검수|시청한.*아닙|재생.*(?:검수|확인)|운영자가 제공|운영자.*화면|추산하지|추정하지|기존.*(?:시각|이미지|일정).*유지|기록합니|기록했습니|표시합니|표기합니|확인했|검증했|확정하지|구분했습니다|요약·번역|공식.*표기입니다|시청하지|재생하지|별도.*확인 필요|대조한 값|편집 요약|남겼습니|접근.*(?:제한|차단|실패)|HTTP\s*(?:403|429|5\d\d)|unknown (?:time|date|quantity|limit|price|detail)|(?:information|details?|dates?|times?|conditions?|quantity|prices?) (?:is |are |were |was )?not available|not (?:disclosed|specified)|editorial (?:summary|translation)|official.*name.*(?:localization|notation)|(?:was|were) (?:verified|confirmed|inspected)|remain(?:s)? unverified|(?:full post|full body|full article|source access).*(?:blocked|restricted|unavailable)|(?:public|source|official).*(?:does not give|does not specify|does not list)|only (?:the )?(?:title|headline|metadata).*(?:date|verified|checked)|cross.checked|we (?:verified|checked|confirmed|recorded)|not (?:verified|confirmed|inspected|watched)|(?:remain|left|kept|pending|awaiting).*(?:unconfirmed|verification|review|localization)|(?:review|localization|translation) (?:scope|evidence|pending)|operator.provided|owner.provided|not extrapolat|未(?:確認|検証|公表)|不明|確認でき|検証でき|確認しました|照合しました|再確認|再検証|翻訳.*要約|要約.*翻訳|ローカライズ|本文.*(?:アクセス制限|記載.*ありません)|掲載日のみ確認|表記のみ保存|運営者.*(?:提供|画面)|推算しません|未明示|不明确|未(?:核实|核實|确认|確認|验证|驗證)|已(?:核对|核對|核实|核實|验证|驗證)|正文.*(?:访问受限|未列|未载)|仅核对|保留标题|本地化|在地化|编译摘要|編譯摘要|运营者.*(?:提供|画面)|不推算)/i;
const metaHeading=/(?:검수|현지화|이름.*(?:근거|표기)|번역.*(?:기준|근거)|자료.*기준|(?:review|localization|translation|name).*(?:scope|evidence|policy|notation)|ローカライズ|本文.*(?:アクセス制限|記載.*ありません)|掲載日のみ確認|表記のみ保存|名称.*(?:根拠|表記)|検証範囲|名稱.*(?:依據|標示)|名称.*(?:依据|标注)|核实范围|核實範圍)/i;
const unknownClock=/^\s*(?:날짜 기준\s*[·・]?\s*시각 (?:미확인|미공개)|Date only\s*[·・]?\s*time (?:unpublished|unconfirmed)|日付のみ[・·]?時刻未(?:発表|確認)|仅日期\s*[·・]?\s*时间未(?:公布|确认))\s*[。.]?\s*$/i;
const splitSentences=(text:string)=>text.split(/(?<=[.!?。！？])\s+(?=[\p{L}\p{N}「『\[])/u);
/** Public copy contains useful facts; provenance and collection status stay in source/owner tools. */
export function cleanDisplayText(text:string|undefined){return (text||'').split('\n').flatMap(splitSentences).map(s=>s.trim().replace(/^(?:공식 공지의 검색 공개문에서|한국 공식 공지에서는|일본 공식 포스터는|배너에는)\s*/, '').replace(/없음을 확인했습니다[.!]?$/, '없습니다.').replace(/있음을 확인했습니다[.!]?$/, '있습니다.').replace(/임을 확인했습니다[.!]?$/, '입니다.').replace(/로 표기됩니다[.!]?$/, '')).filter(s=>!placeholderText(s)&&!unknownClock.test(s)&&!workflowCopy.test(s)).map(s=>s
 .replace(/^(?:한국|일본|중국|글로벌)(?:판|\s*(?:서버|서비스|공식(?:\s*(?:공지|포스터|안내))?))(?:에서는|에는|는|에서)\s*/,'')
 .replace(/(?:로 안내합니다|라고 표기했습니다|로 공지됐습니다|로 안내됐습니다)[.!]?$/,'')
 .replace(/(?<=원)\s*\(KRW\)/g,'')
 ).filter(Boolean).join('\n').trim();}
export function displaySection(title:string|undefined,body:string|undefined){return !metaHeading.test(title||'')&&!!cleanDisplayText(body);}
/** Preserve explicit paragraphs, amounts, conditions and draw limits while separating dense sentences. */
export function detailText(text:string|undefined){
 const cleaned=cleanDisplayText(text);if(!cleaned)return '';
 return cleaned.split('\n').map(line=>{
  const thresholds=[...line.matchAll(/\d+(?:개|회|일|장|점|단계)(?:는|은)\s/g)];
  if(thresholds.length>=2)line=line.replace(/(?:[,，]\s*)?(\d+(?:개|회|일|장|점|단계))(?:는|은)\s*/g,'\n$1 : ').replace(/\s*보상입니다[.!]?$/,'');
  return line.replace(/^(\d+(?:개|회|일|장|점|단계))(?:는|은)\s*/, '$1 : ').replace(/^(.+?)와 (.+?)는 각 ([0-9,.]+원)[.]?$/, '$1 / $2\n각 $3').replace(/^\s*\n/,'').trim();
 }).join('\n\n').replace(/\n{3,}/g,'\n\n').replace(/\n\n(?=\d+(?:개|회|일|장|점|단계) :)/g,'\n');
}
export function displayTitle(entry:Entry,locale:Locale){const local=entry.title[locale];if(authoredField(entry,'title')&&local.trim())return normalizeLineBreaks(local);return !placeholderText(local)?local:entry.title[entry.sourceLocale||'ko']&&!placeholderText(entry.title[entry.sourceLocale||'ko'])?entry.title[entry.sourceLocale||'ko']:entry.sourceTitle;}
export function displaySummary(entry:Entry,locale:Locale){if(authoredField(entry,'summary')&&entry.summary[locale])return normalizeLineBreaks(entry.summary[locale]);return cleanDisplayText(entry.summary[locale])||cleanDisplayText(entry.summary[entry.sourceLocale||'ko'])||'';}
export const originalName=(name:Localized,locale:Locale)=>cleanDisplayText(name[locale])||(['ko','en','ja','zh'] as const).map(l=>cleanDisplayText(name[l])).find(Boolean)||'';

/** Schedule widgets already show exact clocks and the visitor timezone. */
export function displayTimingNote(entry:Entry,locale:Locale){
 const note=cleanDisplayText(entry.timingNote?.[locale]);
 if(!note)return '';
 return note.split('\n').filter(line=>!/^\s*(?:Asia\/[A-Za-z_]+|UTC\s*[+−-]\s*\d{1,2}(?::\d{2})?)\s*$/.test(line)).filter(line=>!(entry.startAt&&entry.endAt&&/^[\d\s/:.,–—~～至年月日時时分()·+−-]+(?:UTC\s*\+\d+|日本標準時)?$/.test(line.replace(/(?:Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep)\.?/g,'')))).join('\n');
}
