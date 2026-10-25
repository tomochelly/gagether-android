#!/usr/bin/env python3
"""Exact-ID ZZZ facts and declared official originals; no Site writes.

Downloads only fixed public sources and their declared original image/data modules.
Downloaded JS is parsed inertly by parse-catalog.mjs, never imported/executed.
Source failures preserve prior character fields and remain visible in manifest.json.
"""
from __future__ import annotations
import argparse,ast,concurrent.futures,copy,datetime,decimal,hashlib,html,io,json,math,operator,pathlib,re,subprocess,sys,urllib.parse,urllib.request
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parent
LOCALES=('ko','en','ja','zh')
OFFICIAL='https://sg-public-api-static.hoyoverse.com/content_v2_user/app/3e9196a4b9274bd7/getContentList?iChanId=287&iPageSize=200&iPage=1&sLangKey=ko-kr'
ENKA='https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/zzz/avatars.json'
FORMULA='https://github.com/EnkaNetwork/API-docs/blob/master/docs/zzz/api.md#formulas'
GG='https://zzz.gg'
GG_LOCALES={'ko':'ko','en':'en','ja':'jp','zh':'zh-hans'}
def C(ko,en,ja,zh):return dict(zip(LOCALES,(ko,en,ja,zh)))
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')
def dump(p,v):pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,separators=(',',':'))+'\n')
def fmt(n):
 d=decimal.Decimal(str(n));s=format(d.quantize(decimal.Decimal('.0001')).normalize(),'f');return '0'if s=='-0'else s
class Sources:
 def __init__(self,root,replay_root=None):self.root=root;root.mkdir(parents=True,exist_ok=True);self.receipts=[];self.replay_root=replay_root
 def get(self,key,url,maximum=15_000_000):
  if self.replay_root:
   b=(self.replay_root/(key+'.body')).read_bytes();receipt=json.loads((self.replay_root/(key+'.meta.json')).read_text())
   if receipt.get('url')!=url or len(b)>maximum or hashlib.sha256(b).hexdigest()!=receipt.get('sha256'):raise ValueError('Captured source identity/hash mismatch')
   receipt={**receipt,'via':'hash-verified-source-replay'};self.receipts.append(receipt)
   if self.root!=self.replay_root:(self.root/(key+'.body')).write_bytes(b);dump(self.root/(key+'.meta.json'),receipt)
   return b
  request=urllib.request.Request(url,headers={'User-Agent':'GAGETHER-ZZZ-reference/1.0','Accept':'application/json,text/html,*/*'})
  with urllib.request.urlopen(request,timeout=35)as r:
   b=r.read(maximum+1)
   if len(b)>maximum:raise ValueError('Source exceeds bound')
   receipt={'key':key,'url':url,'checkedAt':now(),'status':r.status,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)}
  (self.root/(key+'.body')).write_bytes(b);dump(self.root/(key+'.meta.json'),receipt);self.receipts.append(receipt);return b
def norm(s):return re.sub(r'[^\w]','',html.unescape(str(s))).casefold()
def safe_math(expression,rank):
 expression=re.sub(r'AvatarSkillLevel\(\d+\)',str(rank),expression)
 if len(expression)>200 or re.search(r'[^\d.\s+*/()\-]',expression):raise ValueError('Unknown source expression')
 tree=ast.parse(expression,mode='eval')
 def value(n):
  if isinstance(n,ast.Constant)and isinstance(n.value,(int,float))and not isinstance(n.value,bool):return decimal.Decimal(str(n.value))
  if isinstance(n,ast.UnaryOp)and isinstance(n.op,(ast.UAdd,ast.USub)):return value(n.operand)*(1 if isinstance(n.op,ast.UAdd)else-1)
  if isinstance(n,ast.BinOp)and type(n.op)in (ast.Add,ast.Sub,ast.Mult,ast.Div):return {ast.Add:operator.add,ast.Sub:operator.sub,ast.Mult:operator.mul,ast.Div:operator.truediv}[type(n.op)](value(n.left),value(n.right))
  raise ValueError('Nonliteral source expression')
 return value(tree.body)
