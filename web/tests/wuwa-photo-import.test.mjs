import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';
import equipment from '../content/wuwa-equipment-catalog.json' with {type:'json'};
const {parsePhotoText,normalizeEchoPhotoRows,photoEchoRows,applyEchoPhoto}=await import('../lib/wuwa-photo-import.ts');
const c={...equipment},e=c.echoes.find(e=>e.cost===4),old={echoId:e.id,setId:e.setIds[0],rarity:5,level:25,main:{key:'critRate',value:22},subs:[{key:'critDamage',value:15}]};
test('Korean/English OCR parses exact labels, decimals, percentages and native Echo identity; unknown words never become guessed stats',()=>{const r=parsePhotoText(e.name.ko+'\n+25\n크리티컬 22.0%\n공격력 150\n크리티컬 피해 21.0%\n공명 효율 10.8%\n공격력 8.6%\nHP 320\n장식 999',c);assert.equal(r.echoId,e.id);assert.equal(r.level,25);assert.deepEqual(r.rows.map(x=>[x.key,x.value]),[['critRate',22],['atk',150],['critDamage',21],['energyRegen',10.8],['atkPercent',8.6],['hp',320]]);const pick=photoEchoRows(r.rows,4,25,5);assert.equal(pick.main,0);assert.ok(!pick.subs.includes(1));assert.equal(parsePhotoText('Crit. Rate 10.5%\nCrit. DMG 21.0%',c).rows.length,2);assert.deepEqual(parsePhotoText('Unlisted Stat 77',c).rows,[]);});
test('reviewed Echo photo replaces only selected fields and never invents missing main/secondary stats or legal roll values',()=>{const next=applyEchoPhoto(old,c,e.id,25,5,undefined,[{key:'critRate',value:10.5}],false);assert.equal(next.main.value,22);assert.deepEqual(next.subs,[...old.subs,{key:'critRate',value:10.5}]);assert.deepEqual(old.subs,[{key:'critDamage',value:15}]);assert.equal(applyEchoPhoto(old,c,e.id,25,5,undefined,[{key:'critRate',value:66}],true),null);assert.equal(applyEchoPhoto(old,c,e.id,25,5,{key:'critRate',value:220},[],false),null);assert.equal(applyEchoPhoto(old,c,e.id,25,5,undefined,[{key:'critRate',value:10.5},{key:'critRate',value:10.5}],true),null);assert.equal(applyEchoPhoto(old,c,'invented',25,5,undefined,[],true),null);const other=c.echoes.find(x=>x.cost===1),newEcho=applyEchoPhoto(old,c,other.id,25,5,undefined,[],false);assert.equal(newEcho.main.value,0);assert.deepEqual(newEcho.subs,[]);});
test('ambiguous duplicate rows and unsupported intermediate main values remain unconfirmed',()=>{const parsed=parsePhotoText('크리티컬 10.5%\n크리티컬 6.3%',c);assert.deepEqual(parsed.ambiguous,['critRate']);assert.equal(photoEchoRows([{key:'critRate',value:20}],4,23,5).main,-1);});

test('actual browser OCR output recognizes English damage-bonus labels as well as percentage/flat ATK without borrowing an Echo form',()=>{const r=parsePhotoText('Fleurdelys\n+25\nCrit. Rate 22.0%\nATK 150\nCrit. DMG 21.0%\nEnergy Regen 10.8%\nATK 8.6%\nHP 320\nBasic Attack DMG Bonus 8.6%',c);assert.equal(r.rows.length,7);assert.equal(r.rows.at(-1).key,'basicDamage');assert.equal(r.echoId,undefined);const p=photoEchoRows(r.rows,4,25,5);assert.equal(p.main,0);assert.equal(p.subs.length,5);});


test('missing decimal in user 44.0% main stat is restored only from exact selected Echo values, retaining raw OCR',()=>{
 const raw=parsePhotoText('시길룸 +25\n크리티컬 피해 440%\n공격력 150\n강공격 피해 보너스 8.6%\nHP 7.9%\n크리티컬 6.3%\n크리티컬 피해 16.2%\n공명 효율 10.8%',c);
 const before=structuredClone(raw.rows),rows=normalizeEchoPhotoRows(raw.rows,4,25,5),pick=photoEchoRows(rows,4,25,5);
 assert.equal(rows[0].value,44);assert.equal(rows[0].decimalRestoredFrom,440);assert.equal(rows[0].line,'크리티컬 피해 440%');assert.deepEqual(raw.rows,before);
 assert.equal(pick.main,0);assert.deepEqual(pick.subs,[2,3,4,5,6]);
 const next=applyEchoPhoto(old,c,e.id,25,5,rows[pick.main],pick.subs.map(i=>rows[i]),true);assert.equal(next.main.value,44);assert.equal(next.subs.length,5);assert.equal(next.subs[3].value,16.2);
});
test('decimal restoration preserves legal values, flat stats and unsupported or explicit-decimal readings',()=>{
 const raw=parsePhotoText('크리티컬 63%\n공명 효율 108%\n크리티컬 피해 44%\n공격력 150\nHP 2280\n크리티컬 피해 440.0%\n크리티컬 64%\nHP 22.8%',c);
 assert.deepEqual(normalizeEchoPhotoRows(raw.rows,4,25,5).map(r=>r.value),[6.3,10.8,44,150,2280,440,64,22.8]);
 for(const args of [[4,20,5],[4,25,4],[2,25,5]])assert.deepEqual(normalizeEchoPhotoRows(raw.rows,...args),raw.rows);
 assert.equal(photoEchoRows(normalizeEchoPhotoRows(parsePhotoText('크리티컬 피해 440%',c).rows,1,25,5),1,25,5).main,-1);
});
