#!/usr/bin/env python3
"""Enrich existing HSR identities from declared StarRailRes native data.

Full generated rosters and downloaded originals belong in canonical storage,
not the public code repository. This module never discovers/adds character IDs.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import copy
import datetime as dt
from decimal import Decimal
import hashlib
import io
import json
from pathlib import Path
import re
import urllib.request

LOCALES = ('ko', 'en', 'ja', 'zh')
LANG = dict(ko='kr', en='en', ja='jp', zh='cn')
RAW = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/'
INDEX = RAW + 'index_new/'
FILES = dict(chars='characters', skills='character_skills', trees='character_skill_trees',
             ranks='character_ranks', props='properties', paths='paths', elements='elements')
URLS = {f'{k}-{l}': f'{INDEX}{LANG[l]}/{v}.json' for k,v in FILES.items() for l in LOCALES}
URLS['promotions'] = INDEX + 'en/character_promotions.json'
PARAM = re.compile(r'#(\d+)\[(i|f\d+)\](%?)')
NICK = dict(zip(LOCALES, ('개척자', 'Trailblazer', '開拓者', '开拓者')))

def C(ko, en, ja, zh):
    return dict(zip(LOCALES, (ko,en,ja,zh)))

BASE_BASIS = C('광추·유물·행적·성혼 제외 · 기초 HP/공격력/방어력 내림',
 'No Light Cone, Relics, Traces or Eidolons; base HP/ATK/DEF floored.',
 '光円錐・遺物・軌跡・星魂を除外。基礎HP・攻撃力・防御力は切り捨て。',
 '不含光锥、遗器、行迹或星魂；基础生命/攻击/防御向下取整。')
SKILL_BASIS = C('원본 정밀도 · 성혼 레벨 별도', 'Source precision; Eidolon levels marked.',
 '原文精度・星魂追加は別表記', '原文精度；星魂等级另标')
TRACE_BASIS = C('기초 패널 제외', 'Excluded from base panel.', '基礎値に含めない', '未计入基础面板')
RANK_BASIS = TRACE_BASIS
PANEL_BASIS = C('Lv.80/A6 · 장비·행적·성혼 제외', 'Lv.80/A6; no gear, Traces or Eidolons.',
 'Lv.80/昇格6・装備/軌跡/星魂を除外', '80级/晋阶6；不含装备/行迹/星魂')
PROMOTION = C('돌파', 'Ascension', '昇格', '晋阶')
STAT_KEYS = dict(hp='HPDelta', atk='AttackDelta', **{'def':'DefenceDelta'}, spd='SpeedDelta',
                 crit_rate='CriticalChanceBase', crit_dmg='CriticalDamageBase')
EXTRA_STATS = dict(taunt=C('도발 수치','Taunt','狙われやすさ','嘲讽值'),
                  max_sp=C('필살기 자원 최대치','Ultimate resource cap','必殺技リソース上限','终结技资源上限'))

def now(): return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')
def packed(obj): return json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode()
def sha(b): return hashlib.sha256(b).hexdigest()
def number(v):
    s = format(Decimal(str(v)), 'f')
    return s.rstrip('0').rstrip('.') if '.' in s else s
def icon(path):
    if not path: return None
    if not re.fullmatch(r'icon/[A-Za-z0-9_./-]+\.(?:png|webp|jpg)', path) or any(x in ('.','..','') for x in path.split('/')):
        raise ValueError(f'Unexpected declared icon path: {path}')
    return RAW+path
def clean(s,l):
    # Preserve the native ruby reading together with its base text, as plain text.
    s = re.sub(r'\{RUBY_B#([^}]+)\}([^{}]+)\{RUBY_E#\}',r'\2（\1）',s or '')
    s = s.replace('{NICKNAME}',NICK[l]).replace('\\n','\n')
    s = re.sub(r'<[^>]+>','',s)
    if re.search(r'\{(?:RUBY_|[A-Z]+#)',s): raise ValueError(f'Unrecognized native markup: {s}')
    return s.strip()

def native_copy(records, field):
    return {l:clean(records[l].get(field,''),l) for l in LOCALES}

def format_param(v, flag, percent):
    # [i] is not an instruction to truncate fractional multipliers (e.g.113.75%).
    # Never reconstruct precision that the community index has already lost.
    d = Decimal(str(v)) * (100 if percent else 1)
    if flag.startswith('f'):
        places = int(flag[1:])
        # Preserve source information beyond the minimum native decimal places.
        s = number(d)
        if '.' not in s and places: s += '.' + '0'*places
        elif '.' in s: s += '0'*max(0,places-len(s.split('.')[1]))
        return s
    return number(d)

def parameterized(records, max_level, gaps=None, context=None):
    templates, matrices = {}, {}
    for l in LOCALES:
        r=records[l]; text=clean(r.get('desc',''),l); params=r.get('params') or []
        matches=list(PARAM.finditer(text))
        if not matches:
            templates[l]=text; matrices[l]=[]; continue
        if len(params)<max_level: raise ValueError(f'{r["id"]}/{l}: missing source parameter rows')
        definitions=[]
        def replace(m):
            key=(int(m[1])-1,m[2],bool(m[3]))
            if any(key[0]>=len(row) for row in params[:max_level]):
                if gaps is None:raise ValueError(f'{r["id"]}/{l}: unbound native parameter {key[0]+1}')
                gaps.append(dict(character=context,kind='parameter',sourceId=r['id'],locale=l,parameter=key[0]+1,reason='Native description references an absent parameter; explicit unavailable marker retains remaining prose.'))
                return C('[원본 수치 미제공]','[value absent from source]','[原文に数値なし]','[原文未提供数值]')[l]
            if key not in definitions: definitions.append(key)
            return '{'+str(definitions.index(key)+1)+'}'+m[3]
        templates[l]=PARAM.sub(replace,text)
        matrices[l]=[]
        for i,flag,pct in definitions:
            if any(i>=len(row) for row in params[:max_level]):
                raise ValueError(f'{r["id"]}/{l}: unbound native parameter {i+1}')
            values=[format_param(row[i],flag,pct) for row in params[:max_level]]
            matrices[l].append(values[:1] if len(set(values))==1 else values)
        if re.search(r'#\d+\[',templates[l]): raise ValueError('Unparsed source parameter')
    if not any(matrices.values()): return {'description':templates} if any(templates.values()) else {}
    # Identical native number vectors need storing only once; renderer fallback is en.
    unique={'en':matrices['en']}
    for l in LOCALES:
        if matrices[l]!=matrices['en']: unique[l]=matrices[l]
    return dict(descriptionTemplate=templates, parameters=unique, maxLevel=max_level)

def load_sources(directory, refresh=False):
    directory=Path(directory); directory.mkdir(parents=True,exist_ok=True)
    data, receipts = {}, []
    def load(item):
        key,url=item; body=directory/(key+'.body'); meta=directory/(key+'.meta.json')
        if refresh or not body.exists():
            req=urllib.request.Request(url,headers={'User-Agent':'GagetherCharacterResearch/1.0'})
            with urllib.request.urlopen(req,timeout=35) as response:
                b=response.read(); status=response.status
            # A readable HTTP error document must not replace the last valid cache.
            json.loads(b)
            pending=body.with_suffix('.body.tmp');pending.write_bytes(b);pending.replace(body)
            receipt=dict(url=url,checkedAt=now(),status=status,sha256=sha(b),bytes=len(b))
            pending=meta.with_suffix('.json.tmp');pending.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');pending.replace(meta)
        b=body.read_bytes(); receipt=json.loads(meta.read_text())
        if receipt['url']!=url or receipt['sha256']!=sha(b): raise ValueError('Source cache hash mismatch '+key)
        return key,json.loads(b),dict(key=key,**receipt)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for key,d,r in pool.map(load,URLS.items()): data[key]=d; receipts.append(r)
    return data,receipts

def unlock_text(tree,l,all_trees):
    level=(tree.get('levels') or [{}])[0]
    bits=[]
    if level.get('promotion'): bits.append(f'{PROMOTION[l]} {level["promotion"]}')
    if level.get('level'): bits.append(f'Lv.{level["level"]}')
    names=[clean(all_trees.get(str(i),{}).get('name',''),l) for i in tree.get('pre_points',[])]
    names=[x for x in names if x]
    if names:
        bits.append({'ko':'선행: ','en':'Requires: ','ja':'前提：','zh':'前置：'}[l]+', '.join(names))
    return ' · '.join(bits)

def table_base(kind,id,records,basis,source):
    t=dict(id=f'{kind}:{id}',name=native_copy(records,'name'),type=C(kind,kind,kind,kind),
           sourceUrl=source,sourceKind='community',basis=basis,values=[])
    src=icon(records['en'].get('icon'))
    if src:t['icon']=src
    return t

def make_progression(raw, prop_native):
    rows=[];coefficients=[]
    for stage,(lo,hi) in enumerate(((1,20),(20,30),(30,40),(40,50),(50,60),(60,70),(70,80))):
        coefficients.append(dict(stage=stage,minLevel=lo,maxLevel=hi,
                                 base={k:number(raw['values'][stage][k]['base']) for k in STAT_KEYS},
                                 step={k:number(raw['values'][stage][k]['step']) for k in STAT_KEYS}))
        for level in range(lo,hi+1):
            values={}
            for k in STAT_KEYS:
                x=raw['values'][stage][k]
                v=Decimal(str(x['base']))+Decimal(str(x['step']))*(level-1)
                values[k]=(number(v*100)+'%') if k.startswith('crit') else str(int(v)) if k in ('hp','atk','def') else number(v)
            if level in (lo,hi):rows.append(dict(stage=stage,level=level,values=values))
    stats=[]
    for k,p in STAT_KEYS.items():
        s=dict(id=k,label={l:prop_native[l][p]['name'] for l in LOCALES},group='primary' if k in ('hp','atk','def') else 'detail',
               format='floor' if k in ('hp','atk','def') else 'percent' if k.startswith('crit') else 'number')
        i=icon(prop_native['en'][p].get('icon'))
        if i:s['icon']=i
        stats.append(s)
    return dict(sourceUrl=URLS['promotions'],sourceKind='community',basis=BASE_BASIS,
                stageLabel=PROMOTION,stats=stats,stages=[dict(id=n,label={l:f'{PROMOTION[l]} {n}' for l in LOCALES}) for n in range(7)],rows=rows,
                linear=dict(formula='starrail-promotion',stages=coefficients))

def expand_progression(progression):
    """Independent Decimal expansion for canonical endpoint/numerical auditing."""
    formats={s['id']:s['format'] for s in progression['stats']};rows=[]
    for stage in progression['linear']['stages']:
        for level in range(stage['minLevel'],stage['maxLevel']+1):
            values={}
            for k,fmt in formats.items():
                v=Decimal(stage['base'][k])+Decimal(stage['step'][k])*(level-1)
                values[k]=str(int(v)) if fmt=='floor' else number(v*100)+'%' if fmt=='percent' else number(v)
            rows.append(dict(stage=stage['stage'],level=level,values=values))
    checkpoints={(r['stage'],r['level']):r for r in rows}
    if any(checkpoints[(r['stage'],r['level'])]!=r for r in progression['rows']):
        raise ValueError('Promotion coefficient/checkpoint mismatch')
    return rows

def skill_caps(char,trees,ranks):
    """Bind only exact source IDs; alternate-form numeric prefixes imply nothing."""
    caps,bonuses={},{}
    for tid in char['skill_trees']:
        tree=trees[tid]
        for inc in tree.get('level_up_skills',[]):
            key=str(inc['id']);caps[key]=max(caps.get(key,0),tree['max_level'])
    for rid in char['ranks']:
        for inc in ranks[rid].get('level_up_skills',[]):
            key=str(inc['id']);bonuses[key]=bonuses.get(key,0)+inc['num']
    return caps,bonuses

def enrich(doc,sources,receipts=()):
    doc=copy.deepcopy(doc)
    native={kind:{l:sources[f'{kind}-{l}'] for l in LOCALES} for kind in FILES}
    reconciliation=[]; gaps=[]; raw_unused=[]; counts=dict(skills=0,majorTraces=0,minorTraceNodes=0,eidolons=0)
    for c in doc['characters']:
        cid=str(c.get('sourceId',c['id'])); source={l:native['chars'][l][cid] for l in LOCALES}; char=source['en']
        if str(char['id'])!=cid: raise ValueError('Identity mismatch')
        progression=make_progression(sources['promotions'][cid],native['props']); c['statProgression']=progression
        final=expand_progression(progression)[-1]['values']
        c['stats']=[dict({k:v for k,v in s.items() if k!='format'},value=final[s['id']],basis=PANEL_BASIS) for s in progression['stats']]
        for k in EXTRA_STATS:
            v=sources['promotions'][cid]['values'][6].get(k,{}).get('base') if k=='taunt' else char.get('max_sp')
            if v is not None:
                row=dict(id=k,label=EXTRA_STATS[k],value=number(v),basis=PANEL_BASIS,group='detail')
                p=native['props']['en'].get('MaxSP') if k=='max_sp' else None
                if p and p.get('icon'):row['icon']=icon(p['icon'])
                c['stats'].append(row)
        # Identity/illustrations/owner placements are deliberately unchanged.
        for trait in c.get('traits',[]):
            kind={'path':'paths','element':'elements'}.get(trait['id'])
            if kind:
                key=char[trait['id']]
                trait['value']={l:native[kind][l][key]['name'] for l in LOCALES}
                if native[kind]['en'][key].get('icon'):trait['icon']=icon(native[kind]['en'][key]['icon'])
        caps,bonuses=skill_caps(char,native['trees']['en'],native['ranks']['en'])
        tables=[]; included_skills=[]; major=[]; minor=[]; ranks=[]
        for sid in char['skills']:
            records={l:native['skills'][l][sid] for l in LOCALES}; r=records['en']
            if not any(x.get('desc','').strip() for x in records.values()):
                gaps.append(dict(character=cid,kind='skill',sourceId=sid,reason='No native description published; no inferred parameter meaning.'))
                continue
            base=caps.get(sid)
            if base is None:
                # Non-upgradable overworld and Technique records are published at1.
                if r.get('max_level')!=1: raise ValueError(f'No exact trace cap for nonstatic skill {cid}/{sid}')
                base=1
            cap=min(base+bonuses.get(sid,0),r['max_level'])
            if r['params']:cap=min(cap,len(r['params']))
            if cap<base: raise ValueError(f'Incomplete parameter range {cid}/{sid}')
            t=table_base('skill',sid,records,SKILL_BASIS,URLS['skills-en'])
            t['type']={l:clean(records[l].get('type_text',''),l)+((' · '+clean(records[l]['effect_text'],l)) if records[l].get('effect_text') else '') for l in LOCALES}
            t.update(parameterized(records,cap,gaps,cid))
            if cap>base:
                t['baseMaxLevel']=base
                if 'maxLevel' not in t:t['maxLevel']=cap
            tables.append(t);included_skills.append(sid);counts['skills']+=1
            if r['max_level']>cap: raw_unused.append(dict(character=cid,skill=sid,publishedRows=len(r['params']),playableBaseMax=base,exactEidolonMax=cap,unusedRange=[cap+1,r['max_level']]))
        minor_rows=[]
        for tid in char['skill_trees']:
            records={l:native['trees'][l][tid] for l in LOCALES};r=records['en'];props=(r.get('levels') or [{}])[0].get('properties',[])
            if any(x.get('desc','').strip() for x in records.values()):
                t=table_base('trace',tid,records,TRACE_BASIS,URLS['trees-en'])
                t['type']=C('추가 능력','Bonus Ability','追加能力','额外能力')
                t.update(parameterized(records,1,gaps,cid))
                for l in LOCALES:
                    condition=unlock_text(records[l],l,native['trees'][l])
                    if condition:t['basis']={**t['basis'],l:TRACE_BASIS[l]+' · '+condition}
                tables.append(t);major.append(tid);counts['majorTraces']+=1
            elif props:
                minor.append(tid);counts['minorTraceNodes']+=1
                for n,p in enumerate(props):
                    property_id=p['type'];pro=native['props']['en'].get(property_id)
                    if not pro:raise ValueError('Unknown minor trace property '+property_id)
                    val=number(Decimal(str(p['value']))*(100 if pro['percent'] else 1))+('%' if pro['percent'] else '')
                    labels={l:clean(records[l]['name'],l)+((' · '+unlock_text(records[l],l,native['trees'][l])) if unlock_text(records[l],l,native['trees'][l]) else '') for l in LOCALES}
                    row=dict(id=tid+':'+str(n),label=labels,levels=['+'+val if not val.startswith('-') else val])
                    if pro.get('icon'):row['icon']=icon(pro['icon'])
                    minor_rows.append(row)
        if minor_rows:
            tables.append(dict(id='minor-traces',name=C('능력치 행적','Stat Traces','ステータス軌跡','属性行迹'),type=C('행적','Traces','軌跡','行迹'),sourceUrl=URLS['trees-en'],sourceKind='community',basis=TRACE_BASIS,values=minor_rows))
        for rid in char['ranks']:
            records={l:native['ranks'][l][rid] for l in LOCALES};rank=records['en']['rank']
            t=table_base('eidolon',rid,records,RANK_BASIS,URLS['ranks-en'])
            t['type']=C(f'성혼 {rank}',f'Eidolon {rank}',f'星魂 {rank}',f'星魂 {rank}')
            t['description']=native_copy(records,'desc');tables.append(t);ranks.append(rid);counts['eidolons']+=1
        if len(tables)>40:raise ValueError(f'Table bound exceeded: {cid} {len(tables)}')
        c['skillTables']=tables
        details=list(c.get('detailSources',[]))
        for u in (URLS['skills-en'],URLS['trees-en'],URLS['ranks-en'],URLS['promotions']):
            if not any(x['url']==u and x['kind']=='community' for x in details):details.append(dict(url=u,kind='community'))
        if len(details)>40:raise ValueError('Detail source bound exceeded: '+cid)
        c['detailSources']=details
        reconciliation.append(dict(character=cid,skills=included_skills,majorTraces=major,minorTraces=minor,eidolons=ranks,tables=len(tables)))
    doc['sourceName']='Mar-7th/StarRailRes · native character, skill, Trace and Eidolon tables'
    doc['sourceUrls']=list(dict.fromkeys(doc.get('sourceUrls',[])+list(URLS.values())))
    if len(doc['sourceUrls'])>40:raise ValueError('Source URL bound exceeded')
    if receipts:doc['checkedAt']=max(r['checkedAt'] for r in receipts)
    doc['coverage']['note']='Existing source identities and artwork retained. Lv.80/A6 base panels exclude gear, Traces and Eidolons. Native four-language skills, Traces and E1–E6 use community source precision; exact published Eidolon bonus levels are labeled separately. Empty source descriptions are not inferred.'
    audit_path=Path(__file__).with_name('source-audit.json')
    audit=json.loads(audit_path.read_text()) if audit_path.exists() else {}
    manifest=dict(status='ok',generatedAt=now(),sourceKind='community',officialFirst=dict(url='https://hsr.hoyoverse.com/ko-kr/',result='Official homepage read first; official wiki API sample cross-checked. Complete four-locale numerical vectors use community source precision.',crossChecks=audit.get('officialWikiCrossChecks',[])),
        sourceReceipts=list(receipts),counts=dict(characters=len(doc['characters']),**counts),reconciliation=reconciliation,gaps=gaps,
        fetchFailures=[],publishedGapPolicy='Audited missing descriptions/parameters are explicit source limitations, not fetch successes or inferred facts. Fetch/parse/hash failures raise and preserve the complete last-good game snapshot.',
        unusedTheoreticalRows=raw_unused,precision=dict(policy='Decimal arithmetic removes float artifacts without inventing lost digits. Source [i] permits genuine fractional percentages. Source fN minimum decimals retained.',
        knownLimit='StarRailRes March7th shield Lv2=0.4037 (40.37%) versus independently published game-table40.38%. Source values remain unchanged pending a separately attributable exact vector.',
        blockedUpstream='Declared upstream GitHub repository returned451/DMCA. Not accessed by alternate routes.'),
        invariants=dict(identitiesPreserved=True,artworkPreserved=True,basePanel='Lv.80 ascension6, no Light Cone/Relics/Traces/Eidolons',playableCaps='Exact same-character trace max_level + exact rank level_up_skills only; theoretical raw extra rows unused.'))
    return doc,manifest

def collect_icons(doc):
    usage={}
    def visit(v,path):
        if isinstance(v,dict):
            for k,x in v.items():
                if k=='icon' and isinstance(x,str):usage.setdefault(x,[]).append('/'.join(path))
                else:visit(x,path+[str(k)])
        elif isinstance(v,list):
            for i,x in enumerate(v):visit(x,path+[str(i)])
    visit(doc,[])
    return usage

def download_icons(doc,directory):
    from PIL import Image
    directory=Path(directory);directory.mkdir(parents=True,exist_ok=True);usage=collect_icons(doc)
    def get(item):
        url,where=item; receipt_file=directory/(sha(url.encode())+'.json')
        if receipt_file.exists():
            old=json.loads(receipt_file.read_text());p=directory/old['file']
            if p.exists() and sha(p.read_bytes())==old['sha256']:
                return dict(old,uses=where)
        req=urllib.request.Request(url,headers={'User-Agent':'GagetherCharacterResearch/1.0'})
        with urllib.request.urlopen(req,timeout=30) as response:b=response.read();status=response.status
        with Image.open(io.BytesIO(b)) as im:w,h=im.size;fmt=im.format;mode=im.mode
        digest=sha(b);file=digest+'.'+('jpg' if fmt=='JPEG' else fmt.lower());(directory/file).write_bytes(b)
        r=dict(url=url,checkedAt=now(),status=status,sha256=digest,bytes=len(b),width=w,height=h,format=fmt,mode=mode,file=file,uses=where)
        receipt_file.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');return r
    inventory=[];failures=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures={pool.submit(get,x):x[0] for x in usage.items()}
        for future in concurrent.futures.as_completed(futures):
            try:inventory.append(future.result())
            except Exception as e:failures.append(dict(url=futures[future],error=str(e)))
    return dict(checkedAt=now(),declaredCount=len(usage),downloadedCount=len(inventory),assets=sorted(inventory,key=lambda r:r['url']),failures=failures)

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--input',required=True,type=Path);p.add_argument('--output',required=True,type=Path)
    p.add_argument('--source-dir',required=True,type=Path);p.add_argument('--manifest',required=True,type=Path)
    p.add_argument('--refresh',action='store_true');p.add_argument('--download-icons',action='store_true');p.add_argument('--icon-dir',type=Path)
    a=p.parse_args();doc=json.loads(a.input.read_text());s,r=load_sources(a.source_dir,a.refresh);out,manifest=enrich(doc,s,r)
    b=packed(out)+b'\n'
    if len(b)>4_400_000:raise ValueError(f'Complete roster exceeds4.4MB: {len(b)} bytes; no output truncated.')
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_bytes(b)
    manifest['output']=dict(bytes=len(b),sha256=sha(b),characters=len(out['characters']))
    if a.download_icons:
        if not a.icon_dir:p.error('--icon-dir required with --download-icons')
        inventory=download_icons(out,a.icon_dir);(a.icon_dir/'inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2)+'\n')
        manifest['icons']=dict(declared=inventory['declaredCount'],downloaded=inventory['downloadedCount'],failures=inventory['failures'])
    else:manifest['icons']=dict(declared=len(collect_icons(out)),downloaded=False)
    a.manifest.parent.mkdir(parents=True,exist_ok=True);a.manifest.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(dict(output=str(a.output),**manifest['output'],counts=manifest['counts'],icons=manifest['icons']),ensure_ascii=False))

if __name__=='__main__':main()
