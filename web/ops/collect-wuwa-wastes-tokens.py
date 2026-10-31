"""Collect only sitemap-declared public WW token item pages; preserve original source bytes."""
import concurrent.futures,datetime,gzip,hashlib,html,json,pathlib,re,sys,urllib.request
ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/'content/wuwa-wastes-tokens.json'
WORK=ROOT/'ops/research/wuwa-wastes-tokens'
LANGS={'ko':'ko','en':'en','ja':'ja','zh':'zh'}
RESUME='--resume' in sys.argv
def same_day(path):
 return datetime.datetime.fromtimestamp(path.stat().st_mtime,datetime.timezone.utc).date()==datetime.datetime.now(datetime.timezone.utc).date()
def get(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER public token catalog/1'}),timeout=25) as r:
  if r.status!=200:raise ValueError('Source response '+str(r.status))
  b=r.read(20000001)
  if len(b)>20000000:raise ValueError('Source too large')
  return b

def find_data(value):
 if isinstance(value,dict):
  if isinstance(value.get('initialData'),dict) and 'Id' in value['initialData']:return value['initialData']
  for x in value.values():
   r=find_data(x)
   if r:return r
 if isinstance(value,list):
  for x in value:
   r=find_data(x)
   if r:return r

def item_data(original):
 s=original.decode('utf-8')
 for m in re.finditer(r'self\.__next_f\.push\((\[[\s\S]*?\])\)</script>',s):
  try:packet=json.loads(m[1]);t=packet[1] if len(packet)>1 else ''
  except (ValueError,TypeError):continue
  if not isinstance(t,str):continue
  for line in t.splitlines():
   if ':' not in line:continue
   try:value=json.loads(line.split(':',1)[1])
   except ValueError:continue
   found=find_data(value)
   if found:return found
 raise ValueError('Public item data unavailable')

def plain(text):
 return html.unescape(re.sub(r'<[^>]*>','',str(text))).replace(chr(92)+'n',chr(10)).strip()

def original(locale,ident):
 path=WORK/(locale+'-'+ident+'.html.gz')
 if RESUME and path.exists() and same_day(path):b=gzip.decompress(path.read_bytes())
 else:
  b=get('https://wuther.in/'+LANGS[locale]+'/item/'+ident+'/');path.write_bytes(gzip.compress(b,mtime=0))
 data=item_data(b)
 if str(data.get('Id'))!=ident:raise ValueError('Item identity mismatch')
 return data,{'url':'https://wuther.in/'+LANGS[locale]+'/item/'+ident+'/','bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'originalPath':str(path.relative_to(ROOT)).replace('\\','/'),'fetchedAt':datetime.datetime.fromtimestamp(path.stat().st_mtime,datetime.timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')}

def icon(path):
 if not isinstance(path,str) or not path.startswith('/Game/Aki/UI/UIResources/'):raise ValueError('Invalid declared token icon')
 stem=path.split('.',1)[0].replace('/Game/Aki','')
 if not re.fullmatch(r'/UI/UIResources/[A-Za-z0-9_/-]+',stem):raise ValueError('Invalid token icon path')
 return 'https://wutherin.cn-nb1.rains3.com'+stem+'.webp'

