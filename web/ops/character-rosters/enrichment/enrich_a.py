#!/usr/bin/env python3
"""Recover factual roster names/stat tables/art declarations from fixed public sources.

Reads normal public HTTPS only. No credentials, redirects to private APIs, source
evaluation, player data, writes to GAGETHER, or publication. Inputs are never edited.
Per-character detail failure preserves every previous value and is reported;
critical source failure preserves that entire game's input in the output.
"""
import argparse, concurrent.futures, copy, datetime, hashlib, html, json, pathlib, re, urllib.request, unicodedata

GAMES=('limbus','nikke','trickcal','reverse1999')
NIKKE='https://nikke-api-gunwoos-projects.vercel.app/api/nikkes'
LIMBUS='https://raw.githubusercontent.com/hakutou29/LimbusStoryReader/main/LocalizeLimbusCompany/'
TRICK='https://raw.githubusercontent.com/lsbim/foods/master/src/data/i18n/charInfo.js'
REVERSE='https://raw.githubusercontent.com/St-Pavlov-Foundation/re1999-data-global/main/data/'
LOCALES=('ko','en','ja','zh')
NAMES_ONLY=False
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')
def copies(ko,en=None,ja=None,zh=None):return dict(zip(LOCALES,(ko,en or ko,ja or en or ko,zh or en or ko)))
def normalize(s):
 s=unicodedata.normalize('NFKD',str(s)).encode('ascii','ignore').decode().lower()
 return re.sub('[^a-z0-9]','',s).replace('association','assoc').replace('harpooner','harpooneer').replace('representative','rep')
def clean(s):return html.unescape(re.sub('<[^>]+>','',str(s or ''))).replace('\\n',' ').strip()
def json_field(s,key):
 m=re.search(r'"'+re.escape(key)+r'"\s*:',s)
 if not m:raise ValueError('Missing '+key)
 return json.JSONDecoder().raw_decode(s,m.end())[0]
def flight(s):
 chunks=[]
 for m in re.finditer(r'self\.__next_f\.push\((\[.*?\])\)',s):
  try:
   x=json.loads(m.group(1))
   if len(x)>1 and isinstance(x[1],str):chunks.append(x[1])
  except (ValueError,TypeError):pass
 if not chunks:raise ValueError('Missing inert Next Flight data')
 return ''.join(chunks)
