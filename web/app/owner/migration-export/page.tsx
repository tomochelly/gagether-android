import {notFound} from 'next/navigation';
import {editorIdentity} from '@/lib/editor-access';
import MigrationExport from '@/components/migration-export';
export const dynamic='force-dynamic';
export const metadata={title:'이전 백업 · GAGETHER',robots:{index:false,follow:false}};
export default async function MigrationExportPage(){if(!await editorIdentity())notFound();return <MigrationExport/>;}