BUTTONS={
 'Icon_Normal':C('[일반 공격]','[Basic Attack]','[通常攻撃]','[普通攻击]'),
 'Icon_Special':C('[특수 스킬]','[Special Attack]','[特殊スキル]','[特殊技]'),
 'Icon_SpecialReady':C('[강화 특수 스킬]','[EX Special Attack]','[強化特殊スキル]','[强化特殊技]'),
 'Icon_SpecialReady_Rp':C('[강화 특수 스킬]','[EX Special Attack]','[強化特殊スキル]','[强化特殊技]'),
 'Icon_SpecialReady_Ep':C('[강화 특수 스킬]','[EX Special Attack]','[強化特殊スキル]','[强化特殊技]'),
 'Icon_Evade':C('[회피]','[Dodge]','[回避]','[闪避]'),
 'Icon_Switch':C('[지원]','[Assist]','[支援]','[支援]'),
 'Icon_UltimateReady':C('[궁극기]','[Ultimate]','[終結スキル]','[终结技]')}
def text(s,locale,rank=1):
 s=html.unescape(str(s)).replace('\\n','\n')
 s=re.sub(r'\{LAYOUT_(?:CONSOLECONTROLLER|KEYBOARD)#[^}]*\}','',s)
 s=re.sub(r'\{LAYOUT_FALLBACK#([^}]*)\}',r'\1',s)
 def calculated(m):
  expression,scale,precision=m.group(1),decimal.Decimal(m.group(2)),int(m.group(3))
  if scale not in (1,100)or precision not in range(1,6):raise ValueError('Unknown CAL formatting')
  return fmt((safe_math(expression,rank)*scale).quantize(decimal.Decimal(10)**-precision,rounding=decimal.ROUND_HALF_UP))
 s=re.sub(r'\{CAL:([^,{}]+),(\d+),(\d+)\}',calculated,s)
 def button(m):
  if m.group(1)not in BUTTONS:raise ValueError('Unknown control icon')
  return BUTTONS[m.group(1)][locale]
 s=re.sub(r'<IconMap:([^>]+)>',button,s)
 s=re.sub(r'<[^>]+>','',s);s=re.sub(r'[ \t]+',' ',s);s=re.sub(r' *\n *','\n',s).strip()
 if re.search(r'\{(?:CAL:|LAYOUT_)|<[^>]+>',s):raise ValueError('Unresolved game markup')
 if len(s)>3000:raise ValueError('Description exceeds schema; must split explicitly')
 return s
def parameterize(variants):
 """Lossless numeric compression; bounded text chunks retain prose variants."""
 tokens=[re.split(r'(-?\d+(?:,\d{3})*(?:\.\d+)?)',v)for v in variants]
 if any(len(x)!=len(tokens[0])or x[::2]!=tokens[0][::2]for x in tokens):
  # Text parameters are schema-supported; no source paragraph is discarded.
  count=math.ceil(max(map(len,variants))/300)
  return ''.join('{'+str(i+1)+'}'for i in range(count)),[[v[i*300:(i+1)*300]for v in variants]for i in range(count)]
 template='';params=[]
 for i,part in enumerate(tokens[0]):
  if i%2:
   values=[x[i]for x in tokens]
   if len(set(values))==1:template+=part
   else:params.append(values);template+='{'+str(len(params))+'}'
  else:template+=part
 return template,params
