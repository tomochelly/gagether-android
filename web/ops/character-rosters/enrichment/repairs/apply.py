"""Exact-ID repair boundary; never touch entries, editorial values or visitor data."""
import copy
LOCALES=['ko','en','ja','zh']
def apply(document,patches,additions=()):
 out=copy.deepcopy(document);rows={c['id']:c for c in out['characters']}
 def key(c):return ''.join(x for x in c['name']['en'].casefold()if x.isalnum())
 for added in additions:
  candidates=[c for c in rows.values()if key(c)==key(added)or c['name'].get('ko')and c['name']['ko']==added['name']['ko']]
  if not candidates:rows[added['id']]=copy.deepcopy(added)
 for ident,p in patches.items():
  c=rows.get(ident)
  if c is None:continue
  native=p.get('name',{})
  if isinstance(native,dict):
   for l in LOCALES:
    if native.get(l):c['name'][l]=native[l]
  if p.get('ko'):c['name']['ko']=p['ko']
  if p.get('nameSources'):c['nameSources']={**c.get('nameSources',{}),**p['nameSources']}
  source=p.get('sourceUrl')
  if source and(p.get('ko')or isinstance(native,dict)and native.get('ko')):c.setdefault('nameSources',{})['ko']={'url':source,'kind':p.get('method',p.get('kind','community'))}
  for field in ['stats','sections','traits','regions']:
   if p.get(field):c[field]=copy.deepcopy(p[field])
  if p.get('regionalStats'):c['regionalStats']={**c.get('regionalStats',{}),**copy.deepcopy(p['regionalStats'])}
  urls=list(p.get('nativeSourceUrls',[]))+[p[k]for k in ['statSourceUrl','sourceUrl']if p.get(k)]
  c['detailSources']=list({a['url']:a for a in c.get('detailSources',[])+[{'url':u,'kind':'official'if 'hoyoverse.com'in u else'community'}for u in urls]}.values())[:40]
 out['characters']=list(rows.values());out['coverage']['includedCount']=len(rows);out['coverage']['sourceCount']=max(out['coverage']['sourceCount'],len(rows));return out
