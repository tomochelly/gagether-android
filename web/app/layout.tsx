import './favorite-updates.css';
import './usage-analytics.css';
import './content-sections.css';
import type { Metadata,Viewport } from "next";
import "./globals.css";
import "./artwork-calendar.css";
import "./refinement.css";
import "./mobile.css";
import "./version-refinement.css";
import "./studio.css";
import "./pickup-history.css";
import "./owner-workspace.css";
import "./personal-mobile.css";
import "./upcoming-pickups.css";
import "./weapon-links.css";
import "./google-calendar.css";
import "./light-theme.css";
import "./display-settings.css";
import "./catalog-controls.css";
import "./events-social.css";
import "./immersive-banners.css";
import "./catalog-loading.css";
import "./feedback.css";
import "./content-refresh.css";
import "./mobile-density.css";
import {requestLocale} from '@/lib/request-locale';
import {brandOrigin} from '@/lib/brand';
import {displayBootstrap} from '@/lib/display-preferences';
import {websiteStructuredData} from '@/lib/seo';
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#f5f7f2'};
export const metadata: Metadata = {
 metadataBase: new URL(brandOrigin),
 title: "GAGETHER | 가게더 · 가챠 게임 캘린더",
 description: "가챠 게임 캘린더 가게더(GAGETHER). 15개 게임의 픽업, 무기, 이벤트, 판매 패키지와 업데이트 일정. 한국어 · English · 日本語 · 中文.",
 icons: { icon: "/favicon.svg" },
};
export default async function RootLayout({children}:Readonly<{children:React.ReactNode}>) {
 const {locale}=await requestLocale();
 return <html lang={locale} data-theme="light" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:displayBootstrap}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(websiteStructuredData).replace(/</g,'\\u003c')}}/></head><body>{children}</body></html>;
}
