import type {Game,Locale} from './types';
// Display abbreviations only. Full official names remain in accessible labels and details.
export const calendarNames:Record<string,Record<Locale,string>>={
 limbus:{ko:'림버스',en:'Limbus',ja:'リンバス',zh:'边狱'},dna:{ko:'듀나어',en:'DNA',ja:'デナアビ',zh:'二重螺旋'},holodreams:{ko:'홀로드림',en:'HoloDreams',ja:'ホロドリ',zh:'HoloDreams'},
 wuwa:{ko:'명조',en:'WuWa',ja:'鳴潮',zh:'鸣潮'},bluearchive:{ko:'블아',en:'BA',ja:'ブルアカ',zh:'蔚蓝'},nikke:{ko:'니케',en:'NIKKE',ja:'ニケ',zh:'妮姬'},
 endfield:{ko:'엔드필드',en:'Endfield',ja:'エンド',zh:'终末地'},umamusume:{ko:'우마',en:'Uma',ja:'ウマ娘',zh:'赛马娘'},nte:{ko:'이환',en:'NTE',ja:'異環',zh:'异环'},
 gfl2:{ko:'소전2',en:'GFL2',ja:'ドルフロ2',zh:'少前2'},arknights:{ko:'명일방주',en:'AK',ja:'アクナイ',zh:'明日方舟'},genshin:{ko:'원신',en:'Genshin',ja:'原神',zh:'原神'},hsr:{ko:'스타레일',en:'HSR',ja:'スタレ',zh:'星铁'},zzz:{ko:'젠존제',en:'ZZZ',ja:'ゼンゼロ',zh:'绝区零'},
 trickcal:{ko:'트릭컬',en:'Trickcal',ja:'トリッカル',zh:'嘟嘟臉'},hi3:{ko:'붕괴3rd',en:'HI3',ja:'崩壊3rd',zh:'崩坏3'},reverse1999:{ko:'리버스',en:'R1999',ja:'リバース',zh:'重返1999'},stellasora:{ko:'스텔라',en:'Stella',ja:'ステラ',zh:'星塔'},
};
export const calendarGameName=(game:Game,locale:Locale)=>calendarNames[game.id]?.[locale]||game.short||game.name[locale];
