#!/usr/bin/env python3
"""Source-backed real-horse backgrounds for exact existing Umamusume forms.

The full output is canonical-only. No source prose or horse photograph is copied.
GameTora explicitly links character IDs to real horse records and pedigrees.
"""
from __future__ import annotations
import argparse,datetime as dt,hashlib,html,json,re,urllib.request
from pathlib import Path

LOCALES=('ko','en','ja','zh')
MANIFEST_URL='https://gametora.com/data/manifests/umamusume.json'
KEYS=('characters','static/character_rl_details','races','races_extended')
USER_AGENT='GagetherMotifResearch/1.0'
def C(ko,en,ja,zh):return dict(zip(LOCALES,(ko,en,ja,zh)))
def packed(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
def sha(b):return hashlib.sha256(b).hexdigest()
def now():return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')
def source_path(root,key):return root/('gametora-'+key.replace('/','-')+'.body')
def download(url,path):
    req=urllib.request.Request(url,headers={'User-Agent':USER_AGENT})
    with urllib.request.urlopen(req,timeout=35)as response:
        if response.status!=200:raise ValueError('Non-success source response')
        b=response.read(15_000_001)
        if len(b)>15_000_000:raise ValueError('Source response exceeds bound')
    json.loads(b) # Never replace a valid cache with an HTML error page.
    meta=dict(url=url,status=200,bytes=len(b),sha256=sha(b),checkedAt=now())
    path.parent.mkdir(parents=True,exist_ok=True);tmp=path.with_suffix('.pending');tmp.write_bytes(b);tmp.replace(path)
    path.with_suffix('.meta.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
    return json.loads(b),meta
def cached(path):
    b=path.read_bytes();m=json.loads(path.with_suffix('.meta.json').read_text())
    if m['status']!=200 or m['bytes']!=len(b)or m['sha256']!=sha(b):raise ValueError('Source cache identity mismatch')
    return json.loads(b),m
def load_sources(root,refresh=False):
    root=Path(root);mp=root/'gametora-manifest.body'
    manifest,m=download(MANIFEST_URL,mp)if refresh or not mp.exists()else cached(mp)
    if m['url']!=MANIFEST_URL:raise ValueError('Unexpected manifest origin')
    out={};receipts=[m]
    for key in KEYS:
        version=manifest.get(key)
        if not isinstance(version,str)or not re.fullmatch(r'[a-f0-9]{8,64}',version):raise ValueError('Missing declared data version '+key)
        url='https://gametora.com/data/umamusume/'+key+'.'+version+'.json';p=source_path(root,key)
        data,receipt=download(url,p)if refresh or not p.exists()else cached(p)
        if receipt['url']!=url:raise ValueError('Cached data does not match declared manifest '+key)
        if not isinstance(data,list):raise ValueError('Missing source list '+key)
        out[key]=data;receipts.append(receipt)
    return out,receipts
def localized_name(record):
    return C(record.get('name_ko')or record.get('name_en',''),record.get('name_en',''),record.get('name_ja',''),record.get('name_zh_tw')or record.get('name_ja',''))
def valid_date(value):
    if not isinstance(value,str)or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',value):return False
    try:dt.date.fromisoformat(value)
    except ValueError:return False
    return True
def dob(c):
    try:return dt.date(c['birth_year'],c['birth_month'],c['birth_day']).isoformat()
    except (ValueError,KeyError,TypeError):raise ValueError('Missing exact historical birth date '+str(c.get('char_id')))
def pedigree_name(record,characters):
    if record.get('char_id')in characters:return localized_name(characters[record['char_id']])
    english=record.get('name');japanese=record.get('name_ja')
    if not english and not japanese:raise ValueError('Missing declared parent name')
    return C(english or japanese,english or japanese,japanese or english,japanese or english)
def resolved_race(r,races):
    # The historical record's explicit override takes precedence over game data.
    base=races.get(r.get('race_instance_id'),{})
    value={**base,**r.get('details',{})}
    if not any(value.get('name_'+l)for l in ['en','ja','ko','zh_tw']):return None
    return value
def race_name(r,races):
    value=resolved_race(r,races)
    return localized_name(value)if value else None
def representative_wins(history,races):
    candidates=[]
    for r in history:
        if r.get('result')!=1 or not valid_date(r.get('date')):continue
        value=resolved_race(r,races)
        if not value:continue
        # Historical grades can differ from today's race. Only rank the
        # representative selection; never relabel an old victory as modern G1.
        priority=value.get('grade',999999)
        if r.get('grade_override'):
            m=re.search(r'(?:G|Jpn|J-G)([123])$',r['grade_override'])
            if m:priority=int(m[1])*100
        candidates.append((priority,r['date'],r))
    candidates.sort(key=lambda t:(t[0],t[1]))
    top=[r for grade,_,r in candidates if grade==100]
    selected=top[:12]if top else[r for _,_,r in candidates[:5]]
    return sorted(selected,key=lambda r:r['date'])
def clean_text(s):
    s=re.sub(r'<ref\b[^>]*>.*?</ref>|<ref\b[^>]*/>','',s,flags=re.S)
    s=re.sub(r'\[\[([^\[\]]+)\]\]',lambda m:m[1].split('|')[-1],s)
    return html.unescape(re.sub(r'<[^>]*>','',s)).strip()
def wiki_crosschecks(root,characters):
    """Cross-check names+birth dates; an alcohol/plant article cannot match."""
    matches={};gaps=[]
    for p in sorted((Path(root)/'wiki').glob('*.body')):
        doc=json.loads(p.read_text())
        for page in doc.get('query',{}).get('pages',{}).values():
            text=page.get('revisions',[{}])[0].get('slots',{}).get('main',{}).get('*','')
            if '{{競走馬'not in text:continue
            m=re.search(r'^\|\s*生\s*=([^\n]+)',text,re.M)
            if not m:continue
            birth=clean_text(m[1]);bm=re.search(r'(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日',birth)or re.search(r'\{\{生年月日(?:と馬齢)?\|(?:p=0\|)?(\d{4})\|(\d{1,2})\|(\d{1,2})(?:\||\}\})',birth)
            if not bm:continue
            date=f'{int(bm[1]):04}-{int(bm[2]):02}-{int(bm[3]):02}'
            name=page['title'].split(' (')[0]
            for cid,c in characters.items():
                if c.get('name_ja')!=name or dob(c)!=date:continue
                coat=re.search(r'^\|\s*色\s*=([^\n]+)',text,re.M)
                matches[cid]=dict(title=page['title'],pageid=page['pageid'],birth=date,coat=clean_text(coat[1])if coat else None)
    return matches,gaps
COATS={
 '鹿毛':C('갈색(鹿毛)','Bay','鹿毛','鹿毛'), '黒鹿毛':C('검은갈색(黒鹿毛)','Dark bay','黒鹿毛','黑鹿毛'),
 '栗毛':C('밤색(栗毛)','Chestnut','栗毛','栗毛'), '芦毛':C('회색(芦毛)','Grey','芦毛','蘆毛'),
 '青毛':C('검은색(青毛)','Black','青毛','青毛'),'青鹿毛':C('짙은갈색(青鹿毛)','Brown','青鹿毛','青鹿毛')}
def jra_crosschecks(root,characters):
    matches={};gaps=[]
    for p in sorted((Path(root)/'jra').glob('*.body')):
        cid=int(p.stem);c=characters.get(cid)
        if not c:continue
        text=p.read_bytes().decode('cp932');receipt=json.loads(p.with_suffix('.meta.json').read_text())
        if receipt['sha256']!=sha(p.read_bytes()):raise ValueError('JRA source cache changed')
        m=re.search(r'<p class="birth">(.*?)</p>',text,re.S);birth=clean_text(m[1])if m else''
        date=re.search(r'(\d{4})年(\d{1,2})月(\d{1,2})日(?:生)?',birth)
        name=re.search(r'<p class="name">([^<]+)',text)
        if not date or not name or name[1].strip()!=c['name_ja']:raise ValueError('JRA profile identity mismatch '+str(cid))
        actual=f'{int(date[1]):04}-{int(date[2]):02}-{int(date[3]):02}'
        if actual!=dob(c):raise ValueError('JRA historical birthday mismatch '+str(cid))
        record=re.search(r'<dt>通算成績</dt><dd>(.*?)</dd>',text,re.S)
        official=clean_text(record[1])if record else'';nums=re.search(r'(\d+)戦(\d+)勝',official)
        if nums and (int(nums[1]),int(nums[2]))!=(c['rl']['races'],c['rl']['wins']):
            gaps.append(dict(character=cid,kind='official-record-difference',community=[c['rl']['races'],c['rl']['wins']],official=official))
        matches[cid]=dict(url=receipt['url'],checkedAt=receipt['checkedAt'],record=official,recordNumbers=[int(nums[1]),int(nums[2])]if nums else None)
    return matches,gaps
def build(roster,sources,receipts,wiki=None,jra=None):
    if roster.get('gameId')!='umamusume':raise ValueError('Unexpected game')
    characters={c['char_id']:c for c in sources['characters']};details={c['char_id']:c for c in sources['static/character_rl_details']}
    if len(characters)!=len(sources['characters'])or len(details)!=len(sources['static/character_rl_details']):raise ValueError('Duplicate declared source identity')
    races={r['id']:r for r in sources['races']+sources['races_extended']};groups={}
    for form in roster['characters']:
        if not re.fullmatch(r'\d{6}',form['id']):raise ValueError('Unbound historical form ID')
        groups.setdefault(int(form['id'][:4]),[]).append(form['id'])
    wiki=wiki or{};jra=jra or{};profiles=[];audit=[];gaps=[]
    checked=max(r['checkedAt']for r in receipts)
    raw_url=next(r['url']for r in receipts if 'character_rl_details.'in r['url'])
    for cid,outfit_ids in sorted(groups.items()):
        c=characters.get(cid);h=details.get(cid)
        if not c or not h or not c.get('rl')or not re.fullmatch(r'\d{10}',str(h.get('jbis_slug',''))):raise ValueError('No explicit historical mapping '+str(cid))
        rl=c['rl'];birth=dob(c);name=localized_name(c)
        count,wins=rl.get('races'),rl.get('wins')
        if type(count)is not int or type(wins)is not int or not 0<=wins<=count<1000:raise ValueError('Invalid historical record')
        official=jra.get(cid);record_source='GameTora'
        if official and official.get('recordNumbers'):
            count,wins=official['recordNumbers'];record_source='JRA'
        history=h.get('race_history',[]);started=[r for r in history if r.get('result')not in ['dns','excluded']]
        if len(started)!=rl['races']:gaps.append(dict(character=cid,kind='partial-race-history',declaredStarts=rl['races'],listedStarts=len(started)))
        active=rl.get('active')or'';active_derived=False
        if not active and started and len(started)==rl['races']and all(valid_date(r.get('date'))for r in started):
            active=min(r['date']for r in started)[:4]+'-'+max(r['date']for r in started)[:4];active_derived=True
        if active and not re.fullmatch(r'\d{4}(?:-\d{4})?',active):raise ValueError('Invalid historical career span')
        prefix=C(f'{active}년에 활약하며 'if active else'',f'It raced in {active}, recording 'if active else'It recorded ',f'現役期間は{active}年で、'if active else'',f'於{active}年間競賽，'if active else'')
        summary=C(f"{name['ko']}의 모티브가 된 실제 경주마로, {birth[:4]}년에 태어났다. {prefix['ko']}통산 {count}전 {wins}승을 기록했다.",
            f"The real racehorse behind {name['en']} was foaled in {birth[:4]}. {prefix['en']}{wins} wins from {count} starts.",
            f"{birth[:4]}年生まれの実在の競走馬。{prefix['ja']}通算{count}戦{wins}勝を記録した。",
            f"此角色的原型賽馬出生於{birth[:4]}年，{prefix['zh']}生涯{count}戰{wins}勝。")
        fact=lambda id,label,value:dict(id=id,label=label,value=value)
        facts=[fact('foaled',C('출생일','Foaled','生年月日','出生日期'),C(*([birth]*4))),
               fact('sex',C('성별 · 실제 경주마','Sex · real horse','性別・実馬','性別・實際賽馬'),C('수말','Male','牡','牡馬')if c.get('sex')==1 else C('암말','Female','牝','牝馬')if c.get('sex')==2 else C('원문 미제공','Not published','原文未掲載','原文未提供')),
               fact('career',C('현역 기간','Racing career','現役期間','競賽期間'),C(*([active]*4))),
               fact('record',C('통산 전적','Career record','通算成績','生涯戰績'),C(f'{count}전 {wins}승',f'{count} starts, {wins} wins',f'{count}戦{wins}勝',f'{count}戰{wins}勝'))]
        if not active:facts=[f for f in facts if f['id']!='career']
        death=rl.get('death')
        if death:
            if not valid_date(death)or death<birth or death>checked[:10]:raise ValueError('Invalid historical death date')
            facts.append(fact('died',C('사망일','Died','没年月日','死亡日期'),C(*([death]*4))))
        wc=wiki.get(cid)
        if wc and wc.get('coat')in COATS:facts.append(fact('coat',C('모색','Coat','毛色','毛色'),COATS[wc['coat']]))
        pedigree=h.get('pedigree',{})
        for key,label in [('sire',C('부마 · 원문','Sire','父','父馬')),('dam',C('모마 · 원문','Dam','母','母馬'))]:
            if pedigree.get(key):facts.append(fact(key,label,pedigree_name(pedigree[key],characters)))
        sections=[];selected=representative_wins(history,races)
        if selected:
            body={l:'\n'.join(r['date']+' · '+race_name(r,races)[l]for r in selected)for l in LOCALES}
            sections.append(dict(id='representative-wins',title=C('대표 우승','Selected victories','主な勝ち鞍','代表勝仗'),body=body))
        # These statements are generated solely from exact historical winning rows.
        milestones=[]
        for triple in [(100501,101001,101501),(100401,100901,101401),(100401,100901,101701)]:
            if any(i not in races for i in triple):continue
            by_year={};target={localized_name(races[i])['ja']for i in triple}
            for r in history:
                actual=race_name(r,races)
                if r.get('result')==1 and actual and actual['ja']in target:by_year.setdefault(r['date'][:4],set()).add(actual['ja'])
            for year,won in by_year.items():
                if won==target:
                    names={l:' · '.join(localized_name(races[i])[l]for i in triple)for l in LOCALES}
                    milestones.append(C(f"{year}년 동시 우승: {names['ko']}.",f"Won all three in {year}: {names['en']}.",f"{year}年に{names['ja']}をすべて制覇。",f"於{year}年贏得{names['zh']}。"))
        if count==wins and count>0:milestones.append(C(f'현역 {count}전에서 모두 우승했다.',f'Won all {count} career starts.',f'現役{count}戦すべてで勝利した。',f'生涯{count}戰全勝。'))
        if milestones:sections.append(dict(id='milestones',title=C('기록으로 보는 배경','Career milestones','記録から見る背景','生涯紀錄'),body={l:'\n'.join(m[l]for m in milestones)for l in LOCALES}))
        links=[]
        relation_paths=[('sire',),('dam',),('sire','sire'),('sire','dam'),('dam','sire'),('dam','dam')]
        relation_labels={('sire',):C('부마','Sire','父','父馬'),('dam',):C('모마','Dam','母','母馬'),('sire','sire'):C('친조부마','Paternal grandsire','父の父','祖父馬'),('sire','dam'):C('친조모마','Paternal granddam','父の母','祖母馬'),('dam','sire'):C('외조부마','Maternal grandsire','母の父','外祖父馬'),('dam','dam'):C('외조모마','Maternal granddam','母の母','外祖母馬')}
        for path in relation_paths:
            node=pedigree
            for step in path:node=node.get(step,{})
            parent=node.get('char_id')
            if parent in groups:
                pn=localized_name(characters[parent]);label=relation_labels[path];links.append(C(f"{label['ko']}는 {pn['ko']}. 해당 이름의 우마무스메도 등장한다.",f"{label['en']}: {pn['en']}, also represented by an Umamusume.",f"{label['ja']}は{pn['ja']}。同名のウマ娘も登場する。",f"{label['zh']}為{pn['zh']}，亦有同名賽馬娘登場。"))
        if links:sections.append(dict(id='historical-pedigree-links',title=C('실제 말 혈통과 다른 우마무스메','Real pedigree and other Umamusume','実馬の血統とほかのウマ娘','實際血統與其他賽馬娘'),body={l:'\n'.join(v[l]for v in links)for l in LOCALES}))
        sources_out=[dict(url='https://gametora.com/umamusume/characters/'+c['url_name'],kind='community',label=C('GameTora · 실제 경주마','GameTora · real horse','GameTora・実馬','GameTora・原型賽馬')),dict(url=raw_url,kind='community',label=C('GameTora · 혈통·전적 자료','GameTora · pedigree and race records','GameTora・血統と戦績','GameTora・血統與戰績'))]
        if official:sources_out.insert(0,dict(url=official['url'],kind='official',label=C('JRA · 경주마 소개','JRA · horse profile','JRA・競走馬紹介','JRA・賽馬簡介')))
        if wc:
            from urllib.parse import quote
            sources_out.append(dict(url='https://ja.wikipedia.org/wiki/'+quote(wc['title'].replace(' ','_')),kind='community',label=C('일본어 위키백과 · 기본정보 대조','Japanese Wikipedia · identity cross-check','日本語版Wikipedia・基本情報照合','日語維基百科・基本資料核對')))
        background=dict(id='uma-horse:'+str(cid),name=name,summary=summary,facts=facts,sections=sections,sources=sources_out,checkedAt=max(checked,official['checkedAt'])if official else checked)
        profiles.append(dict(baseId=str(cid),outfitIds=outfit_ids,background=background))
        audit.append(dict(baseId=str(cid),outfits=len(outfit_ids),historicalMapping='GameTora characters.char_id = character_rl_details.char_id',races=rl['races'],wins=rl['wins'],recordSource=record_source,careerDerivedFromCompleteRaceDates=active_derived,listedStartedRaces=len(started),representativeVictories=len(selected),wikiBirthdayMatched=bool(wc),jraBirthdayMatched=bool(official)))
    return dict(version=1,profiles=profiles),dict(status='ok',counts=dict(profiles=len(profiles),outfits=sum(len(x['outfitIds'])for x in profiles),jraCrosschecked=sum(x['jraBirthdayMatched']for x in audit),wikiCrosschecked=sum(x['wikiBirthdayMatched']for x in audit)),sourceReceipts=receipts,reconciliation=audit,gaps=gaps)
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--roster',required=True,type=Path);p.add_argument('--cache',required=True,type=Path);p.add_argument('--output',required=True,type=Path);p.add_argument('--audit',required=True,type=Path);p.add_argument('--refresh',action='store_true');a=p.parse_args()
    roster=json.loads(a.roster.read_text());roster=next(r for r in roster if r['gameId']=='umamusume')if isinstance(roster,list)else roster
    sources,receipts=load_sources(a.cache,a.refresh);chars={c['char_id']:c for c in sources['characters']};wiki,_=wiki_crosschecks(a.cache,chars);jra,jra_gaps=jra_crosschecks(a.cache,chars);out,audit=build(roster,sources,receipts,wiki,jra);audit['gaps']+=jra_gaps
    b=packed(out)+b'\n';audit['output']=dict(bytes=len(b),sha256=sha(b));a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_bytes(b);a.audit.parent.mkdir(parents=True,exist_ok=True);a.audit.write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n');print(json.dumps(dict(output=str(a.output),**audit['counts'],**audit['output'])))
if __name__=='__main__':main()
