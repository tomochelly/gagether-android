"""Native Korean Trickcal tables, scoped to KR; no production writes.
collect(roster, fetch(url)->bytes) returns patches/additions/audit.
"""
import copy,concurrent.futures,html,json,re,unicodedata,urllib.parse
from html.parser import HTMLParser
SEED='https://namu.wiki/w/'+urllib.parse.quote('앨리스(트릭컬 리바이브)')
INDEX='https://wikiwiki.jp/thetrickal/'+urllib.parse.quote('使徒一覧/未実装込み版',safe='/')
L=lambda ko='',en='',ja='',zh='':dict(ko=ko,en=en,ja=ja,zh=zh)
N=lambda s:re.sub(r'[^a-z0-9]','',str(s).casefold())
K=lambda s:re.sub(r'[^가-힣a-z0-9]','',str(s).casefold())
ALIASES={'annette':'arnet','benny':'benibeni','caesar':'scizor','dianaheyday':'dianayester','raika':'laika','ricotta':'ricota','rollet':'rollett','shuro':'suro','xxionxx':'xxionx'}
EXTRA={'Kyuri','Patula','Daya (Pure Shine)','Ronnie','Maison','Mynx','Veroo','Aurora'}
KRONLY={'Daya (Pure Shine)','Ronnie','Aurora'}
TR_LABELS={'role':L('역할','Role','役割','职责'),'position':L('배치','Position','配置','站位'),'personality':L('성격','Personality','性格','性格'),'faction':L('종족','Faction','種族','种族'),'damage':L('공격 방식','Damage type','攻撃タイプ','伤害类型')}
TR_VALUES={k:L(ko,k,ja,zh)for k,ko,ja,zh in [('DPS','딜러','攻撃','输出'),('Support','서포터','支援','辅助'),('Tank','탱커','守備','坦克'),('Front','전열','前列','前排'),('Mid','중열','中列','中排'),('Back','후열','後列','后排'),('All','전열 · 중열 · 후열','全列','全体站位'),('Composed','냉정','冷静','冷静'),('Depressed','우울','憂鬱','忧郁'),('Innocent','순수','純粋','纯真'),('Mad','광기','狂気','疯狂'),('Resonance','공명','共鳴','共鸣'),('Vivacious','활발','活発','活泼'),('Dragon','용족','竜族','龙族'),('Elemental','정령','精霊','精灵'),('Elf','엘프','エルフ','精灵族'),('Mystic','미스틱','ミスティック','神秘'),('Phantom','유령','幽霊','幽灵'),('Sprite','요정','妖精','妖精'),('Werebeast','수인','獣人','兽人'),('Witch','마녀','魔女','魔女'),('Magical','마법','魔法','魔法'),('Physical','물리','物理','物理')]}
JP_VALUES={v['ja']:k for k,v in TR_VALUES.items()};JP_VALUES['ミスティック']='Mystic'
def traits_for(c,v=None):
 ts=copy.deepcopy(c.get('traits',[]))
 if not ts and v:
  ts=[{'id':tid,'label':L(),'value':L(en=JP_VALUES.get(v[ix],''),ja=v[ix])}for tid,ix in [('personality',4),('role',5),('position',6),('faction',7),('damage',8)]]
 for t in ts:
  if t['id']in TR_LABELS:t['label']=TR_LABELS[t['id']]
  if t['value'].get('en')in TR_VALUES:t['value']=TR_VALUES[t['value']['en']]
 return ts
class Page(HTMLParser):
 def __init__(self):super().__init__();self.out=[];self.skip=0;self.link=None;self.linktext='';self.links={};self.tables=[];self.row=None;self.cell=None
 def handle_starttag(self,t,a):
  a=dict(a)
  if t in ['script','style']:self.skip+=1
  if t=='a':self.link=a.get('href');self.linktext=''
  if t=='tr':self.row=[]
  if t in ['td','th']:self.cell=''
 def handle_data(self,s):
  if not self.skip:self.out.append(s)
  if self.link:self.linktext+=s
  if self.cell is not None:self.cell+=s
 def handle_endtag(self,t):
  if t in ['script','style']and self.skip:self.skip-=1
  if t=='a'and self.link:
   if self.link.startswith('/w/'):self.links.setdefault(self.linktext.strip(),self.link)
   self.link=None
  if t in ['td','th']and self.cell is not None:
   if self.row is not None:self.row.append(self.cell.strip())
   self.cell=None
  if t=='tr'and self.row is not None:self.tables.append(self.row);self.row=None
