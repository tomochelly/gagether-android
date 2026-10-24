#!/usr/bin/env python3
"""Read-only Blue Archive combat facts from declared public community sources.

Keeps all input identities, outfits, art, regional release scopes and owner facts.
No Site credentials, mutations, video claims or fabricated intermediate ranks.
"""
from __future__ import annotations
import argparse, copy, datetime as dt, hashlib, html, json, math, pathlib, re, urllib.request

REPO='nico0748/SchaleDB'
TREE='https://api.github.com/repos/'+REPO+'/git/trees/main?recursive=1'
JOE='https://ba.joexyz.online/api/students'
MCP='https://ba.joexyz.online/mcp'
JOE_DECLARATION='https://github.com/jozsefsallai/ba-tools/blob/fd70147df536d9d6656e4d8d8c513cf17bbef829/src/lib/mcp/tools/get-student.ts'
OFFICIAL_GUIDE='https://forum.nexon.com/bluearchive/board_view?board=1071&thread=2719465'
LANGS=('ko','en','ja','zh')
SOURCE_LANG={'ko':'kr','en':'en','ja':'jp','zh':'zh'}
GROWTH_FIELDS=[('MaxHP','maxHPLevel1','maxHPLevel100','hp'),('AttackPower','atkLevel1','atkLevel100','attack'),('DefensePower','defLevel1','defLevel100','none'),('HealPower','healLevel1','healLevel100','healing')]
FIXED_FIELDS=[('AccuracyPoint','accuracy'),('DodgePoint','evasion'),('CriticalPoint','crit'),('CriticalDamageRate','critDamagePercent'),('StabilityPoint','stability'),('AmmoCount','ammoCount'),('AmmoCost','ammoCost'),('Range','range'),('RegenCost','regenCost')]
STAR_BONUS={'hp':[0,500,700,900,1400],'attack':[0,1000,1200,1400,1700],'healing':[0,750,1000,1200,1500],'none':[0]*5}
ADAPTATION=('D','C','B','A','S','SS')
ADAPTATION_BONUS=(0.8,0.9,1,1.1,1.2,1.3)

def copies(ko='',en='',ja='',zh=''):return dict(zip(LANGS,(ko,en,ja,zh)))
def now():return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')
def compact(x):return json.dumps(x,ensure_ascii=False,separators=(',',':'))
def source_fetch(url,cache,name,receipts,offline=False,body=None):
    target=cache/name;target.parent.mkdir(parents=True,exist_ok=True)
    if offline:
        raw=target.read_bytes()
        checked=dt.datetime.fromtimestamp(target.stat().st_mtime,dt.timezone.utc).isoformat().replace('+00:00','Z')
    else:
        headers={'User-Agent':'GAGETHER-sourced-roster-enrichment/1.0','Accept':'application/json,text/event-stream' if body else 'application/json,text/plain,*/*;q=0.5'}
        data=None
        if body is not None:
            headers['Content-Type']='application/json';data=compact(body).encode()
        request=urllib.request.Request(url,data=data,headers=headers)
        with urllib.request.urlopen(request,timeout=50) as response:
            if response.status!=200:raise ValueError('Non-200 public source')
            raw=response.read(24*1024*1024+1)
            if len(raw)>24*1024*1024:raise ValueError('Public source exceeds bounded read')
        checked=now();target.write_bytes(raw)
    receipts.append({'url':url,'method':'POST read-only tools/call' if body else 'GET','path':name,'status':200,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'checkedAt':checked,'cached':offline})
    return raw

def read_json(url,cache,name,receipts,offline=False):return json.loads(source_fetch(url,cache,name,receipts,offline))
def localized(localizations,section,key):return {l:localizations[l].get(section,{}).get(key,'') for l in LANGS}
def clean_text(value,loc,extra_labels=None):
    text=html.unescape(str(value));extra_labels=extra_labels or {}
    def buff(m):
        kind,token,override=m.groups();key={'b':'Buff','d':'Debuff','c':'CC','s':'Special'}[kind]+'_'+token
        label=override or loc['BuffName'].get(key) or extra_labels.get(key)
        if not label:raise ValueError('Unbound native buff label '+key)
        return str(label)
    text=re.sub(r"<([bdcs]):(\w+)(?:='([^']*)')?>",buff,text)
    def bare_buff(m):
        key=m.group(1);label=loc['BuffName'].get(key) or extra_labels.get(key)
        if not label:raise ValueError('Unbound bare buff label '+key)
        return str(label)
    text=re.sub(r'\bbuffName\.((?:Buff|Debuff|CC|Special)_\w+)',bare_buff,text)
    text=re.sub(r'</?(?:b|strong|i|em|span)(?:\s[^>]*)?>','',text,flags=re.I)
    text=text.replace('/\n','\n').replace('**','')
    return re.sub(r'[ \t]+',' ',text).strip()

