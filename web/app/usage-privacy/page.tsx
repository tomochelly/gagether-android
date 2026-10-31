import UsagePrivacy from '@/components/usage-privacy';
import {isLocale} from '@/lib/visitor-locale';
export async function generateMetadata({searchParams}:{searchParams:Promise<{locale?:string}>}){const q=await searchParams,locale=isLocale(q.locale)?q.locale:'ko';return {title:({ko:'방문 통계 안내',en:'Usage statistics',ja:'利用統計について',zh:'访问统计说明'})[locale]+' | GAGETHER'};}
export default async function Page({searchParams}:{searchParams:Promise<{locale?:string}>}){const {locale}=await searchParams;return <UsagePrivacy locale={isLocale(locale)?locale:'ko'}/>;}
