export const DISPLAY_PREFERENCES_KEY='gagether.display.v1';
export const ORBIT_DISPLAY_PREFERENCES_KEY='gagether.orbit.display.v1';
export const textScales=[100,115,130,150,175,200] as const;
export type DisplayPreferences={theme:'dark'|'light';textScale:typeof textScales[number]};
export const defaultDisplay:DisplayPreferences={theme:'light',textScale:100};
export const defaultOrbitDisplay:DisplayPreferences={theme:'dark',textScale:100};
export function parseDisplayPreferences(raw:string|null,fallback:DisplayPreferences=defaultDisplay):DisplayPreferences{
 try{const p=JSON.parse(raw||'{}');return {theme:p?.theme==='dark'?'dark':p?.theme==='light'?'light':fallback.theme,textScale:textScales.includes(p?.textScale)?p.textScale:fallback.textScale};}catch{return {...fallback};}
}
export function applyDisplayPreferences(p:DisplayPreferences,root:HTMLElement=document.documentElement){
 root.dataset.theme=p.theme;root.dataset.textScale=String(p.textScale);root.style.setProperty('--text-scale',String(p.textScale/100));
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',p.theme==='light'?'#f5f7f2':'#101711');
}
// The same bounded values run before first paint; no visitor data is interpolated.
export const displayBootstrap=`(()=>{var o=/^\\/orbit(?:\\/|$)/.test(location.pathname);try{var p=JSON.parse(localStorage.getItem(o?'${ORBIT_DISPLAY_PREFERENCES_KEY}':'${DISPLAY_PREFERENCES_KEY}')||'{}'),r=document.documentElement,s=${JSON.stringify(textScales)}.includes(p?.textScale)?p.textScale:100;r.dataset.theme=p?.theme==='dark'?'dark':p?.theme==='light'?'light':o?'dark':'light';r.dataset.textScale=String(s);r.style.setProperty('--text-scale',String(s/100));}catch{document.documentElement.dataset.theme=o?'dark':'light'}})();`;
export const displayText={
 ko:{settings:'설정',theme:'화면 모드',dark:'다크',light:'화이트',darkMode:'다크 모드',size:'글씨 배율',smaller:'배율 줄이기',larger:'배율 늘리기',preview:'미리보기',sample:'픽업과 이벤트 일정을 편하게 읽어보세요.',remember:'변경 사항은 이 기기에 자동으로 저장됩니다.',close:'닫기',reset:'기본 크기로'},
 en:{settings:'Settings',theme:'Appearance',dark:'Dark',light:'Light',darkMode:'Dark mode',size:'Text scale',smaller:'Decrease scale',larger:'Increase scale',preview:'Preview',sample:'Read pickup and event schedules comfortably.',remember:'Changes are saved automatically on this device.',close:'Close',reset:'Default size'},
 ja:{settings:'設定',theme:'表示モード',dark:'ダーク',light:'ライト',darkMode:'ダークモード',size:'文字の拡大率',smaller:'拡大率を下げる',larger:'拡大率を上げる',preview:'プレビュー',sample:'ピックアップやイベントの予定を読みやすく。',remember:'変更はこの端末に自動保存されます。',close:'閉じる',reset:'標準サイズに戻す'},
 zh:{settings:'设置',theme:'显示模式',dark:'深色',light:'浅色',darkMode:'深色模式',size:'文字缩放',smaller:'缩小文字',larger:'放大文字',preview:'预览',sample:'更轻松地阅读卡池和活动日程。',remember:'更改会自动保存在此设备上。',close:'关闭',reset:'恢复默认大小'},
};