def interpolated(base,anchor,level,bonus,stars):
    scale=float(f'{(level-1)/99:.4f}')
    raw=math.floor(float(f'{base+(anchor-base)*scale:.4f}')+0.5)
    multiplier=1+sum(STAR_BONUS[bonus][:stars])/10000
    return math.ceil(float(f'{raw*multiplier:.4f}'))

def make_skill_tables(sid,students,loc,paths,ref,report):
    native=students['en'][sid]
    source=f'https://github.com/{REPO}/blob/{ref}/data/en/students.json'
    result=[]
    root_order=('Ex','Public','Passive','ExtraPassive','WeaponPassive','GearPublic')
    for key in root_order:
        if key not in native['Skills']:continue
        rank=5 if key=='Ex' else 10
        regions=None
        if key=='GearPublic':
            flags=native.get('Gear',{}).get('Released',[])
            regions=(['jp'] if len(flags)>0 and flags[0] else [])+(['global','kr'] if len(flags)>1 and flags[1] else [])
            if not regions:continue
        roots={l:students[l][sid]['Skills'][key] for l in LANGS}
        queue=[(key,roots,False)]
        for child_idx,child in enumerate(roots['en'].get('ExtraSkills',[])):
            if not isinstance(child,dict) or 'Desc' not in child:continue
            child_id=str(child.get('Id',child_idx))
            children={}
            for l in LANGS:
                matches=[s for s in roots[l].get('ExtraSkills',[]) if str(s.get('Id'))==child_id]
                if len(matches)!=1:break
                children[l]=matches[0]
            if len(children)!=4:
                report['omissions'].append({'id':sid,'skill':key,'childId':child_id,'reason':'Missing/ambiguous exact localized child identity'});continue
            if any(any(len(p) not in (1,rank) for p in s.get('Parameters',[])) for s in children.values()):
                report['omissions'].append({'id':sid,'skill':key,'childId':child_id,'reason':'Child rank rows do not bind to parent skill rank; not guessed'});continue
            queue.append((key+'-'+child_id,children,True))
        for table_key,skills,is_child in queue:
            templates={};parameters={};names={}
            for l,s in skills.items():
                if not s.get('Name'):raise ValueError('Missing localized native skill name for '+sid+' '+table_key)
                names[l]=clean_text(s['Name'],loc[l])
                params=[[clean_text(v,loc[l]) for v in row] for row in s.get('Parameters',[])]
                # Native raw rate-base parameters sometimes omit their displayed
                # unit (e.g. Aru's CriticalDamageRate_Base 2000 = +20%p).
                # Bind the ENTIRE array to an exact effect before converting;
                # ordinary points, coefficients and already-unitful text stay intact.
                for param_index,p in enumerate(params):
                    if not p or not all(re.fullmatch(r'-?\d+(?:\.\d+)?',v)for v in p):continue
                    candidates=[]
                    for effect in s.get('Effects',[]):
                        stat=effect.get('Stat','');base_stat=stat.removesuffix('_Base')
                        if effect.get('Type')!='Buff' or not stat.endswith('_Base') or not (base_stat.endswith('Rate') or base_stat.startswith(('AttackSpeed','DamagedRatio'))):continue
                        for raw_values in effect.get('Value',[]):
                            if isinstance(raw_values,list) and [float(v)for v in p]==raw_values:candidates.append(stat)
                    if len(set(candidates))==1:
                        params[param_index]=[format(float(v)/100,'.8g')+'%p' for v in p]
                        if l=='en':report['normalizedRateParameters'].append({'id':sid,'skill':table_key,'parameter':param_index+1,'effectStat':candidates[0],'raw':p,'display':params[param_index],'rule':'Exact effect.Value array binding; common.js CharacterStats.isRateStat / getTotalString rate scale100.'})
                template=clean_text(s.get('Desc',''),loc[l])
                # Published knockback display rule in common.js: effect.Scale[level-1] *2.
                for knock in sorted(set(int(n) for n in re.findall(r'<kb:(\d+)>',template))):
                    effects=[e for e in s.get('Effects',[]) if e.get('Type')=='Knockback']
                    if not 1<=knock<=len(effects):raise ValueError('Unbound native knockback effect')
                    scale=effects[knock-1].get('Scale',[])
                    if len(scale) not in (1,rank):raise ValueError('Unbound native knockback rank')
                    params.append([format(v*2,'.8g') for v in scale])
                    template=template.replace('<kb:'+str(knock)+'>','<?'+str(len(params))+'>')
                template=re.sub(r'<\?(\d+)>',lambda m:'{'+m.group(1)+'}',template)
                referenced=[int(n) for n in re.findall(r'\{(\d+)\}',template)]
                if any(n<1 or n>len(params) or len(params[n-1]) not in (1,rank) for n in referenced):raise ValueError('Unbound native skill parameter '+sid+' '+table_key+' '+l)
                if re.search(r'<[bdcs]:|<\?|<kb:|buffName\.',template):raise ValueError('Unresolved native skill text')
                templates[l]=template;parameters[l]=params
            parameter_map={'en':parameters['en']}
            for l in ('ko','ja','zh'):
                if parameters[l]!=parameters['en']:parameter_map[l]=parameters[l]
            kind=localized(loc,'SkillType',key)
            if is_child:kind={l:kind[l]+' · '+copies('추가 효과','Additional effect','追加効果','附加效果')[l] for l in LANGS}
            if key=='WeaponPassive':basis=copies('고유 무기 ★2 · 패널 미합산','Unique Weapon ★2; excluded from base panel','固有武器★2・基礎値に未加算','专属武器★2・不计入基础面板')
            elif key=='GearPublic':basis=copies('애용품 T2 · 공개 서버만','Bond Gear T2; released services only','愛用品T2・公開サーバーのみ','爱用品T2・仅已开放服务器')
            else:basis=copies('원본 스킬 표','Native skill table','原表スキル','原表技能')
            table={'id':'ba-'+table_key,'name':names,'type':kind,'sourceUrl':source,'sourceKind':'community','basis':basis,'maxLevel':rank,'descriptionTemplate':templates,'parameters':parameter_map,'values':[]}
            if regions is not None:table['regions']=regions
            skill=skills['en'];icon='images/skill/'+str(skill.get('Icon',''))+'.webp'
            if icon in paths:table['icon']=f'https://raw.githubusercontent.com/{REPO}/{ref}/{icon}'
            if 'Cost' in skill:
                cost=skill['Cost']
                if len(cost) not in (1,rank) or any(not isinstance(n,(int,float)) for n in cost):raise ValueError('Invalid declared EX cost ranks')
                table['values'].append({'id':'cost','label':copies('코스트','Cost','コスト','费用'),'levels':[str(n) for n in cost]})
            result.append(table)
    if len(result)>40:raise ValueError('Too many exact student skill tables')
    return result

