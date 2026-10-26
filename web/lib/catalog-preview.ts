import rows from '../content/catalog-preview-images.json' with {type:'json'};
const images=new Map(rows.map(row=>[row.original,row]));
export function catalogPreview(original?:string){
 if(!original)return;
 try{const u=new URL(original,'https://gagether.wiki');if(!['gagether.wiki','gagether.tomochelly.chatgpt.site'].includes(u.hostname)||u.search||u.hash)return;return images.get(u.pathname);}catch{return;}
}
