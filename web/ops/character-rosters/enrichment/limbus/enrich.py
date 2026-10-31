#!/usr/bin/env python3
"""Bounded, identity-bound Limbus source supplement. Reads public sources only."""
from __future__ import annotations
import argparse, concurrent.futures, copy, datetime, hashlib, html, io, json, pathlib, re, sys, unicodedata, urllib.request
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[4]
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent.parent))
from enrich_a import flight,json_field
BASE='https://raw.githubusercontent.com/x1bViolet/Limbus-Localization-Files/'
LANGS={'ko':'Korean','en':'English','ja':'Japanese'}
ICON='https://cdn.prydwen.gg/images/limbus-company/icons/'
LOCALES=('ko','en','ja','zh')
def C(ko,en,ja,zh):return dict(zip(LOCALES,(ko,en,ja,zh)))
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')
def sha(b):return hashlib.sha256(b).hexdigest()
def norm(x):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFKD',str(x)).encode('ascii','ignore').decode().lower()).replace('association','assoc').replace('harpooner','harpooneer').replace('representative','rep')
def plain(x):
 x=re.sub(r'<(?:br\s*/?|/p|/li|/div)>','\n',str(x or ''),flags=re.I)
 x=html.unescape(re.sub(r'<[^>]*>','',x)).replace('\\n','\n')
 return re.sub(r'\n\s*\n\s*\n+','\n\n',x).strip()
SINS={'Wrath':C('분노','Wrath','憤怒','暴怒'),'Lust':C('색욕','Lust','色欲','色欲'),'Sloth':C('나태','Sloth','怠惰','怠惰'),'Gluttony':C('탐식','Gluttony','暴食','暴食'),'Gloom':C('우울','Gloom','憂鬱','忧郁'),'Pride':C('오만','Pride','傲慢','傲慢'),'Envy':C('질투','Envy','嫉妬','嫉妒')}
ATK={'Slash':C('참격','Slash','斬撃','斩击'),'Pierce':C('관통','Pierce','貫通','突刺'),'Blunt':C('타격','Blunt','打撃','打击')}
LABELS={'hp':C('HP','HP','HP','生命值'),'def':C('방어 레벨','Defense level','防御レベル','防御等级'),'speed':C('속도','Speed','速度','速度')}
EVENTS={'WhenUse':C('사용시','On Use','使用時','使用时'),'OnSucceedAttack':C('적중시','On Hit','的中時','命中时'),'OnSucceedAttackHead':C('앞면 적중시','On Heads Hit','表面的中時','正面命中时'),'OnSucceedAttackTail':C('뒷면 적중시','On Tails Hit','裏面的中時','反面命中时'),'DefeatDuel':C('합 승리시','Clash Win','マッチ勝利時','拼点胜利时'),'LoseDuel':C('합 패배시','Clash Lose','マッチ敗北時','拼点失败时'),'BattleStart':C('전투 시작시','Combat Start','戦闘開始時','战斗开始时'),'OnEndAttack':C('공격 종료시','After Attack','攻撃終了時','攻击结束时')}
EVENTS.update({
'StartBattle':C('전투 시작시','Combat Start','戦闘開始時','战斗开始时'),'WinDuel':C('합 승리시','Clash Win','マッチ勝利時','拼点胜利时'),'EndSkill':C('스킬 종료시','Skill End','スキル終了時','技能结束时'),'CriticalOnSucceedAttack':C('치명타 적중시','On Crit','クリティカル的中時','暴击命中时'),'DuelCounter':C('합 가능 반격','Clashable Counter','マッチ可能反撃','可拼点反击'),'BeforeAttack':C('공격 전','Before Attack','攻撃前','攻击前'),'BeforeUse':C('사용 전','Before Use','使用前','使用前'),'OnSucceedEvade':C('회피 성공시','On Evade','回避成功時','闪避成功时'),'CantDuel':C('합 불가능','Unclashable','マッチ不可','不可拼点'),'EndBattle':C('전투 종료시','Combat End','戦闘終了時','战斗结束时'),'EnemyKill':C('적 처치시','On Kill','敵討伐時','击杀时'),'UnBrokenCoinOnSucceedAttack':C('파괴 불가 코인 적중시','Unbreakable Coin On Hit','破壊不可コイン的中時','不可摧毁硬币命中时'),'ReUseOnSucceedAttack':C('재사용 코인 적중시','Reused Coin On Hit','再使用コイン的中時','重复使用硬币命中时')})
class Cache:
 def __init__(self,path,offline=False):self.path=pathlib.Path(path);self.path.mkdir(parents=True,exist_ok=True);self.offline=offline;self.receipts=[]
 def get(self,url,limit=6_000_000):
  if not url.startswith(('https://raw.githubusercontent.com/x1bViolet/Limbus-Localization-Files/','https://api.github.com/repos/x1bViolet/Limbus-Localization-Files/git/trees/','https://www.prydwen.gg/limbus-company/identities/','https://cdn.prydwen.gg/images/limbus-company/','https://limbuscompany.com/','https://raw.githubusercontent.com/eldritchtools/limbus-shared-library/','https://clan.fastly.steamstatic.com/images/43587230/')):raise ValueError('Source outside fixed allowlist')
  stem=self.path/sha(url.encode());body=stem.with_suffix('.body');meta=stem.with_suffix('.json')
  if body.exists() and meta.exists():
   b=body.read_bytes();r=json.loads(meta.read_text())
   if r['url']!=url or r['sha256']!=sha(b)or len(b)>limit:raise ValueError('Cached source hash or byte bound mismatch')
   checked=datetime.datetime.fromisoformat(r['checkedAt'].replace('Z','+00:00'))
   if self.offline or(datetime.datetime.now(datetime.timezone.utc)-checked).total_seconds()<21600:
    r={**r,'mode':'cached-replay'};self.receipts.append(r);return b,r
  if self.offline:raise ValueError('Missing offline source')
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-public-roster-reference/1.0'}),timeout=35)as response:
   if response.status!=200:raise ValueError('Expected HTTP200')
   b=response.read(limit+1)
  if len(b)>limit:raise ValueError('Source byte bound exceeded')
  r={'url':url,'checkedAt':now(),'sha256':sha(b),'bytes':len(b),'httpStatus':200,'mode':'live-read'};body.write_bytes(b);meta.write_text(json.dumps(r))
  self.receipts.append(r);return b,r
 def json(self,url):return json.loads(self.get(url)[0])
