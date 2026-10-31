const root='https://raw.githubusercontent.com/DommyMM/wuwabuild/main/public';
/** Read only the provider's declared shipped-file keys. Never execute source code or guess an ID path. */
export function parseWuwaSplashResolver(text:string){
 if(!/SPLASH_EXTENSION\s*=\s*['"]webp['"]/.test(text))throw Error('Unknown splash format');
 const block=/const SPLASH_ART_TRANSFORMS[^=]*=\s*\{([\s\S]*?)\n\};/.exec(text)?.[1];
 if(!block)throw Error('Full-illustration manifest unavailable');
 const keys=[...block.matchAll(/['"]([A-Za-z0-9-]+)['"]\s*:\s*\{[^}]*\}/g)].map(m=>m[1]),out:Record<string,string>={};
 if(keys.length<20||keys.length>500)throw Error('Invalid full-illustration manifest');
 for(const key of keys)if(/^\d+$/.test(key))out[key]=root+'/images/splash/'+key+'.webp';
 if(keys.includes('Rover')){const roster=/BUNDLED_ROVER_CHARACTER_IDS[^=]*=[\s\S]*?\[([\s\S]*?)\]/.exec(text)?.[1];for(const m of roster?.matchAll(/['"](\d+)['"]/g)||[])out[m[1]]=root+'/images/splash/Rover.webp';}
 return out;
}
