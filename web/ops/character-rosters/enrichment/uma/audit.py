#!/usr/bin/env python3
"""Audit a generated Uma detail catalog and its exact source identities.
This CLI is read-only and never accepts publication credentials.
"""
import argparse,hashlib,json,pathlib
from enrich import LOCALES,packed

def audit(original,roster,catalog):
 if original['gameId']!=roster['gameId']or roster['gameId']!='umamusume':raise ValueError('Wrong game')
 before={c['id']:c for c in original['characters']};after={c['id']:c for c in roster['characters']}
 if set(before)!=set(after)or set(catalog['forms'])!=set(before):raise ValueError('Character identities changed')
 for cid,c in after.items():
  for k in ['sourceId','name','image','images','artworkFrames']:
   if before[cid].get(k)!=c.get(k):raise ValueError('Outfit original changed: '+cid+'/'+k)
  f=catalog['forms'][cid]
  if f['sourceId']!=c['sourceId']:raise ValueError('Source identity mismatch')
  for region,refs in f['regionalSkillRefs'].items():
   if region not in c['regions']or len(refs)>40:raise ValueError('Invalid regional detail binding')
   tables=[catalog['skills'][key]for key in refs]
   if len({t['id']for t in tables})!=len(tables):raise ValueError('Repeated service skill identity')
 for key,t in catalog['skills'].items():
  if hashlib.sha256(packed(t)).hexdigest()!=key:raise ValueError('Table content hash mismatch')
  for copy in [t['name'],t['type'],t['basis'],t.get('description',{})]+[v['label']for v in t['values']]:
   if set(copy)!=set(LOCALES)or any(not isinstance(x,str)or len(x)>3000 for x in copy.values()):raise ValueError('Invalid native localized copy')
  if not any(t.get('description',{}).values())and not t['values']or len(t['values'])>100:raise ValueError('Missing or overbound skill facts')
  if any(len(x)>300 for v in t['values']for x in v['levels']):raise ValueError('Skill value exceeds source schema')
 return dict(forms=len(after),catalogTables=len(catalog['skills']),starPanels=sum(len(f['statProgression']['rows'])for f in catalog['forms'].values()),growthRows=sum(sum(s['id'].startswith('growth-')for s in f['stats'])for f in catalog['forms'].values()),maxTables=max(len(v)for f in catalog['forms'].values()for v in f['regionalSkillRefs'].values()))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--original',required=True,type=pathlib.Path);p.add_argument('--roster',required=True,type=pathlib.Path);p.add_argument('--catalog',required=True,type=pathlib.Path);a=p.parse_args();print(json.dumps(audit(*[json.loads(x.read_text())for x in [a.original,a.roster,a.catalog]])))
