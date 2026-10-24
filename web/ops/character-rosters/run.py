"""Collect fixed public rosters and deliver only successful results with scoped OIDC."""
import concurrent.futures, hashlib, json, os, pathlib, subprocess, sys, time, urllib.error, urllib.parse, urllib.request
ROOT=pathlib.Path(__file__).resolve().parent
WORK=pathlib.Path(os.environ.get('ROSTER_WORKDIR','/tmp/gagether-rosters')).resolve()
ENDPOINT='https://gagether.tomochelly.chatgpt.site/api/characters'
AUDIENCE='https://gagether.wiki/api/characters'
AGENT='GAGETHER-CharacterCollector/1.0 (+https://github.com/tomochelly/gagether-android)'
GAMES=['genshin','hsr','zzz','arknights','nikke','nte','trickcal','reverse1999','limbus','stellasora','gfl2','holodreams','dna','bluearchive','umamusume','hi3','endfield']
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
opener=urllib.request.build_opener(NoRedirect)
def post(body):
 for attempt in range(3):
  oidc=os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']+'&audience='+urllib.parse.quote(AUDIENCE,safe='')
  with opener.open(urllib.request.Request(oidc,headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']}),timeout=20)as r:token=json.load(r)['value']
  print('::add-mask::'+token,flush=True)
  try:
   req=urllib.request.Request(ENDPOINT,data=json.dumps(body,ensure_ascii=False).encode(),method='POST',headers={'Content-Type':'application/json','Accept':'application/json','X-Gagether-Collection-OIDC':token,'User-Agent':AGENT})
   with opener.open(req,timeout=120)as r:result=json.load(r)
   if result.get('error'):raise RuntimeError(result['error'])
   return result
  except urllib.error.HTTPError as e:
   if e.code not in [429,500,502,503,504]or attempt==2:raise RuntimeError(str(e.code)+' '+e.read(3000).decode(errors='replace'))from e
   time.sleep(2**attempt)
 raise RuntimeError('Delivery exhausted')
def run(group,args):
 result=subprocess.run([sys.executable,*map(str,args)],text=True,check=False)
 return group,result.returncode
WORK.mkdir(parents=True,exist_ok=True)
for report in [WORK/'public/run.json',WORK/'dense/normalized/run.json',WORK/'official/source-outcomes.json']:report.unlink(missing_ok=True)
commands=[('public',[ROOT/'public-sources/collect_rosters.py','--workdir',WORK/'public']),('dense',[ROOT/'dense-sources/collect_dense_rosters.py','--refresh','--workdir',WORK/'dense']),('official',[ROOT/'official-sources/collect.py','--workdir',WORK/'official','--typescript',os.environ['TYPESCRIPT_PATH']])]
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:codes=dict(pool.map(lambda x:run(*x),commands))
eligible={};errors={}
try:
 manifest=json.loads((WORK/'public/run.json').read_text())
 for row in manifest['results']:
  if row['eligibleForIngest']:eligible[row['gameId']]=pathlib.Path(row['path'])
  else:errors[row['gameId']]=row.get('error','Public source failed')
except Exception as e:errors.update({g:str(e)for g in GAMES[:13]})
if codes['dense']==0:
 try:
  manifest=json.loads((WORK/'dense/normalized/run.json').read_text())
  for name,digest in manifest['files'].items():
   p=WORK/'dense/normalized'/name
   if hashlib.sha256(p.read_bytes()).hexdigest()!=digest:raise ValueError('Dense manifest hash mismatch')
   eligible[p.stem]=p
 except Exception as e:errors.update({g:str(e)for g in ['bluearchive','umamusume']})
else:errors.update({g:'Dense source failed; inspect collection logs'for g in ['bluearchive','umamusume']})
try:
 manifest=json.loads((WORK/'official/source-outcomes.json').read_text())
 for game,row in manifest['games'].items():
  if row.get('status') in ['ok','updated','unchanged','success']:eligible[game]=WORK/'official/normalized'/(game+'.json')
  else:errors[game]=row.get('error','Official source failed')
except Exception as e:errors.update({g:str(e)for g in ['hi3','endfield']})
receipts=[]
for game in GAMES:
 try:
  if game in eligible:
   document=json.loads(eligible[game].read_text())
   if document['gameId']!=game:raise ValueError('Game identity mismatch')
   result=post({'action':'ingest','data':document})
   if not result.get('readback'):raise ValueError('Missing server readback')
   receipts.append({'gameId':game,'status':'ok','count':result['count'],'changed':result['changed'],'hash':result['hash']})
  else:
   error=errors.get(game,'No successful collection receipt')[:2000]
   post({'action':'health','gameId':game,'status':'failed','error':error})
   receipts.append({'gameId':game,'status':'failed','error':error})
 except Exception as e:receipts.append({'gameId':game,'status':'delivery-failed','error':str(e)[:2000]})
report={'receipts':receipts,'partial':any(r['status']!='ok'for r in receipts)}
(WORK/'delivery.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
with open(os.environ.get('GITHUB_STEP_SUMMARY','/dev/null'),'a')as f:
 f.write('## Character roster collection\n\n| Game | Status | Forms |\n|---|---|---|\n')
 for row in receipts:f.write('|'+row['gameId']+'|'+row['status']+'|'+str(row.get('count','—'))+'|\n')
print(json.dumps(report,ensure_ascii=False))
if not any(r['status']=='ok'for r in receipts):raise SystemExit('All source deliveries failed; saved Site snapshots retained')
if report['partial']:print('::warning::Partial roster collection; last-good data retained for failed games.')
