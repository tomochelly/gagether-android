"""Exact previously audited hero IDs + pinned Global-client cost records."""
import pathlib,json,datetime
ROOT=pathlib.Path(__file__).resolve().parents[3];P=ROOT/'work/materials-extra-sources';OUT=pathlib.Path(__file__).resolve().parent
def read(n):return json.loads((P/(n+'.json')).read_text('utf-8'))
def C(*v):return dict(zip(['ko','en','ja','zh'],v))
pin='36d8067c56889cec3a56160672cd12fbd54cdd50';base='https://raw.githubusercontent.com/St-Pavlov-Foundation/re1999-data-global/'+pin+'/data/'
assetbase='https://raw.githubusercontent.com/myssal/Reverse-1999-CN-Asset/45e75248ba3b25053fd32e63ab13c2f9f54dd9df/singlebg/'
loc={l:{r['key']:r['content']for r in read('reverse-language-'+s)}for l,s in [('ko','kr'),('en','en'),('ja','jp'),('zh','zh')]}
items={str(r['id']):r for r in read('reverse-item')};currency={str(r['id']):r for r in read('reverse-currency')}
paths={}
for source,prefix in [('prop','propitem'),('currency','currencyitem')]:
 tree=read('reverse-'+source+'-tree');assert not tree.get('truncated')
 paths[prefix]={r['path']for r in tree['tree']if r['path'].endswith('.png')}
audit=json.loads((ROOT/'ops/character-rosters/enrichment/reverse1999/source-audit.json').read_text('utf-8'))
identities={r['global']['heroId']:r['id']for r in audit['identities']if r.get('global')}
result={'icons':{},'requirements':{'reverse1999':{}},'gaps':[]};needed=set()
for fname,key,cat,category in [('character_rank','rank','insight',C('통찰','Insight','洞察','洞悉')),('character_talent','talentId','resonance',C('공명','Resonance','共鳴','共鸣'))]:
 for r in read('reverse-'+fname):
  cid=identities.get(r['heroId'])
  if not cid or not r.get('consume'):continue
  rows=[]
  for token in r['consume'].split('|'):
   kind,native,qty=token.split('#');assert kind in ['1','2'];mid=('item-'if kind=='1'else'currency-')+native
   assert int(qty)>0
   rows.append({'id':mid,'quantity':int(qty)});needed.add(mid)
  n=r[key]-1 if cat=='insight'else r[key]
  title={l:v+' '+str(n)for l,v in category.items()}
  section={'id':'reverse-'+cat+'-'+str(n),'title':title,'categoryId':cat,'category':category,'items':rows,'sourceUrl':base+'json/'+fname+'.json','sourceKind':'community','regions':['global','kr','jp']}
  result['requirements']['reverse1999'].setdefault(cid,[]).append(section)
icons=[]
for mid in sorted(needed):
 kind,native=mid.split('-',1);r=(items if kind=='item'else currency)[native];prefix='propitem'if kind=='item'else'currencyitem';path=('prop/'if kind=='item'else'')+str(r['icon'])+'.png'
 if path not in paths[prefix]:
  result['gaps'].append({'game':'reverse1999','id':mid,'reason':'Exact native icon absent from pinned asset tree'});continue
 names={l:d.get(r['name'],'')for l,d in loc.items()}
 if not all(names.values()):
  result['gaps'].append({'game':'reverse1999','id':mid,'reason':'Incomplete native item localization'});continue
 icons.append({'id':mid,'name':names,'icon':assetbase+prefix+'/'+path,'sourceUrl':base+'json/'+('item'if kind=='item'else'currency')+'.json','sourceKind':'community'})
result['icons']['reverse1999']={'items':icons,'sourceUrls':[base+'json/'+f+'.json'for f in ['item','currency','character_rank','character_talent']]}
known={r['id']for r in icons}
for cid,groups in result['requirements']['reverse1999'].items():
 for group in groups:
  assert all(i['id']in known for i in group['items']),(cid,group)
target=OUT/'extra-reverse.json';target.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps({'bytes':target.stat().st_size,'characters':len(result['requirements']['reverse1999']),'groups':sum(map(len,result['requirements']['reverse1999'].values())),'icons':len(icons),'gaps':result['gaps']}))