STAT_LABELS={'hp':C('HP','HP','HP','生命值'),'atk':C('공격력','ATK','攻撃力','攻击力'),'def':C('방어력','DEF','防御力','防御力'),'crit_rate':C('치명타 확률','CRIT Rate','会心率','暴击率'),'crit_dmg':C('치명타 피해','CRIT DMG','会心ダメージ','暴击伤害'),'impact':C('충격력','Impact','衝撃力','冲击力'),'proficiency':C('이상 마스터리','Anomaly Proficiency','異常マスタリー','异常精通'),'mastery':C('이상 장악력','Anomaly Mastery','異常掌握','异常掌控'),'energy_regen':C('에너지 자동 회복','Energy Regen','エネルギー自動回復','能量自动回复')}
STAT_IDS={'hp':'11101','atk':'12101','def':'13101','impact':'12201','crit_rate':'20101','crit_dmg':'21101','mastery':'31401','proficiency':'31201','energy_regen':'30501'}
STAT_BASIS=C('선택 레벨·승급 · 핵심 강화 0 · 음동기·디스크·시네마 제외 · Enka 기본+성장+승급, 정수 버림','Selected level/promotion, core 0; no W-Engine/Discs/Mindscapes. Enka base+growth+promotion, integers floored.','選択レベル・昇格・コア0。音動機・ディスク・凸なし。Enka基礎＋成長＋昇格、整数切り捨て。','所选等级/晋升、核心0；不含音擎/驱动盘/影画。Enka基础+成长+晋升，整数向下取整。')
SKILL_BASIS=C('시네마 강화 제외','No Mindscape upgrades.','凸強化なし。','不含影画升级。')
CORE_BASIS=C('핵심 기본–F · 시네마 제외','Core base–F; no Mindscapes.','コア初期–F・凸なし。','核心初始–F，不含影画。')
KINDS={0:C('일반 공격','Basic Attack','通常攻撃','普通攻击'),1:C('특수 스킬','Special Attack','特殊スキル','特殊技'),2:C('회피','Dodge','回避','闪避'),3:C('콤보·궁극기','Chain / Ultimate','連携・終結','连携/终结'),5:C('핵심 스킬','Core Skill','コアスキル','核心技'),6:C('지원','Assist','支援','支援')}
CORE_LABELS=[C('기본','Base','初期','初始')]+[C(x,x,x,x)for x in 'ABCDEF']
def stat_values(raw,level,stage):
 result={}
 for key,pid in STAT_IDS.items():
  if pid not in raw['BaseProps']:continue
  value=decimal.Decimal(raw['BaseProps'][pid])+decimal.Decimal(raw.get('GrowthProps',{}).get(pid,0))*(level-1)/10000+decimal.Decimal(raw['PromotionProps'][stage].get(pid,0))
  result[key]=fmt(value/100)+('%'if key.startswith('crit_')else'')if key.startswith('crit_')or key=='energy_regen'else str(math.floor(value))
 return result
def with_stats(row,raw):
 values=stat_values(raw,60,5)
 default_basis=C('Lv.60 · 승급5 · 핵심0','Lv.60 / promotion5 / core0','Lv.60・昇格5・コア0','60级/晋升5/核心0')
 row['stats']=[{'id':key,'label':STAT_LABELS[key],'value':value,'basis':default_basis,'group':'primary'if key in ('hp','atk','def')else'detail'}for key,value in values.items()]
 rows=[]
 for stage in range(6):
  for level in sorted({max(1,stage*10),stage*10+10}):rows.append({'level':level,'stage':stage,'values':stat_values(raw,level,stage)})
 row['statProgression']={'sourceUrl':FORMULA,'sourceKind':'community','basis':STAT_BASIS,'stageLabel':C('돌파 단계','Promotion','突破段階','突破阶段'),'stats':[{'id':k,'label':STAT_LABELS[k],'group':'primary'if k in ('hp','atk','def')else'detail'}for k in values],'stages':[{'id':i,'label':C('승급 '+str(i),'Promotion '+str(i),'昇格 '+str(i),'晋升 '+str(i))}for i in range(6)],'rows':rows}
def gg_url(c,locale):
 name=c['Name'].strip().replace('- ','');name=re.sub(r'\s','-',name)
 for value in ('.',')','(','<br>','"',"'",'º','「','」'):name=name.replace(value,'')
 return GG+'/'+GG_LOCALES[locale]+'/characters/'+urllib.parse.quote(name.lower(),safe='')
def multiplier(value,rank,avatar,scaling):
 had_skill=False
 def skill(m):
  nonlocal had_skill
  had_skill=True;raw=scaling.get(int(m.group(1)))
  if not raw or raw['AvatarID']!=avatar:raise ValueError('Unbound scaling identity')
  key={1001:'DamagePercentage',1002:'StunRatio'}.get(int(m.group(2)))
  if not key:raise ValueError('Unknown scaling property')
  return fmt(decimal.Decimal(raw[key]+(rank-1)*raw.get(key+'Growth',0))/100)
 result=re.sub(r'\{Skill:\s*(\d+),\s*Prop:\s*(\d+)\}',skill,value)
 if had_skill:
  result=result.replace('{','(').replace('}',')');return fmt(safe_math(result,rank))+'%'
 return text(result,'en',rank)
