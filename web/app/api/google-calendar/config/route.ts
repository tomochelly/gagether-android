import {env} from 'cloudflare:workers';
export const dynamic='force-dynamic';
export async function GET(){
 // OAuth browser client IDs are public identifiers, not client secrets.
 const value=(env as unknown as Record<string,unknown>).GOOGLE_CALENDAR_CLIENT_ID;
 const clientId=typeof value==='string'&&/^[a-zA-Z0-9._-]+\.apps\.googleusercontent\.com$/.test(value)?value:null;
 return Response.json({clientId},{headers:{'Cache-Control':'no-store'}});
}
