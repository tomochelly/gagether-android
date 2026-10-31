"""Remove only byte-verified exact duplicate detail fields; encoded originals remain canonical."""
import argparse,base64,copy,gzip,hashlib,json,pathlib
FIELDS=('stats','statProgression','regionalStatProgression','statDetailLabel','skillTables','regionalSkillTables','historicalBackground')
def dedupe(rows):
 out=copy.deepcopy(rows);removed=0;value_bytes=0
 for roster in out:
  catalog=roster.get('detailCatalog')or{}
  if catalog.get('version')!=3:continue
  for character in roster['characters']:
   block=catalog['forms'].get(character['id'])
   if not block:continue
   raw=gzip.decompress(base64.b64decode(block['payload'],validate=True))
   if len(raw)!=block['bytes']or hashlib.sha256(raw).hexdigest()!=block['sha256']:raise ValueError('Detail original hash/size mismatch')
   body=json.loads(raw)
   if body['id']!=character['id']or body['sourceId']!=character.get('sourceId')or body['sourceId']!=block['sourceId']:raise ValueError('Detail original identity mismatch')
   for key in FIELDS:
    if key in character and key in body['details']and character[key]==body['details'][key]:
     value_bytes+=len(json.dumps(character[key],ensure_ascii=False,separators=(',',':')).encode());del character[key];removed+=1
 return out,dict(removedExactDuplicateFields=removed,duplicateValueBytes=value_bytes)
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--input',required=True,type=pathlib.Path);p.add_argument('--output',required=True,type=pathlib.Path);a=p.parse_args();out,report=dedupe(json.loads(a.input.read_text()));a.output.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n');print(json.dumps(report))
if __name__=='__main__':main()