def native_sources(cache):
 inventories={};failures=[]
 def get_lang(pair):
  locale,branch=pair;root=BASE+branch+'/'
  tree=cache.json('https://api.github.com/repos/x1bViolet/Limbus-Localization-Files/git/trees/'+branch+'?recursive=1')
  if tree.get('truncated'):raise ValueError('Truncated native file inventory')
  paths=[x['path']for x in tree['tree']if '/'not in x['path']and(x['path']in('Personalities.json','Passives.json','Skills.json','BattleKeywords.json')or re.fullmatch(r'Skills_personality-[\w-]+\.json',x['path'])or re.fullmatch(r'BattleKeywords-(?!Refraction)[\w-]+\.json',x['path']))]
  if len(paths)<16:raise ValueError('Incomplete native skill inventory')
  result={'skills':{},'passives':{},'names':{},'keywords':{}}
  def one(path):
   url=root+path
   try:return path,cache.json(url),url,None
   except Exception as e:return path,None,url,type(e).__name__+': '+str(e)
  with concurrent.futures.ThreadPoolExecutor(max_workers=6)as pool:
   for path,data,url,error in pool.map(one,paths):
    if error:failures.append({'locale':locale,'url':url,'error':error});continue
    target='skills'if path.startswith('Skills')else'passives'if path.startswith('Passives')else'names'if path=='Personalities.json'else'keywords'
    for row in data.get('dataList',[]):
     ident=str(row['id'])
     if ident in result[target] and result[target][ident][0]!=row:
      if target=='keywords':continue
      raise ValueError('Conflicting native source identity')
     result[target][ident]=(row,url)
  return locale,result
 with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
  for locale,result in pool.map(get_lang,LANGS.items()):inventories[locale]=result
 return inventories,failures
