import type {Entry,EntityArtwork} from './types';
import type {SiteSettings} from './editorial';

// Preview is local to the editor's browser. Persist only through the owner API.
export type EditorPreview={entry?:Entry|null;settings?:SiteSettings};
export function previewEntries(entries:Entry[],preview:EditorPreview|null){
 const draft=preview?.entry;
 if(!draft)return entries;
 const original=entries.find(e=>e.id===draft.id);
 const changed=Object.keys(replacementArtwork('', '')).filter(key=>JSON.stringify(draft[key as keyof Entry])!==JSON.stringify(original?.[key as keyof Entry]));
 const rendered=changed.length?{...draft,editor:{revision:draft.editor?.revision||0,updatedAt:draft.editor?.updatedAt||draft.verifiedAt,fields:[...new Set([...draft.editor?.fields||[],...changed])]}}:draft;
 return original?entries.map(e=>e.id===draft.id?rendered:e):[rendered,...entries];
}
export function replacementArtwork(image:string,origin:string,imageLocale?:EntityArtwork['imageLocale']):Partial<EntityArtwork>{
 return {image,imageSource:image?(image.startsWith('/')?origin+image:image):undefined,imageVerified:!!image,
  imageFit:'contain',imagePosition:'50% 50%',previewFocus:{x:50,y:38,zoom:1},
  imageFraming:undefined,previewBounds:undefined,previewArtwork:undefined,localizedArtwork:undefined,imageLocale,imageCaption:undefined,textFreePreview:undefined};
}
export function myGameEntries<T extends {gameId:string}>(entries:T[],favorites:string[],enabled:boolean){
 return enabled?entries.filter(e=>favorites.includes(e.gameId)):entries;
}