def read_joe_mcp(student,cache,receipts,offline=False):
    if not re.fullmatch(r'[a-z0-9_]{1,100}',str(student['id'])):raise ValueError('Invalid exact public student slug')
    body={'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':'get_student','arguments':{'id':student['id']}}}
    raw=source_fetch(MCP,cache,'joe-mcp-'+student['id']+'.json',receipts,offline,body)
    text=raw.decode();messages=[]
    if text.lstrip().startswith('{'):messages=[json.loads(text)]
    else:messages=[json.loads(line[6:])for line in text.splitlines()if line.startswith('data: ')]
    responses=[message['result']for message in messages if 'result'in message]
    if len(responses)!=1 or responses[0].get('isError'):raise ValueError('Public MCP result failed')
    chunks=[block['text']for block in responses[0].get('content',[])if block.get('type')=='text']
    if len(chunks)!=1:raise ValueError('Ambiguous public MCP payload')
    result=json.loads(chunks[0])
    if result.get('id')!=student['id'] or str(result.get('schaleDbId'))!=str(student['schaleDbId']):raise ValueError('Public MCP student identity mismatch')
    return result

def make_range_skills(student,mcp,loc,report):
    source=MCP
    extra_labels={}
    for s in mcp['skills']:
        for kind,token,label in re.findall(r"<([bdcs]):(\w+)='([^']*)'>",s['description']):extra_labels[{'b':'Buff','d':'Debuff','c':'CC','s':'Special'}[kind]+'_'+token]=label
    # This source exposes an unnamed additional Erina effect, not a native buff name.
    # Keep its factual role without inventing a proper-name translation.
    if student['id']=='erina':extra_labels['Special_CH0321_Ex']='an additional effect'
    keys={'EX':'Ex','Basic':'Public','Enhanced':'Passive','Sub':'ExtraPassive'}
    tables=[]
    if len(mcp['skills'])!=4 or set(s['type']for s in mcp['skills'])!=set(keys):raise ValueError('Missing or duplicate public skill category')
    for skill in mcp['skills']:
        key=keys[skill['type']];rank=5 if key=='Ex' else 10
        name=clean_text(skill['name'],loc['en'],extra_labels);description=clean_text(skill['description'],loc['en'],extra_labels)
        table={'id':'ba-range-'+str(skill['id']),'name':copies(en=name),'type':{l:localized(loc,'SkillType',key)[l]+' · '+copies('1~'+str(rank)+'레벨 범위','Lv.1–'+str(rank)+' range','Lv.1〜'+str(rank)+'範囲','1～'+str(rank)+'级范围')[l] for l in LANGS},'sourceUrl':source,'sourceKind':'community','basis':copies('공개 원문은 1레벨~최대 레벨 범위만 제공. 중간 레벨 계수는 계산하지 않음.','Public source gives only Lv.1–max ranges; no intermediate ranks are inferred.','公開原文はLv.1〜最大の範囲のみ。中間倍率は推測しない。','公开原文仅提供1级至满级范围，不推算中间等级系数。'),'description':copies(en=description),'values':[]}
        if skill.get('cost') is not None:
            if not re.fullmatch(r'\d+(?:\.\d+)?',str(skill['cost'])):raise ValueError('Nonconstant ranged source cost')
            table['values']=[{'id':'cost','label':copies('코스트','Cost','コスト','费用'),'levels':[str(skill['cost'])]}]
        tables.append(table)
    report['rangeOnlyIds'].append(str(student['schaleDbId']))
    return tables