class Skills(HTMLParser):
 def __init__(self):super().__init__();self.skip=0;self.h=None;self.htext='';self.active=False;self.finished=False;self.lines=[]
 def handle_starttag(self,t,a):
  if t in ['script','style']:self.skip+=1
  if t in ['h2','h3']:
   if self.active:self.active=False;self.finished=True
   self.h=t;self.htext=''
  if self.active and t in ['br','p','tr','div']:self.lines.append('\n')
 def handle_data(self,s):
  if self.skip:return
  if self.h:self.htext+=s
  elif self.active:self.lines.append(s)
 def handle_endtag(self,t):
  if t in ['script','style']and self.skip:self.skip-=1
  if t==self.h:
   if not self.finished and re.fullmatch(r'\s*\d+(?:\.\d+)+\.\s*스킬\s*(?:\[편집\])?\s*',self.htext):self.active=True
   self.h=None;self.htext=''
  if self.active and t in ['p','tr','div']:self.lines.append('\n')
LABELS={'hp':('HP','HP','HP','生命值'),'sp':('SP','SP','SP','SP'),'physical-atk':('물리 공격력','Physical ATK','物理攻撃力','物理攻击'),'magic-atk':('마법 공격력','Magic ATK','魔法攻撃力','魔法攻击'),'physical-def':('물리 방어력','Physical DEF','物理防御力','物理防御'),'magic-def':('마법 방어력','Magic DEF','魔法防御力','魔法防御'),'critical':('치명타','CRIT Hit','会心','暴击'),'critical-damage':('치명 피해','CRIT DMG','会心ダメージ','暴击伤害'),'critical-resist':('치명타 저항','CRIT Resistance','会心抵抗','暴击抗性'),'critical-damage-resist':('치명 피해 저항','CRIT DMG Resistance','会心ダメージ抵抗','暴击伤害抗性')}
def parse_stats(body):
 p=Page();p.feed(body);s=re.sub(r'\s+',' ',' '.join(p.out));level=re.search(r'Lv\.\s*100\s*기준',s)
 if not level:raise ValueError('No explicit Lv.100 basis')
 area=s[level.end():][:1000];basis=L('한국 서비스 · Lv.100 · 위키 기본 정보','Korean service · Lv.100 · wiki basic stats','韓国サービス・Lv.100・Wiki基本情報','韩国服务器 · Lv.100 · 维基基础信息');stats=[]
 for ident,label in LABELS.items():
  m=re.search(re.escape(label[0])+r'\s*([\d,]+)',area)
  if not m:raise ValueError('Numeric cell absent: '+ident)
  stats.append(dict(id=ident,label=dict(zip(['ko','en','ja','zh'],label)),value=m[1].replace(',',''),basis=basis))
 return stats

def parse_skills(body):
 p=Skills();p.feed(body);s=''.join(p.lines);s=re.sub(r'파일:[^\s]+','',s);s=re.sub(r'\[\d+\]','',s);s=re.sub(r'[^\S\n]+',' ',s);s=re.sub(r' *\n+ *','\n',s).strip()
 if not s or not any(x in s for x in ['피해','회복','증가','감소','효과']):return []
 hits=[]
 for ident,label in [('low','저학년 스킬'),('high','고학년 스킬'),('normal','일반 공격')]:
  m=re.search(re.escape(label),s)
  if m:hits.append((m.start(),m.end(),ident,label))
 hits.sort();out=[]
 for i,(start,end,ident,label)in enumerate(hits):
  text=s[end:hits[i+1][0]if i+1<len(hits)else len(s)].strip()
  if text and len(text)<=3000:out.append(dict(id='native-skill-'+ident,title=L(label),body=L(text),regions=['kr']))
 return out

def text(fetch,url):
 raw=fetch(url)
 if isinstance(raw,bytes):return raw.decode('utf-8')
 if isinstance(raw,str):return raw
 raise ValueError('Invalid source bytes')
