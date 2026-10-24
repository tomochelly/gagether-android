export type DrawerTouch={x:number;y:number;at:number;open:boolean};
/** An edge gesture must be deliberate and horizontal; normal vertical scrolls
 * and gestures over editable/interactive surfaces never open the drawer. */
export function drawerGesture(start:DrawerTouch,end:{x:number;y:number;at:number},width:number,blocked=false){
 const dx=end.x-start.x,dy=Math.abs(end.y-start.y);
 if(blocked||width>1100||end.at-start.at>900||Math.abs(dx)<64||Math.abs(dx)<dy*1.7)return null;
 return !start.open&&start.x<=24&&dx>0?'open':start.open&&dx<0?'close':null;
}
