#!/usr/bin/env python3
"""Read only DNA/Stella source enrichment. Python stdlib, Node+TypeScript for inert official JS.
Run: python enrich_d.py --input-dir normalized --output-dir enriched
Failed source/character reads preserve the input's accepted values. No publishing or credentials.
"""
from __future__ import annotations
import argparse,concurrent.futures,copy,datetime,hashlib,html,json,pathlib,re,struct,subprocess,os,urllib.request,urllib.parse,urllib.error
HERE=pathlib.Path(__file__).resolve().parent
LOCALES=('ko','en','ja','zh')
def copy4(ko,en,ja,zh):return dict(zip(LOCALES,[ko,en,ja,zh]))
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')
def canonical(d):return {k:v for k,v in d.items()if k!='checkedAt'}
def write(path,v):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
class Reader:
 def __init__(self,out):self.out=pathlib.Path(out);self.raw=self.out/'source-cache';self.raw.mkdir(parents=True,exist_ok=True);self.receipts=[];self.cache={}
 def get(self,url):
  key=hashlib.sha256(url.encode()).hexdigest();path=self.raw/key
  if key in self.cache:return self.cache[key]
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-public-roster-enrichment/1.0','Accept':'text/html,application/json,application/javascript,image/*,*/*;q=0.5'}),timeout=35)as r:
    if r.status!=200:raise ValueError('Expected HTTP200')
    data=r.read(25*1024*1024+1)
    if len(data)>25*1024*1024:raise ValueError('Oversize source')
   path.write_bytes(data);self.cache[key]=data;self.receipts.append({'url':url,'status':'ok','sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'fetchedAt':now()});return data
  except Exception as e:self.receipts.append({'url':url,'status':'failed','error':str(e),'checkedAt':now()});raise
 def text(self,url):return self.get(url).decode('utf-8')
 def json(self,url):return json.loads(self.get(url))
def dimensions(data):
 if data[:8]==b'\x89PNG\r\n\x1a\n':return struct.unpack('>II',data[16:24])
 if data[:4]==b'RIFF'and data[8:12]==b'WEBP':
  kind=data[12:16]
  if kind==b'VP8X':return 1+int.from_bytes(data[24:27],'little'),1+int.from_bytes(data[27:30],'little')
  if kind==b'VP8 ':
   i=data.index(b'\x9d\x01\x2a');return struct.unpack('<HH',data[i+3:i+7])
  if kind==b'VP8L':
   bits=int.from_bytes(data[21:25],'little');return (bits&16383)+1,((bits>>14)&16383)+1
 raise ValueError('Unknown original image format')
def srcurl(data,needle):
 urls=re.findall(r'https://[^"\s<>]+',data)
 hits=[html.unescape(u)for u in urls if needle in u]
 if not hits:raise ValueError('Declared source chunk missing: '+needle)
 return hits[0]
DNA_HOME='https://duetnightabyss.dna-panstudio.com/ko/'
DNA_DB='https://duetnightabyss.th.gl/ko/db/characters/'
DNA_BASE_LABELS={
 'HP (Lv 1)':('hp',copy4('체력','HP','HP','生命值')),
 'Shield (Lv 1)':('shield',copy4('실드','Shield','シールド','护盾')),
 'ATK (Lv 1)':('atk',copy4('공격력','ATK','攻撃力','攻击力')),
 'DEF':('def',copy4('방어력','DEF','防御力','防御力')),
 'Max Sanity':('sanity',copy4('최대 정신력','Max Sanity','最大精神力','最大神智'))}
DNA_BASIS=copy4('TH.GL 원문 기본 수치: 체력·실드·공격력 Lv.1, 방어력·정신력은 원문 기본값.','TH.GL source base values: HP, Shield and ATK at Lv.1; DEF and Sanity are source defaults.','TH.GL原文の基本値：HP・シールド・攻撃力はLv.1、防御力・精神力は原文の基本値。','TH.GL原文基础数值：生命、护盾及攻击为Lv.1，防御与神智为来源默认值。')
DNA_TRAITS={'Element':('element',copy4('속성','Element','属性','属性')),'Faction':('faction',copy4('소속','Faction','所属','阵营')),'Weapon Mastery':('weapon-mastery',copy4('숙련 무기','Weapon Mastery','得意武器','精通武器'))}
def dna_page(reader,row):
 url=DNA_DB+urllib.parse.quote(row['id']);s=reader.text(url)
 if 'href="'+url+'"'not in s or '<title>'+row['name']['ko']not in s:raise ValueError('Character page identity mismatch: '+row['id'])
 pairs=dict((html.unescape(re.sub('<[^>]+>','',a)).strip(),html.unescape(re.sub('<[^>]+>','',b)).strip())for a,b in re.findall(r'<div class="flex items-center gap-1 text-\[10px\][^>]*>(.*?)</div><div class="text-sm font-medium text-slate-100">(.*?)</div>',s,re.S))
 stats=[]
 for label,(sid,native)in DNA_BASE_LABELS.items():
  value=pairs.get(label)
  if value is None or not re.fullmatch(r'[0-9]+(?:\.[0-9]+)?',value):raise ValueError('Missing numeric base stat '+label)
  stats.append({'id':sid,'label':native,'value':value,'basis':DNA_BASIS})
 traits=[]
 for label,(tid,native)in DNA_TRAITS.items():
  if label!='Element':continue
  elements={'물 속성':copy4('물','Hydro','水','水'),'바람 속성':copy4('바람','Anemo','風','风'),'번개 속성':copy4('번개','Electro','雷','雷'),'불 속성':copy4('불','Pyro','火','火'),'빛 속성':copy4('빛','Lumino','光','光'),'어둠 속성':copy4('어둠','Umbro','闇','暗')}
  if pairs.get(label)in elements:traits.append({'id':tid,'label':native,'value':elements[pairs[label]]})
 return stats,traits,url

def dna(reader,doc,out):
 warnings=[];assets=[];result=copy.deepcopy(doc);source_urls=[]
 # Read the Korean official page before community details.
 try:
  home=reader.text(DNA_HOME);main=srcurl(home,'/resource_assets/index-');maintext=reader.text(main)
  protagonist=srcurl(maintext,'/resource_assets/protagonist-');rolemodule=srcurl(maintext,'/resource_assets/RoleWeaponPage-');roletext=reader.text(rolemodule);protext=reader.text(protagonist)
  if '/imgs/role/pc/detail/role-${'not in roletext:raise ValueError('Official role image expression changed')
  mapping=re.findall(r'index:(\d+),id:"([^"]+)",name:e\("role\.([^".]+)\.name"\)',protext)
  if len(mapping)<29 or len({r[1]for r in mapping})!=len(mapping):raise ValueError('Official role mapping incomplete or duplicated')
  js=out/'official-main.js';js.write_text(maintext);literal=out/'official-role-literals.json';ts=os.environ.get('TYPESCRIPT_PATH')or str(pathlib.Path.cwd()/'node_modules/typescript/lib/typescript.js')
  subprocess.run(['node',str(HERE/'extract_dna_literals.mjs'),str(js),str(literal),ts],check=True,capture_output=True,text=True)
  roles=json.loads(literal.read_text());en=next(r for r in roles if r['Berenica']['name']=='Berenica')
  by_name={r['name']['en']:r for r in result['characters']}
  if len(by_name)!=len(result['characters']):raise ValueError('Input English names not unique')
  cdn=main.split('/resource_assets/')[0]
  def getart_unchecked(m):
   _,slug,key=m;name=en[key]['name'];row=by_name.get(name)
   if not row:return {'sourceRoleId':slug,'sourceRoleKey':key,'status':'unmapped','sourceName':name}
   url=cdn+'/imgs/role/pc/detail/role-'+slug+'.webp';data=reader.get(url);w,h=dimensions(data);sha=hashlib.sha256(data).hexdigest();f=out/'assets'/(sha+'.webp');f.parent.mkdir(exist_ok=True);f.write_bytes(data)
   return {'characterId':row['id'],'sourceRoleId':slug,'sourceRoleKey':key,'sourceName':name,'url':url,'sourceUrl':protagonist,'imageExpressionSourceUrl':rolemodule,'sourceKind':'official','sha256':sha,'bytes':len(data),'width':w,'height':h,'ext':'webp','path':str(f),'status':'ok'}
  def getart(m):
   try:return getart_unchecked(m)
   except Exception as e:return {'sourceRoleId':m[1],'sourceRoleKey':m[2],'status':'failed','error':str(e)}
  with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
   for m,a in zip(mapping,pool.map(getart,mapping)):
    if a['status']=='ok':
     row=next(r for r in result['characters']if r['id']==a['characterId']);row['image']={k:a[k]for k in ['url','sourceUrl','width','height','sourceKind']};row['image'].update(kind='card',locale='neutral',caption=copy4('공식 캐릭터 소개 원본 · 하단 사선 구도','Official character introduction original · diagonal lower crop','公式キャラクター紹介原画・下部は斜めの構図','官方角色介绍原图・下部为斜切构图'));assets.append(a)
    else:warnings.append(a)
  source_urls += [DNA_HOME,main,protagonist,rolemodule]
 except Exception as e:warnings.append({'source':'official-art','error':str(e)})
 def detail(row):
  try:return row['id'],dna_page(reader,row),None
  except Exception as e:return row['id'],None,str(e)
 with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
  for cid,value,error in pool.map(detail,result['characters']):
   if error:warnings.append({'characterId':cid,'source':'community-details','error':error});continue
   stats,traits,url=value;row=next(r for r in result['characters']if r['id']==cid);row['stats']=stats;old={t['id']:t for t in row.get('traits',[])}
   for t in traits:
    if t['id']in old:
     prior=old[t['id']];t['value']={l:t['value'][l]or prior['value'].get(l,'')for l in LOCALES}
    old[t['id']]=t
   row['traits']=list(old.values());row['sourceUrl']=url
 if len(source_urls)+len(result['sourceUrls'])<=40:result['sourceUrls']=list(dict.fromkeys([*result['sourceUrls'],*source_urls]))
 result['coverage']['fullBodyCount']=sum(bool(r.get('image',{}).get('kind')in['full-body','splash'])for r in result['characters'])
 if canonical(result)!=canonical(doc):result['checkedAt']=now()
 return result,warnings,assets
SSBASE='https://raw.githubusercontent.com/JforPlay/sstoy/main/public/data/'
SSBASIS=copy4('sstoy의 원본 Attribute 표 Lv.1·돌파 0 기본값. 디스크·잠재력·재능·빌드 보너스 미포함.','sstoy raw Attribute table, Lv.1 / ascension 0 base values; excludes discs, potentials, talents and build bonuses.','sstoyのAttribute原表、Lv.1・突破0の基礎値。ディスク・潜在・才能・ビルド補正を含まない。','sstoy原始Attribute表Lv.1、突破0基础值，不含唱片、潜能、天赋及构筑加成。')
def stella(reader,doc,out):
 warnings=[];result=copy.deepcopy(doc)
 try:reader.text('https://stellasora.kr/')
 except Exception as e:warnings.append({'source':'korean-official','error':str(e)})
 chars=reader.json(SSBASE+'Character.json');attrs=reader.json(SSBASE+'Attribute.json');enums=reader.json(SSBASE+'GameEnums.json')
 stats_labels={'Hp':('hp',copy4('체력','HP','HP','生命值')),'Atk':('atk',copy4('공격력','ATK','攻撃力','攻击力')),'Def':('def',copy4('방어력','DEF','防御力','防御力')),'CritRate':('crit-rate',copy4('치명타 확률','CRIT Rate','会心率','暴击率')),'CritPower':('crit-damage',copy4('치명타 피해','CRIT DMG','会心ダメージ','暴击伤害'))}
 elements={'1':copy4('물','Water','水','水'),'2':copy4('불','Fire','火','火'),'3':copy4('땅','Earth','地','地'),'4':copy4('바람','Wind','風','风'),'5':copy4('빛','Light','光','光'),'6':copy4('어둠','Dark','闇','暗')}
 classes={'1':copy4('딜러','Vanguard','アタッカー','输出'),'2':copy4('밸런스','Balance','バランス','均衡'),'3':copy4('서포터','Support','サポーター','辅助')}
 for row in result['characters']:
  c=chars.get(row['id'])
  if not c: warnings.append({'characterId':row['id'],'error':'Missing character source ID'});continue
  attr=attrs.get(str(c['AttributeId'])+'00001')
  if not attr or attr.get('lvl')!=1 or str(attr.get('GroupId'))!=str(c['AttributeId']):warnings.append({'characterId':row['id'],'error':'Missing exact Lv.1/phase0 attribute group'});continue
  row['stats']=[{'id':sid,'label':label,'value':str(attr[k]/100).rstrip('0').rstrip('.')+'%'if k in ['CritRate','CritPower']else str(attr[k]),'basis':SSBASIS}for k,(sid,label)in stats_labels.items()if k in attr]
  grade=enums['characterGrade'][str(c['Grade'])];row.update(rarity=grade['stars'],rarityLabel=grade['key'])
  old={x['id']:x for x in row.get('traits',[])if not x['id'].startswith('source-')}
  if str(c['EET'])in elements:old['element']={'id':'element','label':copy4('속성','Element','属性','属性'),'value':elements[str(c['EET'])]}
  if str(c['Class'])in classes:old['class']={'id':'class','label':copy4('역할','Role','役割','职责'),'value':classes[str(c['Class'])]}
  row['traits']=list(old.values())
 result['sourceUrls']=list(dict.fromkeys([*result['sourceUrls'],SSBASE+'Attribute.json',SSBASE+'GameEnums.json','https://github.com/JforPlay/sstoy/blob/main/src/modules/dmgcalc/core/stats.ts']))
 if canonical(result)!=canonical(doc):result['checkedAt']=now()
 return result,warnings,[]
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--input-dir',required=True);ap.add_argument('--output-dir',required=True);args=ap.parse_args();inp=pathlib.Path(args.input_dir);out=pathlib.Path(args.output_dir);out.mkdir(parents=True,exist_ok=True);reader=Reader(out);report={'checkedAt':now(),'games':{}}
 for game,fn in [('dna',dna),('stellasora',stella)]:
  path=inp/(game+'.json')
  if not path.exists():continue
  old=json.loads(path.read_text());work=out/game;work.mkdir(exist_ok=True)
  try:
   doc,warnings,assets=fn(reader,old,work);write(out/(game+'.json'),doc);write(out/(game+'-assets.json'),assets);report['games'][game]={'status':'partial'if warnings else'updated','characters':len(doc['characters']),'stats':sum(bool(c.get('stats'))for c in doc['characters']),'art':sum(bool(c.get('image'))for c in doc['characters']),'warnings':warnings}
  except Exception as e:write(out/(game+'.json'),old);report['games'][game]={'status':'failed','error':str(e),'preservedInput':True}
 write(out/'manifest.json',report);write(out/'source-receipts.json',reader.receipts);print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':main()