def with_details(row,native,catalogs,audit):
 ko=native['ko'];sources={l:gg_url(native[l],l)for l in LOCALES};scaling={s['ID']:s for s in catalogs['en']['skill_scaling']};tables=[]
 indices=[i for i,s in enumerate(ko['Skills'])if s.get('TextType')==0 or 'Growth'in s]
 # Same ID and structural index in all four declared language catalogs.
 if any(len(native[l]['Skills'])!=len(ko['Skills'])for l in LOCALES):raise ValueError('Native skill inventory differs')
 row_groups=[];current=None
 for i,s in enumerate(ko['Skills']):
  if s.get('TextType')!=1:continue
  if s.get('DescType')==0:
   current={'title':s['Text'],'letter':s['SkillLetter'],'rows':[],'index':i,'used':False};row_groups.append(current)
  elif current is not None:current['rows'].append(i)
 def append_values(item,group):
  group['used']=True
  for ri in group['rows']:
   value=native['en']['Skills'][ri].get('Value','')
   if not value:continue
   levels=[multiplier(value,rank,int(row['id']),scaling)for rank in range(1,13)]
   if any(len(v)>300 for v in levels):raise ValueError('Numeric row exceeds bound')
   item['values'].append({'id':'row-'+str(ri),'label':{l:text(native[l]['Skills'][ri]['Text'],l)for l in LOCALES},'levels':levels if len(set(levels))>1 else levels[:1]})
  item['maxLevel']=12
 for i in indices:
  s=ko['Skills'][i];letter=s['SkillLetter'];basis=CORE_BASIS if 'Growth'in s else SKILL_BASIS
  item={'id':'zzz-skill-'+str(i),'name':{l:text(native[l]['Skills'][i]['TextTitle'],l)for l in LOCALES},'type':KINDS[letter],'sourceUrl':sources['ko'],'sourceKind':'community','basis':basis,'values':[]}
  variants={l:[text(v,l,rank+1)for rank,v in enumerate(native[l]['Skills'][i]['Growth'])]if'Growth'in s else[text(native[l]['Skills'][i]['Text'],l,rank)for rank in range(1,13)]for l in LOCALES}
  dynamic='Growth'in s or any(len(set(v))>1 for v in variants.values())
  if dynamic:
   templates={};params={}
   for l in LOCALES:templates[l],params[l]=parameterize(variants[l])
   item.update(descriptionTemplate=templates,parameters=params,maxLevel=7 if 'Growth' in s else 12)
   if'Growth'in s:item['levelLabels']=CORE_LABELS
  else:item['description']={l:v[0]for l,v in variants.items()}
  group=next((g for g in row_groups if not g['used']and g['title']==s['TextTitle']and g['letter']==letter),None)
  if group:append_values(item,group)
  tables.append(item)
 # Stance/attack variants may have a numeric heading distinct from all prose
 # titles. Retain those exact groups instead of silently losing their values.
 for group in row_groups:
  if group['used']or not any(ko['Skills'][i].get('Value')for i in group['rows']):continue
  i=group['index'];item={'id':'zzz-parameters-'+str(i),'name':{l:text(native[l]['Skills'][i]['Text'],l)for l in LOCALES},'type':KINDS[group['letter']],'sourceUrl':sources['ko'],'sourceKind':'community','basis':SKILL_BASIS,'values':[]};append_values(item,group);tables.append(item)
 expected={i for i,s in enumerate(ko['Skills'])if s.get('TextType')==1 and s.get('Value')};actual=[int(v['id'].removeprefix('row-'))for t in tables for v in t['values']]
 if len(actual)!=len(set(actual))or set(actual)!=expected:raise ValueError('Native numerical rows lost or duplicated')
 for i in range(6):
  if any(len(native[l]['Talents'])!=6 or native[l]['Talents'][i]['TalentLevel']!=i+1 for l in LOCALES):raise ValueError('Mindscape inventory differs')
  tables.append({'id':'zzz-mindscape-'+str(i+1),'name':{l:text(native[l]['Talents'][i]['TalentName'],l)for l in LOCALES},'type':C('시네마 M'+str(i+1),'Mindscape M'+str(i+1),'心象映画 M'+str(i+1),'影画 M'+str(i+1)),'sourceUrl':sources['ko'],'sourceKind':'community','basis':C('ZZZ.gg 시네마 원문','ZZZ.gg native Mindscape text','ZZZ.gg心象映画原文','ZZZ.gg影画原文'),'description':{l:text(native[l]['Talents'][i]['TalentDesc'],l)for l in LOCALES},'values':[]})
 if len(tables)>40:raise ValueError('Skill tables exceed bound')
 row['skillTables']=tables
 sections=[{'id':'zzz-skill-basis','title':C('스킬 수치 기준','Skill value basis','スキル数値の基準','技能数值基准'),'body':C('스킬·참조 스킬은 선택한 공통 Lv.1–12 기준이며 시네마 강화를 제외한다. 핵심 스킬은 기본 및 A–F를 별도로 선택한다.','Skills and referenced skills use the selected common Lv.1–12 without Mindscape upgrades. Core skills independently select base or A–F.','参照先を含むスキルは選択した共通Lv.1–12、凸強化なし。コアスキルは初期またはA–Fを別途選択。','含引用技能采用所选共同1–12级，不含影画升级；核心技单独选择初始或A–F。')}]
 profile={l:native[l].get('Profile')or{}for l in LOCALES}
 if any(profile.values()):
  labels={'Gender':C('성별','Gender','性別','性别'),'Height':C('키','Height','身長','身高'),'Birthday':C('생일','Birthday','誕生日','生日')}
  body={l:'\n'.join([*[labels[k][l]+': '+text(profile[l][k],l)+(' cm'if k=='Height'and str(profile[l][k]).isdigit()else'')for k in labels if profile[l].get(k)],C('소속','Faction','所属','阵营')[l]+': '+text(native[l]['CampName'],l)])for l in LOCALES}
  sections.append({'id':'zzz-profile','title':C('프로필','Profile','プロフィール','档案'),'body':body})
 for idx,key in enumerate(('level','skills','core')):
  def material(l):
   found=next((m for m in native[l]['TotalMaterials']if m['Key']==key),None)
   return'\n'.join(text(m['Name'],l)+' × '+str(m['Number'])for m in found['Items'])if found else''
  title={'level':C('Lv.60 육성 재료','Lv.60 development materials','Lv.60育成素材','60级养成材料'),'skills':C('스킬 Lv.12 육성 재료 합계','All skills to Lv.12 materials','全スキルLv.12育成素材','全部技能12级材料'),'core':C('핵심 스킬 육성 재료 합계','All core skill materials','コアスキル育成素材合計','全部核心技材料')}[key]
  sections.append({'id':'zzz-materials-'+key,'title':title,'body':{l:material(l)for l in LOCALES}})
 old={s['id']:s for s in row.get('sections',[])};old.update({s['id']:s for s in sections});row['sections']=list(old.values())
 row['detailSources']=list({r['url']:r for r in [*row.get('detailSources',[]),*[{'url':u,'kind':'community'}for u in sources.values()],{'url':FORMULA,'kind':'community'}]}.values())
