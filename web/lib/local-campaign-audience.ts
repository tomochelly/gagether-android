import {safeSource,type Entry,type Region} from './types';

// Reviewed physical partners from the existing regional campaign inventory.
// A Korean gameplay announcement or an in-game collaboration is not a KR-only event.
const koreanPhysicalPartners:Record<string,RegExp>={
 wuwa:/롯데\s*시네마|lotte\s+cinema|ロッテシネマ|乐天影院/i,
 bluearchive:/\bGS\s?25\b/i,
 arknights:/반올림\s*피자|banolim\s*pizza/i,
 hsr:/메가\s*(?:MGC\s*)?커피|mega\s*(?:MGC\s*)?coffee/i,
 hi3:/일러스타\s*카페|illustar\s*caf[eé]|POLUV/i,
 trickcal:/골든\s*크레마|golden\s*crema/i,
};
export function localCampaignMarket(entry:Entry):Region|undefined{
 if(entry.marketRegion||entry.audienceRegions?.length||entry.broadcast||entry.collaboration?.scope==='ingame'||!['event','update','package'].includes(entry.kind))return;
 if(entry.sourceLocale!=='ko'||entry.sourceKind!=='official'||!safeSource(entry.sourceUrl,entry.gameId))return;
 const pattern=koreanPhysicalPartners[entry.gameId];
 return pattern?.test(entry.sourceTitle||entry.title.ko)?'kr':undefined;
}
