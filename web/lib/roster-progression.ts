export type RosterNumberFormat='floor'|'number'|'percent';
export type LinearPromotion={stage:number;minLevel:number;maxLevel:number;base:Record<string,string>;step:Record<string,string>};
const scale=BigInt(10)**BigInt(12);
function scaled(value:string){
 if(typeof value!=='string'||!/^\d+(?:\.\d{1,12})?$/.test(value)||Number(value)>1e12)throw Error('Invalid source growth coefficient');
 const [whole,fraction='']=value.split('.');return BigInt(whole)*scale+BigInt(fraction.padEnd(12,'0'));
}
/** Published promotion base + step × (level−1), using exact fixed decimals.
 * These are source coefficients, not interpolation between measured panels. */
export function promotionValue(stage:LinearPromotion,id:string,level:number,format:RosterNumberFormat){
 if(!Number.isInteger(level)||level<stage.minLevel||level>stage.maxLevel)throw Error('Level outside source promotion range');
 let value=scaled(stage.base[id])+scaled(stage.step[id])*BigInt(level-1);
 if(format==='floor')return String(value/scale);
 if(format==='percent')value*=BigInt(100);
 const whole=String(value/scale),fraction=String(value%scale).padStart(12,'0').replace(/0+$/,'');
 return whole+(fraction?'.'+fraction:'')+(format==='percent'?'%':'');
}
export function progressionRows<T extends {rows:{level:number;stage?:number;values:Record<string,string>}[];stats:{id:string;format?:RosterNumberFormat}[];linear?:{formula:'starrail-promotion';stages:LinearPromotion[]}}>(progression:T,selectedStage?:number){
 if(!progression.linear)return progression.rows.filter(r=>selectedStage===undefined||r.stage===selectedStage).sort((a,b)=>a.level-b.level);
 return progression.linear.stages.filter(s=>selectedStage===undefined||s.stage===selectedStage).flatMap(s=>Array.from({length:s.maxLevel-s.minLevel+1},(_,i)=>{
  const level=s.minLevel+i;return {stage:s.stage,level,values:Object.fromEntries(progression.stats.map(stat=>[stat.id,promotionValue(s,stat.id,level,stat.format||'number')]))};
 }));
}
