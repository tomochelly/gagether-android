export const GAME_ORDER_KEY='gagether.game-order.v1';
export function normalizeGameOrder(value:unknown,ids:readonly string[]):string[]{
 const known=new Set(ids),seen=new Set<string>();
 const requested=Array.isArray(value)?value.filter((id):id is string=>typeof id==='string'&&known.has(id)):[];
 return [...requested,...ids].filter(id=>!seen.has(id)&&!!seen.add(id));
}
export function moveGame(order:readonly string[],id:string,to:number):string[]{
 const from=order.indexOf(id);if(from<0||!Number.isInteger(to)||to<0||to>=order.length)return [...order];
 const next=[...order];next.splice(from,1);next.splice(to,0,id);return next;
}
export function readGameOrder(raw:string|null,ids:readonly string[]){
 if(!raw)return {order:[...ids],writable:true};
 try{const value=JSON.parse(raw);if(value.version!==1||!Array.isArray(value.ids))throw Error();return {order:normalizeGameOrder(value.ids,ids),writable:true};}
 catch{return {order:[...ids],writable:false};}
}
