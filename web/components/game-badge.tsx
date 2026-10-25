'use client';
import {textAppearanceStyle} from '@/lib/text-appearance';
import type {Locale} from '@/lib/types';
import {useCatalog} from './catalog-context';
export default function GameBadge({gameId,locale,force=false}:{gameId:string;locale:Locale;force?:boolean}){const {byId,showGameIcons}=useCatalog(),g=byId[gameId];if(!g||!force&&!showGameIcons)return null;return <span className="content-game-badge"><img src={g.icon||g.logo} width={22} height={22} alt="" loading="lazy" decoding="async"/><span style={textAppearanceStyle(g.textStyle?.[locale],'title')}>{g.name[locale]}</span></span>;}
