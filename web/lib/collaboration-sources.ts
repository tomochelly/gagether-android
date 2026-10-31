// Reviewed publisher/partner notices, scoped to the exact game and article.
// A partner domain is not a blanket grant of official provenance.
export const collaborationSources:Record<string,string[]>={
 stellasora:['https://prtimes.jp/main/html/rd/p/000009107.000016756.html','https://prtimes.jp/main/html/rd/p/000002028.000025284.html'],
 wuwa:['https://game.naver.com/lounge/WutheringWaves/board/detail/8307145'],
 arknights:['https://order.banolimpizza.com/event/detail/163814c2-cc1e-4051-b35c-91ba2906ea36'],
 hsr:['https://www.mega-mgccoffee.com/bbs/detail/?YmJzX2lkeD02OTcmYmJzX2NhdGVnb3J5PTMmYmJzX2RldGFpbF9jYXRlZ29yeT0mYmJzX3BhZ2U9MQ=%3D'],
 endfield:['https://prtimes.jp/main/html/rd/p/000000044.000126152.html'],
 umamusume:['https://love-tomakomai-anime.com/umamusume/archives/event/371','https://love-tomakomai-anime.com/umamusume/archives/event/398'],
};
export function isReviewedCollaborationSource(url:string,gameId:string){return (collaborationSources[gameId]||[]).includes(url);}
