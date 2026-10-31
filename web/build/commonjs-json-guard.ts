import type {Plugin,PluginOption} from 'vite';

/** JSON is handled by Vite, never by the legacy CommonJS source scanner.
 * vite-plugin-commonjs 0.10.4 strips comments before applying its user filter.
 * Its // regexp can take quadratic time on a large, single-line JSON snapshot
 * containing many URLs. Keep executable-module handling intact and reject data
 * before invoking that scanner. Do not edit or re-encode the source JSON.
 */
export function guardCommonjsJson(option:PluginOption):PluginOption {
  if(Array.isArray(option))return option.map(guardCommonjsJson);
  if(!option||typeof option!=='object')return option;
  if('then' in option)return Promise.resolve(option).then(guardCommonjsJson);
  if(option.name!=='vite-plugin-commonjs')return option;
  const plugin=option as Plugin,hook=plugin.transform;
  if(!hook)return option;
  const handler=typeof hook==='function'?hook:hook.handler;
  const guarded:typeof handler=function(code,id,options){
    if(id==='\0gagether:roster-bootstrap-packed.js'||/\.json(?:\?|$)/i.test(id))return null;
    return handler.call(this,code,id,options);
  };
  return {...plugin,transform:typeof hook==='function'?guarded:{...hook,handler:guarded}};
}
