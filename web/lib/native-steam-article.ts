const nativeApps=new Set(['1973530','3950020','4282500']);
const nativeLanguages=new Set(['english','koreana','japanese','schinese','tchinese']);
/** Only the bounded BBCode adapter's complete article fragment at a registered
 * native event URL can establish a short article; a page shell cannot. */
export function nativeSteamShortArticle(html:string,base:string,text:string){
 try{
  const u=new URL(base),match=u.pathname.match(/^\/news\/app\/(\d+)\/view\/\d+$/);
  if(u.protocol!=='https:'||u.hostname!=='store.steampowered.com'||u.username||u.password||u.port||u.hash||!match||!nativeApps.has(match[1])||u.searchParams.getAll('l').length!==1||!nativeLanguages.has(u.searchParams.get('l')||'')||[...u.searchParams.keys()].some(k=>k!=='l'))return false;
 }catch{return false;}
 const article=html.match(/^<article>([\s\S]*)<\/article>$/);
 if(!article||/<(?!\/?(?:p|br|a|img)(?=[\s/>]))/i.test(article[1]))return false;
 const plain=text.replace(/\s+/g,' ').trim();
 if(!/\p{L}/u.test(plain)||/^(?:Steam\s*::|Sign in\s+Store\s+Home|Community Hub\b|["']\s*\)\s*;?\s*\})/i.test(plain))return false;
 if(/^(?:sign in|log in|login|loading|access denied|forbidden|로그인|로딩|ログイン|サインイン|読み込み中|登录|登入|加载中)[.!。\s]*$/i.test(plain))return false;
 if(/^(?:window\.|document\.|console\.|(?:var|let|const)\s+\w+\s*=|function\s|(?:eval|alert|setTimeout|setInterval)\s*\()/i.test(plain))return false;
 return true;
}