def main():
 WORK.mkdir(exist_ok=True)
 source=WORK/'sitemap.xml'
 if RESUME and source.exists() and same_day(source):sitemap=source.read_bytes()
 else:sitemap=get('https://wuther.in/sitemap.xml');source.write_bytes(sitemap)
 ids=sorted(set(re.findall(r'<loc>https://wuther\.in/ko/item/(715\d+)/</loc>',sitemap.decode())))
 if not 50<=len(ids)<=300:raise ValueError('Unexpected token candidate inventory')
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:candidates=list(pool.map(lambda ident:(ident,*original('ko',ident)),ids))
 chosen=[(ident,row,receipt) for ident,row,receipt in candidates if '증표' in row.get('Tag',[])]
 if len(chosen)<50:raise ValueError('Incomplete WW token inventory')
 refs={};tokens=[]
 for index,(ident,ko,kreceipt) in enumerate(chosen):
  values={'ko':ko};receipts={'ko':kreceipt}
  with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:other=list(pool.map(lambda locale:(locale,*original(locale,ident)),['en','ja','zh']))
  for locale,row,receipt in other:values[locale]=row;receipts[locale]=receipt
  if any(row.get('Rarity')!=ko.get('Rarity') or row.get('Icon')!=ko.get('Icon') for row in values.values()):raise ValueError('Localized token identities differ')
  names={locale:plain(row['Name']) for locale,row in values.items()};descs={locale:plain(row['Desc']) for locale,row in values.items()}
  if any(not value for value in names.values()):raise ValueError('Missing native token name')
  usage=re.search(r'최대\s*(\d+)\s*회\s*사용',descs['ko']);maxuses=int(usage[1]) if usage else None
  tokens.append({'id':ident,'name':names,'description':descs,'icon':icon(ko['Icon']),'rarity':ko['Rarity'],'maxUses':maxuses,'useLimit':'limited' if maxuses is not None else 'unlimited' if '사용 횟수에 제한이 없다' in descs['ko'] else 'unknown','effectAvailable':all(descs.values()),'cycleIds':[],'availability':'catalog-only','imageStatus':'declared-unverified','sourceUrl':kreceipt['url']})
  refs[ident]=receipts
  if index%20==0:print('tokens',index+1,'/',len(chosen),flush=True)
 # Existing exact native cycle22 receipt establishes reward availability only; unknown current23 stays unknown.
 cycles=[]
 fixture=ROOT/'tests/fixtures/wuwa-reference/slash-ko.json'
 d=json.loads(fixture.read_bytes());reward_ids=sorted({str(x['Id']) for a in d['Id'].values() for x in a.get('LevelPassRewardEntries',[])})
 cycles.append({'id':'whimpering-wastes:'+str(d['SeasonInfo']['Id']),'startDate':d['Begin'],'endDate':d['End'],'tokenIds':reward_ids,'sourceUrl':'https://wuther.in/ko/whiwa/'+str(d['SeasonInfo']['Id'])+'/','scope':'reward-entries-only'})
 for row in tokens:
  if row['id'] in reward_ids:row['cycleIds'].append(cycles[0]['id']);row['availability']='source-cycle'
 if set(reward_ids)-{row['id'] for row in tokens}:raise ValueError('Known cycle reward tokens missing')
 if OUT.exists() and {row['id'] for row in json.loads(OUT.read_bytes())['tokens']}-{row['id'] for row in tokens}:raise ValueError('Token inventory regression')
 now=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
 catalog={'version':1,'sourceVersion':'3.7.8','checkedAt':now,'tokens':tokens,'cycles':cycles,'sources':[{'name':'wuther.in · public item catalog','url':'https://wuther.in/ko/item/','kind':'community','checkedAt':now},{'name':'wuther.in · published sitemap','url':'https://wuther.in/sitemap.xml','kind':'community','checkedAt':now}],'limits':{'maxEquippedPerRun':None,'maxEquippedPerTeam':None,'useLimitScope':'Source item description only; not assumed to be simultaneous equip slots.'},'coverage':{'tokens':len(tokens),'effectsAvailable':sum(row['effectAvailable'] for row in tokens),'missingEffectIds':[row['id'] for row in tokens if not row['effectAvailable']],'nativeLocales':4,'currentCycleAvailability':'unknown','imageDelivery':'Declared original asset URL; exporter/CDN access returned403, no image-byte verification claim.'}}
 (WORK/'receipt.json').write_text(json.dumps({'checkedAt':now,'sourceVersion':'3.7.8','sitemap':{'url':'https://wuther.in/sitemap.xml','bytes':len(sitemap),'sha256':hashlib.sha256(sitemap).hexdigest()},'candidateCount':len(ids),'tokenCount':len(tokens),'itemSources':refs,'knownCycleFixture':{'file':'tests/fixtures/wuwa-reference/slash-ko.json','sha256':hashlib.sha256(fixture.read_bytes()).hexdigest()},'imageCheck':{'url':'https://wutherin.cn-nb1.rains3.com/UI/UIResources/Common/Image/IconMowing/T_IconMowing_58.webp','status':403,'verifiedOriginals':0,'bypassAttempts':0}},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 tmp=OUT.with_suffix('.json.new');tmp.write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8');tmp.replace(OUT)
 print('complete',len(tokens),OUT.stat().st_size,flush=True)
if __name__=='__main__':main()