def combat_sections(student,native,loc,report):
    sections=[]
    def add(id,title,body):sections.append({'id':id,'title':title,'body':body})
    terrain=[]
    for label,field in [('Street','streetBattleAdaptation'),('Outdoor','outdoorBattleAdaptation'),('Indoor','indoorBattleAdaptation')]:
        index=student[field]
        if not isinstance(index,int) or not 0<=index<6:raise ValueError('Invalid terrain source value')
        terrain.append((label,ADAPTATION[index],ADAPTATION_BONUS[index]))
    add('ba-terrain',copies('지형 적성','Terrain affinity','地形適性','地形适性'),{l:' · '.join(loc[l]['AdaptationType'][key]+' '+rank+' (×'+format(multiplier,'.8g')+')' for key,rank,multiplier in terrain) for l in LANGS})
    equipment={l:' · '.join(loc[l]['ItemCategory'].get(key,key)for key in student['equipment']) for l in LANGS}
    add('ba-equipment',copies('장비 슬롯','Equipment slots','装備スロット','装备栏'),equipment)
    position={'Front':copies('전열','Front','フロント','前排'),'Middle':copies('중열','Middle','ミドル','中排'),'Back':copies('후열','Back','バック','后排')}[student['combatPosition']]
    cover=copies('엄폐 사용','Uses cover','遮蔽物を使用','使用掩体') if student['usesCover'] else copies('엄폐 미사용','Does not use cover','遮蔽物を使用しない','不使用掩体')
    add('ba-position',copies('전투 배치','Combat placement','戦闘配置','战斗站位'),{l:position[l]+' · '+cover[l] for l in LANGS})
    if native:
        names={l:native[l]['Weapon'].get('Name','') for l in LANGS}
        weapon=native['en']['Weapon'];bits=[]
        for id in ('AttackPower','MaxHP','HealPower'):
            if weapon.get(id+'1'):
                bits.append((localized(loc,'Stat',id),str(weapon[id+'1'])))
        if bits:
            add('ba-weapon',copies('고유 무기 · Lv.1','Unique Weapon · Lv.1','固有武器 · Lv.1','专属武器 · Lv.1'),{l:names[l]+'\n'+' · '.join(label[l]+' '+value for label,value in bits) for l in LANGS})
    return sections