class Cache:
 def __init__(self,path):self.path=pathlib.Path(path);self.path.mkdir(parents=True,exist_ok=True);self.receipts=[]
 def get(self,url):
  if not url.startswith(('https://raw.githubusercontent.com/','https://www.prydwen.gg/','https://nikke-api-gunwoos-projects.vercel.app/','https://store.steampowered.com/feeds/news/app/1973530/')):raise ValueError('Source outside fixed allowlist')
  key=hashlib.sha256(url.encode()).hexdigest();p=self.path/(key+'.body');m=self.path/(key+'.json')
  if p.exists()and m.exists():
   receipt=json.loads(m.read_text());b=p.read_bytes()
   if receipt['url']!=url or hashlib.sha256(b).hexdigest()!=receipt['sha256']:raise ValueError('Corrupt cached source')
   checked=datetime.datetime.fromisoformat(receipt['checkedAt'].replace('Z','+00:00'))
   if (datetime.datetime.now(datetime.timezone.utc)-checked).total_seconds()>=21600:
    # The reusable workdir must never make a six-hour collection stale forever.
    # A fresh normal fetch is required after the collection cadence; failure is
    # surfaced without overwriting last-good cached bytes.
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-roster-enrichment/1.0','Accept':'application/json,text/html,text/plain;q=0.9'}),timeout=35)as r:
     if r.status!=200:raise ValueError('Expected HTTP200')
     fresh=r.read(32*1024*1024+1)
     if len(fresh)>32*1024*1024:raise ValueError('Source exceeds bound')
    b=fresh;receipt={'url':url,'checkedAt':now(),'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'httpStatus':200};p.write_bytes(b);m.write_text(json.dumps(receipt))
  else:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-roster-enrichment/1.0','Accept':'application/json,text/html,text/plain;q=0.9'}),timeout=35)as r:
    if r.status!=200:raise ValueError('Expected HTTP200')
    b=r.read(32*1024*1024+1)
    if len(b)>32*1024*1024:raise ValueError('Source exceeds bound')
   receipt={'url':url,'checkedAt':now(),'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'httpStatus':200};p.write_bytes(b);m.write_text(json.dumps(receipt))
  self.receipts.append(receipt);return b.decode('utf-8-sig')
 def json(self,url):return json.loads(self.get(url))
def stat(key,value,label,basis):return {'id':key,'label':label,'value':str(value),'basis':basis}
def native_name(row,locale,value,url,kind='community'):
 if value and not str(value).startswith('language_'):
  row['name'][locale]=clean(value);row.setdefault('nameSources',{})[locale]={'url':url,'kind':kind}
def merge_art(row,url,source,kind='splash'):
 if not url or not str(url).startswith('https://'):return
 art={'url':url,'sourceUrl':source,'kind':kind,'locale':'neutral','sourceKind':'community'}
 prior=row.get('image');row['image']=art
 row['images']=list({a['url']:a for a in [*(row.get('images')or[]),*([prior]if prior else[])] if a['url']!=url}.values())
def detail_rows(doc,cache,fn,workers=6):
 if NAMES_ONLY:return 0,[]
 errors=[];count=0
 def job(c):
  try:return c['id'],fn(c),None
  except Exception as e:return c['id'],None,type(e).__name__+': '+str(e)
 with concurrent.futures.ThreadPoolExecutor(max_workers=workers)as pool:
  for ident,patch,error in pool.map(job,doc['characters']):
   if error:errors.append({'id':ident,'error':error});continue
   row=next(c for c in doc['characters']if c['id']==ident)
   for k,v in patch.items():
    if k=='art':merge_art(row,*v)
    else:row[k]=v
   count+=1
 return count,errors

# Explicit same-character source aliases. These are identity joins, never name
# generation. Exact native names come from the joined table's language fields.
NIKKE_ALIASES={
 'Rei':339201,'Sakura':328201,
 'Red Hood B3':447001,'Asuka Shikinami Langley':583001,'Rei Ayanami':583101,
 'Mari Makinami Illustrious':583201,'Misato Katsuragi':583301,
 'Asuka Shikinami Langley: Wille':583501,'Rei Ayanami (Tentative Name)':583401,
 'Sakura Suzuhara':583601,'Siren':451301,'Jill Valentine':584101,
 'Ada Wong':584001,'Claire Redfield':584201,'Chisato Nishikigi':586001,
 'Takina Inoue':586101,'Queen (Makoto Niijima)':587001,'Yukiko Amagi':587101}
TRICK_ALIASES={'Annette':'Arnet','Asia':'Eisia','Benny':'Beni','Caesar':'Scizor','Diana (Heyday)':'Diana(Yester)','Leone':'Lion','Rollet':'Rollett','Shuro':'Suro','Skea':'Skia','xXionXx':'xXionx'}
LABELS={'hp':copies('HP','HP','HP','生命值'),'atk':copies('공격력','ATK','攻撃力','攻击力'),'def':copies('방어력','DEF','防御力','防御力'),'speed':copies('속도','Speed','速度','速度'),'crit_rate':copies('치명타 확률','CRIT Rate','会心率','暴击率'),'crit_dmg':copies('치명타 피해','CRIT DMG','会心ダメージ','暴击伤害'),'reality_def':copies('현실 방어','Reality DEF','リアル防御力','现实防御'),'mental_def':copies('정신 방어','Mental DEF','メンタル防御力','精神防御')}
def enrich_nikke(doc,cache):
 source=cache.json(NIKKE)['characters'];by_id={c['id']:c for c in source};index={}
 if len(source)<150 or len(by_id)!=len(source):raise ValueError('Incomplete or duplicate NIKKE native inventory')
 for c in source:index.setdefault(normalize(c['name'].get('en','')),[]).append(c)
 matches={};missing=[]
 for c in doc['characters']:
  en=c['name']['en'];rows=index.get(normalize(en),[]);hit=by_id.get(NIKKE_ALIASES.get(en))or(rows[0]if len(rows)==1 else None)
  if not hit:missing.append(c['id']);continue
  matches[c['id']]=hit
  c['sourceUrl']=NIKKE+'/'+str(hit['id']);c['sourceKind']='community'
  for l,loc in [('ko','ko'),('ja','ja'),('zh','zh-TW')]:native_name(c,l,hit['name'].get(loc),NIKKE+'/'+str(hit['id']))
  # Official BlablaLink's declared original is a full-body rather than gacha splash.
  merge_art(c,hit.get('images',{}).get('full'),NIKKE+'/'+str(hit['id']),'full-body')
  if hit['rarity'].upper()in ('R','SR','SSR'):c['rarity']={'R':1,'SR':2,'SSR':3}[hit['rarity'].upper()];c['rarityLabel']=hit['rarity'].upper()
 def details(c):
  if c['id']not in matches:return {}
  hit=matches[c['id']];url=NIKKE+'/'+str(hit['id'])+'?fields=id,name,details.statsPerLevel,details.combat';d=cache.json(url)
  if d.get('id')!=hit['id']:raise ValueError('NIKKE identity mismatch')
  s=d.get('details',{}).get('statsPerLevel',{});combat=d.get('details',{}).get('combat',{});basis=copies('BlablaLink 성장표 Lv.1 · 장비·돌파·호감도 등 추가 보너스 제외','BlablaLink growth table, Lv.1; equipment, limit break, bond and other bonuses excluded','BlablaLink成長表・Lv.1。装備・限界突破・好感度などの追加効果を除く','BlablaLink成长表Lv.1，不含装备、突破、好感等额外加成')
  stats=[]
  for key,field in [('hp','hp'),('atk','attack'),('def','defence')]:
   v=s.get(field)
   if isinstance(v,list)and v and isinstance(v[0],(int,float)):stats.append(stat(key,v[0],LABELS[key],basis))
  for key,field in [('crit_rate','criticalRatio'),('crit_dmg','criticalDamage')]:
   if combat.get(field):stats.append(stat(key,combat[field],LABELS[key],basis))
  return {'stats':stats}if stats else{}
 count,errors=detail_rows(doc,cache,details)
 return {'nameMatches':len(matches),'unmatchedNames':missing,'detailReads':count,'detailFailures':errors,'note':'NIKKE official BlablaLink tables exposed through public community API; full files remain original same-character default outfits, not alternate costume assets.'}

def enrich_limbus(doc,cache):
 native={l:{r['id']:r for r in cache.json(LIMBUS+lang+'/Personalities.json')['dataList']}for l,lang in [('en','EN'),('ko','KR'),('ja','JP')]}
 if any(len(v)<160 for v in native.values()):raise ValueError('Incomplete Limbus native localization inventory')
 index={normalize(r['title']+' '+r['name']):i for i,r in native['en'].items()}
 # Prydwen omits Assoc. on two early records; this punctuation alias is exact.
 index.update({normalize('Cinq South Section 4 Director Sinclair'):11008,normalize('Cinq South Section 4 Outis'):11106})
 missing=[];matches=0
 for c in doc['characters']:
  ident=index.get(normalize(c['name']['en']))
  if ident:
   matches+=1
   for l,lang in [('ko','KR'),('ja','JP')]:
    hit=native[l].get(ident)
    if hit:native_name(c,l,hit['title']+' '+hit['name'],LIMBUS+lang+'/Personalities.json')
  else:missing.append(c['id'])
 def details(c):
  page=cache.get(c['sourceUrl']);d=json_field(flight(page),'character')
  if d['slug']!=c['sourceUrl'].rstrip('/').split('/')[-1]:raise ValueError('Limbus slug mismatch')
  d=d.get('data',{});s=d.get('status',{})or{};shown=re.search(r'Stats\s*\(At level\s*(\d+)\)',page);level=shown.group(1)if shown else'1';suffix='30'if shown else'1'
  # Provider field names are historical: hp_30 is currently rendered under a
  # visible Lv.60 heading. The observed heading, never that legacy key alone,
  # establishes the stat panel's level.
  basis=copies(f'Prydwen 공개 표 Lv.{level} · 기본 상태 표기, 편성 버프 제외',f'Prydwen public Lv.{level} stat panel; base status, excluding team buffs',f'Prydwen公開表 Lv.{level}。基礎ステータス、編成バフを除く',f'Prydwen公开Lv.{level}基础属性表，不含队伍增益')
  stats=[stat(k,s[f+'_'+suffix],LABELS[k],basis)for k,f in [('hp','hp'),('def','def'),('speed','speed')]if s.get(f+'_'+suffix)not in (None,'')]
  patch={}
  if stats:patch['stats']=stats
  if d.get('full_image'):patch['art']=(d['full_image'],c['sourceUrl'],'splash')
  return patch
 count,errors=detail_rows(doc,cache,details)
 # The latest six identities are absent in the mirrored base localization file.
 # Their Korean explanatory renderings are explicitly marked translations, never
 # falsely promoted to publisher-native names or to a read blocked source.
 extra={
  '190':'동부 섕크 협회 3과 홍루',
  '191':'오트쿠튀르::르누아르 신발관 료슈',
  '192':'오트쿠튀르::르루주 부티크 이스마엘',
  '193':'오트쿠튀르::수선실 로쟈',
  '194':'오트쿠튀르::르누아르 브랜드 매니저 돈키호테',
  '195':'오트쿠튀르::르루주 붉은 신 싱클레어'}
 # Only a freshly read publisher source may promote the latest explanatory
 # translations to native names. A failed optional source leaves them marked.
 native_recent='';recent_url='https://store.steampowered.com/feeds/news/app/1973530/?l=koreana';name_source_failures=[]
 try:native_recent=clean(cache.get(recent_url))
 except Exception as e:name_source_failures.append({'url':recent_url,'error':type(e).__name__+': '+str(e)})
 for c in doc['characters']:
  if c['id']in extra and not c['name'].get('ko'):
   name=extra[c['id']];is_native=re.sub(r'\s','',name)in re.sub(r'\s','',native_recent)
   native_name(c,'ko',name,recent_url if is_native else c['sourceUrl'],'official'if is_native else'translation')
 return {'nativeNameMatches':matches,'baseLocalizationGaps':missing,'detailReads':count,'detailFailures':errors,'nameSourceFailures':name_source_failures,'note':'All stable Prydwen IDs retained; native title+name matched by exact normalized English title and native game-localization ID. Original Prydwen full_image is never guessed from a filename.'}

def enrich_trickcal(doc,cache):
 source=cache.get(TRICK);rows=[]
 for block in re.findall(r'names\s*:\s*\{([^}]+)\}',source):
  d={a or b or c:v for a,b,c,v in re.findall(r'''(?:'([^']+)'|"([^"]+)"|(\w+))\s*:\s*"([^"]*)"''',block)}
  if d.get('ko')and d.get('en'):rows.append(d)
 if len(rows)<100:raise ValueError('Incomplete multilingual Trickcal table')
 index={normalize(d['en']):d for d in rows};missing=[]
 for c in doc['characters']:
  hit=index.get(normalize(TRICK_ALIASES.get(c['name']['en'],c['name']['en'])))
  if not hit:missing.append(c['id']);continue
  for l,loc in [('ko','ko'),('ja','ja'),('zh','zh-CN')]:native_name(c,l,hit.get(loc),TRICK)
 return {'nameMatches':len(doc['characters'])-len(missing),'unmatchedNames':missing,'sourceCount':len(rows),'note':'lsbim/foods explicitly provides multilingual same-apostle names. This source supplies grade/personality but no HP/ATK/DEF table; no numerical combat stats were invented.'}

def enrich_reverse1999(doc,cache):
 chars=cache.json(REVERSE+'json/character.json');ko={r['key']:r['content']for r in cache.json(REVERSE+'configs/language/language_kr.json')};en={r['key']:r['content']for r in cache.json(REVERSE+'configs/language/language_en.json')}
 if len(chars)<100 or len({c['id']for c in chars})!=len(chars)or len(ko)<10000 or len(en)<10000:raise ValueError('Incomplete or duplicate Reverse native inventory')
 index={normalize(r['nameEng']):r for r in chars};index.update({normalize(en[r['name']]):r for r in chars if en.get(r['name'])})
 missing=[];matches=0
 for c in doc['characters']:
  hit=index.get(normalize(c['name']['en']))
  if hit and ko.get(hit['name']):native_name(c,'ko',ko[hit['name']],REVERSE+'configs/language/language_kr.json');matches+=1
  else:missing.append(c['id'])
 # CN-first community records currently absent in the native global tables.
 # Keep their explanatory Korean display forms explicitly tagged as translations.
 extra={'Hedone':'헤도네','Narcissus':'나르키소스','Huntsworn Lilya':'사냥 마녀 릴리아','Glyndŵr':'글린두르'}
 for c in doc['characters']:
  if not c['name'].get('ko')and c['name']['en']in extra:native_name(c,'ko',extra[c['name']['en']],c['sourceUrl'],'translation')
 def details(c):
  d=json_field(flight(cache.get(c['sourceUrl'])),'character')
  if d['slug']!=c['sourceUrl'].rstrip('/').split('/')[-1]:raise ValueError('Reverse source identity mismatch')
  s=d.get('characterStats')or{};stats=[]
  basis=copies('Prydwen 기본 표 · 통찰 0 Lv.1, 공명·의지·조각 보너스 제외','Prydwen base table, Insight 0 Lv.1; resonance, psychube and portray bonuses excluded','Prydwen基礎表・洞察0 Lv.1。共鳴・心相・塑造の追加効果を除く','Prydwen基础表，洞悉0 Lv.1，不含共鸣、心相、塑造加成')
  for key in ['hp','atk','reality_def','mental_def','crit_rate','crit_dmg']:
   value=(s.get(key)or{}).get('insight_0_min')
   if value is not None:stats.append(stat(key,str(value)+('%'if key in ['crit_rate','crit_dmg']else''),LABELS[key],basis))
  return {'stats':stats}if stats else{}
 count,errors=detail_rows(doc,cache,details)
 native_levels={r['heroId']:r for r in cache.json(REVERSE+'json/character_level.json')if r['level']==1}
 native_basis=copies('공개 클라이언트 character_level 표 · Lv.1, 통찰·공명·의지·조각 보너스 제외','Public client character_level table, Lv.1; insight, resonance, psychube and portray bonuses excluded','公開クライアント character_level表・Lv.1。洞察・共鳴・心相・塑造の追加効果を除く','公开客户端character_level表Lv.1，不含洞悉、共鸣、心相、塑造加成')
 for c in doc['characters']:
  hit=index.get(normalize(c['name']['en']));values=native_levels.get(hit['id'])if hit else None
  if values:
   old={s['id']:s for s in c.get('stats',[])}
   old.update({k:stat(k,values[f],LABELS[k],native_basis)for k,f in [('hp','hp'),('atk','atk'),('reality_def','def'),('mental_def','mdef')]})
   c['stats']=list(old.values())
 return {'nativeNameMatches':matches,'unmatchedNames':missing,'detailReads':count,'detailFailures':errors,'note':'Korean native names joined through the exact client name key and published English identity; absent CN-first names remain reported gaps. Stats retain their actual Insight 0 Lv.1 basis.'}

def enrich(game,document,cache_dir):
 cache=Cache(pathlib.Path(cache_dir)/game);out=copy.deepcopy(document);report=globals()['enrich_'+game](out,cache)
 additions={'nikke':[NIKKE],'limbus':[LIMBUS+lang+'/Personalities.json'for lang in('EN','KR','JP')]+['https://store.steampowered.com/feeds/news/app/1973530/?l=koreana'],'trickcal':[TRICK],'reverse1999':[REVERSE+'json/character.json',REVERSE+'json/character_level.json',REVERSE+'configs/language/language_kr.json',REVERSE+'configs/language/language_en.json']}[game]
 out['sourceUrls']=list(dict.fromkeys([*out['sourceUrls'],*additions]))
 if game=='nikke':out['sourceName']='Prydwen + BlablaLink native tables (public community mirror)'
 before={k:v for k,v in document.items()if k!='checkedAt'};after={k:v for k,v in out.items()if k!='checkedAt'}
 if before!=after:out['checkedAt']=now()
 report.update(gameId=game,count=len(out['characters']),koreanNames=sum(bool(c['name'].get('ko'))for c in out['characters']),stats=sum(bool(c.get('stats'))for c in out['characters']),fullArt=sum(c.get('image',{}).get('kind')in('full-body','splash')for c in out['characters']),sources=cache.receipts)
 return out,report
def main():
 global NAMES_ONLY
 p=argparse.ArgumentParser();p.add_argument('--input-dir',required=True);p.add_argument('--output-dir',required=True);p.add_argument('--cache-dir');p.add_argument('--games',nargs='*',choices=GAMES,default=list(GAMES));p.add_argument('--names-only',action='store_true');args=p.parse_args();NAMES_ONLY=args.names_only
 src=pathlib.Path(args.input_dir);dest=pathlib.Path(args.output_dir);dest.mkdir(parents=True,exist_ok=True);reports=[]
 for game in args.games:
  source=src/(game+'.json')
  if not source.exists():continue
  original=json.loads(source.read_text())
  try:
   out,report=enrich(game,original,args.cache_dir or str(dest/'sources'));report['status']='partial'if report.get('detailFailures')or report.get('unmatchedNames')else'ok'
  except Exception as e:out=original;report={'gameId':game,'status':'failed','error':type(e).__name__+': '+str(e),'preservedInput':True}
  (dest/(game+'.json')).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');reports.append(report);print(json.dumps({k:v for k,v in report.items()if k not in('sources','detailFailures')},ensure_ascii=False),flush=True)
 (dest/'enrichment-a-report.json').write_text(json.dumps({'checkedAt':now(),'games':reports},ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
