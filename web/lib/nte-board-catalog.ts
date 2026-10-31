import {nteBoardArt} from './nte-board-art';
import type {Entry} from './types';
import type {CharacterRoster} from './character-roster';
import type {BoardCatalog,BoardItem} from './nte-board';
const copy=(ko:string,en:string,ja:string,zh:string)=>({ko,en,ja,zh});
export function createNteBoardCatalog(entries:Entry[],roster:CharacterRoster,now=Date.now()):BoardCatalog{
 const sourceUrl='https://static.pwsdk.com/nte/special/gacharate_ko.html';
 const ids=['3','5','7','9','11','15'],aids=['2','6','8','13','16','17'];
 const items:BoardItem[]=roster.characters.filter(c=>[...ids,...aids,'24'].includes(c.id)).map(c=>({id:'character:'+c.id,name:c.name,grade:ids.includes(c.id)||c.id==='24'?'S':'A',kind:'character',image:c.images?.find(i=>i.kind==='full-body'||i.kind==='splash')?.url||c.image?.url,sourceUrl:c.sourceUrl}));
 const arcs=[copy('잊힌 자','The Forgotten','忘れられた者','被遗忘者'),copy('정화 개시','Purification Begins','浄化開始','净化开始'),copy('머리 조심','Mind Your Head','頭上注意','小心头顶'),copy('물망산','Mount Oblivion','勿忘山','勿忘山'),copy('발도','Draw the Blade','抜刀','拔刀'),copy('성공을 향한 첫 걸음','First Step to Success','成功への第一歩','迈向成功的第一步'),copy('광란의 「전자음악」','Frenzied Electronic Music','狂乱の「電子音楽」','狂乱的「电子乐」'),copy('미소 천사','Smiling Angel','微笑みの天使','微笑天使'),copy('위험한 게임','Dangerous Game','危険なゲーム','危险游戏'),copy('「우리.」','“Us.”','「私たち。」','「我们。」')];
 arcs.forEach((name,i)=>{const a=nteBoardArt.find(a=>a.id==='arc:'+i)!;items.push({id:a.id,name:{...name,en:a.en},grade:i<5?'A':'B',kind:'arc',image:'/api/nte/board-media/'+a.sha256,sourceUrl:a.sourceUrl});});
 items.push({id:'bonus:skin',name:copy('스킨 보너스','Skin bonus','スキンボーナス','外观奖励'),kind:'bonus',sourceUrl:''}, {id:'bonus:dice:limited',name:copy('진실의 주사위','Solid Dice','本質サイコロ','实质骰子'),kind:'bonus',image:'/api/reward-icons/nte-solid-dice?v=9439ddfea72ee47ccaea27b9d2695b8a73481952a6e4227b9ccb29f907e3a940',sourceUrl:'https://interactivemap.app/neverness-to-everness/database/en/items/dicelimite/'}, {id:'bonus:dice:standard',name:copy('기만의 주사위','Fabricated Dice','虚質サイコロ','虚质骰子'),kind:'bonus',image:'/api/reward-icons/nte-fabricated-dice?v=d3a6afaffe3d2d3f22fb61c1bebc6fbd2d4ebf80cccf29d78cf2e9f8861fbd5f',sourceUrl:'https://interactivemap.app/neverness-to-everness/database/en/items/dicenormal/'});
 // Pin this reviewed rotation; new/future pools need their own reviewed member list.
 const entry=entries.find(e=>e.id==='hist-nte-global-20261021-character-f6a28244912f'&&e.gameId==='nte'&&e.region==='global'&&e.kind==='pickup'&&e.title.ko==='아카네 린'&&e.endAt&&Date.parse(e.endAt)>now&&Date.parse('2026-10-21T00:00:00+09:00')<=now);
 const result:BoardCatalog={items,banners:entry&&items.some(i=>i.id==='character:24')?[{id:entry.id,name:copy('찬란한 별 · 아카네 린','Brilliant Star · Akane Rin','輝く星 · 明音凛','灿烂的星 · 明音凛'),featured:'character:24',endAt:entry.endAt!,sourceUrl:entry.sourceUrl}]:[],standard:ids.map(id=>'character:'+id),aCharacters:aids.map(id=>'character:'+id),aArcs:arcs.slice(0,5).map((_,i)=>'arc:'+i),bArcs:arcs.slice(5).map((_,i)=>'arc:'+(i+5))};
 if([...result.standard,...result.aCharacters].some(id=>!items.some(i=>i.id===id)))throw Error('Incomplete NTE character pool');return result;
}
export async function readNteBoardCatalog(){const [{readData},{readCharacterRosterView}]=await Promise.all([import('./store'),import('./roster-art-framing-store')]);const [data,roster]=await Promise.all([readData({index:true,gameId:'nte'}),readCharacterRosterView('nte')]);if(!roster)throw Error('NTE roster unavailable');return createNteBoardCatalog(data.entries,roster.data);}
