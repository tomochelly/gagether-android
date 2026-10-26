import supplements from '../content/leaks/english-supplement.json' with {type:'json'};
import type {LeakItem} from './leaks';
/** Public translation projection; source edits/manual records always win. */
export function englishLeak(item:LeakItem):LeakItem{
 if(item.manual||item.localized.en?.sourceHash===item.bodyHash)return item;
 const rule=supplements.find(r=>r.id===item.id&&r.sourceUrl===item.sourceUrl&&r.expectedBodyHash===item.bodyHash);
 return rule?{...item,localized:{...item.localized,en:rule.localized.en as NonNullable<LeakItem['localized']['en']>}}:item;
}
