import concurrent.futures,json,pathlib,sys,urllib.parse
from collect import fetch,OUT
JOBS=[
 ('ba-tree','https://api.github.com/repos/nico0748/SchaleDB/git/trees/main?recursive=1'),
 ('ark-asset-tree','https://api.github.com/repos/fexli/ArknightsResource/git/trees/master?recursive=1'),
 ('genshin-materials','https://genshin-db-api.vercel.app/api/v5/materials?query=names&matchCategories=true&verboseCategories=true&resultLanguage=English'),
 ('genshin-characters','https://genshin-db-api.vercel.app/api/v5/characters?query=names&matchCategories=true&verboseCategories=true&resultLanguage=English'),
 ('genshin-talents','https://genshin-db-api.vercel.app/api/v5/talents?query=names&matchCategories=true&verboseCategories=true&resultLanguage=English'),
 ('reverse-tree','https://api.github.com/repos/St-Pavlov-Foundation/re1999-data-global/git/trees/main?recursive=1'),
 ('endfield-tree','https://api.github.com/repos/rmxlinux/EndfieldData/git/trees/main?recursive=1'),
 ('stella-tree','https://api.github.com/repos/JforPlay/sstoy/git/trees/main?recursive=1'),
 ('zzz-anby','https://zzz.gg/ko/characters/anby'),
]
def work(p):
 try:
  b=fetch(*p);d=json.loads(b)if p[0].endswith('tree')else None
  return {'key':p[0],'bytes':len(b),'candidates':[r['path']for r in d['tree']if any(t in r['path'].lower()for t in ['material','item','rank','level','promot','evolve','skill'])][:90] if d else None}
 except Exception as e:return {'key':p[0],'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=5)as ex:
 for r in ex.map(work,JOBS):print(json.dumps(r),flush=True)
