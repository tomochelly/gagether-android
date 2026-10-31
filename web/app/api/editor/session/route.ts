import {editorIdentity} from '@/lib/editor-access';
export const dynamic='force-dynamic';
export async function GET(){const user=await editorIdentity();return Response.json({canEdit:!!user},{headers:{'Cache-Control':'no-store'}});}
