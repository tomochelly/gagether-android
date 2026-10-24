"""Supplemental native facts with separately reported source/field gaps."""
import concurrent.futures,importlib.util,json,pathlib,urllib.request
HERE=pathlib.Path(__file__).resolve().parent

def module(name):
 spec=importlib.util.spec_from_file_location('roster_repair_'+name,HERE/(name+'.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def fetch(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-CharacterCollector/1.0 (+https://github.com/tomochelly/gagether-android)'}),timeout=40)as r:
  data=r.read(30000001)
  if len(data)>30000000:raise ValueError('Source response exceeded30MB')
  return data

def repair(document):
 apply=module('apply').apply;game=document['gameId'];audit={'gameId':game,'status':'ok'};result=document
 try:
  if game=='hi3':
   for name in ['hi3_stats','hi3_native']:
    patches,receipt=module(name).collect(result,fetch);result=apply(result,patches);audit[name]=receipt
  elif game=='umamusume':
   patches,receipt=module('uma').collect(result,fetch);result=apply(result,patches);audit['source']=receipt
  elif game=='trickcal':
   value=module('trickcal').collect(result,fetch)
   patches,additions,receipt=value['patches'],value['additions'],value['audit'];result=apply(result,patches,additions);audit['source']=receipt
  elif game=='reverse1999':
   result,patches,receipt=module('reverse').collect(result,fetch);result=apply(result,patches);audit['source']=receipt
  elif game=='limbus':
   native=module('limbus_names');patches,receipt=native.collect(result['characters'],fetch);result=apply(result,patches);audit['source']=receipt
   more,receipt=native.collect_missing_stats(result['characters'],fetch);result=apply(result,more);audit['statsSource']=receipt
  for receipt in list(audit.values()):
   if isinstance(receipt,dict)and(receipt.get('partial')or receipt.get('status')in ['partial','failed','error']):audit['status']='partial'
 except Exception as e:audit.update(status='partial',error=type(e).__name__+': '+str(e)[:1500])
 return result,audit
