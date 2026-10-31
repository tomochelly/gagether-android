import {NTE_GATES,NTE_SIDE_ROUTES} from './nte-board-layout';
import type {Locale} from './types';
export const NTE_BOARD_KEY='gagether.nte-board.v1';
export type BoardKind='apprentice'|'hero'|'arc'|'warp'|'lost'|'again'|'surprise'|'guardian'|'gate'|'s'|'a'|'outfit';
export type BoardItem={id:string;name:Record<Locale,string>;grade?:'S'|'A'|'B';kind:'character'|'arc'|'bonus';image?:string;sourceUrl:string};
export type BoardCatalog={items:BoardItem[];banners:{id:string;name:Record<Locale,string>;featured:string;endAt:string;sourceUrl:string}[];standard:string[];aCharacters:string[];aArcs:string[];bArcs:string[]};
export type BoardPool={position:number;branch:0|1|2;returnAt:number;pity:number;rolls:number;free:number;guardian:null|{distance:number;left:number};cosmetics:number[]};
export type BoardReward={id:string;quantity:number;extra?:boolean};
export type BoardTurn={number:number;banner:string;dice:number;from:string;to:string;path:string[];kind:BoardKind;rewards:BoardReward[];modified:boolean;hard:boolean;guardian?:'started'|'caught'|'escaped';warp:number;lost:number;free:number;time:number};
export type BoardState={version:1;revision:number;total:number;paid:number;warp:number;lost:number;owned:Record<string,number>;pools:Record<string,BoardPool>;history:BoardTurn[]};
export const emptyBoardState=():BoardState=>({version:1,revision:0,total:0,paid:0,warp:0,lost:0,owned:{},pools:{},history:[]});
export const emptyBoardPool=():BoardPool=>({position:0,branch:0,returnAt:0,pity:0,rolls:0,free:0,guardian:null,cosmetics:[]});
const kinds:BoardKind[]=['apprentice','hero','arc','warp','lost','again','surprise','guardian','gate','s','a','outfit'];
const integer=(x:unknown,min=0,max=1e9):x is number=>Number.isSafeInteger(x)&&Number(x)>=min&&Number(x)<=max;
export function validBoardState(value:unknown):value is BoardState{
 if(!value||typeof value!=='object')return false;const s=value as BoardState;
 if(s.version!==1||![s.revision,s.total,s.paid,s.warp,s.lost].every(x=>integer(x))||!s.owned||!s.pools||!Array.isArray(s.history)||s.history.length>200)return false;
 if(Object.keys(s.owned).length>300||Object.keys(s.pools).length>40||Object.entries(s.owned).some(([k,v])=>k.length>180||!integer(v,1)))return false;
 for(const [id,p] of Object.entries(s.pools)){if(id.length>180||!p||!integer(p.position,0,p.branch?9:53)||![0,1,2].includes(p.branch)||!integer(p.returnAt,0,53)||!integer(p.pity,0,89)||!integer(p.rolls)||!integer(p.free)||!Array.isArray(p.cosmetics)||p.cosmetics.some(x=>![50,120,200].includes(x))||p.guardian&&(!integer(p.guardian.distance,1,100)||!integer(p.guardian.left,1,3)))return false;}
 return s.history.every(t=>t&&integer(t.number,1)&&typeof t.banner==='string'&&integer(t.dice,0,6)&&typeof t.from==='string'&&typeof t.to==='string'&&Array.isArray(t.path)&&t.path.length<=8&&t.path.every(p=>typeof p==='string'&&/^[012]:\d{1,2}$/.test(p))&&kinds.includes(t.kind)&&Array.isArray(t.rewards)&&t.rewards.length<8&&t.rewards.every(r=>typeof r.id==='string'&&r.id.length<180&&integer(r.quantity,1,100))&&[t.warp,t.lost,t.free].every(x=>integer(x))&&integer(t.time,0,8640000000000000)&&typeof t.modified==='boolean'&&typeof t.hard==='boolean');
}
export function parseBoardState(raw:string|null){if(raw===null)return {valid:true,state:emptyBoardState()};try{const s=JSON.parse(raw);if(validBoardState(s))return {valid:true,state:s};}catch{}return {valid:false,state:emptyBoardState()};}
export function boardAddress(pool:BoardPool){return pool.branch+':'+pool.position;}
// Reference topology, not the undisclosed current-client board generation algorithm.
// The two side loops are entered only on exact landing, never by crossing a gate.
export function tileKind(branch:number,index:number,modified=false,limited=true):BoardKind{
 if(branch===1)return index===0?(limited?'outfit':'hero'):index===1?'surprise':'hero';
 if(branch===2)return (['s','arc','hero','apprentice','hero','apprentice','hero','apprentice','hero','hero'] as BoardKind[])[index]||'hero';
 if(index===NTE_GATES[1].entry||index===NTE_GATES[2].entry)return 'gate';
 if(modified&&index%5===2)return 's';
 if(index===10||index===40)return 'lost';if(index===37)return 'hero';if(index===41||index===42)return 'apprentice';
 if(index===25)return 'guardian';if(index===4)return 'again';if(index===37)return 'surprise';if(index===10||index===32)return 'arc';if(index===22||index===49)return 'warp';if(index%7===0)return 'lost';if(index%3===0)return 'hero';return 'apprentice';
}
export function boardNext(p:BoardPool,enterGate=true):BoardPool{if(p.branch){const route=NTE_SIDE_ROUTES[p.branch],index=route.indexOf(p.position);if(index<0||index===route.length-1)return {...p,branch:0 as const,position:p.returnAt};return {...p,position:route[index+1]};}if(enterGate){const branch=p.position===NTE_GATES[1].entry?1:p.position===NTE_GATES[2].entry?2:0;if(branch)return {...p,branch,position:NTE_SIDE_ROUTES[branch][0],returnAt:NTE_GATES[branch].exit};}return {...p,position:(p.position+53)%54};}
function roll(rng:()=>number){const n=rng();if(!Number.isFinite(n)||n<0||n>=1)throw Error('Invalid random draw');return n;}
function pick(ids:string[],rng:()=>number){if(!ids.length)throw Error('Incomplete reward pool');return ids[Math.floor(roll(rng)*ids.length)];}
export function playBoardTurn(state:BoardState,catalog:BoardCatalog,bannerId:string,time:number,rng:()=>number=Math.random){
 if(!validBoardState(state)||!integer(time,0,8640000000000000))throw Error('Invalid saved state');
 const banner=catalog.banners.find(b=>b.id===bannerId);if(bannerId!=='standard'&&(!banner||Date.parse(banner.endAt)<=time))throw Error('Banner unavailable');
 const byId=new Map(catalog.items.map(i=>[i.id,i]));const s=structuredClone(state),poolKey=bannerId==='standard'?'standard':'limited',prior=s.pools[poolKey]||emptyBoardPool();let p={...prior,guardian:prior.guardian?{...prior.guardian}:null,cosmetics:[...prior.cosmetics]};
 // Character pity is shared; board position, free dice and outfit progress belong to each board.
 if(poolKey==='limited'){const own=s.pools['board:'+bannerId]||emptyBoardPool();p={...own,pity:prior.pity,guardian:own.guardian?{...own.guardian}:null,cosmetics:[...own.cosmetics]};}
 const before=boardAddress(p),modified=p.pity>=70,hard=p.pity===89,path:string[]=[];const dice=hard?0:Math.floor(roll(rng)*6)+1;const usedFree=p.free>0;if(usedFree)p.free--;else s.paid++;
 // A resting gate is entered on the next roll's first movement step.
 // Passing the gate during this roll continues along the main board.
 for(let i=0;i<dice;i++){p=boardNext(p,i===0);path.push(boardAddress(p));}
 let kind=hard?'s' as BoardKind:tileKind(p.branch,p.position,modified,!!banner);const rewards:BoardReward[]=[];let warp=0,lost=0,free=0,guardian:BoardTurn['guardian'];
 const sId=()=>banner?banner.featured:pick(catalog.standard,rng);
 const award=(id:string,extra=false,quantity=1)=>{const item=byId.get(id);if(!item)throw Error('Unknown reward');const copies=(s.owned[id]||0)+quantity;s.owned[id]=copies;rewards.push({id,quantity,...extra?{extra:true}:{}});if(item.kind==='character'&&copies>1)warp+=item.grade==='S'?(copies<=7?40:80):(copies<=7?6:12);if(item.kind==='arc')item.grade==='A'?warp+=4:lost+=20;};
 if(p.guardian&&!hard){p.guardian.distance+=2-dice;p.guardian.left--;if(p.guardian.distance<=0){warp+=30;p.guardian=null;guardian='caught';}else if(!p.guardian.left){p.guardian=null;guardian='escaped';}}
 if(kind==='outfit')award('bonus:skin');
 else if(kind==='s')award(sId());
 else if(kind==='a')award(pick(catalog.aCharacters,rng));
 else if(kind==='apprentice'||kind==='hero'){if(roll(rng)<(kind==='hero'?.03:.002))award(sId());else award(pick(catalog.bArcs,rng));if(kind==='hero')warp+=2;}
 else if(kind==='arc')award(pick(catalog.aArcs,rng));
 else if(kind==='warp')warp+=2;
 else if(kind==='lost')lost+=40;
 else if(kind==='again'||kind==='surprise'){free=kind==='again'?1:5;p.free+=free;if(p.branch===1&&p.position===1)award('bonus:dice:'+(banner?'limited':'standard'),false,5);}
 else if(kind==='guardian'){lost+=20;if(!p.guardian&&!guardian){p.guardian={distance:9,left:3};guardian='started';}}
 const gotS=rewards.some(r=>byId.get(r.id)?.grade==='S');p.pity=gotS?0:p.pity+1;p.rolls++;
 // The 10-roll gift is additional; it never replaces the tile reward.
 if(p.rolls%10===0)award(pick(roll(rng)<.2?catalog.aCharacters:catalog.aArcs,rng),true);
 if(banner)for(const n of [50,120,200])if(p.rolls>=n&&!p.cosmetics.includes(n))p.cosmetics.push(n);
 s.total++;s.warp+=warp;s.lost+=lost;s.revision++;s.pools[poolKey]={...p};if(banner)s.pools['board:'+bannerId]={...p};
 const turn:BoardTurn={number:s.total,banner:bannerId,dice,from:before,to:boardAddress(p),path,kind,rewards,modified,hard,...guardian?{guardian}:{},warp,lost,free,time};s.history=[turn,...s.history].slice(0,200);
 if(!validBoardState(s))throw Error('Invalid resulting state');return {state:s,turn};
}
