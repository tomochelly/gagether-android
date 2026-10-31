#!/usr/bin/env python3
"""Opt-in normal public source JSON refresh; no artwork/network image reads.

Pin each native repository once per run, reject bounded/partial data, and keep
source checks distinct from replay. Run outside the Site Worker; never on page
requests. This command does not publish or change any stored Site data.
"""
import argparse,concurrent.futures,datetime as dt,gzip,hashlib,json,urllib.request
from pathlib import Path
TABLES=['character.json','skill.json','skill_effect.json','skill_passive_level.json','skill_ex_level.json','fight_device.json','character_rank_replace.json','fight_card_choice.json']
def get(url,limit):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-public-native-reference/1.0','Accept-Encoding':'gzip','Accept':'application/json'}),timeout=65)as response:
  b=response.read(limit+1)
  if response.status!=200 or len(b)>limit:raise ValueError('Source response bound')
  if response.headers.get('Content-Encoding')=='gzip':
   import io
   with gzip.GzipFile(fileobj=io.BytesIO(b))as source:b=source.read(limit+1)
   if len(b)>limit:raise ValueError('Decompressed source bound')
 return b
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--directory',required=True,type=Path);args=ap.parse_args()
 for name,repo in [('global','re1999-data-global'),('cn','re1999-data')]:
  url='https://api.github.com/repos/St-Pavlov-Foundation/'+repo+'/commits/main';commit=json.loads(get(url,2_000_000))['sha']
  if len(commit)!=40 or any(c not in'0123456789abcdef'for c in commit):raise ValueError('Invalid repository commit')
  directory=args.directory if name=='global'else args.directory/'cn';directory.mkdir(parents=True,exist_ok=True)
  files=[('json/'+t,t)for t in TABLES]
  if name=='global':files +=[('configs/language/language_'+l+'.json','language_'+l+'.json')for l in ['kr','en','jp','zh']]
  def fetch(item):
   path,file=item;url='https://raw.githubusercontent.com/St-Pavlov-Foundation/'+repo+'/'+commit+'/data/'+path;b=get(url,85_000_000);value=json.loads(b)
   if not isinstance(value,list)or not value:raise ValueError('Incomplete native table '+file)
   receipt={'url':url,'commit':commit,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'httpStatus':200,'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')}
   target=directory/file;temporary=directory/(file+'.tmp');temporary.write_bytes(b);temporary.replace(target);(directory/(file+'.receipt.json')).write_text(json.dumps(receipt)+'\n');return receipt
  with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:receipts=list(pool.map(fetch,files))
  print(json.dumps({'service':name,'commit':commit,'files':len(receipts),'bytes':sum(r['bytes']for r in receipts),'networkImageReads':0}))
if __name__=='__main__':main()
