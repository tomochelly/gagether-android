"""Exact-identity NTE detail enrichment. Read-only public sources, no credentials.
Primary source is fixed Global1.4.5 extracted client, not current CN main.
Kaiden progression remains explicitly a provider table, not a derived client panel.
"""
from __future__ import annotations
import argparse,collections,concurrent.futures,copy,datetime,decimal,hashlib,html,json,pathlib,re,urllib.request,urllib.error
from html.parser import HTMLParser
REF='cef09a29d4d92c7b1e0b950d89ba8c75b1c529e7'
RAW='https://raw.githubusercontent.com/Waifus-Grace/NTE_Assets/'+REF+'/'
ROOT=pathlib.Path(__file__).resolve().parent
LOCALES=('ko','en','ja','zh')
PATHS={'elements':'DataTable/DT_CharacterElementTypeData.json','forks':'DataTable/Fork/DT_ForkTypeData.json','characters':'DataTable/Character/DT_Character.json','packs':'DataTable/PackData/DT_PlayerPackData.json','abilities':'DataTable/Character/DT_CharacterAbilityConfig.json','tips':'DataTable/Skill/DT_GameplayAbilityTipsData.json','damage':'DataTable/Skill/DT_SkillDamageData.json'}
CURVE_NAMES=('AICharacter','Adler','Akane','BlackBird','Cang','Chaos','Chiichan','Daffodill','Edgar','Fadia','Female051','Female','Haniel','Hathor','Jin','Kuhara','Lacrimosa','Linko','Mint','Mitsuki','Nanally','Oneiroi','Sagiri','Shinku','Skia','Zankou')
def C(ko,en,ja,zh):return dict(zip(LOCALES,(ko,en,ja,zh)))
def clean(s):return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]*>','',str(s or'')).replace('\\n',' '))).strip()
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')
def fmt(v,percent=False):
 d=decimal.Decimal(str(v))*(100 if percent else 1);d=d.quantize(decimal.Decimal('.001'),rounding=decimal.ROUND_HALF_UP)
 return format(d,'f').rstrip('0').rstrip('.')if'.'in format(d,'f')else str(d)
class Node:
 def __init__(self,tag='',attrs=(),parent=None):self.tag=tag;self.attrs=dict(attrs);self.children=[];self.parent=parent
 def walk(self):
  yield self
  for c in self.children:
   if isinstance(c,Node):yield from c.walk()
 def text(self):return re.sub(r'\s+',' ',''.join(c.text()if isinstance(c,Node)else c for c in self.children)).strip()
 def cls(self,c):return c in self.attrs.get('class','').split()
 def find(self,fn):return next((n for n in self.walk()if fn(n)),None)
class DOM(HTMLParser):
 def __init__(self,s):super().__init__(convert_charrefs=True);self.root=Node('root');self.cur=self.root;self.feed(s)
 def handle_starttag(self,t,a):
  n=Node(t,a,self.cur);self.cur.children.append(n)
  if t not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'):self.cur=n
 def handle_endtag(self,t):
  n=self.cur
  while n.parent:
   if n.tag==t:self.cur=n.parent;return
   n=n.parent
 def handle_data(self,s):self.cur.children.append(s)
class Sources:
 def __init__(self,cache_dir,offline=False):self.cache=pathlib.Path(cache_dir);self.offline=offline;self.receipts=[];self.cache.mkdir(parents=True,exist_ok=True)
 def get(self,path,kind='client'):
  if kind=='client':url=RAW+path;file=self.cache/'global-client'/path
  else:url=path;file=self.cache/'kaiden'/(hashlib.sha256(url.encode()).hexdigest()+'.html')
  if self.offline:
   if not file.exists():raise ValueError('Offline source missing: '+str(file))
   b=file.read_bytes();mode='offline-replay'
  else:
   req=urllib.request.Request(url,headers={'User-Agent':'GAGETHER-NTE-Details/1.0','Accept':'application/json,text/html,text/plain;q=0.9'})
   with urllib.request.urlopen(req,timeout=35)as r:
    if r.status!=200:raise ValueError('Expected HTTP200')
    b=r.read(16000001)
    if len(b)>16000000:raise ValueError('Source too large')
   file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(b);mode='fetched'
  self.receipts.append({'url':url,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'mode':mode,**({'checkedAt':now()}if mode=='fetched'else{})});return b
 def json(self,path):return json.loads(self.get(path))
