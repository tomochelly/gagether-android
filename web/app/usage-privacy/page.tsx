import UsagePrivacy from '@/components/usage-privacy';
import {isLocale} from '@/lib/visitor-locale';
export const metadata={title:'방문 통계 안내 · Usage statistics · GAGETHER'};
export default async function Page({searchParams}:{searchParams:Promise<{locale?:string}>}){const {locale}=await searchParams;return <UsagePrivacy locale={isLocale(locale)?locale:'ko'}/>;}
