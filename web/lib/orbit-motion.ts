export type Quaternion=[number,number,number,number];
export type Vector=[number,number,number];
export const orbitDirections:Vector[]=[[0,0,1],[1,0,0],[-1,0,0],[0,0,-1],[0,-1,0],[0,1,0]];
export const qAxis=(x:number,y:number,z:number,a:number):Quaternion=>[x*Math.sin(a/2),y*Math.sin(a/2),z*Math.sin(a/2),Math.cos(a/2)];
export const orbitTargets:Quaternion[]=[[0,0,0,1],qAxis(0,1,0,-Math.PI/2),qAxis(0,1,0,Math.PI/2),qAxis(0,1,0,Math.PI),qAxis(1,0,0,-Math.PI/2),qAxis(1,0,0,Math.PI/2)];
export function qMultiply(a:Quaternion,b:Quaternion):Quaternion{return[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];}
export function qRotate([x,y,z]:Vector,[qx,qy,qz,qw]:Quaternion):Vector{const tx=2*(qy*z-qz*y),ty=2*(qz*x-qx*z),tz=2*(qx*y-qy*x);return[x+qw*tx+qy*tz-qz*ty,y+qw*ty+qz*tx-qx*tz,z+qw*tz+qx*ty-qy*tx];}
export function turnOrbit(q:Quaternion,dx:number,dy:number){const out=qMultiply(qMultiply(qAxis(0,1,0,dx),qAxis(1,0,0,-dy)),q),l=Math.hypot(...out);return out.map(v=>v/l) as Quaternion;}
export function nearestOrbit(q:Quaternion,count=6){let best=0;for(let i=1;i<count;i++)if(qRotate(orbitDirections[i],q)[2]>qRotate(orbitDirections[best],q)[2])best=i;return best;}
