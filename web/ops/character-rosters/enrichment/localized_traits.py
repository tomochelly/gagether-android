"""Korean UI vocabulary for existing game classification codes, not identity matching."""
import copy
LABELS={'affinity':'죄악 속성','attackType':'공격 유형','baseCharacter':'수감자','group':'소속','element':'속성','weapon':'무기','class':'클래스','manufacturer':'기업','burstType':'버스트 단계','rank':'등급','attributes':'속성','afflatus':'영감','damageType':'피해 유형','role':'역할','position':'배치','personality':'성격','faction':'종족','damage':'공격 방식'}
TERMS={
'limbus':{'Wrath':'분노','Lust':'색욕','Sloth':'나태','Gluttony':'탐식','Gloom':'우울','Pride':'오만','Envy':'질투','Slash':'참격','Pierce':'관통','Blunt':'타격','Yi Sang':'이상','Faust':'파우스트','Don Quixote':'돈키호테','Ryoshu':'료슈','Meursault':'뫼르소','Hong Lu':'홍루','Heathcliff':'히스클리프','Ishmael':'이스마엘','Rodion':'로쟈','Sinclair':'싱클레어','Outis':'오티스','Gregor':'그레고르'},
'nikke':{'Attacker':'화력형','Defender':'방어형','Supporter':'지원형','Fire':'작열','Water':'수냉','Wind':'풍압','Electric':'전격','Iron':'철갑','Elysion':'엘리시온','Missilis':'미실리스','Tetra':'테트라','Pilgrim':'필그림','Abnormal':'어브노멀','Assault Rifle':'소총','Minigun':'머신건','Rocket Launcher':'런처','SMG':'기관단총','Shotgun':'샷건','Sniper Rifle':'저격소총','R':'R','SR':'SR','SSR':'SSR','1':'I','2':'II','3':'III'},
'gfl2':{'support':'서포트','bulwark':'불워크','vanguard':'뱅가드','sentinel':'센티널','Elite':'정예','Standard':'표준','medium-ammo':'표준탄','heavy-ammo':'중량탄','light-ammo':'경량탄','shotgun-ammo':'산탄','freeze':'빙결','electric':'전도','physical':'물리','burn':'연소','corrosion':'산성','melee':'근접','hydro':'탁류','resonance':'공명'},
'reverse1999':{'Beast':'야수','Intellect':'지능','Mineral':'암석','Plant':'나무','Spirit':'영혼','Star':'천체','Mental':'정신','Reality':'현실'},
'holodreams':{'dev-is':'hololive DEV_IS','hololive':'홀로라이브','hololive-en':'홀로라이브 English','hololive-id':'홀로라이브 Indonesia'},
'hi3':{'ジャベリン':'투창','チャクラム':'차크람','ランス':'랜스','十字架':'십자가','双銃':'쌍권총','双銃・十字架':'쌍권총 · 십자가','大剣':'대검','大鎌':'낫','太刀':'태도','弓':'활','腕甲':'권갑','重砲':'중포'},
'zzz':{'Armorer':'단조','ZhenZhenAssault':'서슬','Physics':'물리','Lumen':'루멘'}}
def localize(document):
 result=copy.deepcopy(document);game=result['gameId'];lookup=TERMS.get(game,{})
 for c in result['characters']:
  if game=='hsr'and c['id']in {str(i)for i in range(8001,8011)}and any('{NICKNAME}'in v for v in c['name'].values()):
   heading=dict(zip(['ko','en','ja','zh'],['개척자','Trailblazer','開拓者','开拓者']));path=next((t['value']for t in c.get('traits',[])if t['id']=='path'),{})
   for lo in heading:
    if '{NICKNAME}'in c['name'][lo]:c['name'][lo]=heading[lo]+(' · '+path[lo]if path.get(lo)else'')
  for t in c.get('traits',[]):
   if not t['label'].get('ko')and t['id']in LABELS:t['label']['ko']=LABELS[t['id']]
   if game=='zzz'and t['value'].get('en')=='Lumen'and t['value'].get('ko')=='빛':t['value']['ko']='루멘'
   if t['value'].get('ko'):continue
   raw=t['value'].get('en')or t['value'].get('ja')or'';parts=raw.split(', ')
   if all(p in lookup for p in parts):t['value']['ko']=', '.join(lookup[p]for p in parts)
 return result
