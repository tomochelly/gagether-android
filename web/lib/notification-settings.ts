export const reminderKinds=['pickup','weapon','event','package'] as const;
export type ReminderKind=typeof reminderKinds[number];
export type ReminderRule={starts:boolean;ends:boolean;startOffsets:number[];endOffsets:number[]};
export type ReminderRules=Record<ReminderKind,ReminderRule>;
export const MAX_REMINDER_MINUTES=10080;
export function cleanOffsets(value:unknown,fallback:number[]=[]):number[]{
 if(!Array.isArray(value))return [...fallback];
 return [...new Set(value.filter((v):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=MAX_REMINDER_MINUTES))].sort((a,b)=>b-a).slice(0,8);
}
export function reminderRules(raw:unknown,legacy:{starts?:boolean;offsets?:number[]}={}):ReminderRules{
 const rules=(raw&&typeof raw==='object'?raw:{}) as Partial<ReminderRules>;
 return Object.fromEntries(reminderKinds.map(k=>{const r=rules[k];return [k,{starts:r?.starts??legacy.starts??true,ends:r?.ends??true,startOffsets:cleanOffsets(r?.startOffsets,[0]),endOffsets:cleanOffsets(r?.endOffsets,cleanOffsets(legacy.offsets,[1440,60,0]))}];})) as ReminderRules;
}
