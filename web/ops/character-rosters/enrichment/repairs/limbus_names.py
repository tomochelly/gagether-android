"""Exact native identity names from published KR/EN/JP client text."""
import concurrent.futures,json,re,unicodedata
URLS={l:'https://raw.githubusercontent.com/x1bViolet/Limbus-Localization-Files/'+b+'/Personalities.json'for l,b in [('en','English'),('ko','Korean'),('ja','Japanese')]}
def norm(s):
 s=unicodedata.normalize('NFKD',str(s)).encode('ascii','ignore').decode().casefold();s=re.sub(r'\[|\]',' ',s)
 s=s.replace('association','assoc').replace('harpooner','harpooneer').replace('representative','rep')
 return re.sub(r'[^a-z0-9]','',s)
def collect(rows,fetch):
 def get(item):
  lo,url=item;raw=fetch(url);d=json.loads(raw)
  if not isinstance(d.get('dataList'),list)or len(d['dataList'])<180:raise ValueError('Incomplete native identity table')
  ids=[x['id']for x in d['dataList']]
  if len(set(ids))!=len(ids):raise ValueError('Duplicate native identity ID')
  return lo,{x['id']:x for x in d['dataList']}
 with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:native=dict(pool.map(get,URLS.items()))
 names={};used=set();patch={};missing=[]
 for i,r in native['en'].items():
  key=norm(r['title']+' '+r['name'])
  if key in names:raise ValueError('Ambiguous native title/name')
  names[key]=r
 for c in rows:
  key=norm(c['name']['en']);key={'cinqsouthsection4directorsinclair':'cinqassocsouthsection4directorsinclair','cinqsouthsection4outis':'cinqassocsouthsection4outis'}.get(key,key)
  hit=names.get(key)
  if not hit:missing.append({'id':c['id'],'name':c['name']['en']});continue
  used.add(hit['id']);result=dict(c['name'])
  for lo in ['ko','ja']:
   own=native[lo].get(hit['id'])
   if own:result[lo]=re.sub(r'\s+',' ',own['title']+' '+own['name']).strip()
  patch[c['id']]={'ko':result['ko'],'name':result,'sourceUrl':URLS['ko'],'kind':'community','nativeId':hit['id'],'nameSources':{lo:{'url':URLS[lo],'kind':'community'}for lo in ['ko','ja']if hit['id']in native[lo]}}
 return patch,{'nativeCount':{l:len(v)for l,v in native.items()},'matched':len(patch),'missing':missing,'sourceOnly':[i for i in native['en']if i not in used], 'sourceExclusions':{str(i):'NPC'if i==9999 else'Façade cosmetic, separate from playable identity'for i in [9999,40501]if i in native['en']}, 'sourceUrls':URLS}
if __name__=='__main__':
 import argparse,pathlib,urllib.request
 p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--output',required=True);a=p.parse_args()
 data=json.load(open(a.input));roster=next(r for r in data if r['gameId']=='limbus')if isinstance(data,list)else data
 def fetch(url):
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-CharacterCollector/1.0'}),timeout=40)as r:return r.read(30000001)
 pathlib.Path(a.output).write_text(json.dumps(collect(roster['characters'],fetch),ensure_ascii=False,indent=2)+'\n')

# Independent published coefficients fill only profiles whose supplier has no sheet.
STATS_URL='https://limbuscompany.wiki.gg/wiki/List_of_Identities/Data'
def collect_missing_stats(rows,fetch):
 from html.parser import HTMLParser
 class Table(HTMLParser):
  def __init__(self):super().__init__();self.rows=[];self.row=None;self.cell=None
  def handle_starttag(self,t,a):
   if t=='tr':self.row=[]
   if t in ['td','th']and self.row is not None:self.cell=''
  def handle_data(self,s):
   if self.cell is not None:self.cell+=s
  def handle_endtag(self,t):
   if t in ['td','th']and self.row is not None and self.cell is not None:self.row.append(re.sub(r'\s+',' ',self.cell).strip());self.cell=None
   if t=='tr'and self.row is not None:self.rows.append(self.row);self.row=None
 raw=fetch(STATS_URL);p=Table();p.feed(raw.decode()if isinstance(raw,bytes)else raw)
 values={}
 for v in p.rows:
  if len(v)!=17 or not re.fullmatch(r'\d+',v[3]):continue
  key=norm(v[0]);key={'cinqsouthsection4directorsinclair':'cinqassocsouthsection4directorsinclair','cinqsouthsection4outis':'cinqassocsouthsection4outis'}.get(key,key)
  if key in values:raise ValueError('Duplicate wiki identity row')
  values[key]=v
 if len(values)<180:raise ValueError('Incomplete wiki coefficient inventory')
 def cp(v):return dict(zip(['ko','en','ja','zh'],v))
 basis=cp(['기초 체력 계수·성장·속도 범위·방어 레벨 보정·물리 내성 · 위키 데이터 표','Base HP coefficient, growth, speed range, defense level modifier and physical resistances · wiki data table','基礎体力係数・成長・速度範囲・防御レベル補正・物理耐性・Wikiデータ表','基础生命系数、成长、速度范围、防御等级修正、物理抗性・维基数据表'])
 result={};missing=[]
 for c in rows:
  if c.get('stats'):continue
  key=norm(c['name']['en']);key={'cinqsouthsection4directorsinclair':'cinqassocsouthsection4directorsinclair','cinqsouthsection4outis':'cinqassocsouthsection4outis'}.get(key,key);v=values.get(key)
  if not v:missing.append(c['id']);continue
  fields=[('hp-base-coefficient',['기초 체력 계수','Base HP coefficient','基礎体力係数','基础生命系数'],v[3]),('hp-growth',['체력 성장 계수','HP growth','体力成長係数','生命成长系数'],v[4]),('speed',['속도','Speed','速度','速度'],v[5]),('defense-mod',['방어 레벨 보정','Defense level modifier','防御レベル補正','防御等级修正'],v[6])]
  for ident,ix,label in [('slash',7,['참격 내성','Slash resistance','斬撃耐性','斩击抗性']),('pierce',8,['관통 내성','Pierce resistance','貫通耐性','突刺抗性']),('blunt',9,['타격 내성','Blunt resistance','打撃耐性','打击抗性'])]:
   mul=re.search(r'\[x([\d.]+)\]',v[ix])
   if not mul:raise ValueError('Incomplete resistance '+c['id'])
   fields.append((ident,label,'×'+mul[1]))
  result[c['id']]={'stats':[dict(id=i,label=cp(l),value=str(value),basis=basis)for i,l,value in fields]}
 return result,{'sourceUrl':STATS_URL,'sourceRows':len(values),'filled':len(result),'missing':missing,'note':'Coefficient facts; no synthetic level60 panel.'}
