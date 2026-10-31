"""HI3 published community Lv80/rank sheets keyed to exact canonical battlesuits.
No service writes. Empty source rows and unmatched new suits remain numeric gaps.
"""
import csv,io,json,re,unicodedata,decimal
URL='https://raw.githubusercontent.com/YossaponSopap/hi3-database/main/data/stats.csv'
PAGE='https://github.com/YossaponSopap/hi3-database/blob/main/data/stats.csv'
LOCALES=['ko','en','ja','zh']
def cp(*v):return dict(zip(LOCALES,v))
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',str(s)).replace('△','Δ')).strip().casefold()
# Exact CMS IDs and native suit names guard the publisher's shortened English labels.
ALIASES={'hi3-129957':('空梦·掠集之兽','Pardofelis','Reverist Calico'),'hi3-129903':('极地战刃','Arctic Kriegsmesser','Kriegsmesser'),'hi3-129885':('猎袭装·影铁','Stalker: Phantom Iron','Phantom Iron')}
LABELS={'HP':cp('HP','HP','HP','生命值'),'SP':cp('SP','SP','SP','能量'),'ATK':cp('공격력','ATK','攻撃力','攻击力'),'DEF':cp('방어력','DEF','防御力','防御力'),'CRT':cp('회심','CRT','会心','会心')}
RANK={'B':1,'A':2,'S':3,'SS':4,'SSS':5}
def collect(roster,fetch):
 if roster['gameId']!='hi3':raise ValueError('HI3 identity required')
 raw=fetch(URL)
 if isinstance(raw,str):raw=raw.encode()
 if not raw or len(raw)>2_000_000:raise ValueError('Invalid CSV response')
 rows=list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))))
 if len(rows)<100 or not rows or not set(['Character','Battlesuits','Rank','Lvl',*LABELS])<=set(rows[0]):raise ValueError('Incomplete numeric table')
 by={};allnames=set()
 for row in rows:
  key=norm(row['Battlesuits']);allnames.add(key)
  if not row['HP'].strip():continue
  try:
   level=decimal.Decimal(row['Lvl']);values={k:decimal.Decimal(row[k])for k in LABELS}
   if level!=80 or values['HP']<=0 or values['ATK']<=0 or any(not x.is_finite()or x<0 for x in values.values())or row['Rank']not in RANK:raise ValueError('Invalid numeric/rank basis')
  except decimal.InvalidOperation as e:raise ValueError('Malformed numeric source')from e
  target=by.setdefault(key,[])
  if any(x['Rank']==row['Rank']for x in target):raise ValueError('Duplicate numeric rank row')
  target.append(row)
 if len(by)<70:raise ValueError('Truncated usable stat roster')
 out={};missing=[];matches=[]
 for c in roster['characters']:
  en=c['name']['en'];alias=ALIASES.get(c['id'])
  if alias:
   if c['name']['zh']!=alias[0]or en!=alias[1]:raise ValueError('Guarded CMS suit alias changed '+c['id'])
   en=alias[2]
  group=by.get(norm(en))
  if not group:missing.append(c['id']);continue
  row=max(group,key=lambda r:RANK[r['Rank']]);rank=row['Rank']
  basis=cp(f'Lv.80 · {rank} 랭크 · 공개 전투복 수치 표',f'Lv.80 · rank {rank} · published battlesuit sheet',f'Lv.80・{rank}ランク・公開戦乙女数値表',f'80级 · {rank}阶级 · 公开装甲数值表')
  stats=[{'id':k.lower(),'label':l,'value':str(int(decimal.Decimal(row[k]))),'basis':basis}for k,l in LABELS.items()]
  out[c['id']]={'stats':stats,'statSourceUrl':PAGE};matches.append({'id':c['id'],'nativeName':c['name']['en'],'tableName':row['Battlesuits'],'rank':rank,'level':80})
 return out,{'sourceUrl':URL,'sourceNames':len(allnames),'usableSourceNames':len(by),'matched':len(out),'matches':matches,'missingStatsIds':missing,'partial':bool(missing)}
if __name__=='__main__':
 import argparse,pathlib,urllib.request
 p=argparse.ArgumentParser();p.add_argument('--bootstrap',required=True);p.add_argument('--output',required=True);a=p.parse_args()
 data=json.load(open(a.bootstrap));r=next(r for r in data if r['gameId']=='hi3')if isinstance(data,list)else data
 f=lambda u:urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'GAGETHER-CharacterCollector/1.0'}),timeout=40).read()
 patches,audit=collect(r,f);pathlib.Path(a.output).write_text(json.dumps(patches,ensure_ascii=False,indent=2)+'\n');pathlib.Path(a.output+'.audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n');print('HI3 matched',len(patches),'gaps',len(audit['missingStatsIds']))
