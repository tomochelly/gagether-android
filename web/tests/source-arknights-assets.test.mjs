import {test}from'node:test';import assert from'node:assert/strict';
import {isArknightsSourceArtwork,isArknightsSourceIcon}from'../scripts/source-arknights-assets.mjs';
const commit='184aa662f210100150716d4f58cadc0b4e3642fc',root='https://raw.githubusercontent.com/fexli/ArknightsResource/'+commit+'/',common={gameId:'arknights',sourceKind:'community',assetCommit:commit,gitBlobSha:'1'.repeat(40),width:2248,height:2248};
test('source delivery binds exact operator/Elite exports and separately declared preview exports to an immutable fixed mirror',()=>{
 const a={...common,characterId:'char_002_amiya',sourceId:'illust_char_002_amiya_2',url:root+'charpack/char_002_amiya_2.png'};assert.equal(isArknightsSourceArtwork(a),true);assert.equal(isArknightsSourceArtwork({...a,preview:true,url:root+'charpack/char_002_amiya_2b.png'}),true);
 for(const bad of [{...a,characterId:'char_003_kalts'},{...a,assetCommit:'main'},{...a,url:a.url.replace('fexli','other')},{...a,url:a.url+'?arbitrary=1'},{...a,url:root+'charpor/char_002_amiya_2.png'},{...a,preview:true}])assert.equal(isArknightsSourceArtwork(bad),false);
});
test('native glyph delivery accepts only declared same-game skill paths, never an arbitrary proxy URL',()=>{
 const a={...common,sourceId:'skill_icon_skcom_magic_rage[3]',url:root+'skills/skill_icon_skcom_magic_rage%5B3%5D.png',width:64,height:64};assert.equal(isArknightsSourceIcon(a),true);
 for(const bad of [{...a,gameId:'gfl2'},{...a,sourceId:'another-skill'},{...a,url:'https://example.org/icon.png'},{...a,gitBlobSha:'invalid'}])assert.equal(isArknightsSourceIcon(bad),false);
});
