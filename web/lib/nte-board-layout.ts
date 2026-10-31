// Main addresses stay stable for existing practice/history. Travel is toward
// decreasing main addresses. Side positions instead follow each entry route.
export const NTE_MAIN_POINTS=[[7,3],[7,2],[7,1],[7,0],[6,0],[5,0],[4,0],[3,0],[2,0],[1,0],[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[1,7],[2,7],[3,7],[4,7],[4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[15,8],[15,7],[15,6],[15,5],[15,4],[15,3],[14,3],[13,3],[13,2],[13,1],[13,0],[12,0],[11,0],[10,0],[10,1],[10,2],[10,3],[9,3],[8,3]];
// Historical addresses remain stable. The open side routes omit the two
// crossed-out cells in the owner's annotated reference (left8, right9).
export const NTE_SIDE_POINTS={
 1:[[1,3],[0,3],[0,2],[0,1],[0,0],[1,0],[2,0],[2,1],[2,2],[2,3]],
 2:[[0,0],[1,0],[2,0],[3,0],[3,1],[3,2],[2,2],[1,2],[0,2],[0,1]]
};
export const NTE_GATES={1:{entry:12,exit:10},2:{entry:39,exit:37}};
export const NTE_SIDE_ROUTES={1:[9,0,1,2,3,4,5,6,7],2:[0,1,2,3,4,5,6,7,8]};
export function boardPoint(address:string){const [b,n]=address.split(':').map(Number);if(b===1||b===2){const [x,y]=NTE_SIDE_POINTS[b][n]||NTE_SIDE_POINTS[b][0];return {x:(b===1?110:1300)+x*48-y*4,y:(b===1?170:240)+y*39};}const [x,y]=NTE_MAIN_POINTS[n]||NTE_MAIN_POINTS[0];return {x:410+x*48-y*4,y:150+y*39};}
