export const DISPLAY_PREFERENCES_KEY='gagether.display.v1';
export const textScales=[100,115,130,150,175,200] as const;
export type DisplayPreferences={theme:'dark'|'light';textScale:typeof textScales[number]};
export const defaultDisplay:DisplayPreferences={theme:'light',textScale:100};
export function parseDisplayPreferences(raw:string|null):DisplayPreferences{
 try{const p=JSON.parse(raw||'{}');return {theme:p?.theme==='dark'?'dark':'light',textScale:textScales.includes(p?.textScale)?p.textScale:100};}catch{return {...defaultDisplay};}
}
export function applyDisplayPreferences(p:DisplayPreferences,root:HTMLElement=document.documentElement){
 root.dataset.theme=p.theme;root.dataset.textScale=String(p.textScale);root.style.setProperty('--text-scale',String(p.textScale/100));
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',p.theme==='light'?'#f5f7f2':'#101711');
}
// The same bounded values run before first paint; no visitor data is interpolated.
export const displayBootstrap=`try{var p=JSON.parse(localStorage.getItem('${DISPLAY_PREFERENCES_KEY}')||'{}'),r=document.documentElement,s=${JSON.stringify(textScales)}.includes(p?.textScale)?p.textScale:100;r.dataset.theme=p?.theme==='dark'?'dark':'light';r.dataset.textScale=String(s);r.style.setProperty('--text-scale',String(s/100));}catch{document.documentElement.dataset.theme='light'}`;
export const displayText={
 ko:{settings:'화면 설정',theme:'화면 모드',dark:'다크',light:'화이트',size:'글씨 크기',sample:'픽업과 이벤트 일정을 편하게 읽어보세요.',remember:'이 기기에 저장됩니다.',close:'닫기',reset:'기본 크기'},
 en:{settings:'Display',theme:'Appearance',dark:'Dark',light:'Light',size:'Text size',sample:'Read pickup and event schedules comfortably.',remember:'Saved on this device.',close:'Close',reset:'Default size'},
 ja:{settings:'表示設定',theme:'表示モード',dark:'ダーク',light:'ライト',size:'文字サイズ',sample:'ピックアップやイベントの予定を読みやすく。',remember:'この端末に保存されます。',close:'閉じる',reset:'標準サイズ'},
 zh:{settings:'显示设置',theme:'显示模式',dark:'深色',light:'浅色',size:'文字大小',sample:'更轻松地阅读卡池和活动日程。',remember:'保存在此设备上。',close:'关闭',reset:'默认大小'},
};
