import type {Locale} from '@/lib/types';
const copy={
 ko:['최신 게임 정보를 가져오고 있어요.','정보를 가져오지 못했어요.','다시 시도'],
 en:['Fetching the latest game information.','Could not load game information.','Try again'],
 ja:['最新のゲーム情報を取得しています。','ゲーム情報を取得できませんでした。','再試行'],
 zh:['正在获取最新游戏信息。','无法加载游戏信息。','重试'],
};
export default function CatalogPending({locale,failed,onRetry}:{locale:Locale;failed:boolean;onRetry:()=>void}){
 const t=copy[locale];
 return <section className="catalog-pending" aria-busy={!failed}>
  <div className="catalog-pending-status" role="status"><span/>{t[failed?1:0]}{failed&&<button onClick={onRetry}>{t[2]}</button>}</div>
  <div className="catalog-pending-calendar" aria-hidden="true"><div/><div className="catalog-pending-days">{Array.from({length:21},(_,i)=><i key={i}/>)}</div></div>
  <div className="catalog-pending-banner" aria-hidden="true"><div/><div/><div/></div>
 </section>;
}