def collect(roster,fetch):
 body=text(fetch,SEED);seed=Page();seed.feed(body);links={}
 for label,url in seed.links.items():
  decoded=urllib.parse.unquote(url[3:]).split('#')[0].replace('(트릭컬 리바이브)','').replace('/','')
  if decoded:links.setdefault(K(decoded),'https://namu.wiki'+url)
  if label and re.search('[가-힣]',label):links.setdefault(K(label),'https://namu.wiki'+url)
 page=Page();page.feed(text(fetch,INDEX));table=[v for v in page.tables if len(v)==13 and re.search('[가-힣]',v[11])]
 if len(table)<125:raise ValueError('Counterpart table truncated')
 by={N(v[12]):v for v in table};patches={};used=set();rows=[];unmatched=[]
 for c in roster['characters']:
  norm=N(c['name']['en']);v=by.get(ALIASES.get(norm,norm));ko=v[11]if v else c['name']['ko']
  if v:used.add(N(v[12]))
  if not ko or not re.search('[가-힣]',ko):unmatched.append(c['id']);continue
  patch={'ko':ko,'name':{**c['name'],'ko':ko},'sourceUrl':INDEX if v else SEED,'method':'community','traits':traits_for(c,v)}
  if c['id']=='lethe'and v and v[9].strip():patch['regions']=list(dict.fromkeys(c.get('regions',['kr'])+['global']))
  if v and v[9].strip():patch['name']['ja']=v[2].rstrip('?')
  patches[c['id']]=patch;rows.append({**c,'name':{**c['name'],'ko':ko}})
 additions=[]
 for v in table:
  if v[12]not in EXTRA or N(v[12])in used:continue
  ident='trickcal:wikiwiki:'+re.sub('[^a-z0-9]+','-',v[12].lower()).strip('-')
  rarity=int(re.sub(r'\D','',v[3]));a=dict(id=ident,name=L(v[11],v[12],v[2].rstrip('?')if v[9].strip()else''),rarity=rarity,regions=['kr']if v[12]in KRONLY else['kr','global'],sourceUrl=INDEX,sourceKind='community')
  a['traits']=traits_for(a,v);additions.append(a);rows.append(a)
 def one(c):
  ko=c['name']['ko'];url=links.get(K(ko))
  if not url:return c['id'],None,{'id':c['id'],'name':ko,'error':'No declared exact native link'}
  try:
   htmlbody=body if url==SEED else text(fetch,url);p={'sourceUrl':url,'method':'community','ko':ko};errors=[]
   try:p['regionalStats']={'kr':parse_stats(htmlbody)}
   except Exception as e:errors.append(str(e))
   sections=parse_skills(htmlbody)
   if sections:p['sections']=sections
   return c['id'],p,{'id':c['id'],'name':ko,'sourceUrl':url,'stats':bool(p.get('regionalStats')),'skills':len(sections),'errors':errors}
  except Exception as e:return c['id'],None,{'id':c['id'],'name':ko,'sourceUrl':url,'error':type(e).__name__+': '+str(e)}
 reports=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
  for ident,p,report in pool.map(one,rows):
   if p:patches[ident]={**patches.get(ident,{}),**p}
   reports.append(report)
 # Supplemental identities carry their own KR facts too.
 for a in additions:
  p=patches.get(a['id'],{})
  for k in ['regionalStats','sections']:
   if p.get(k):a[k]=p[k]
 return {'patches':patches,'additions':additions,'audit':{'sourceUrls':[SEED,INDEX],'originalCount':len(roster['characters']),'nativeTable':len(table),'koNames':len(patches),'stats':sum(bool(p.get('regionalStats'))for p in patches.values()),'skillCharacters':sum(bool(p.get('sections'))for p in patches.values()),'unmatchedIds':unmatched,'newSourceCandidates':[{'ko':v[11],'en':v[12],'sourceUrl':INDEX}for v in table if N(v[12])not in used and v[12]not in EXTRA],'reports':reports}}

if __name__=='__main__':
 import argparse,pathlib,urllib.request
 p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--output',required=True);a=p.parse_args()
 data=json.load(open(a.input));roster=next(r for r in data if r['gameId']=='trickcal')if isinstance(data,list)else data
 def fetch(url):
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-CharacterCollector/1.0'}),timeout=40)as r:return r.read(30000001)
 pathlib.Path(a.output).write_text(json.dumps(collect(roster,fetch),ensure_ascii=False,indent=2)+'\n')