def rows(v):
 if not isinstance(v,list)or len(v)!=1 or not isinstance(v[0].get('Rows'),dict):raise ValueError('Missing declared data table rows')
 return v[0]['Rows']
LABELS={'hp':C('HP','HP','HP','生命值'),'atk':C('공격력','ATK','攻撃力','攻击力'),'def':C('방어력','DEF','防御力','防御力'),'crit_rate':C('치명타 확률','CRIT Rate','会心率','暴击率'),'crit_dmg':C('치명타 피해','CRIT DMG','会心ダメージ','暴击伤害'),'energy_cap':C('종결 에너지 상한','Ultimate Energy cap','終結エネルギー上限','终结能量上限'),'energy_efficiency':C('에너지 획득 효율','Energy gain efficiency','エネルギー獲得効率','能量获取效率')}
TYPES={'Melee':C('일반 공격','Normal Attack','通常攻撃','普通攻击'),'Skill':C('스킬','Skill','スキル','技能'),'UltraSkill':C('종결 스킬','Ultimate','終結スキル','终结技'),'QTE':C('지원 스킬','Support Skill','支援スキル','支援技'),'Passive':C('패시브','Passive','パッシブ','被动')}
PROVIDER_BASIS=C('Kaiden Lv.1–80 기초표 · 장비·각성·콘솔의 별도 효과 미합산','Kaiden level1–80 base table; separate equipment, awakening and console effects are not added','Kaiden Lv.1–80基礎表・装備/覚醒/コンソールの別効果は加算しない','Kaiden1–80级基础表；未加算装备、觉醒与控制台独立效果')
CLIENT_BASIS=C('Global1.4.5 추출 클라이언트의 기초 필드 · 장비·각성·콘솔 미합산','Raw base fields in extracted Global1.4.5 client; no equipment, awakening or console additions','Global1.4.5抽出クライアント基礎フィールド・装備/覚醒/コンソール加算なし','Global1.4.5提取客户端基础字段；未加算装备、觉醒和控制台')
SKILL_BASIS=C('Global1.4.5 클라이언트 명시 계수 · 스킬 Lv.1–13 · 장비·각성 미합산 · 최종 피해량 아님','Declared Global1.4.5 client coefficients, skill levels1–13; no equipment/awakening additions; not final damage','Global1.4.5クライアント明記係数・スキルLv.1–13・装備/覚醒加算なし・最終ダメージではない','Global1.4.5客户端明示系数，技能1–13级；未加算装备/觉醒，非最终伤害')
def enrich(game,document,cache_dir,offline=False,zero_gender="female",include_variants=True):
 if game!='nte':return document,{'status':'skipped','gameId':game}
 doc=copy.deepcopy(document);s=Sources(cache_dir,offline);notes=[];asset_file=ROOT/'nte-detail-assets.json';asset_meta=json.loads(asset_file.read_text())if asset_file.exists()else{};asset_index=asset_meta.get('assets',{});extra_sections={};raw={k:rows(s.json(p))for k,p in PATHS.items()};loc={l:s.json('Localization/'+{'zh':'zh-CN'}.get(l,l)+'/game.json')for l in LOCALES}
 if len(raw['characters'])<25 or len(raw['abilities'])<24 or len(raw['damage'])<800:raise ValueError('Partial client source inventory')
 def native(v,l):
  if not isinstance(v,dict):return''
  if v.get('CultureInvariantString'):return clean(v['CultureInvariantString'])
  ns=v.get('TableId','').split('/')[-1].split('.')[0]
  return clean(loc[l].get(ns,{}).get(v.get('Key'),''))
 def text(v):return {l:native(v,l)for l in LOCALES}
 by_name=collections.defaultdict(list)
 for cid,c in raw['characters'].items():
  if c.get('bIsManual')or cid in ('1046','1051'):by_name[native(c['ItemName'],'en')].append((cid,c))
 curves=collections.defaultdict(list)
 for cn in CURVE_NAMES:
  p='DataTable/Skill/GlobalCharacterData/DT_'+cn+'EffectFigure.json'
  try:
   for k,v in rows(s.json(p)).items():curves[k].append((p,v))
  except Exception as e:notes.append('Curve source unavailable '+p+': '+str(e))
 def curve_values(name):
  found=[]
  for path,c in curves.get(name,[]):
   keys=c.get('Keys',[])
   if not keys:continue
   values=[]
   for lv in range(1,14):
    exact=next((x['Value']for x in keys if x['Time']==lv),None)
    if exact is None:
     prev=[x for x in keys if x['Time']<=lv];after=[x for x in keys if x['Time']>lv]
     if not prev:break
     a=max(prev,key=lambda x:x['Time'])
     if c.get('InterpMode')=='ERichCurveInterpMode::RCIM_Constant'or not after:exact=a['Value']
     elif c.get('InterpMode')=='ERichCurveInterpMode::RCIM_Linear':
      b=min(after,key=lambda x:x['Time']);exact=a['Value']+(b['Value']-a['Value'])*(lv-a['Time'])/(b['Time']-a['Time'])
     else:break
    values.append(exact)
   if len(values)==13:found.append(values)
  if not found or any(v!=found[0]for v in found):raise ValueError('Missing/ambiguous source curve '+name)
  return found[0]
 def coefficient(v,l):
  lu=v.get('LevelUpData')or{};kind=lu.get('LevelUpGESourceType','');arrays=[]
  if kind in ['ELevelUpGESourceType::UseGEDamageType','ELevelUpGESourceType::UseGEDefType','ELevelUpGESourceType::UseGEHPType']:
   listkey,field={'ELevelUpGESourceType::UseGEDamageType':('DamageGEList','AtkRateBaseArray'),'ELevelUpGESourceType::UseGEDefType':('DefGEList','DefRateBaseArray'),'ELevelUpGESourceType::UseGEHPType':('HPGEList','HPRateBaseArray')}[kind]
   for ge in lu.get(listkey,[]):
    a=raw['damage'].get(ge,{}).get(field,[])
    if len(a)<13:raise ValueError('Incomplete source damage array '+ge)
    arrays.append([fmt(x,True)for x in a[:13]])
  else:
   for a in lu.get('EffectFigureDataList',[]):arrays.append([fmt(x,a.get('bIsPercent',False))for x in curve_values(a['NameID'])])
   if not arrays and v.get('CLGlobalCommonDataCurveID')not in [None,'None','']:
    arrays.append([fmt(x)for x in curve_values(v['CLGlobalCommonDataCurveID'])])
  template=native(v.get('DescValue'),l)
  refs=[int(x)for x in re.findall(r'\{(\d+)\}',template)]
  if template and not refs and re.search(r'\d',template):return [template]*13
  if not template or not arrays or not refs or max(refs)>=len(arrays):raise ValueError('Unbound source coefficient template')
  return [re.sub(r'\{(\d+)\}',lambda m:arrays[int(m[1])][lv],template)for lv in range(13)]
 identity={};coverage=[]
 for c in doc['characters']:
  matches=by_name[c['name']['en']]
  if c['name']['en']=='Zero':matches=[x for x in matches if x[0]==('1046'if zero_gender=='male'else'1051')]
  if len(matches)!=1:raise ValueError('Missing/ambiguous playable source identity '+c['name']['en'])
  cid,cr=matches[0];identity[c['id']]=cid;c['name']=text(cr['ItemName']);c['nameSources']={l:{'url':RAW+'Localization/'+{'zh':'zh-CN'}.get(l,l)+'/game.json','kind':'community'}for l in LOCALES}
  e=cr['ElementData'];pack=next((v for k,v in raw['packs'].items()if k.casefold()==e['PropModifyID'].casefold()),None)
  if not pack:raise ValueError('Missing exact base pack '+e['PropModifyID'])
  extra=[]
  for prop,sid,percent in [('CritBase','crit_rate',True),('CritDamageBase','crit_dmg',True),('ChargeMax','energy_cap',False),('ChargeGetEfficiencyBase','energy_efficiency',True)]:
   v=pack.get(prop)
   if not isinstance(v,(int,float))or v<0:continue
   extra.append({'id':sid,'label':LABELS[sid],'value':fmt(v,percent)+('%'if percent else''),'basis':CLIENT_BASIS})
  c['stats']=[x for x in c.get('stats',[])if x['id']not in {x['id']for x in extra}]+extra
  url=c['sourceUrl'];slug={'Akane Rin':'akane'}.get(c['name']['en'],c['name']['en'].lower());url='https://www.kaiden.gg/nte/characters/'+slug+'/'
  try:
   body=s.get(url,'kaiden').decode();dom=DOM(body).root;h=dom.find(lambda n:n.tag=='h1')
   if not h or not h.text().lower().startswith('akane'if slug=='akane'else c['name']['en'].lower()):raise ValueError('Kaiden detail identity mismatch')
   node=dom.find(lambda n:n.attrs.get('id')=='nte-stats-container');table=json.loads(node.attrs['data-stats']);levels=[r['level']for r in table]
   if levels!=list(range(1,81))or any(not all(isinstance(r[k],(int,float))and r[k]>0 for k in ['hp','atk','def'])for r in table):raise ValueError('Partial provider progression')
   c['statProgression']={'sourceUrl':url,'sourceKind':'community','basis':PROVIDER_BASIS,'stats':[{'id':k,'label':LABELS[k]}for k in ['hp','atk','def']],'rows':[{'level':r['level'],'values':{k:fmt(r[k])for k in ['hp','atk','def']}}for r in table]}
   for st in c['stats']:
    if st['id']in ['hp','atk','def']:st['value']=fmt(table[-1][st['id']]);st['basis']=C('Kaiden Lv.80 기초표 표시값 · 별도의 장비·각성·콘솔 효과 미합산','Kaiden Lv.80 base table values; no separate equipment/awakening/console effect added','Kaiden Lv.80基礎表の表示値・装備/覚醒/コンソールの別効果は加算しない','Kaiden80级基础表显示值；未额外加算装备/觉醒/控制台效果')
   h=dom.find(lambda n:n.tag=='h3'and n.text()=='Console');panel=h.parent if h else None
   spec=panel.find(lambda n:n.tag=='p'and n.text()=='Specialization')if panel else None
   value=spec.parent.text()if spec else'';match=re.fullmatch(r'Specialization\s*Type (I+) Increases (.+?) by ([0-9.]+)% for each Type \1 Module equipped\.',value)
   slots=re.search(r'(\d+) total slots',panel.text())if panel else None
   metrics={'ATK':LABELS['atk'],'DEF':LABELS['def'],'HP':LABELS['hp'],'Crit Rate':LABELS['crit_rate'],'Crit DMG':LABELS['crit_dmg'],'Cosmos DMG Bonus':C('빛 속성 피해 보너스','Cosmos DMG Bonus','光属性ダメージボーナス','光属性伤害加成'),'Chaos DMG Bonus':C('암 속성 피해 보너스','Chaos DMG Bonus','暗属性ダメージボーナス','暗属性伤害加成'),'Incantation DMG Bonus':C('주 속성 피해 보너스','Incantation DMG Bonus','呪属性ダメージボーナス','咒属性伤害加成')}
   if match and slots and match[2]in metrics:
    ty,metric,num=match.groups();v=metrics[metric];n=slots[1]
    body=C(f'{n}칸. {ty}형 모듈 1개를 장착할 때마다 {v["ko"]} +{num}%. 모듈 장착 효과로 기초 능력치와 별도 적용.',f'{n}slots. Each Type{ty}module grants {v["en"]} +{num}%. Separate equipment effect, not included in base stats.',f'{n}マス。タイプ{ty}モジュール1個につき{v["ja"]}+{num}%。基礎値とは別の装備効果。',f'{n}槽位。每个{ty}型模块使{v["zh"]}+{num}%。独立装备效果，未计入基础数值。')
    extra_sections[c['id']]=[{'id':'nte-console','title':C('콘솔 특화','Console specialization','コンソール特化','控制台专精'),'body':body}]

  except Exception as ex:notes.append(c['id']+' progression: '+str(ex))
  st=[];sections=[];skipped=[]
  ac=raw['abilities'].get(cid,{})
  for a in ac.get('CharacterAbilityList',[]):
   aid=a['Key'];tip=raw['tips'].get(aid)
   if not tip:skipped.append(aid+': missing tips');continue
   vals=[]
   for i,v in enumerate(tip.get('GALevelUpArray',[])):
    try:
     levels=coefficient(v,'en');label=text(v['Desc'])
     if not all(label.values()):raise ValueError('Missing native metric label')
     vals.append({'id':str(i),'label':label,'levels':levels})
    except Exception as ex:skipped.append(aid+'/'+str(i)+': '+str(ex))
   if vals:
    kind=next((k for k in ['UltraSkill','Melee','Skill','QTE']if aid.endswith('_'+k)),'Skill')
    st.append({'id':aid,'name':text(tip['Name']),'type':TYPES[kind],'nameLocale':'ko','sourceUrl':RAW+PATHS['tips'],'sourceKind':'community','basis':SKILL_BASIS,'values':vals})
  for entry in st:
   tip=raw['tips'].get(entry['id'],{});asset=(tip.get('icon')or{}).get('AssetPathName','');path=asset_index.get(asset)
   if path:entry['icon']=RAW+path
  if st:c['skillTables']=st
  # Only mechanically descriptive passives. No flavor-text/AFFIX paragraphs.
  for a in ac.get('PassiveAbilityList',[]):
   aid=a['Key'];tip=raw['tips'].get(aid,{})
   for i,d in enumerate(tip.get('AbilityDescription',[])):
    if d.get('AbilityDesType')!='EAbilityDesType::ADT_DES':continue
    bodies=text(d.get('ShortDescription'))
    if not all(bodies.values()):bodies=text(d.get('Description'))
    if not all(bodies.values())or any(re.search(r'\{[^}]+\}',b)for b in bodies.values()):continue
    sections.append({'id':'client-passive:'+aid+':'+str(i),'title':text(tip['Name']),'body':bodies})
  passive_count=len(sections)
  awaken_path=asset_meta.get('awakenTables',{}).get(cid)
  if awaken_path:
   try:
    awaken=rows(s.json(awaken_path)).get(cid)
    if not awaken:raise ValueError('Awakening source identity missing')
    for v in awaken.get('AwakenEffectStructList',[]):
     title,bodies=text(v['Title']),text(v['Desc'])
     if not all(title.values())or not all(bodies.values())or any(re.search(r'\{[^}]+\}',b)for b in bodies.values()):notes.append(cid+' awakening omitted incomplete/unbound locale: '+v['EffectID']);continue
     sections.append({'id':'client-awakening:'+cid+':'+v['EffectID'],'title':title,'body':bodies})
   except Exception as ex:notes.append(cid+' awakening: '+str(ex))
  sections+=extra_sections.get(c['id'],[])
  if sections:c['sections']=[x for x in c.get('sections',[])if not x['id'].startswith(('client-passive:','client-awakening:','nte-console'))]+sections
  # Native element/compatibility labels; old provider role labels remain distinct.
  aliases={}
  for key,v in loc['en'].get('ST_Common',{}).items():
   if key.startswith('character_reactionelementtype_'):aliases[v]={l:clean(loc[l].get('ST_Common',{}).get(key,''))for l in LOCALES}
  for key,v in loc['en'].get('ST_Ui',{}).items():
   if key.startswith('item_fork_type_'):aliases[v]={l:clean(loc[l].get('ST_Ui',{}).get(key,''))for l in LOCALES}
  labels={'element':C('속성','Element','属性','属性'),'role':C('역할','Role','役割','定位'),'arcCompatibility':C('아크 유형','Arc type','アークタイプ','弧盘类型'),'rank':C('등급','Rank','ランク','等级')}
  for t in c.get('traits',[]):
   if t['id']in labels:t['label']=labels[t['id']]
   if t['value'].get('en')in aliases:t['value']=aliases[t['value']['en']]
   if t['id']in ['element','arcCompatibility']:
    table,tf,ic=('elements','ElementName','ElementBGIcon')if t['id']=='element'else('forks','TypeName','TypeIcon')
    match=next((r for r in raw[table].values()if native(r.get(tf),'en')==t['value'].get('en')),None)
    if match:
     path=asset_index.get((match.get(ic)or{}).get('AssetPathName',''))
     if path:t['icon']=RAW+path
   roles={'Damage':C('공격','Damage','攻撃','输出'),'Buff':C('버프','Buff','強化','增益'),'Survival':C('생존','Survival','生存','生存')}
   if t['id']=='role'and t['value'].get('en')in roles:t['value']=roles[t['value']['en']]
   if t['id']=='rank':t['value']={l:t['value']['en']for l in LOCALES}
  grade={'EItemQuality::ITEM_QUALITY_ORANGE':'S','EItemQuality::ITEM_QUALITY_PURPLE':'A'}.get(cr['ItemQuality'])
  rank=next((t['value']['en']for t in c.get('traits',[])if t['id']=='rank'),'')
  if grade and grade==rank:c['rarityLabel']=grade;c['rarity']=5 if grade=='S'else 4
  coverage.append({'id':c['id'],'clientId':cid,'name':c['name']['en'],'progressionRows':len(c.get('statProgression',{}).get('rows',[])),'skillTables':len(st),'skillValues':sum(len(t['values'])for t in st),'passives':passive_count,'awakening':sum(x['id'].startswith('client-awakening:')for x in sections),'console':sum(x['id']=='nte-console'for x in sections),'omittedCoefficientRows':skipped})
 doc['sourceUrls']=list(dict.fromkeys(doc['sourceUrls']+[RAW+'README.md',RAW+PATHS['characters'],RAW+PATHS['packs'],RAW+PATHS['tips'],RAW+PATHS['damage']]))[:40]
 zero_evidence=None
 if include_variants:
  male,male_report=enrich(game,document,cache_dir,offline=True,zero_gender='male',include_variants=False)
  z=next(c for c in doc['characters']if c['name']['en']=='Zero');m=next(c for c in male['characters']if c['name']['en']=='Zero')
  z['variantDetails']={key:{'sourceId':cid,'stats':v.get('stats',[]),'skillTables':v.get('skillTables',[]),'sections':v.get('sections',[])}for key,cid,v in [('male','1046',m),('female','1051',z)]}
  zero_evidence={'maleSourceId':'1046','femaleSourceId':'1051','sameBasePack':raw['characters']['1046']['ElementData']['PropModifyID']==raw['characters']['1051']['ElementData']['PropModifyID'],'sameUpgradePack':raw['characters']['1046']['ElementData']['UpgradeModifyPackId']==raw['characters']['1051']['ElementData']['UpgradeModifyPackId'],'sameBreakthroughPack':raw['characters']['1046']['ElementData']['BreakthroughPackId']==raw['characters']['1051']['ElementData']['BreakthroughPackId'],'mechanicalCoefficientsEquivalent':m['skillTables']==z['skillTables'],'default':'female','note':'Base/growth pointers identical; source ability IDs and coefficient expressions differ, so each gender has separate source-bound skill tables.'}
 return doc,{'gameId':'nte','zeroVariants':zero_evidence,'sourceRef':REF,'version':'1.4.5 Global','identity':identity,'coverage':coverage,'notes':notes,'sources':s.receipts,'providerDiscrepancy':'Neverness Adler80 8638/272/600; Kaiden13122/382/912. Primary base/growth/stage composition not asserted. Retained Kaiden explicit-provider level table; raw client critical and energy fields have their own basis.'}
def main():
 p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--output-dir',required=True);p.add_argument('--cache-dir',required=True);p.add_argument('--offline',action='store_true');a=p.parse_args();out=pathlib.Path(a.output_dir);out.mkdir(parents=True,exist_ok=True);doc=json.load(open(a.input));result,report=enrich('nte',doc,a.cache_dir,a.offline);(out/'nte.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');(out/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:sum(c[k]for c in report['coverage'])for k in ['progressionRows','skillTables','skillValues','passives']}))
if __name__=='__main__':main()
