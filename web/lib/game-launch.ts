import type {Game,Locale,Region} from './types';
export function gameLaunchLabel(game:Game,locale:Locale,region?:Region){
 if(!game.launch)return '';
 const r=region&&game.regions.includes(region)?region:game.serviceMode==='shared-global'?'global':({ko:'kr',en:'global',ja:'jp',zh:'cn'} as const)[locale];
 const date=game.launch.dates[r];if(!date)return game.launch.labels[locale];
 const [y,m,d]=date.split('-').map(Number),label=new Intl.DateTimeFormat(locale,{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d)));
 const suffix={ko:'출시 예정',en:'planned launch',ja:'配信予定',zh:'预计上线'}[locale],prefix=game.serviceMode==='regional'?({kr:{ko:'한국',en:'Korea',ja:'韓国',zh:'韩国'},jp:{ko:'일본',en:'Japan',ja:'日本',zh:'日本'},cn:{ko:'중국',en:'China',ja:'中国',zh:'中国'},global:{ko:'영어 서비스',en:'English service',ja:'英語版',zh:'英语版'}}[r][locale]+' · '):'';
 return prefix+label+' '+suffix;
}
/** Short library caption; full regional launch information stays on the game page. */
export function gameLaunchShortLabel(game:Game,locale:Locale,region?:Region){
 if(locale!=='ko')return gameLaunchLabel(game,locale,region);
 if(!game.launch)return '';
 const r=region&&game.regions.includes(region)?region:game.serviceMode==='shared-global'?'global':'kr',date=game.launch.dates[r];
 if(!date)return '미정';
 const [year,month,day]=date.split('-').map(Number);
 return `${year}년 ${month}월 ${day}일`;
}
