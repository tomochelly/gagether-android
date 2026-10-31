import type {Game,Locale,Region} from '@/lib/types';
import {gameLaunchLabel} from '@/lib/game-launch';
import {PageReference} from './page-references';
export default function UpcomingGameOverview({game,locale,region}:{game:Game;locale:Locale;region:Region}){
 const p=game.launch;if(!p)return null;const t={ko:{label:'출시 예정',official:'공식 홈페이지',video:'공개 영상',source:'공식 발표'},en:{label:'UPCOMING',official:'Official website',video:'Public trailer',source:'Official announcements'},ja:{label:'配信予定',official:'公式サイト',video:'公開映像',source:'公式発表'},zh:{label:'即将上线',official:'官方网站',video:'公开宣传片',source:'官方公告'}}[locale];
 return <section className="upcoming-game-overview"><div className="upcoming-game-visual"><img src={game.art} alt={game.name[locale]}/></div><div className="upcoming-game-copy"><small>{t.label} / {game.short}</small><h2>{game.name[locale]}</h2><strong className="upcoming-launch-date">{gameLaunchLabel(game,locale,region)}</strong><p>{p.summary[locale]}</p><nav><a href={p.officialSites[locale]} target="_blank" rel="noreferrer">{t.official} ↗</a>{p.trailers?.[locale]&&<a href={p.trailers[locale]} target="_blank" rel="noreferrer">{t.video} ↗</a>}</nav></div><PageReference locale={locale} label={t.source}><details><summary>{t.source}</summary>{p.sourceUrls.map(url=><a key={url} href={url} target="_blank" rel="noreferrer">{url}</a>)}</details></PageReference></section>;
}

