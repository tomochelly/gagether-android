"""Source-bound numerical gap repair and exact released Lady by the Lake addition.
No service mutations. collect(roster, fetch_bytes) -> (document, patches, audit).
Current numerical sheets are left untouched. Native snapshot facts, direct source
bodies, blocked/placeholder documents and retained search-index evidence differ.
"""
import copy,concurrent.futures,json,pathlib,re,unicodedata,urllib.parse
NATIVE='https://raw.githubusercontent.com/UnderLotus/r1999-roster/release/src/data/characters.json'
NATIVE_PAGE='https://github.com/UnderLotus/r1999-roster/blob/release/src/data/characters.json'
REPO='w158661/rev1999-knowledge-pack'
TREE='https://api.github.com/repos/'+REPO+'/git/trees/HEAD?recursive=1'
ASSET_TREE='https://api.github.com/repos/UnderLotus/r1999-roster/git/trees/release?recursive=1'
LADY_IMAGE='https://raw.githubusercontent.com/UnderLotus/r1999-roster/933a3f98cd2f153cd8e270b6ebaf1977b1294d31/public/assets/characters/avatars/313601.webp'
KR_RELEASE='https://reverse1999.haoplay.com/update/3.7overview?id=1394'
LOCALES=('ko','en','ja','zh')
def C(*x):return dict(zip(LOCALES,x))
def norm(s):return re.sub(r'[\W_]+','',unicodedata.normalize('NFKC',str(s)).casefold(),flags=re.UNICODE)
LABELS={'hp':C('HP','HP','HP','生命值'),'atk':C('공격력','ATK','攻撃力','攻击力'),'reality_def':C('현실 방어','Reality DEF','リアル防御力','现实防御'),'mental_def':C('정신 방어','Mental DEF','メンタル防御力','精神防御'),'crit':C('치명타 기술','Critical Technique','クリティカルテクニック','暴击技巧')}
# Current search reader returned complete Character Stats/Attributes tables.
# This is a retained reviewed fallback, not an automatic direct-body receipt.
PINNED={3157:{'expectedEnglish':'Narcissus','stage':3,'level':60,'values':{'hp':6993,'atk':1153,'reality_def':533,'mental_def':533,'crit':420},'url':'https://res1999.huijiwiki.com/wiki/%E7%BA%B3%E8%A5%BF%E7%B4%A2%E6%96%AF','sourceAccess':'search-index','checkedAt':'2026-10-24T22:54:59.587503Z'},3163:{'expectedEnglish':'Glyndŵr','stage':2,'level':50,'values':{'hp':4540,'atk':919,'reality_def':416,'mental_def':416,'crit':381},'url':'https://uttu.merui.net/profiles/glynd%C5%B5r/','sourceAccess':'search-index','checkedAt':'2026-10-24T22:54:59.587503Z'}}

def stats(values,stage,level):
 basis=C(f'통찰 {stage} · Lv.{level} · 공명·의지 제외',f'Insight {stage} · Lv.{level} · excludes Resonance/Psychube',f'洞察{stage}・Lv.{level}・共鳴/心相を除く',f'洞悉{stage}·{level}级·不含共鸣/心相')
 return [dict(id=k,label=LABELS[k],value=str(v),basis=basis)for k,v in values.items()]

def parse_published(text,cn,source_id):
 if not(text.startswith('【'+cn+'】')or text.startswith('# '+cn+'\n')):raise ValueError('Exact native title mismatch')
 if '部分内容为占位文本'in text or'尚未在游戏中实装'in text:raise ValueError('Explicit placeholder/prerelease text')
 text=re.sub(r'\[图:[^\]]+\]','',text)
 ident=re.search(r'编号ID[：:]\s*(\d+)',text)
 if ident and int(ident[1])!=source_id:raise ValueError('Source ID mismatch')
 m=re.search(r'属性\s*Attributes\s*洞悉(\d)\s*(\d+)级(.*?)(?:共鸣|觉察|所需微尘)',text,re.S)
 if not m:raise ValueError('No numerical attribute block')
 stage,level=int(m[1]),int(m[2])
 if not 0<=stage<=3 or not 1<=level<=60:raise ValueError('Invalid growth basis')
 values={}
 for cn,key in [('生命','hp'),('攻击','atk'),('现实防御','reality_def'),('精神防御','mental_def'),('暴击技巧','crit')]:
  n=re.search(cn+r'\s*(\d+(?:\.\d+)?)',m[3])
  if not n or float(n[1])<=0:raise ValueError('Missing positive base stat '+key)
  values[key]=n[1]
 if len(set(values.values()))==1:raise ValueError('Uniform placeholder stats')
 return stats(values,stage,level)