def official_match(row,native,official):
 keys={norm(row['name']['ko']),norm(row['name']['en']),*[norm(native[l][k])for l in ('ko','en')for k in ('Name','FullName')]}
 matches=[]
 for r in official:
  e=r['sExt'];names={norm(e.get('chara-name','')),norm(e.get('chara-name-en',''))}
  if keys&names:matches.append(r)
 if len(matches)!=1:raise ValueError('Ambiguous/missing official identity '+row['id'])
 return matches[0]
def download_art(it,sources,out):
 row,record=it;e=record['sExt'];declared=e.get('new-chara-cover-inner')or e.get('chara-cover-inner')or[]
 if len(declared)!=1:raise ValueError('Missing/ambiguous full original')
 url=declared[0]['url'];u=urllib.parse.urlparse(url)
 if u.scheme!='https'or u.netloc!='fastcdn.hoyoverse.com'or not u.path.startswith(('/content-v2/nap/','/static-resource-v2/','/upload/'))or u.query:raise ValueError('Unregistered official artwork host/path')
 b=sources.get('art-'+row['id'],url,30_000_000);im=Image.open(io.BytesIO(b));im.load()
 if im.format not in ('PNG','WEBP','JPEG')or min(im.size)<500:raise ValueError('Original format/dimensions unsuitable')
 sha=hashlib.sha256(b).hexdigest();ext={'PNG':'png','WEBP':'webp','JPEG':'jpg'}[im.format];path=out/(sha+'.'+ext);path.write_bytes(b)
 alpha=im.convert('RGBA').getchannel('A');bounds=alpha.point(lambda a:255 if a>=8 else 0).getbbox()
 source='https://zenless.hoyoverse.com/ko-kr/character?id='+str(record['iInfoId'])
 art={'url':url,'sourceUrl':source,'kind':'full-body','width':im.width,'height':im.height,'locale':'neutral','sourceKind':'official','caption':C('공식 캐릭터 소개 전체 원본','Complete official character introduction art','公式キャラクター紹介の全体原画','官方角色介绍完整原图')}
 inventory={'gameId':'zzz','characterId':row['id'],'sourceRoleId':record['iInfoId'],'sourceName':e['chara-name'],'url':url,'sourceUrl':source,'sourceIndexUrl':OFFICIAL,'sourceKind':'official','sha256':sha,'bytes':len(b),'width':im.width,'height':im.height,'ext':ext,'status':'ok','kind':'full-body','locale':'neutral','path':'public/roster-bootstrap/'+path.name,'publicUrl':'https://gagether.wiki/roster-bootstrap/'+path.name,'localPath':str(path),'alphaBounds':list(bounds)if bounds else None,'classification':'Declared complete official introduction standing illustration; no gacha splash claim.'}
 return row['id'],art,inventory