def native_text(value,locale,native):
 value=plain(value)
 keywords=native.get(locale,{}).get('keywords',{})
 def token(m):
  key=m[1];r=keywords.get(key)
  if r and r[0].get('name'):return plain(r[0]['name'])
  return '['+(EVENTS[key][locale]if key in EVENTS else key)+']'
 return re.sub(r'\[([^\]\n]+)\]',token,value)
def level_body(r,locale,native):
 lines=[native_text(r.get('desc',''),locale,native)]
 for i,coin in enumerate(r.get('coinlist',[]),1):
  descriptions=[native_text(x.get('desc',''),locale,native)for x in coin.get('coindescs',[])if x.get('desc')]
  if descriptions:lines.append(C(f'코인 {i}',f'Coin {i}',f'コイン{i}',f'硬币{i}')[locale]+'\n'+'\n'.join(descriptions))
 return '\n\n'.join(x for x in lines if x)
def source_labels(url,kind='community'):return {'url':url,'kind':kind}
def match_identity(c,native):
 names=native['en']['names'];wanted=norm(c['name']['en']);hits=[ident for ident,(r,url)in names.items()if norm(r.get('title','')+' '+r.get('name',''))==wanted]
 aliases={'Cinq South Section 4 Director Sinclair':'11008','Cinq South Section 4 Outis':'11106'}
 alias=aliases.get(re.sub(r'[\[\]]','',c['name']['en']))
 if alias and not hits:hits=[alias]
 if len(hits)>1:raise ValueError('Ambiguous native identity')
 return hits[0]if hits else None
def match_skill(skill,identity,native):
 if not identity:return None
 wanted=norm(skill['name']);hits=[]
 for ident,(r,url)in native['en']['skills'].items():
  if not ident.startswith(identity):continue
  if any(norm(l.get('name',''))==wanted for l in r.get('levelList',[])):hits.append(ident)
 return hits[0]if len(hits)==1 else None
