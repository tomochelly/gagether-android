import {ArrowUpRight,Sparkles} from 'lucide-react';
import type {Locale} from '@/lib/types';
import {orbitWords} from '@/lib/orbit';
export default function OrbitBanner({locale}:{locale:Locale}){const c=orbitWords[locale];return <a className="orbit-beta-banner" href={`/orbit/${locale}`}><span className="orbit-beta-tag">ORBIT <b>BETA</b></span><span className="orbit-beta-copy"><strong>{c.banner}</strong><span>{c.bannerSub}</span></span><span className="orbit-beta-action"><Sparkles size={18}/>{c.try}<ArrowUpRight size={20}/></span></a>;}
