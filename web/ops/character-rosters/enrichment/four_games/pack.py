"""Exact character detail blocks; list artwork and server facts remain immediately readable."""
import argparse,base64,copy,gzip,hashlib,json
from pathlib import Path
GAMES={'genshin','reverse1999','limbus','trickcal'}
FIELDS=('sourceUrl','image','images','nameSources','stats','regionalStats','statProgression','regionalStatProgression','statDetailLabel','traits','skillTables','regionalSkillTables','variantDetails','sections','detailSources')
DEFERRED={'statProgression','regionalStatProgression','statDetailLabel','skillTables','regionalSkillTables','variantDetails','sections','detailSources'}
def packed(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
def encode(roster):
 if roster.get('gameId') not in GAMES:raise ValueError('Wrong packed game')
 out=copy.deepcopy(roster);forms={};raw_total=0
 for c in out['characters']:
  ident=c['id'];c.setdefault('sourceId',ident)
  if ident in forms:raise ValueError('Duplicate character identity')
  fields={k:copy.deepcopy(c[k]) for k in FIELDS if k in c}
  body=packed({'id':ident,'sourceId':c['sourceId'],'details':fields})
  if len(body)>1_000_000:raise ValueError('Exact detail block exceeds decoded bound: '+ident)
  payload=gzip.compress(body,compresslevel=9,mtime=0);raw_total+=len(body)
  forms[ident]={'sourceId':c['sourceId'],'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body),'payload':base64.b64encode(payload).decode()}
  for key in DEFERRED:c.pop(key,None)
  if c.get('images'):c['images']=[{k:v for k,v in art.items() if k in ('url','sourceUrl','kind','width','height','locale','sourceKind','variantId','variantLabel','regions','preview')} for art in c['images']]
 out['detailCatalog']={'version':3,'sourceUrl':roster['sourceUrls'][0],'checkedAt':roster['checkedAt'],'forms':forms}
 wire=packed(out)
 if len(wire)>4_400_000:raise ValueError('Complete game exceeds existing4.4MB ingest bound: '+str(len(wire)))
 return out,{'gameId':out['gameId'],'characters':len(out['characters']),'wireBytes':len(wire),'decodedDetailBytes':raw_total,'maxBlockBytes':max(f['bytes'] for f in forms.values()),'sourceIdentityUnchanged':True}
def main():
 p=argparse.ArgumentParser();p.add_argument('--input',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--report',type=Path);a=p.parse_args()
 out,report=encode(json.loads(a.input.read_text()));a.output.write_bytes(packed(out)+b'\n')
 if a.report:a.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report))
if __name__=='__main__':main()
