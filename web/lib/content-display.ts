import type {Entry,Locale,Localized} from './types';
const waiting=/^(?:현지화 확인 중|.*검수 중입니다\.?|.*상세.*현지화.*검수.*|Localization pending|.*awaiting review\.?|現地表記を確認中|.*詳細条件.*確認中.*|本地化名称核实中|.*详细条件.*正在核实.*)$/i;
export const placeholderText=(text:string|undefined)=>!text?.trim()||waiting.test(text.trim())||/^(공식 새 (공지|소식)입니다\.|Official (news|notice)\.|公式からのお知らせです。|官方最新消息。)/i.test(text.trim());
/** Hide workflow filler, not gameplay uncertainty or source facts. */
export function cleanDisplayText(text:string|undefined){return (text||'').split('\n').filter(line=>!placeholderText(line)&&!/^\s*(?:날짜 기준\s*[·・]?\s*시각 (?:미확인|미공개)|Date only\s*[·・]?\s*time (?:unpublished|unconfirmed)|日付のみ[・·]?時刻未(?:発表|確認)|仅日期\s*[·・]?\s*时间未(?:公布|确认))\s*[。.]?\s*$/i.test(line)).join('\n').trim();}
export function displayTitle(entry:Entry,locale:Locale){const local=entry.title[locale];return !placeholderText(local)?local:entry.title[entry.sourceLocale||'ko']&&!placeholderText(entry.title[entry.sourceLocale||'ko'])?entry.title[entry.sourceLocale||'ko']:entry.sourceTitle;}
export function displaySummary(entry:Entry,locale:Locale){return cleanDisplayText(entry.summary[locale])||cleanDisplayText(entry.summary[entry.sourceLocale||'ko'])||'';}
export const originalName=(name:Localized,locale:Locale)=>cleanDisplayText(name[locale])||(['ko','en','ja','zh'] as const).map(l=>cleanDisplayText(name[l])).find(Boolean)||'';