def enrich(document,cache_dir,offline=False):
    if document.get('gameId')!='bluearchive':raise ValueError('Exact Blue Archive roster required')
    doc=copy.deepcopy(document);cache=pathlib.Path(cache_dir);cache.mkdir(parents=True,exist_ok=True)
    report={'gameId':'bluearchive','checkedAt':now(),'sources':[],'omissions':[],'rangeOnlyIds':[],'normalizedRateParameters':[]}
    receipts=report['sources']
    tree=read_json(TREE,cache,'tree.json',receipts,offline)
    if tree.get('truncated') or len(tree.get('tree',[]))<1000 or not re.fullmatch(r'[a-f0-9]{40}',tree.get('sha','')):raise ValueError('Incomplete exact upstream tree')
    ref=tree['sha'];paths={row['path']for row in tree['tree']};students={};loc={}
    for l,source_l in SOURCE_LANG.items():
        for name in ('students','localization'):
            path=f'data/{source_l}/{name}.json'
            if path not in paths:raise ValueError('Required declared source missing')
            url=f'https://raw.githubusercontent.com/{REPO}/{ref}/{path}'
            value=read_json(url,cache,path,receipts,offline)
            (students if name=='students' else loc)[l]=value
    common_path='js/common.js';config_path='data/config.json'
    common=source_fetch(f'https://raw.githubusercontent.com/{REPO}/{ref}/{common_path}',cache,common_path,receipts,offline).decode()
    config=read_json(f'https://raw.githubusercontent.com/{REPO}/{ref}/{config_path}',cache,config_path,receipts,offline)
    if "((level-1)/99).toFixed(4)"not in common or 'Math.ceil((Math.round((stat1+(stat100-stat1)*levelScale).toFixed(4))*transcendence).toFixed(4))'not in common:raise ValueError('Reviewed source growth formula changed')
    if any(set(db)!=set(students['en'])for db in students.values()) or len(students['en'])<274:raise ValueError('Localized native source shrank or disagrees')
    joe=read_json(JOE,cache,'joe-students.json',receipts,offline)
    if not isinstance(joe,list) or len(joe)<len(doc['characters']):raise ValueError('Current inventory source shrank')
    byid={str(c['schaleDbId']):c for c in joe}
    if len(byid)!=len(joe):raise ValueError('Duplicate public inventory identities')
    snapshot_level=90
    source_date=dt.datetime.fromtimestamp(config['build'],dt.timezone.utc).date().isoformat()
    # Deliberately a published source-snapshot bound, not a live-cap assertion.
    reviewed_regions=[region for region in config.get('Regions',[]) if region.get('Name')in ('Jp','Global')]
    if len(reviewed_regions)!=2 or any(region.get('StudentMaxLevel')!=snapshot_level for region in reviewed_regions):raise ValueError('Reviewed snapshot level bound changed')
    source_formula=f'https://github.com/{REPO}/blob/{ref}/js/common.js'
    source_data=f'https://github.com/{REPO}/blob/{ref}/data/en/students.json'
    patch={};matched=[];range_only=[]
    for row in doc['characters']:
        sid=row['id'];student=byid.get(sid)
        if not student or student['id']!=str(row.get('sourceId')):raise ValueError('Exact existing outfit identity changed: '+sid)
        stars=student['rarity']
        if stars not in (1,2,3):raise ValueError('Unexpected natural rarity')
        native={l:students[l][sid] for l in LANGS} if sid in students['en'] else None
        if native:
            for id,start,end,bonus in GROWTH_FIELDS:
                if student[start]!=native['en'][id+'1'] or student[end]!=native['en'][id+'100']:raise ValueError('Independent source endpoints disagree: '+sid+' '+id)
            matched.append(sid)
        url=source_data if native else JOE
        stats_basis=copies('기초값','Base values','基礎値','基础值')
        panel_basis=copies(f'Lv.90 · 태생 {stars}★ · 보너스 제외',f'Lv.90; natural {stars}★; no bonuses',f'Lv.90・初期{stars}★・補正なし',f'90级・初始{stars}★・无加成')
        growth_basis=copies(f'참조 Lv.1–90·태생 {stars}★. 무기·장비·인연·잠재·패시브 제외. Lv.100은 성장식 앵커이며 현재 상한이 아님.',f'Reference Lv.1–90, natural {stars}★. No weapon, gear, bond, potential or passive bonuses. Lv.100 is a formula anchor, not the live cap.',f'参照Lv.1–90・初期{stars}★。武器・装備・絆・能力解放・パッシブ補正なし。Lv.100は成長式の基準で現在の上限ではない。',f'参考1–90级・初始{stars}★。无武器、装备、羁绊、潜能或被动加成。100级是公式锚点，非当前上限。')
        growth_basis={l:'SchaleDB '+source_date+' · '+text for l,text in growth_basis.items()}
        growth={'formula':'schaledb-standard','sourceUrl':source_formula,'sourceKind':'community','basis':growth_basis,'minLevel':1,'maxLevel':snapshot_level,'starGrade':stars,'stats':[]}
        stats=[]
        for id,start,end,bonus in GROWTH_FIELDS:
            label=localized(loc,'Stat',id);base=student[start];anchor=student[end]
            if not all(isinstance(v,int) and v>=0 for v in (base,anchor)):raise ValueError('Invalid exact growth endpoint')
            growth['stats'].append({'id':id,'label':label,'base':base,'anchor':anchor,'bonus':bonus})
            stats.append({'id':id,'label':label,'value':str(interpolated(base,anchor,snapshot_level,bonus,stars)),'basis':panel_basis})
        for id,key in FIXED_FIELDS:
            value=student[key]
            if not isinstance(value,(int,float)) or value<0:raise ValueError('Invalid fixed source stat')
            value=format(value/100,'.8g')+'%' if id=='CriticalDamageRate' else format(value,'.8g')
            label=localized(loc,'Stat',id)
            if id=='AmmoCost':label=copies('발사당 탄약','Ammo per attack','攻撃毎の弾薬','每次攻击弹药')
            stats.append({'id':id,'label':label,'value':value,'basis':stats_basis})
        skills=make_skill_tables(sid,students,loc,paths,ref,report) if native else make_range_skills(student,read_joe_mcp(student,cache,receipts,offline),loc,report)
        sections=combat_sections(student,native,loc,report)
        new={'stats':stats,'statGrowth':growth,'skillTables':skills,'sections':sections}
        patch[sid]=new
        old_sections=row.get('sections',[])
        keep=[section for section in old_sections if not section['id'].startswith('ba-')]
        row.update(new);row['sections']=[*keep,*sections][:30]
        if len(row['sections'])<len(keep)+len(sections):raise ValueError('Existing owner sections would be truncated')
    report.update(status='ok',sourceRef=ref,sourceNativeCount=len(students['en']),detailedStatCount=len(patch),perRankSkillStudentCount=len(matched),skillTableCount=sum(len(x['skillTables'])for x in patch.values()),rangeOnlySkillCount=sum(len(patch[s]['skillTables'])for s in report['rangeOnlyIds']),sourceFormula=source_formula,officialGrowthGuide=OFFICIAL_GUIDE,inventoryAnchorCrossChecks=len(matched)*8,snapshotLevelBound=snapshot_level,liveServerCapClaim=False)
    added=[source_formula,source_data,JOE,JOE_DECLARATION,MCP,OFFICIAL_GUIDE]
    doc['sourceUrls']=list(dict.fromkeys([*doc['sourceUrls'],*added]))
    if len(doc['sourceUrls'])>40:raise ValueError('Too many provenance URLs')
    doc['sourceName']="SchaleDB native combat tables + Joe's Blue Archive Tools"
    doc['sourceVersion']='SchaleDB '+source_date+' · Joe '+next(x['sha256'][:16]for x in receipts if x['url']==JOE)
    doc['checkedAt']=report['checkedAt'];report['compactBytes']=len(compact(doc).encode());report['defaultJsonBytes']=len(json.dumps(doc,ensure_ascii=False).encode())
    report['changed']={k:v for k,v in doc.items()if k!='checkedAt'}!={k:v for k,v in document.items()if k!='checkedAt'}
    if report['defaultJsonBytes']>4400000:raise ValueError('Detailed roster exceeds4.4MB ingest limit: '+str(report['defaultJsonBytes']))
    return doc,patch,report

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--input',required=True);parser.add_argument('--output-dir',required=True);parser.add_argument('--cache-dir',required=True);parser.add_argument('--offline',action='store_true');args=parser.parse_args()
    document=json.loads(pathlib.Path(args.input).read_text());output=pathlib.Path(args.output_dir);output.mkdir(parents=True,exist_ok=True)
    try:
        result,patch,report=enrich(document,args.cache_dir,args.offline)
    except Exception as error:
        result=document;patch={};report={'gameId':'bluearchive','status':'failed','changed':False,'preservedInput':True,'error':type(error).__name__+': '+str(error),'checkedAt':now()}
    for name,value in [('bluearchive.json',result),('patches.json',patch),('manifest.json',report)]:
        target=output/name;temporary=target.with_suffix('.tmp');temporary.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n');temporary.replace(target)
    print(compact(report))
    if report['status']!='ok':raise SystemExit(1)

if __name__=='__main__':main()