def json_read(fetch,url):
 b=fetch(url)
 if not isinstance(b,bytes)or not 0<len(b)<=24_000_000:raise ValueError('Invalid/oversized public source')
 return json.loads(b)

def collect(roster,fetch):
 if roster.get('gameId')!='reverse1999':raise ValueError('Wrong game')
 doc=copy.deepcopy(roster);patches={};audit={'sources':[],'issues':[],'addedIds':[],'nativeNames':0,'directNumerical':0,'pinnedSearchNumerical':0}
 native=json_read(fetch,NATIVE)
 if not isinstance(native,list)or len(native)<100:raise ValueError('Incomplete native index')
 by_name={};by_id={}
 for row in native:
  ident=row.get('baseId');en=norm(row.get('names',{}).get('en-US',''))
  if not isinstance(ident,int)or ident in by_id:raise ValueError('Duplicate native source identity')
  by_id[ident]=row
  if en:
   if en in by_name:raise ValueError('Ambiguous native English identity')
   by_name[en]=row
 aliases={'ezratheodore':'ezra'}
 lady=by_id.get(3136)
 if lady and lady.get('isReleased')is True and lady.get('stage')=='live':
  known=norm(lady['names']['en-US']);existing=next((x for x in doc['characters']if norm(x['name']['en'])==known),None)
  if existing:existing['id']='huiji-3136';existing['sourceId']=3136
  else:
   name=C(*(lady['names'].get(tag,'')for tag in ['ko-KR','en-US','ja-JP','zh-CN']))
   image={'url':LADY_IMAGE,'sourceUrl':NATIVE_PAGE,'kind':'card','width':228,'height':524,'locale':'neutral','sourceKind':'community'}
   doc['characters'].append({'id':'huiji-3136','sourceId':3136,'name':name,'rarity':4,'regions':['global','kr','jp','cn'],'sourceUrl':lady['source']['pageUrl'],'sourceKind':'community','image':image,'traits':[{'id':'afflatus','label':C('영감','Afflatus','属性','灵感'),'value':C('나무','Plant','木','木')},{'id':'damageType','label':C('피해 유형','Damage type','ダメージタイプ','伤害类型'),'value':C('정신','Mental','メンタル','精神')}]});audit['addedIds'].append('huiji-3136')
 doc['coverage']['includedCount']=len(doc['characters']);doc['coverage']['sourceCount']=max(doc['coverage']['sourceCount'],len(doc['characters']))
 native_for={}
 for c in doc['characters']:
  key=norm(c['name']['en']);n=by_name.get(aliases.get(key,key))
  if not n:continue
  native_for[c['id']]=n
  names={lo:n['names'].get(tag,'')for lo,tag in [('ko','ko-KR'),('en','en-US'),('ja','ja-JP'),('zh','zh-CN')]}
  current=copy.deepcopy(c['name'])
  for lo,value in names.items():
   if value:current[lo]=value
  patch={'name':current,'nameSources':{lo:{'url':NATIVE_PAGE,'kind':'community'}for lo,value in names.items()if value}}
  patches[c['id']]=patch;audit['nativeNames']+=bool(names['ko'])
 tree=json_read(fetch,TREE)
 if tree.get('truncated')is not False or not re.fullmatch('[0-9a-f]{40}',tree.get('sha','')):raise ValueError('Invalid published tree')
 files={x['path']for x in tree['tree']if x.get('type')=='blob'}
 audit['sources'].append({'url':NATIVE,'sourceAccess':'body','sourceCount':len(native)})
 audit['sources'].append({'url':TREE,'sourceAccess':'body','sha':tree['sha'],'fileCount':len(files)})
 targets=[c for c in doc['characters']if not c.get('stats')and c['id']in native_for]
 targets.sort(key=lambda c:native_for[c['id']].get('releaseOrder',10000))
 def one(c):
  n=native_for[c['id']];cn=n['names']['zh-CN'];path='data/角色列表/'+cn+'.md';page='https://github.com/'+REPO+'/blob/'+tree['sha']+'/'+urllib.parse.quote(path,safe='/');url='https://raw.githubusercontent.com/'+REPO+'/'+tree['sha']+'/'+urllib.parse.quote(path,safe='/')
  try:
   if path not in files:raise ValueError('No declared native source file')
   b=fetch(url)
   if not isinstance(b,bytes)or len(b)>2_000_000:raise ValueError('Invalid source body')
   values=parse_published(b.decode(),cn,n['baseId'])
   return c['id'],{'stats':values}, {'id':c['id'],'url':page,'sourceAccess':'body','stats':True}
  except Exception as e:
   pin=PINNED.get(n['baseId'])
   if pin and norm(pin['expectedEnglish'])==norm(c['name']['en']):return c['id'],{'stats':stats(pin['values'],pin['stage'],pin['level'])},{'id':c['id'],'url':pin['url'],'sourceAccess':'search-index','retainedCheckedAt':pin['checkedAt'],'directBodyIssue':str(e)}
   return c['id'],None,{'id':c['id'],'url':page,'sourceAccess':'error','error':str(e)}
 with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
  for ident,p,receipt in pool.map(one,targets[:30]):
   audit['sources'].append(receipt)
   if p:
    patches.setdefault(ident,{}).update(p)
    if receipt['sourceAccess']=='body':audit['directNumerical']+=1
    else:audit['pinnedSearchNumerical']+=1;audit['issues'].append({'id':ident,'note':'Retained search-index facts; direct body is unavailable or stale'})
   else:audit['issues'].append(receipt)
 if len(targets)>30:audit['issues'].append({'note':'Bounded source pass; additional profiles remain','count':len(targets)-30})
 for c in doc['characters']:
  p=patches.get(c['id'],{})
  for key in ['name','stats','nameSources']:
   if key in p:
    if key=='nameSources':c[key]={**c.get(key,{}),**p[key]}
    else:c[key]=p[key]
 urls=[x['url']for x in audit['sources']if x.get('stats')or x.get('sourceAccess')=='search-index']
 doc['sourceUrls']=list(dict.fromkeys(doc['sourceUrls']+[NATIVE_PAGE]+urls))[:40]
 audit['forms']=len(doc['characters']);audit['withNumerical']=sum(bool(c.get('stats'))for c in doc['characters']);audit['status']='partial'if audit['issues']else'ok'
 return doc,patches,audit

if __name__=='__main__':
 import argparse,urllib.request
 ap=argparse.ArgumentParser();ap.add_argument('--input',required=True);ap.add_argument('--output',required=True);args=ap.parse_args();source=json.load(open(args.input));roster=next(r for r in source if r['gameId']=='reverse1999')if isinstance(source,list)else source
 def fetch(url):return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-CharacterCollector/1.0 (+https://github.com/tomochelly/gagether-android)'}),timeout=35).read(24_000_001)
 doc,patches,audit=collect(roster,fetch);dest=pathlib.Path(args.output);dest.mkdir(parents=True,exist_ok=True)
 for name,value in [('reverse-document.json',doc),('reverse-patches.json',patches),('reverse-audit.json',audit),('reverse-additions.json',[r for r in doc['characters']if r['id']=='huiji-3136'])]:(dest/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:v for k,v in audit.items()if k!='sources'},ensure_ascii=False))
