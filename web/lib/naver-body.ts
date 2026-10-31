/** Render the public lounge's SmartEditor document as inert source HTML. */
export function naverBody(contents:string){
 if(!contents.trim().startsWith('{'))return contents;
 let raw:any;try{raw=JSON.parse(contents);}catch{throw Error('Official lounge document JSON changed');}
 if(!Array.isArray(raw?.document?.components))throw Error('Official lounge document format changed');
 const escape=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 const https=(s:any)=>{try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
 function render(node:any):string{
  if(!node||typeof node!=='object')return '';
  if(Array.isArray(node))return node.map(render).join('');
  if(node['@ctype']==='textNode'){
   const text=escape(String(node.value||'')),url=https(node.link?.url);return url?`<a href="${escape(url)}">${text}</a>`:text;
  }
  if(node['@ctype']==='image'){
   const original=https(String(node.domain||'')+String(node.path||'')),src=https(node.src);
   // Only use an explicitly declared same-host original, never fabricate a larger URL.
   const image=original&&src&&new URL(original).hostname===new URL(src).hostname?original:src;
   return image?`<img src="${escape(image)}">`:'';
  }
  const children=render(node.nodes||node.value||node.components||node.rows||node.cells);
  return ['paragraph','text','table','tableRow','tableCell'].includes(node['@ctype'])?'<p>'+children+'</p>':children;
 }
 return '<article>'+render(raw.document.components)+'</article>';
}
