import manifest from '../content/nikke-recruit-media.json' with {type:'json'};
import type {NikkeRank} from './nikke-recruit';
export type NikkeRecruitClip={rank:NikkeRank;sha256:string;bytes:number;duration:number;width:number;height:number;rest:number;lift:number;sourceUrl:string;sourceStart:number;sourceEnd:number;audioVerified:boolean;uiLanguage:'en'|'ja'|'ko'|'zh'};
export const nikkeRecruitEnabled=manifest.enabled;
export const nikkeRecruitClips=manifest.clips as NikkeRecruitClip[];
export const nikkeRecruitMediaKey=(hash:string)=>'nikke-recruit-media/'+hash;
export const nikkeRecruitMediaUrl=(hash:string)=>'/api/nikke/convene-media/'+hash;

export type NikkeRecruitSound={id:string;sha256:string;bytes:number;duration:number;contentType:string;sourceUrl:string;sourceStart:number;sourceEnd:number;audioVerified:boolean};
export const nikkeRankSequenceEnabled=manifest.sequenceEnabled;
export const nikkeRecruitSounds=manifest.sounds as NikkeRecruitSound[];
export const nikkeRecruitAssets=[...nikkeRecruitClips,...nikkeRecruitSounds];

export const nikkeResultAnimationEnabled=manifest.resultsAnimationEnabled;