def patch_character(c,character,page,native,icons,cache,rejected):
 if str(character.get('data',{}).get('unitId'))!=c['id']or character['slug']!=c['sourceUrl'].rstrip('/').split('/')[-1]:raise ValueError('Source page identity mismatch')
 d=character['data'];out=copy.deepcopy(c);identity=match_identity(c,native);tables=[];source_urls=[c['sourceUrl']];native_matches=0
 if identity:
  for locale in LANGS:
   item=native[locale]['names'].get(identity)
   if item:
    row,url=item;out['name'][locale]=' '.join(plain(row.get('title','')+' '+row.get('name','')).split());out.setdefault('nameSources',{})[locale]={'url':url,'kind':'community'};source_urls.append(url)
 for trait in out.get('traits',[]):
  if trait['id']=='affinity':trait['label']=C('죄악 속성','Sin affinity','罪悪属性','罪孽属性');words=[SINS.get(x)for x in d.get('affinity',[])];trait['value']={l:', '.join(x[l]for x in words)for l in LOCALES}if words and all(words)else trait['value']
  if trait['id']=='attackType':trait['label']=C('공격 유형','Attack type','攻撃タイプ','攻击类型');words=[ATK.get(x)for x in d.get('attackType',[])];trait['value']={l:', '.join(x[l]for x in words)for l in LOCALES}if words and all(words)else trait['value']
  if trait['id']=='baseCharacter':
   trait['label']=C('수감자','Sinner','囚人','罪人')
   if identity:
    for locale in LANGS:
     item=native[locale]['names'].get(identity)
     if item:trait['value'][locale]=plain(item[0].get('name',''))
 visible=plain(re.sub(r'<script\b[^>]*>[\s\S]*?</script>','',page,flags=re.I))
 shown=re.search(r'Stats\s*\(At level\s*(\d+)\)',visible);level=int(shown[1])if shown else None
 if level:
  panel=d.get('status')or{};suffix='30'if level>1 else'1';basis_panel=C(f'Prydwen 공개 표 Lv.{level} · 동기화 단계 미표기 · 편성 버프 제외',f'Prydwen public Lv.{level} panel; Uptie not declared; team buffs excluded',f'Prydwen公開Lv.{level}表。同期段階未記載、編成バフ除外',f'Prydwen公开Lv.{level}面板，未标明同步阶段；排除队伍增益')
  projected=[{'id':k,'label':LABELS[k],'value':str(panel[k+'_'+suffix]),'basis':basis_panel}for k in('hp','def','speed')if panel.get(k+'_'+suffix)not in(None,'')]
  if projected:out['stats']=projected+[row for row in out.get('stats',[])if row['id']not in('hp','def','speed')]
 basis=C('Prydwen 기본 스킬 표 · 동기화 단계 미표기 · 조건부 추가 효과 별도','Prydwen base skill table; Uptie tier not declared; conditional bonuses separate','Prydwen基礎スキル表。同期段階未記載、条件付き追加効果は別記','Prydwen基础技能表，未标明同步阶段；条件加成另列')
 for n,s in enumerate(d.get('skills',[]),1):
  sid=str(s.get('skill_id')or n);defensive=bool(s.get('is_defensive'));native_id=match_skill(s,identity,native)
  declared_slot=re.fullmatch(re.escape(c['id'])+r'_([1-4])(?:_[0-9]+)?',sid);slot=declared_slot[1]if declared_slot else None
  names={'ko':'','en':plain(s['name']),'ja':'','zh':''}
  if native_id:
   native_matches+=1
   for locale in LANGS:
    item=native[locale]['skills'].get(native_id)
    if item:
     levels=item[0].get('levelList',[])
     if levels:names[locale]=plain(levels[-1].get('name',''));source_urls.append(item[1])
  desc=plain(s.get('skill_effect',''))
  for coin in s.get('coin_effects',[]):
   text=plain(coin.get('dark',''))
   if text:desc+='\n\nCoin '+str(coin.get('level')or coin.get('light')or'?')+'\n'+text
  sin=s.get('type');icon=icons.get('affinity_'+str(sin).lower())
  values=[]
  fields=[('base-power','skill_power',C('기본 위력','Base Power','基本威力','基础威力')),('coin-power','coin_power',C('코인 위력','Coin Power','コイン威力','硬币威力')),('coin-count','number_of_coins',C('코인 수','Coins','コイン数','硬币数量')),('copies','amount',C('덱 수량','Copies','デッキ枚数','牌组数量'))]
  for ident,key,label in fields:
   value=s.get(key)
   if value not in(None,''):values.append({'id':ident,'label':label,'levels':[str(value)]})
  if sin in SINS:values.append({'id':'affinity','label':C('죄악 속성','Sin affinity','罪悪属性','罪孽属性'),'levels':[sin],**({'icon':icon}if icon else{})})
  atk=s.get('attack_type');attack_icon=icons.get('attackt_'+str(atk).lower())
  if atk in ATK:values.append({'id':'attack-type','label':C('공격 유형','Attack type','攻撃タイプ','攻击类型'),'levels':[atk],**({'icon':attack_icon}if attack_icon else{})})
  if not defensive and s.get('offense_level')not in(None,''):
   value=str(s['offense_level']);value=('+'if re.fullmatch(r'\d+(?:\.\d+)?',value)else'')+value
   values.append({'id':'offense-modifier','label':C('공격 레벨 보정','Offense level modifier','攻撃レベル補正','攻击等级修正'),'levels':[value]})
  table={'id':'prydwen-'+sid+'-row-'+str(n),'name':names,'type':C(('수비'if defensive else'스킬 '+slot if slot else'기술')+' · 수치',('Defense'if defensive else'Skill '+slot if slot else'Ability')+' · values',('守備'if defensive else'スキル'+slot if slot else'技')+'・数値',('防御'if defensive else'技能'+slot if slot else'技能')+'·数值'),'sourceUrl':c['sourceUrl'],'sourceKind':'community','basis':basis,'description':{'ko':'','en':desc,'ja':'','zh':''},'values':values}
  if icon:table['icon']=icon
  if not desc and not values:continue
  tables.append(table)
  if native_id:
   existing=next((t for t in tables if t['id']=='native-'+native_id),None)
   if existing:
    if existing.get('icon')!=icon:existing.pop('icon',None)
    continue
   source=native['en']['skills'][native_id];entries=source[0].get('levelList',[])
   levels=sorted({r['level']for r in entries});translations={};native_names=dict(names)
   for locale in LANGS:
    row=native[locale]['skills'].get(native_id)
    if not row:continue
    by_level={r['level']:r for r in row[0].get('levelList',[])}
    if all(v in by_level for v in levels):translations[locale]=[level_body(by_level[v],locale,native)or'—'for v in levels]
   if translations and any(text!='—'for texts in translations.values()for text in texts):
    native_table={'id':'native-'+native_id,'name':native_names,'type':C('동기화별 원문','Uptie descriptions','同期段階別原文','同步阶段原文'),'sourceUrl':source[1],'sourceKind':'community','basis':C('동일 인격 ID와 스킬 ID로 대조한 게임 원문 · 표기된 동기화 단계만','Game localization joined by exact Identity and skill IDs; explicitly supplied Uptie tiers only','同一人格ID・スキルIDで照合したゲーム原文。明記された同期段階のみ','按相同人格与技能ID核对的游戏文本，仅列出明确提供的同步阶段'),'maxLevel':len(levels),'levelLabels':[C('동기화 '+str(v),'Uptie '+str(v),'同期'+str(v),'同步'+str(v))for v in levels],'descriptionTemplate':{l:'{1}'if l in translations else''for l in LOCALES},'parameters':{},'values':[]}
    for locale,texts in translations.items():
     slots=max((len(t)+299)//300 for t in texts)
     if slots>100:raise ValueError('Native description byte/parameter bound exceeded')
     native_table['descriptionTemplate'][locale]=''.join('{'+str(i+1)+'}'for i in range(slots))
     native_table['parameters'][locale]=[[text[i*300:(i+1)*300]for text in texts]for i in range(slots)]
    if icon:native_table['icon']=icon
    tables.append(native_table)
 for n,p in enumerate(d.get('passives',[]),1):
  desc=plain(p.get('description',''));costs=[]
  for suffix in('','_2','_3'):
   sin=p.get('type'if not suffix else'affinity_type'+suffix);cost=p.get('cost'+suffix)
   if sin and cost:costs.append(str(cost)+' '+sin)
  if costs:desc=' + '.join(costs)+' ['+str(p.get('category',''))+']\n\n'+desc
  icon=icons.get('affinity_'+str(p.get('type')).lower());name={'ko':'','en':plain(p.get('name','')),'ja':'','zh':''}
  t={'id':'passive-'+str(p.get('passive_id')or n)+'-row-'+str(n),'name':name,'nameLocale':'en','type':C('서포트 패시브'if p.get('passive_type')=='Support'else'전투 패시브','Support passive'if p.get('passive_type')=='Support'else'Combat passive','サポートパッシブ'if p.get('passive_type')=='Support'else'戦闘パッシブ','支援被动'if p.get('passive_type')=='Support'else'战斗被动'),'sourceUrl':c['sourceUrl'],'sourceKind':'community','basis':basis,'description':{'ko':'','en':desc,'ja':'','zh':''},'values':[]}
  if icon:t['icon']=icon
  if desc:tables.append(t)
 if len(tables)>40:raise ValueError('Detailed skill table bound exceeded')
 out['skillTables']=tables
 # Source status endpoints only, with no interpolation or inferred default level.
 if level and level>1:
  status=d.get('status')or{};ids=('hp','def','speed');keys={'hp':'hp','def':'def','speed':'speed'}
  if all(status.get(keys[k]+'_'+suffix)not in(None,'')for k in ids for suffix in('1','30')):
   b=C(f'Prydwen 공개 Lv.1 및 Lv.{level} 표 · 중간 레벨 보간 없음 · 편성 버프 제외',f'Prydwen published Lv.1 and Lv.{level} endpoints; no interpolation; team buffs excluded',f'Prydwen公開Lv.1・Lv.{level}の値。中間レベル補間なし、編成バフ除外',f'Prydwen公开Lv.1与Lv.{level}端点，不插值；排除队伍增益')
   out['statProgression']={'sourceUrl':c['sourceUrl'],'sourceKind':'community','basis':b,'defaultLevel':level,'stats':[{'id':k,'label':LABELS[k],**({'icon':icons['stat_'+k]}if 'stat_'+k in icons else{})}for k in ids],'rows':[{'level':v,'values':{k:str(status[keys[k]+'_'+suffix])for k in ids}}for v,suffix in [(1,'1'),(level,'30')]]}
 for stat in out.get('stats',[]):
  if 'stat_'+stat['id']in icons:stat['icon']=icons['stat_'+stat['id']]
 out['stats']=[s for s in out.get('stats',[])if not s['id'].startswith('res-')]
 for kind,value in(d.get('resistances')or{}).items():
  if kind not in('slash','pierce','blunt')or value in(None,''):continue
  out.setdefault('stats',[]).append({'id':'res-'+kind,'label':C(ATK[kind.title()]['ko']+' 내성',kind.title()+' resistance',ATK[kind.title()]['ja']+'耐性',ATK[kind.title()]['zh']+'抗性'),'value':str(value),'basis':basis,'group':'detail',**({'icon':icons['attackt_'+kind]}if'attackt_'+kind in icons else{})})
 out['detailSources']=list({s['url']:s for s in[*c.get('detailSources',[]),*[source_labels(u)for u in source_urls]]}.values())[:40]
 art=None;art_failure=None;url=d.get('full_image')
 if(not c.get('image')or c['image'].get('kind')=='portrait')and url and url not in rejected:
  if not url.startswith('https://cdn.prydwen.gg/images/limbus-company/characters/'):raise ValueError('Unexpected full art URL')
  try:
   b,receipt=cache.get(url,16_000_000)
   with Image.open(io.BytesIO(b))as im:
    im.load();width,height=im.size
    if width<500 or height<350:raise ValueError('Full artwork dimensions too small')
   art={**receipt,'characterId':c['id'],'width':width,'height':height,'url':url,'sourceUrl':c['sourceUrl'],'kind':'splash','sourceKind':'community','locale':'neutral'}
   prior=c.get('image');out['image']={k:art[k]for k in('url','sourceUrl','kind','width','height','sourceKind','locale')}
   out['images']=list({a['url']:a for a in[*c.get('images',[]),*([prior]if prior else[])]if a['url']!=url}.values())[:10]
  except Exception as error:art_failure={'url':url,'error':type(error).__name__+': '+str(error)}
 return out,{'id':c['id'],'nativeIdentityId':identity,'nativeSkills':native_matches,'tables':len(tables),'sourcePageSha256':sha(page.encode()),'newArtwork':art,'artFailure':art_failure}
def apply_reviewed_art(document,cache,native):
 records=json.loads((pathlib.Path(__file__).parent/'reviewed-artwork.json').read_text())['records'];by_id={c['id']:c for c in document['characters']};applied=[];failures=[]
 for source in records:
  try:
   c=by_id[source['characterId']];identity=match_identity(c,native)
   if identity!=source['nativeIdentityId']:raise ValueError('Reviewed artwork native identity mismatch')
   if 'sourceDeclaredName'in source:
    native_name=native['en']['names'][identity][0]
    if norm(source['sourceDeclaredName'])!=norm(native_name['title'])or int(identity[1:3])!=source['sourceSinnerId']:raise ValueError('Artwork source title/Sinner mismatch')
   prior=c.get('image')
   if prior and prior.get('kind')not in('portrait','card'):continue
   # Native good whole scenes always win; reviewed cards only fill the exact known gaps.
   b,receipt=cache.get(source['url'],5_000_000)
   if sha(b)!=source['sha256']or len(b)!=source['bytes']:raise ValueError('Reviewed original byte identity changed')
   with Image.open(io.BytesIO(b))as im:
    im.verify()
    if im.size!=(source['width'],source['height']):raise ValueError('Reviewed dimensions changed')
   old_urls=list(dict.fromkeys([a['url']for a in[prior,*c.get('images',[])]if a]))
   art={k:source[k]for k in('url','sourceUrl','kind','sourceKind','width','height','caption')}
   locales=source.get('locales',[source.get('locale','neutral')]);c['image']={**art,'locale':locales[0]}
   extras=[{**art,'locale':l}for l in locales[1:]]
   existing=[a for a in[*c.get('images',[]),*([prior]if prior else[])]if a['url']!=art['url']]
   c['images']=extras+list({a['url']+'|'+a.get('locale',''):a for a in existing}.values())
   c['detailSources']=list({s['url']:s for s in[*c.get('detailSources',[]),{'url':source['sourceUrl'],'kind':source['sourceKind']} ]}.values())[:40]
   applied.append({**source,**receipt,'oldUrls':old_urls})
  except Exception as error:failures.append({'id':source['characterId'],'stage':'reviewed-art','error':type(error).__name__+': '+str(error)})
 return applied,failures
def enrich(document,cache):
 original=copy.deepcopy(document)
 if document.get('gameId')!='limbus':raise ValueError('Wrong game')
 if len({c['id']for c in document['characters']})!=len(document['characters']):raise ValueError('Duplicate input identity')
 # Publisher's Korean page is read first; its base Sinner profiles never replace Identity art.
 official=None
 try:_,official=cache.get('https://limbuscompany.com/')
 except Exception as e:official={'url':'https://limbuscompany.com/','status':'failed','error':str(e)}
 native,native_failures=native_sources(cache);rejected={x['url']for x in json.loads((ROOT/'content/character-rosters/rejected-artwork.json').read_text())}
 icons={};evidence=[];failures=[];artwork=[]
 # URLs are extracted from actual rendered source markup, never composed as guessed assets.
 sample=cache.get(document['characters'][0]['sourceUrl'])[0].decode()
 urls=set(re.findall(r'https://cdn\.prydwen\.gg/images/limbus-company/icons/[a-z_]+\.webp',sample))
 for encoded in re.findall(r'https%3A%2F%2Fcdn\.prydwen\.gg%2Fimages%2Flimbus-company%2Ficons%2F[a-z_]+\.webp',sample):
  import urllib.parse
  urls.add(urllib.parse.unquote(encoded))
 # Different identities declare other sin icons. Their pages are fetched below before icon assignment.
 pages={}
 def read(c):
  try:
   b,r=cache.get(c['sourceUrl']);page=b.decode();character=json_field(flight(page),'character')
   return c['id'],(page,character,r),None
  except Exception as e:return c['id'],None,type(e).__name__+': '+str(e)
 with concurrent.futures.ThreadPoolExecutor(max_workers=6)as pool:
  for ident,result,error in pool.map(read,document['characters']):
   if error:failures.append({'id':ident,'stage':'detail','error':error});continue
   pages[ident]=result
   urls.update(re.findall(r'https://cdn\.prydwen\.gg/images/limbus-company/icons/[a-z_]+\.webp',result[0]))
   import urllib.parse
   urls.update(urllib.parse.unquote(u)for u in re.findall(r'https%3A%2F%2Fcdn\.prydwen\.gg%2Fimages%2Flimbus-company%2Ficons%2F[a-z_]+\.webp',result[0]))
 for url in sorted(urls):
  try:
   b,r=cache.get(url,1_000_000)
   with Image.open(io.BytesIO(b))as im:im.verify();size=im.size
   if not(8<=min(size)<=500 and max(size)<=1000):raise ValueError('Unexpected game glyph dimensions')
   key=url.rsplit('/',1)[-1].removesuffix('.webp');icons[key]=url;evidence.append({**r,'width':size[0],'height':size[1]})
  except Exception as e:failures.append({'stage':'icon','url':url,'error':str(e)})
 patched=[];coverage=[]
 for c in document['characters']:
  if c['id']not in pages:patched.append(copy.deepcopy(c));continue
  page,character,r=pages[c['id']]
  try:
   row,record=patch_character(c,character,page,native,icons,cache,rejected);patched.append(row);coverage.append(record)
   if record['newArtwork']:artwork.append(record['newArtwork'])
   if record['artFailure']:failures.append({'id':c['id'],'stage':'art',**record['artFailure']})
  except Exception as e:patched.append(copy.deepcopy(c));failures.append({'id':c['id'],'stage':'transform','error':type(e).__name__+': '+str(e)})
 result=copy.deepcopy(original);result['characters']=patched
 reviewed_art,art_failures=apply_reviewed_art(result,cache,native);failures.extend(art_failures)
 missing_art=sum(not c.get('image')for c in patched);result['coverage']['nativeNameCounts']={l:sum(bool(c['name'].get(l))for c in patched)for l in LOCALES};result['coverage']['note']=f'190 stable Identity IDs retained. Native KO/EN/JP names and Uptie descriptions are joined by exact game Identity/skill IDs. {missing_art} identities have no verified primary illustration; preserve known whole scenes and exact-source card alternatives. Source indexing never asserts release times.'
 if[c['id']for c in patched]!=[c['id']for c in original['characters']]:raise ValueError('Stable identity sequence changed')
 report={'gameId':'limbus','checkedAt':now(),'officialFirst':official,'identityCount':len(patched),'detailCount':len(coverage),'skillTables':sum(len(c.get('skillTables',[]))for c in patched),'nativeSkillMatches':sum(x['nativeSkills']for x in coverage),'newArtwork':artwork,'reviewedArtwork':reviewed_art,'missingArtworkIds':[c['id']for c in patched if not c.get('image')],'statProgressionCount':sum(bool(c.get('statProgression'))for c in patched),'nativeNameCounts':result['coverage']['nativeNameCounts'],'icons':evidence,'identities':coverage,'failures':failures,'nativeSourceFailures':native_failures,'sourceReceipts':cache.receipts,'limits':['Prydwen numeric skill tables do not declare Uptie; no tier is inferred. Native Uptie descriptions remain separate tables.','Japanese native text is used only when exact same skill ID and explicit level rows exist; other unavailable locales use honest English fallback.','No review/rating text copied, no team buffs or weapon assumptions invented.']}
 return result,report
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--input',type=pathlib.Path,required=True);ap.add_argument('--output',type=pathlib.Path,required=True);ap.add_argument('--cache-dir',type=pathlib.Path,required=True);ap.add_argument('--report',type=pathlib.Path,required=True);ap.add_argument('--offline',action='store_true');a=ap.parse_args()
 d=json.loads(a.input.read_text());d=next(x for x in d if x['gameId']=='limbus')if isinstance(d,list)else d
 output,report=enrich(d,Cache(a.cache_dir,a.offline));a.output.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n');a.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:report[k]for k in ['identityCount','detailCount','skillTables','nativeSkillMatches']},ensure_ascii=False));print(json.dumps({'failures':len(report['failures']),'newArtwork':len(report['newArtwork']),'reviewedArtwork':len(report['reviewedArtwork']),'nativeFailures':len(report['nativeSourceFailures'])}))
