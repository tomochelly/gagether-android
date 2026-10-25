"""Complete source GFL2 facts in exact-character hash/size-bound V3 blocks."""
import base64,copy,gzip,hashlib,json
FIELDS=('stats','statProgression','regionalStatProgression','statDetailLabel','traits','skillTables','regionalSkillTables','historicalBackground','sections','detailSources')
def packed(obj):return json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode()
def encode(roster,checked_at=None):
 out=copy.deepcopy(roster)
 if out.get('gameId')!='gfl2':raise ValueError('Wrong packed game')
 forms={}
 for c in out['characters']:
  id=c['id'];c.setdefault('sourceId',id)
  if id in forms:raise ValueError('Duplicate exact source ID')
  details={k:c[k]for k in FIELDS if k in c}
  if not details.get('stats')or not details.get('skillTables'):
   previous=(roster.get('detailCatalog')or{}).get('forms',{}).get(id)
   if (roster.get('detailCatalog')or{}).get('version')==3 and previous and previous.get('sourceId')==c['sourceId']:
    forms[id]=copy.deepcopy(previous);continue
   raise ValueError('Incomplete packed character '+id)
  body=packed(dict(id=id,sourceId=c['sourceId'],details=details))
  if len(body)>1_000_000:raise ValueError('Decoded block exceeds bound')
  zipped=gzip.compress(body,compresslevel=9,mtime=0)
  forms[id]=dict(sourceId=c['sourceId'],sha256=hashlib.sha256(body).hexdigest(),bytes=len(body),payload=base64.b64encode(zipped).decode())
 out['detailCatalog']=dict(version=3,sourceUrl='https://gfl2.help/en/characters',checkedAt=checked_at or roster['checkedAt'],forms=forms)
 # Keep public identity traits for directory filters; all complete details also survive inside blocks.
 wire=copy.deepcopy(out)
 for c in wire['characters']:
  for k in FIELDS:
   if k!='traits':c.pop(k,None)
 if len(packed(wire))>4_400_000:raise ValueError('Complete wire roster exceeds4.4MB bound')
 return out,wire
