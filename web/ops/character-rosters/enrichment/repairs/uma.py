"""Native Korean outfit names and actual release-date flags from public GameTora.
Uses the manifest declared by its public frontend. Numeric stats stay untouched.
"""
import datetime,json,re
from zoneinfo import ZoneInfo
MANIFEST='https://gametora.com/data/manifests/umamusume.json'
def collect(roster,fetch,as_of=None):
 if roster.get('gameId')!='umamusume':raise ValueError('Wrong roster game')
 as_of=as_of or datetime.datetime.now(ZoneInfo('Asia/Tokyo')).date().isoformat()
 datetime.date.fromisoformat(as_of)
 manifest=json.loads(fetch(MANIFEST));revision=manifest.get('character-cards','')
 if not isinstance(revision,str)or not re.fullmatch('[a-f0-9]{8,64}',revision):raise ValueError('Invalid public character manifest')
 source='https://gametora.com/data/umamusume/character-cards.'+revision+'.json'
 rows=json.loads(fetch(source))
 if not isinstance(rows,list)or len(rows)<200:raise ValueError('Empty or partial character card inventory')
 indexed={}
 for row in rows:
  ident=str(row.get('card_id',''))
  if not re.fullmatch('[0-9]{6}',ident)or ident in indexed:raise ValueError('Invalid/duplicate exact form ID')
  indexed[ident]=row
 patches={};audit={'policyDate':as_of,'sourceUrl':source,'sourceCount':len(indexed),'sourceOnlyIds':sorted(set(indexed)-{c['id']for c in roster['characters']}),'missingStoredIds':[],'released':{'jp':0,'kr':0,'global':0},'nativeKorean':0,'releaseDates':{}}
 for old in roster['characters']:
  ident=old['id'];row=indexed.get(ident)
  if row is None:audit['missingStoredIds'].append(ident);continue
  regions=[];dates={}
  for region,key in [('jp','release'),('kr','release_ko'),('global','release_en')]:
   date=row.get(key)
   if date:
    if not isinstance(date,str)or not re.fullmatch('[0-9]{4}-[0-9]{2}-[0-9]{2}',date):raise ValueError('Invalid actual service release date')
    datetime.date.fromisoformat(date);dates[region]=date
    if date<=as_of:regions.append(region);audit['released'][region]+=1
  if not regions:continue # No guessed service availability for future-only records.
  patch={'regions':regions};name,title=row.get('name_ko',''),row.get('title_ko','')
  if isinstance(name,str)and re.search('[가-힣]',name)and isinstance(title,str)and title.startswith('[')and title.endswith(']'):
   patch['name']={**old['name'],'ko':name.strip()+' '+title.strip()}
   patch['nameSources']={'ko':{'url':source,'kind':'community'}};audit['nativeKorean']+=1
  patches[ident]=patch;audit['releaseDates'][ident]=dates
 if audit['missingStoredIds']:raise ValueError('Existing source form IDs absent from independent inventory')
 return patches,audit
if __name__=='__main__':
 import argparse,pathlib,urllib.request
 p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--output',required=True);a=p.parse_args()
 data=json.load(open(a.input));roster=next(r for r in data if r['gameId']=='umamusume')if isinstance(data,list)else data
 def fetch(url):
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-CharacterCollector/1.0'}),timeout=40)as r:return r.read(30000001)
 pathlib.Path(a.output).write_text(json.dumps(collect(roster,fetch),ensure_ascii=False,indent=2)+'\n')

