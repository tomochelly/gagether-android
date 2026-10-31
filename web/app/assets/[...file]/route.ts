import {env} from 'cloudflare:workers';
import {catalogAssetResponse} from '@/lib/catalog-asset-response';
export function GET(request:Request,_context?:unknown){return catalogAssetResponse(request,env.BUCKET);}
export const HEAD=GET;
