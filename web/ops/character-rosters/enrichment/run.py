"""Supplement freshly validated canonical roster files, preserving raw inputs on failure.
No credentials, writes to Site, or publication. Outputs are ingested by the parent.
"""
import concurrent.futures,json,os,pathlib,shutil,subprocess,sys,tempfile
ROOT=pathlib.Path(__file__).resolve().parent
REPAIR_ROOT=ROOT
GROUPS={'a':['limbus','nikke','trickcal','reverse1999'],'b':['umamusume','gfl2','holodreams','nte'],'c':['genshin','hsr','zzz','arknights'],'d':['dna','stellasora'],'e':['hi3','endfield','bluearchive']}
def enrich_files(files,work):
 work=pathlib.Path(work);inputs=work/'input';inputs.mkdir(parents=True,exist_ok=True)
 for game,path in files.items():shutil.copyfile(path,inputs/(game+'.json'))
 def group(item):
  key,games=item;output=work/key;output.mkdir(parents=True,exist_ok=True)
  if not any(g in files for g in games):return key,{'status':'skipped'}
  # This directory starts empty every run: cached replay cannot masquerade as a
  # fresh supplemental source check. Helpers may validate HTTP304 themselves.
  with tempfile.TemporaryDirectory(prefix='gagether-roster-'+key+'-')as cache:
   command=[sys.executable,str(ROOT/('enrich_'+key+'.py')),'--input-dir',str(inputs),'--output-dir',str(output)]
   if key!='d':command+=['--cache-dir',cache]
   process=subprocess.run(command,check=False,timeout=1200)
  report={'status':'completed'if process.returncode==0 else'partial','exitCode':process.returncode,'output':str(output)}
  for name in ['enrichment-report.json','enrichment-a-report.json','enrichment-report-b.json','manifest.json']:
   path=output/name
   if path.exists():report['sourceReport']=json.loads(path.read_text());break
  if key=='b' and 'nte'in files:
   # Keep the exact art and rich client facts in the same scoped reference path.
   # The detail helper deliberately pins its verified Global client version.
   for helper in ['collect_nte_art.py','enrich_nte_details.py']:
    target=output/helper.removesuffix('.py');target.mkdir(exist_ok=True)
    command=[sys.executable,str(ROOT/helper),'--input',str(output/'nte.json'),'--output-dir',str(target)]
    if helper=='enrich_nte_details.py':command+=['--cache-dir',str(target/'sources')]
    try:
     result=subprocess.run(command,check=False,timeout=1200)
     candidate=target/'nte.json'
     details=json.loads((target/'manifest.json').read_text())if(target/'manifest.json').exists()else{}
     report.setdefault('nteEnrichment',[]).append({'helper':helper,'exitCode':result.returncode,'details':details})
     if details.get('status')in ['failed','error','partial']:report['status']='partial'
     if result.returncode==0 and candidate.exists():
      d=json.loads(candidate.read_text());prior=json.loads((output/'nte.json').read_text())
      if d.get('gameId')!='nte'or{c['id']for c in d['characters']}!={c['id']for c in prior['characters']}:raise ValueError('NTE detail identity mismatch')
      if len(json.dumps(d,ensure_ascii=False).encode())>4400000:raise ValueError('NTE detail exceeds ingest bound')
      shutil.copyfile(candidate,output/'nte.json')
     else:report['status']='partial'
    except Exception as e:
     report['status']='partial';report.setdefault('nteErrors',[]).append(helper+': '+str(e))
  if key=='e' and 'bluearchive'in files:
   target=output/'enrich_bluearchive_details';target.mkdir(exist_ok=True)
   command=[sys.executable,str(ROOT/'enrich_bluearchive_details.py'),'--input',str(output/'bluearchive.json'),'--output-dir',str(target),'--cache-dir',str(target/'sources')]
   try:
    result=subprocess.run(command,check=False,timeout=1200)
    candidate=target/'bluearchive.json'
    details=json.loads((target/'manifest.json').read_text())if(target/'manifest.json').exists()else{}
    report['bluearchiveEnrichment']={'exitCode':result.returncode,'details':details}
    if details.get('status')in ['failed','error','partial']:report['status']='partial'
    if result.returncode==0 and candidate.exists():
     d=json.loads(candidate.read_text());prior=json.loads((output/'bluearchive.json').read_text())
     if d.get('gameId')!='bluearchive'or{c['id']for c in d['characters']}!={c['id']for c in prior['characters']}:raise ValueError('Blue Archive detail identity mismatch')
     if len(json.dumps(d,ensure_ascii=False).encode())>4400000:raise ValueError('Blue Archive detail exceeds ingest bound')
     shutil.copyfile(candidate,output/'bluearchive.json')
    else:report['status']='partial'
   except Exception as e:
    report['status']='partial';report['bluearchiveError']=str(e)
  if key=='e' and 'endfield'in files:
   target=output/'enrich_endfield_details';target.mkdir(exist_ok=True)
   command=[sys.executable,str(ROOT/'enrich_endfield_details.py'),'--input',str(output/'endfield.json'),'--output-dir',str(target),'--cache-dir',str(target/'sources')]
   try:
    result=subprocess.run(command,check=False,timeout=1200)
    candidate=target/'endfield.json'
    details=json.loads((target/'manifest.json').read_text())if(target/'manifest.json').exists()else{}
    report['endfieldEnrichment']={'exitCode':result.returncode,'details':details}
    if details.get('omissions'):report['status']='partial'
    if result.returncode==0 and candidate.exists():
     d=json.loads(candidate.read_text());prior=json.loads((output/'endfield.json').read_text())
     if d.get('gameId')!='endfield'or{c['id']for c in d['characters']}!={c['id']for c in prior['characters']}:raise ValueError('Endfield detail identity mismatch')
     if len(json.dumps(d,ensure_ascii=False).encode())>4400000:raise ValueError('Endfield detail exceeds ingest bound')
     shutil.copyfile(candidate,output/'endfield.json')
    else:report['status']='partial'
   except Exception as e:
    report['status']='partial';report['endfieldError']=str(e)
  return key,report
 reports={}
 with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
  jobs={pool.submit(group,item):item[0]for item in GROUPS.items()}
  for future in concurrent.futures.as_completed(jobs):
   key=jobs[future]
   try:key,report=future.result();reports[key]=report
   except Exception as e:reports[key]={'status':'failed','error':str(e)}
 result=dict(files)
 for key,games in GROUPS.items():
  for game in games:
   path=work/key/(game+'.json')
   if game not in files or not path.exists():continue
   try:
    d=json.loads(path.read_text());original=json.loads(pathlib.Path(files[game]).read_text())
    if d['gameId']!=game or {c['id']for c in d['characters']}!={c['id']for c in original['characters']}:raise ValueError('Supplement changed canonical source identity set')
    if len(json.dumps(d,ensure_ascii=False).encode())>4400000:raise ValueError('Supplement exceeds ingest bound')
    result[game]=path
   except Exception as e:reports[key].setdefault('validationErrors',[]).append(game+': '+str(e))
 # Audited secondary source forms extend the primary inventory without renumbering it.
 spec=__import__('importlib.util',fromlist=['util']).spec_from_file_location('roster_repairs',REPAIR_ROOT/'repairs/run.py')
 repairs=__import__('importlib.util',fromlist=['util']).module_from_spec(spec);spec.loader.exec_module(repairs)
 sys.path.insert(0,str(REPAIR_ROOT));from localized_traits import localize
 allowed={'trickcal':{'trickcal:wikiwiki:'+s for s in ['kyuri','patula','daya-pure-shine','ronnie','maison','mynx','aurora','veroo']},'reverse1999':{'huiji-3136'}}
 reports['repairs']={'status':'completed','games':{}};dest=work/'repaired';dest.mkdir(exist_ok=True)
 def fixed(game):
  original=json.loads(pathlib.Path(result[game]).read_text());data,audit=repairs.repair(original)
  prior={c['id']for c in original['characters']};current={c['id']for c in data['characters']}
  if not prior.issubset(current)or current-prior-allowed.get(game,set()):raise ValueError('Unexpected supplemental identity change')
  data=localize(data)
  if len(json.dumps(data,ensure_ascii=False).encode())>4400000:raise ValueError('Supplement exceeds ingest bound')
  missing=[]if game=='holodreams'else[c['id']for c in data['characters']if not(c.get('stats')or c.get('regionalStats'))]
  audit['missingStatsIds']=missing
  if missing:audit['status']='partial'
  if data==original:return game,pathlib.Path(result[game]),audit
  path=dest/(game+'.json');path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n');return game,path,audit
 with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
  jobs={pool.submit(fixed,g):g for g in result}
  for job in concurrent.futures.as_completed(jobs):
   g=jobs[job]
   try:
    _,path,audit=job.result();result[g]=path;reports['repairs']['games'][g]=audit
    if audit.get('status')=='partial':reports['repairs']['status']='partial'
   except Exception as e:reports['repairs']['status']='partial';reports['repairs']['games'][g]={'status':'failed','error':str(e)}
 (work/'summary.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2)+'\n')
 return result,reports
