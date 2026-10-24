"""Native HI3 publisher CMS snippets, exact source suit identity only.
No video watching or numerical effects inferred from descriptions.
"""
import concurrent.futures,html,json,pathlib,re,unicodedata
LOCALES=['ko','en','ja','zh']
CONFIG={'en':('5fcd2aa439ca4aea',521,767,'en-us'),'ko':('f4395662cb524b05',464,755,'ko-kr'),'zh':('84de1c2c34e14b58',493,756,'zh-tw'),'ja':('9f099cd555854c14',565,771,'ja-jp')}
def cp(ko='',en='',ja='',zh=''):return dict(zip(LOCALES,[ko,en,ja,zh]))
_converter=None
def simplify(text):
 global _converter
 if _converter is None:
  options=[pathlib.Path(__file__).resolve().parents[2]/'official-sources']
  root=next((p for p in options if(p/'TSCharacters.txt').exists()),None)
  if root is None:raise ValueError('Pinned OpenCC dictionaries unavailable')
  chars={};phrases={}
  for f,d in [('TSCharacters.txt',chars),('TSPhrases.txt',phrases)]:
   for line in(root/f).read_text().splitlines():
    if line and not line.startswith('#'):
     a,b=line.split('\t');d[a]=b.split()[0]
  pat=re.compile('|'.join(map(re.escape,sorted(phrases,key=len,reverse=True))));_converter=chars,phrases,pat
 chars,phrases,pat=_converter;s=pat.sub(lambda m:phrases[m[0]],str(text));return ''.join(chars.get(c,c)for c in s)
def norm(s):return re.sub(r'[\s\u200b·・「」『』《》×x\-：:！!]','',unicodedata.normalize('NFKC',simplify(s)).replace('△','Δ').casefold())
def plain(s):
 s=html.unescape(str(s or''));s=re.sub(r'<br\s*/?>','\n',s,flags=re.I);s=re.sub(r'<[^>]*>','',s);return re.sub(r'[^\S\n]+',' ',s).strip()
def api(lo,modern):
 app,old,new,lang=CONFIG[lo];return f'https://sg-public-api-static.hoyoverse.com/content_v2_user/app/{app}/getContentList?iChanId={new if modern else old}&iPageSize=200&iPage=1&sLangKey={lang}'
def tokens(urls):return {m[1]for u in urls if isinstance(u,str)and(m:=re.search(r'/([0-9a-f]{32})_\d+\.',u))}
def collect(roster,fetch):
 if roster['gameId']!='hi3':raise ValueError('Wrong game')
 by_name={};by_token={};by_id={c['id']:c for c in roster['characters']}
 for c in roster['characters']:
  for s in c['name'].values():
   if s:by_name.setdefault(norm(s),set()).add(c['id'])
  for t in tokens([a['url']for a in [c.get('image'),*c.get('images',[])]if a]):by_token.setdefault(t,set()).add(c['id'])
 jobs=[(lo,m)for lo in LOCALES for m in[False,True]]
 def read(job):
  lo,m=job;u=api(lo,m);raw=fetch(u)
  if isinstance(raw,str):raw=raw.encode()
  if not raw or len(raw)>10_000_000:raise ValueError('Invalid CMS bytes')
  data=json.loads(raw)
  if data.get('retcode')!=0:raise ValueError('CMSretcode')
  rows=data['data']['list']
  if len(rows)!=int(data['data']['iTotal'])or len(rows)<(15 if m else 75):raise ValueError('Incomplete CMS')
  return lo,m,u,rows
 out={};receipts=[];unmatched=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
  for lo,modern,u,rows in pool.map(read,jobs):
   channel=CONFIG[lo][2 if modern else 1];seen=set();matched=0
   for row in rows:
    ext=json.loads(row['sExt']);name=ext.get('armorName')if modern else ext.get(f'{channel}_{0 if lo=="ja"else 1}')
    if not isinstance(name,str)or not name.strip():raise ValueError('Missing native suit name')
    ids=set()
    for n in[name,row.get('sTitle','')]:ids.update(by_name.get(norm(n),set()))
    if len(ids)>1:raise ValueError('Ambiguous exact CMS name '+name)
    if not ids:
     urls=[]
     for value in ext.values():
      if isinstance(value,list):urls +=[a.get('url')for a in value if isinstance(a,dict)]
     for t in tokens(urls):
      if len(by_token.get(t,set()))==1:ids.update(by_token[t])
    if not ids and lo=='zh'and row['iInfoId']==109364 and name=='暮光騎士'and by_id.get('hi3-129931',{}).get('name',{}).get('zh')=='暮光骑士·月煌':ids={'hi3-129931'}
    if len(ids)!=1:unmatched.append({'locale':lo,'cmsId':row['iInfoId'],'name':name,'ids':sorted(ids)});continue
    cid=next(iter(ids))
    if cid in seen:raise ValueError('Duplicate native source suit '+cid)
    seen.add(cid);matched+=1;p=out.setdefault(cid,{'sections':[],'nativeSourceUrls':[]});p['nativeSourceUrls'].append(u)
    def section(sid,title,body):
     body=plain(body);title=plain(title)
     if not body:return
     if len(body)>3000:raise ValueError('Overlong native CMS text')
     sec=next((s for s in p['sections']if s['id']==sid),None)
     if sec is None:sec={'id':sid,'title':cp(),'body':cp()};p['sections'].append(sec)
     sec['title'][lo]=title;sec['body'][lo]=body
    if modern:
     labels={'ko':('소개','별의 고리'),'en':('Profile','Astral Ring'),'ja':('紹介','アストラルリング'),'zh':('介绍','星之环')}
     # Native short publisher quote is separate from mechanical effects; no fake skill table.
     section('hi3-official-profile',labels[lo][0],ext.get('roleDec',''))
     section('hi3-official-ring',labels[lo][1],ext.get('resonanceName',''))
    else:
     starts=[6,12,18,24,30]if lo=='ja'else[4,12,20,28,36]
     for ix,k in enumerate(starts):
      section('hi3-official-skill-'+str(ix+1),ext.get(f'{channel}_{k}',''),ext.get(f'{channel}_{k+1}',''))
   receipts.append({'locale':lo,'modern':modern,'sourceUrl':u,'records':len(rows),'matched':matched})
 return out,{'nativeCounts':{lo:sum(any(s['body'][lo]for s in p['sections'])for p in out.values())for lo in LOCALES},'sourceReceipts':receipts,'unmatched':unmatched,'partial':bool(unmatched)}
if __name__=='__main__':
 import argparse,urllib.request
 p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--output',required=True);a=p.parse_args()
 data=json.load(open(a.input));roster=next(r for r in data if r['gameId']=='hi3')if isinstance(data,list)else data
 def fetch(url):return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-CharacterCollector/1.0'}),timeout=40).read(30000001)
 out,audit=collect(roster,fetch);pathlib.Path(a.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');pathlib.Path(a.output+'.audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