def run(args):
 out=args.output_dir;out.mkdir(parents=True,exist_ok=True);assets=out/'assets';assets.mkdir(exist_ok=True);sources=Sources(args.cache_dir or out/'sources',args.replay_source_root);audit={'checkedAt':now(),'status':'ok','errors':[],'omittedNumericRows':[]}
 original=json.loads(args.input.read_text());doc=copy.deepcopy(original)
 if doc.get('gameId')!='zzz':raise ValueError('Exact ZZZ input required')
 official=json.loads(sources.get('official-ko',OFFICIAL));official=official['data']['list']
 if len(official)<50:raise ValueError('Official inventory unexpectedly small')
 for r in official:r['sExt']=json.loads(r['sExt'])if isinstance(r['sExt'],str)else r['sExt']
 avatars=json.loads(sources.get('enka',ENKA));page=sources.get('gg-page',GG+'/ko/characters').decode();scripts=list(dict.fromkeys(re.findall(r'(?:href|src)="(/_nuxt/[^\"]+\.js)"',page)));catalogs={};modules={}
 # Discover exact locale module URLs from a declared application component.
 for i,path in enumerate(scripts):
  if 'gg-router'in modules:break
  body=sources.get('gg-discovery-'+str(i),GG+path).decode()
  if '../data/ko/characters.json'in body:modules['gg-router']={'url':GG+path,'body':body}
 if 'gg-router'not in modules:raise ValueError('Missing declared character data imports')
 for l in LOCALES:
  pattern=re.escape('../data/'+GG_LOCALES[l]+'/characters.json')+r'"\s*:\s*\(\)=>[A-Za-z_$][\w$]*\(\(\)=>import\("(\./[A-Za-z0-9_-]+\.js)"'
  match=re.search(pattern,modules['gg-router']['body'])
  if not match:raise ValueError('Missing declared native data module '+l)
  url=urllib.parse.urljoin(modules['gg-router']['url'],match[1]);sources.get('catalog-'+l,url,10_000_000)
  parsed=subprocess.run(['node',str(ROOT/'parse-catalog.mjs'),str(sources.root/('catalog-'+l+'.body'))],check=True,capture_output=True,text=True,timeout=45);catalogs[l]=json.loads(parsed.stdout)
 native={l:{str(c['ID']):c for c in catalogs[l]['characters']}for l in LOCALES};pairs=[]
 for row in doc['characters']:
  prior=copy.deepcopy(row)
  try:
   raw=avatars[row['id']];n={l:native[l][row['id']]for l in LOCALES};with_stats(row,raw);with_details(row,n,catalogs,audit);record=official_match(row,n,official);pairs.append((row,record))
   source='https://zenless.hoyoverse.com/ko-kr/character?id='+str(record['iInfoId']);row['detailSources']=list({r['url']:r for r in [*row['detailSources'],{'url':source,'kind':'official'}]}.values())
  except Exception as e:
   row.clear();row.update(prior);audit['errors'].append({'id':row['id'],'stage':'facts','error':str(e)})
 inventory=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
  jobs={pool.submit(download_art,p,sources,assets):p[0]['id']for p in pairs}
  for future in concurrent.futures.as_completed(jobs):
   id=jobs[future]
   try:
    id,art,receipt=future.result();row=next(c for c in doc['characters']if c['id']==id);row['images']=list({a['url']:a for a in [*row.get('images',[]),*([row['image']]if row.get('image')else[])]if a['url']!=art['url']}.values())[:9];row['image']=art;inventory.append(receipt)
   except Exception as e:audit['errors'].append({'id':id,'stage':'art','error':str(e)})
 doc['checkedAt']=now();doc['sourceUrls']=list(dict.fromkeys([*doc['sourceUrls'],OFFICIAL,FORMULA,*[GG+'/'+GG_LOCALES[l]+'/characters'for l in LOCALES]]))[:40]
 doc['coverage']['fullBodyCount']=sum(c.get('image',{}).get('kind')=='full-body'for c in doc['characters']);doc['sourceName']='EnkaNetwork + Korean official full originals + ZZZ.gg native character tables'
 numeric_rows=sum(len(s.get('values',[]))for c in doc['characters']for s in c.get('skillTables',[]))
 source_numeric_rows=sum(bool(s.get('Value'))for c in doc['characters']for s in native['ko'][c['id']]['Skills']if s.get('TextType')==1)
 audit.update(status='partial'if audit['errors']or audit['omittedNumericRows']else'ok',characters=len(doc['characters']),fullBodyCount=len(inventory),skillCharacters=sum(bool(c.get('skillTables'))for c in doc['characters']),skillTables=sum(len(c.get('skillTables',[]))for c in doc['characters']),numericRows=numeric_rows,sourceNumericRows=source_numeric_rows,numericRowReconciliation='Each source index retained exactly once per character; enforced before accepting facts.',sources=sources.receipts)
 if [c['id']for c in doc['characters']]!=[c['id']for c in original['characters']]:raise ValueError('Stable inventory changed')
 dump(out/'zzz.json',doc);dump(out/'artwork-inventory.json',sorted(inventory,key=lambda r:int(r['characterId'])));dump(out/'manifest.json',audit)
 print(json.dumps({k:v for k,v in audit.items()if k not in ('sources','errors','omittedNumericRows')}));return audit
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--input',type=pathlib.Path,required=True);parser.add_argument('--output-dir',type=pathlib.Path,required=True);parser.add_argument('--cache-dir',type=pathlib.Path);parser.add_argument('--replay-source-root',type=pathlib.Path);args=parser.parse_args()
 try:audit=run(args)
 except Exception as e:
  args.output_dir.mkdir(parents=True,exist_ok=True);dump(args.output_dir/'zzz.json',json.loads(args.input.read_text()));dump(args.output_dir/'manifest.json',{'status':'failed','checkedAt':now(),'preservedInput':True,'error':str(e)});raise
 if audit['errors']:raise SystemExit(1)
if __name__=='__main__':main()
