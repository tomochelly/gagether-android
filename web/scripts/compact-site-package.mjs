// Packaging only: preserve every artwork byte, runtime manifest value and migration.
import {rmSync} from 'node:fs';
// Build-tool manifests are not read by the deployed Worker or browser.
// Keep vinext-client-entry-manifest.json, which is the actual runtime map.
for(const path of ['dist/client/.vite/manifest.json','dist/server/.vite/manifest.json']){
 rmSync(path,{force:true});
}
// Unreferenced framework starter icons; GAGETHER uses its own favicon and assets.
for(const name of ['file.svg','window.svg','globe.svg'])rmSync('dist/client/'+name,{force:true});

// Incomplete local transfer scratch file, never a published asset or source URL.
rmSync('dist/client/assets/versions/.genshin-neutral-kv.png.6xoZN6',{force:true});
