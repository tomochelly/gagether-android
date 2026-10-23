import {isInitialShellRequest} from '../lib/initial-shell';
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import {publicScreen,screenContentRevision,screenObjectCache} from '../lib/public-screen-cache';
import {catalogLocaleHeaders} from '../lib/catalog-paths';
import {catalogAssetResponse} from '../lib/catalog-asset-response';

declare const __PATCHWORK_BUILD__:string;

export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    // Public files known at build time are intercepted by Vinext before app routes.
    // Serve pinned R2 originals first, without changing their public paths.
    if(new URL(request.url).pathname.startsWith('/assets/')&&['GET','HEAD'].includes(request.method))return catalogAssetResponse(request,env.BUCKET,()=>handler.fetch(new Request(request,{method:'GET'}),env,ctx));
    // Use the country supplied by the edge. Never retain the IP address itself.
    const country=(request as Request & {cf?:{country?:string}}).cf?.country||request.headers.get('cf-ipcountry')||'';
    const localeHeaders=catalogLocaleHeaders(request);
    localeHeaders.delete('x-patchwork-country');
    if(/^[A-Z]{2}$/.test(country))localeHeaders.set('x-patchwork-country',country);
    request=new Request(request,{headers:localeHeaders});
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const render=(documentRequest:Request)=>runWithConnectorBinding(binding,()=>handler.fetch(documentRequest,env,ctx));
    // The public frame contains no stored catalog or private data. Do not put
    // database revision checks or an R2 read in front of its first byte.
    if(isInitialShellRequest(request)){
      const started=Date.now();
      return render(request).then((response:Response)=>{
        const headers=new Headers(response.headers);
        headers.set('Cache-Control','private, no-store');
        headers.set('X-Gagether-Screen-Cache','SHELL');
        headers.append('Server-Timing',`shell;dur=${Date.now()-started}`);
        return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
      });
    }
    if(import.meta.env.DEV||!env.DB||!env.BUCKET)return render(request);
    const cache=screenObjectCache(env.BUCKET);
    return publicScreen(request,{build:__PATCHWORK_BUILD__,cache,ctx,revision:()=>screenContentRevision(env.DB!),render});
  },
};
