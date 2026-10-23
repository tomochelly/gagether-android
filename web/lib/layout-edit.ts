import type {SiteSettings} from './editorial';
import type {LayoutView,SectionId} from './site-layout';
import {editError,EditFailure} from './inline-edit';
export type SavedSettings={settings:SiteSettings;settingsRevision:number};
export async function fetchSiteSettings():Promise<SavedSettings>{const r=await fetch('/api/editor?view=settings',{cache:'no-store'}),v=await r.json() as SavedSettings&{error?:string};if(!r.ok||!v.settings||!Number.isInteger(v.settingsRevision))throw new EditFailure(editError(v),r.status);return v;}
export async function saveLayout(base:SavedSettings,view:LayoutView,order:SectionId[]):Promise<SavedSettings>{
 const settings={...base.settings,layout:{...base.settings.layout,[view]:order}};
 const r=await fetch('/api/editor?view=settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({target:'site',revision:base.settingsRevision,changes:settings})}),value=await r.json() as {error?:string};if(!r.ok)throw new EditFailure(editError(value),r.status);
 const readback=await fetchSiteSettings();if(JSON.stringify(readback.settings.layout?.[view])!==JSON.stringify(order))throw new EditFailure('Saved layout could not be verified. Compare latest settings before retrying.',409);return readback;
}
