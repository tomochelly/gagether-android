import {Smartphone} from 'lucide-react';
import type {Locale} from '@/lib/types';
import {downloadPath,appDownloadCopy} from '@/lib/app-release';
export default function AppDownloadLink({locale}:{locale:Locale}){const label=({ko:'Android 앱',en:'Android app',ja:'Androidアプリ',zh:'Android应用'})[locale];return <a className="app-download-top" href={downloadPath(locale)} aria-label={appDownloadCopy.cta[locale]} title={appDownloadCopy.cta[locale]}><Smartphone size={17} aria-hidden="true"/><span>{label}</span></a>;}
