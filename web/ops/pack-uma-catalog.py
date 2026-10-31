"""Encode complete exact-outfit facts without expanding them in public directories.

This is a canonical source representation, not a saved read-only projection.
Every omitted wire stat/progression field is retained inside its checked block.
"""
import argparse,base64,gzip,hashlib,json,pathlib
def packed(value):return json.dumps(value,ensure_ascii=False,separators=(',',':')).encode()
def encode(roster,catalog,horses):
 if roster['gameId']!='umamusume' or catalog['version']!=1:raise ValueError('Wrong catalog identity')
 known={c['id']:c for c in roster['characters']};history={}
 for p in horses['profiles']:
  for id in p['outfitIds']:
   if id in history:raise ValueError('Duplicate horse outfit mapping')
   history[id]=p['background']
 forms={}
 for id,f in catalog['forms'].items():
  if id not in known or f['sourceId']!=known[id]['sourceId']:raise ValueError('Exact outfit identity mismatch')
  details={k:v for k,v in f.items()if k not in ['sourceId','regionalSkillRefs','skillRefs','horseId']}
  if not details.get('stats'):raise ValueError('Missing native initial stats')
  if 'regionalSkillRefs'in f:details['regionalSkillTables']={region:[catalog['skills'][key]for key in refs]for region,refs in f['regionalSkillRefs'].items()}
  if 'skillRefs'in f:details['skillTables']=[catalog['skills'][key]for key in f['skillRefs']]
  if id in history:details['historicalBackground']=history[id]
  body=packed(dict(id=id,sourceId=f['sourceId'],details=details))
  if len(body)>1000000:raise ValueError('Single outfit exceeds decoded bound')
  zipped=gzip.compress(body,compresslevel=9,mtime=0)
  forms[id]=dict(sourceId=f['sourceId'],sha256=hashlib.sha256(body).hexdigest(),bytes=len(body),payload=base64.b64encode(zipped).decode())
  assert gzip.decompress(zipped)==body
 if set(forms)!=set(known):raise ValueError('Incomplete exact outfit catalog')
 characters=[]
 for c in roster['characters']:
  body=json.loads(gzip.decompress(base64.b64decode(forms[c['id']]['payload'])))
  characters.append({k:v for k,v in c.items()if k not in body['details']or v!=body['details'][k]or k not in ['stats','statProgression','regionalStatProgression','statDetailLabel','skillTables','regionalSkillTables','historicalBackground']})
 out={**roster,'characters':characters,'detailCatalog':dict(version=3,sourceUrl=catalog['sourceUrl'],checkedAt=catalog['checkedAt'],forms=forms)}
 # Source field values remain in every corresponding identity-bound block.
 wire={**out,'characters':[{k:v for k,v in c.items()if k not in ['stats','statProgression','regionalStatProgression','statDetailLabel','skillTables','regionalSkillTables','historicalBackground']}for c in out['characters']]}
 if len(packed(wire))>4400000:raise ValueError('Complete encoded roster exceeds4.4MB ingest bound')
 return out,wire
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--roster',required=True,type=pathlib.Path);p.add_argument('--catalog',required=True,type=pathlib.Path);p.add_argument('--horses',required=True,type=pathlib.Path);p.add_argument('--output-dir',required=True,type=pathlib.Path);a=p.parse_args();out,wire=encode(*[json.loads(v.read_text())for v in [a.roster,a.catalog,a.horses]]);a.output_dir.mkdir(exist_ok=True,parents=True)
 for name,value in [('umamusume.json',out),('umamusume-wire.json',wire)]:
  b=packed(value)+b'\n';(a.output_dir/name).write_bytes(b);print(json.dumps(dict(file=name,bytes=len(b),sha256=hashlib.sha256(b).hexdigest())))
if __name__=='__main__':main()
