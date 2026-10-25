#!/usr/bin/env python3
"""Endfield released-character detail importer. Standard library, no site writes.

The reviewed release allowlist is deliberate: preloaded characters are not proof of
release. All bindings are native IDs, never table position or an artwork guess.
"""
import argparse, ast, copy, datetime, hashlib, json, math, re, urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

REPO = 'rmxlinux/EndfieldData'
PIN = 'a0ed1dac31c502f636c70cee4e3010ca69562a70'
OFFICIAL = 'https://endfield.gryphline.com/ko-kr'
LOCALES = {'ko':'KR','en':'EN','ja':'JP','zh':'CN'}
MAPPING = {
 'akekuri':'chr_0019_karin','alesh':'chr_0024_deepfin','antal':'chr_0023_antal',
 'arclight':'chr_0007_ikut','ardelia':'chr_0025_ardelia','avywenna':'chr_0012_avywen',
 'camille':'chr_0033_camille','catcher':'chr_0020_meurs','chen':'chr_0005_chen',
 'dapan':'chr_0018_dapan','ember':'chr_0009_azrila','endministrator1':'chr_0003_endminf',
 'endministrator2':'chr_0002_endminm','estella':'chr_0021_whiten','fluorite':'chr_0022_bounda',
 'gilberta':'chr_0013_aglina','jsspsi':'chr_0036_jsspsi','laevatain':'chr_0016_laevat',
 'lastrite':'chr_0026_lastrite','lifeng':'chr_0015_lifeng','liino':'chr_0035_liino',
 'lizhiyan':'chr_0032_lizhiyan','mifu':'chr_0031_mifu','perlica':'chr_0004_pelica',
 'pogranichnik':'chr_0029_pograni','purrche':'chr_0038_purrche','rossi':'chr_0028_wulfa',
 'snowshine':'chr_0014_aurora','tangtang':'chr_0027_tangtang','typhoea':'chr_0034_typhoea',
 'wulfgard':'chr_0006_wolfgd','xaihi':'chr_0011_seraph','yvonne':'chr_0017_yvonne',
 'zhuangfy':'chr_0030_zhuangfy'}
TABLES = ['CharacterTable','CharGrowthTable','CharBreakStageTable','SkillPatchTable',
 'CharacterPotentialTable','PotentialTalentEffectTable','SpaceshipCharSkillTable',
 'SpaceshipSkillTable','AttributeMetaTable','AttributeShowConfigTable','BattleConst',
 'I18nTextTable_KR','I18nTextTable_EN','I18nTextTable_JP','I18nTextTable_CN']

def cp(ko,en,ja=None,zh=None): return dict(zip(LOCALES,(ko,en,ja or en,zh or en)))
def clean(x):
    return re.sub(r'<[^>]*>', '', str(x)).replace('\\n','\n').strip()
def num(x): return str(int(x)) if float(x).is_integer() else format(float(x),'.6g')
def native_integer(x): return str(math.floor(math.floor(x*100000+0.5)/100000))
def dump(path, value): path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

class Sources:
    def __init__(self,cache,offline):
        self.cache=cache; self.offline=offline; self.receipts=[]; self.omissions=[]
        self.cache.mkdir(parents=True,exist_ok=True)
    def fetch(self,url,path,blob=None):
        p=self.cache/path
        if not p.exists():
            if self.offline: raise RuntimeError('Missing offline cache: '+str(p))
            req=urllib.request.Request(url,headers={'User-Agent':'Gagether-source-import/1.0'})
            with urllib.request.urlopen(req,timeout=120) as r: raw=r.read(70_000_001)
            if len(raw)>70_000_000: raise ValueError('Source exceeds bounded read')
            p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(raw)
        raw=p.read_bytes()
        git=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
        if blob and blob!=git: raise ValueError('Git blob mismatch: '+str(path))
        self.receipts.append({'url':url,'cachePath':str(path),'bytes':len(raw),
          'sha256':hashlib.sha256(raw).hexdigest(),'gitBlobSha':git if blob else None,
          'readAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'cached':True})
        return raw
    def table(self,name,tree):
        filename=name+'.json';entry=next(x for x in tree if x['path']==filename)
        return json.loads(self.fetch(self.url('TableCfg/'+filename),Path('rmx')/filename,entry['sha']))
    def url(self,path): return f'https://raw.githubusercontent.com/{REPO}/{PIN}/{path}'

def expression(expr,lookup):
    """Restricted arithmetic in the native descriptions; never Python eval."""
    if re.fullmatch(r'\d+,\d+',expr): raise ValueError('Indexed native token needs missing parameter export')
    def walk(n):
        if isinstance(n,ast.Expression):return walk(n.body)
        if isinstance(n,ast.Constant) and isinstance(n.value,(int,float)):return n.value
        if isinstance(n,ast.Name):return lookup(n.id)
        if isinstance(n,ast.UnaryOp) and isinstance(n.op,(ast.USub,ast.UAdd)):
            return (-1 if isinstance(n.op,ast.USub) else 1)*walk(n.operand)
        if isinstance(n,ast.BinOp) and isinstance(n.op,(ast.Add,ast.Sub,ast.Mult,ast.Div)):
            a,b=walk(n.left),walk(n.right)
            if isinstance(n.op,ast.Add):return a+b
            if isinstance(n.op,ast.Sub):return a-b
            if isinstance(n.op,ast.Mult):return a*b
            return a/b
        raise ValueError('Unsupported token expression: '+expr)
    return walk(ast.parse(expr,mode='eval'))

def formatted(value,spec):
    # Native display strings already supply combat coefficients. This formatter is
    # used only for description blackboards with their declared 0/0.0/0% formats.
    value=round(float(value),5)
    if not spec: return num(value)
    if not re.fullmatch(r'0(?:\.[0#]+)?%?',spec):raise ValueError('Unsupported format '+spec)
    pct=spec.endswith('%');fmt=spec.rstrip('%');places=len(fmt.split('.')[1]) if '.' in fmt else 0
    answer=format(value*(100 if pct else 1),f'.{places}f')
    if '#' in fmt:answer=answer.rstrip('0').rstrip('.')
    return answer+('%' if pct else '')

class Enricher:
    def __init__(self,src,tables):
        self.src=src;self.t=tables;self.i18n={l:tables['I18nTextTable_'+code] for l,code in LOCALES.items()}
        self.counts={'matchedCharacters':0,'progressionRows':0,'combatGroups':0,'combatCoefficientRows':0,
          'talentSections':0,'potentialSections':0,'baseSkillSections':0,'attributeSections':0}
    def text(self,ref,l):
        if isinstance(ref,str):return clean(ref)
        return clean(self.i18n[l].get(str(ref.get('id',0)),ref.get('text','')))
    def textcopy(self,ref):return {l:self.text(ref,l) for l in LOCALES}
    def token_desc(self,ref,sequences,identity):
        texts=self.textcopy(ref); tokens=[]
        for text in texts.values():
            for m in re.finditer(r'\{([^{}]+)\}',text):
                if m.group(0) not in tokens:tokens.append(m.group(0))
        params=[]
        try:
            for token in tokens:
                inner=token[1:-1];expr,sep,spec=inner.partition(':')
                params.append([formatted(expression(expr,lambda key:sequences(key)[i]),spec) for i in range(12)])
            for l in texts:
                for i,token in enumerate(tokens):texts[l]=texts[l].replace(token,'{'+str(i+1)+'}')
            return texts,params
        except (ValueError,KeyError,IndexError,SyntaxError,ZeroDivisionError) as e:
            self.src.omissions.append({'id':identity,'fact':'parameterized description','reason':str(e)})
            return None,None
    def combat(self,native,growth):
        result=[]
        for group in sorted(growth['skillGroupMap'].values(),key=lambda x:{0:0,1:1,3:2,2:3}[x['skillGroupType']]):
            native_ids=group['skillIdList']; bundles=[]
            for sid in native_ids:
                rows=self.t['SkillPatchTable'][sid]['SkillPatchDataBundle']
                assert [x['level'] for x in rows]==list(range(1,13)),sid
                bundles.append((sid,rows))
            def seq(key):
                options=[]
                for sid,rows in bundles:
                    values=[]
                    for r in rows:
                        hit=[b['value'] for b in r['blackboard'] if b['key']==key]
                        if len(hit)!=1:break
                        values.append(hit[0])
                    if len(values)==12 and values not in options:options.append(values)
                # Arcane's preceding hit has a zero poise override; its explicitly
                # separate final hit has the only nonzero strong-hit sequence.
                if group['skillGroupId']=='chr_0032_lizhiyan_NormalAttack' and key=='poise':
                    options=[x for x in options if any(v!=0 for v in x)]
                if len(options)!=1:raise ValueError('Ambiguous/missing blackboard '+key)
                return options[0]
            desc,parameters=self.token_desc(group['desc'],seq,group['skillGroupId'])
            values=[]
            for sid,rows in bundles:
                for j,item in enumerate(rows[0]['subDescDataList']):
                    if any(len(x['subDescDataList'])!=len(rows[0]['subDescDataList']) for x in rows):
                        raise ValueError('Changing skill rows: '+sid)
                    labels=[self.textcopy(x['subDescDataList'][j]['name']) for x in rows]
                    if any(x!=labels[0] for x in labels):raise ValueError('Rank-dependent skill label '+sid)
                    levels=[clean(x['subDescDataList'][j]['desc']) for x in rows]
                    values.append({'id':sid+':'+str(j),'label':labels[0],'levels':levels})
                # Source costs and cooldowns are independent facts, not damage coefficients.
                for key,label in [('coolDown',cp('쿨타임 (초)','Cooldown (s)','クールタイム（秒）','冷却时间（秒）')),
                    ('costValue',cp('스킬 게이지 소모' if group['skillGroupType']==1 else '궁극기 에너지 소모',
                      'SP cost' if group['skillGroupType']==1 else 'Ultimate energy cost',
                      'SP消費' if group['skillGroupType']==1 else '必殺技エネルギー消費',
                      '技力消耗' if group['skillGroupType']==1 else '终结技能量消耗'))]:
                    if any(x[key]>0 for x in rows):values.append({'id':sid+':'+key,'label':label,'levels':[num(x[key]) for x in rows]})
            kind={0:cp('일반 공격','Basic attack','通常攻撃','普通攻击'),1:cp('배틀 스킬','Battle skill','戦技','战技'),
              2:cp('궁극기','Ultimate','必殺技','终结技'),3:cp('연계 스킬','Combo skill','連携技','连携技')}[group['skillGroupType']]
            entry={'id':group['skillGroupId'],'name':self.textcopy(group['name']),'type':kind,
              'sourceUrl':self.src.url('TableCfg/SkillPatchTable.json'),'sourceKind':'community',
              'basis':cp('클라이언트 1.6 원본 표. 스킬 1–9 및 마스터리 I–III의 개별 수치이며, 잠재·재능·장비 보정 미포함.',
                'Client 1.6 native tables. Skill ranks 1–9 and Mastery I–III; potential, talent and equipment bonuses excluded.',
                'クライアント1.6の元データ。スキル1–9・特化I–III。潜在・素質・装備補正を含みません。',
                '客户端1.6原始数据。技能1–9级及专精I–III，不含潜能、天赋和装备加成。'),
              'maxLevel':12,'levelLabels':[cp(str(i),str(i),str(i),str(i)) for i in range(1,10)]+[cp('M'+str(i),'M'+str(i),'M'+str(i),'M'+str(i)) for i in range(1,4)],
              'values':values}
            if desc is not None:
                entry['descriptionTemplate']=desc
                if parameters:entry['parameters']={'en':parameters}
            if not values and not desc:continue
            result.append(entry); self.counts['combatGroups']+=1;self.counts['combatCoefficientRows']+=len(values)
        return result
    def effect(self,effectid):
        effect=self.t['PotentialTalentEffectTable'][effectid]
        candidates={}
        def put(key,value):candidates.setdefault(key.lower(),set()).add(float(value))
        for item in effect['dataList']:
            for kind in ['attachSkill','attachBuff']:
                for b in item[kind]['blackboard']:put(b['key'],b.get('value',b.get('valueDouble',0)))
            mod=item['skillBbModifier']
            if mod['bbKey']:put(mod['bbKey'],mod['floatValue'])
            mod=item['skillParamModifier']
            if mod['skillId']:
                param={1:'costValue',2:'coolDown'}.get(mod['paramType'])
                if param:put(param,mod['paramValue'])
            mod=item['attrModifier']
            if mod['attrType']:
                # Native effect descriptions and their own attrModifier entries,
                # corroborated by AttributeShowConfig's localized labels.
                attr={39:'Str',40:'Agi',41:'Wisd',42:'Will',9:'CriticalRate',3:'Def',
                  1:'MaxHp',50:'PhysicalDamageIncrease',52:'PulseDamageIncrease',
                  87:'PhysicalAndSpellInflictionEnhance',17:'NormalAttackDamageIncrease',
                  53:'CrystDamageIncrease',29:'HealOutputIncrease',32:'NormalSkillDamageIncrease'}.get(mod['attrType'])
                if attr:put(attr,mod['attrValue'])
        def lookup(key):
            values=candidates[key.lower()]
            if len(values)!=1:raise ValueError('Ambiguous effect blackboard '+key)
            return next(iter(values))
        answer={}
        try:
            for l in LOCALES:
                text=self.text(effect['desc'],l)
                if re.fullmatch(r'[?？\s.]+',text):raise ValueError('Native placeholder, no published effect text')
                def sub(m):
                    expr,sep,spec=m.group(1).partition(':')
                    return formatted(expression(expr,lookup),spec)
                answer[l]=re.sub(r'\{([^{}]+)\}',sub,text)
            return answer
        except (ValueError,KeyError,SyntaxError,ZeroDivisionError) as e:
            self.src.omissions.append({'id':effectid,'fact':'talent/potential description','reason':str(e)})
            return None
    def sections(self,native,growth):
        out=[]
        def section(identity,title,body,kind):
            if any(len(x)>3000 for x in body.values()):raise ValueError('Section exceeds copy limit '+identity)
            out.append({'id':'endfield-detail-'+identity,'title':title,'body':body});self.counts[kind]+=1
        attrlabels={39:cp('힘','Strength','筋力','力量'),40:cp('민첩','Agility','敏捷','敏捷'),
          41:cp('지능','Intellect','知性','智识'),42:cp('의지','Will','意志','意志')}
        main=attrlabels[growth['mainAttrType']];sub=attrlabels[growth['subAttrType']]
        out.append({'id':'endfield-detail-attribute-priority',
          'title':cp('주요·보조 속성','Main and secondary attributes','メイン・サブ能力','主、副能力'),
          'body':cp('주요 속성: '+main['ko']+'\n보조 속성: '+sub['ko'],
            'Main attribute: '+main['en']+'\nSecondary attribute: '+sub['en'],
            'メイン能力：'+main['ja']+'\nサブ能力：'+sub['ja'],
            '主能力：'+main['zh']+'\n副能力：'+sub['zh'])})
        for node in growth['talentNodeMap'].values():
            if node['nodeType']==4:
                info=node['passiveSkillNodeInfo'];desc=self.effect(info['talentEffectId'])
                if desc is None:continue
                prefix=cp(f"정예화 {info['breakStage']} · 재능 Lv.{info['level']}",f"Promotion {info['breakStage']} · Talent Lv.{info['level']}",f"昇進{info['breakStage']}・素質Lv.{info['level']}",f"精英化{info['breakStage']} · 天赋Lv.{info['level']}")
                section(node['nodeId'],self.textcopy(info['name']),{l:prefix[l]+'\n'+desc[l] for l in LOCALES},'talentSections')
            elif node['nodeType']==3:
                info=node['attributeNodeInfo'];body=self.textcopy(info['desc'])
                if any('{' in x for x in body.values()):continue
                prefix=cp(f"정예화 {info['breakStage']}",f"Promotion {info['breakStage']}",f"昇進{info['breakStage']}",f"精英化{info['breakStage']}")
                # The numeric friendship-to-displayed-percent conversion is native
                # C# and absent in this export. Do not label raw 60/300 as percent.
                if info['favorability']>0:
                    condition=cp(' · 추가 신뢰도 조건',' · Additional trust requirement','・追加の信頼度条件あり',' · 另有信赖条件')
                    prefix={l:prefix[l]+condition[l] for l in LOCALES}
                section(node['nodeId'],self.textcopy(info['title']),{l:prefix[l]+'\n'+body[l] for l in LOCALES},'attributeSections')
        for info in self.t['CharacterPotentialTable'][native]['potentialUnlockBundle']:
            desc=self.effect(info['potentialEffectId'])
            if desc is None:continue
            title=self.textcopy(info['name']);prefix=cp('잠재','Potential','潜在','潜能')
            section('potential-'+str(info['level']),{l:prefix[l]+' '+str(info['level'])+' · '+title[l] for l in LOCALES},desc,'potentialSections')
        for link in self.t['SpaceshipCharSkillTable'].get(native,{}).get('skillList',[]):
            info=self.t['SpaceshipSkillTable'][link['skillId']];desc=self.textcopy(info['desc'])
            if any('{' in x for x in desc.values()):
                self.src.omissions.append({'id':link['skillId'],'fact':'base skill','reason':'unresolved native parameter'});continue
            title=self.textcopy(info['name']);unlock=self.textcopy(link['unlockHint'])
            nodes=[n['factorySkillNodeInfo'] for n in growth['talentNodeMap'].values() if n['nodeType']==5 and n['factorySkillNodeInfo']['index']==link['skillIndex'] and n['factorySkillNodeInfo']['level']==info['level']]
            if len(nodes)!=1:raise ValueError('Unbound base skill unlock '+link['skillId'])
            prefix=cp(f"거점 스킬 · 정예화 {nodes[0]['breakStage']}",f"Base skill · Promotion {nodes[0]['breakStage']}",f"基地スキル・昇進{nodes[0]['breakStage']}",f"基建技能 · 精英化{nodes[0]['breakStage']}")
            section(link['skillId'],{l:title[l] if title[l].endswith(info['skillNamePostfix']) else title[l]+' '+info['skillNamePostfix'] for l in LOCALES},
              {l:prefix[l]+'\n'+unlock[l]+'\n'+desc[l] for l in LOCALES},'baseSkillSections')
        return out
    def stats(self,native):
        row=self.t['CharacterTable'][native];stages=self.t['CharBreakStageTable'];frames=[]
        labels={
          1:('hp',cp('기본 HP','Base HP','基礎HP','基础生命值')),
          2:('atk',cp('기본 공격력','Base ATK','基礎攻撃力','基础攻击力')),
          3:('def',cp('기본 방어력','Base DEF','基礎防御力','基础防御力')),
          39:('str',cp('힘','Strength','筋力','力量')),40:('agi',cp('민첩','Agility','敏捷','敏捷')),
          41:('int',cp('지능','Intellect','知性','智识')),42:('wil',cp('의지','Will','意志','意志')),
          9:('crit-rate',cp('기본 치명타 확률','Base Critical Rate','基礎会心率','基础暴击率'))}
        basis=cp('클라이언트 1.6의 레벨·정예화별 원본 값. HP·공격력·방어력은 속성 환산 전 기본치이며 장비·무기·잠재·재능·신뢰도 보정 미포함. 레벨 1–90만 표시.',
          'Client 1.6 native level/promotion values. HP/ATK/DEF are raw base values before attribute conversion. No gear, weapon, potential, talent or trust bonuses. Levels 1–90 only.',
          'クライアント1.6のレベル・昇進別元データ。HP・攻撃力・防御力は属性換算前の基礎値。装備・武器・潜在・素質・信頼度の補正を含みません。Lv.1–90。',
          '客户端1.6等级、精英化原始值。生命、攻击、防御为属性换算前基础值，不含装备、武器、潜能、天赋、信赖加成，仅显示1–90级。')
        for f in row['attributes']:
            attrs={a['attrType']:a['attrValue'] for a in f['Attribute']['attrs']};level=int(attrs[0]);stage=f['breakStage'];s=stages[str(stage)]
            if not s['minCharLevel']<=level<=s['maxCharLevel']:continue
            values={sid:(formatted(attrs[code],'0.0%') if code==9 else native_integer(attrs[code])) for code,(sid,label) in labels.items()}
            frames.append({'level':level,'stage':stage,'values':values})
        assert len(frames)==94 and max(x['level'] for x in frames)==90
        frames.sort(key=lambda x:(x['stage'],x['level']));last=frames[-1]
        progression={'sourceUrl':self.src.url('TableCfg/CharacterTable.json'),'sourceKind':'community','basis':basis,
          'stats':[{'id':sid,'label':label,**({'group':'detail'} if code in (39,40,41,42,9) else {})} for code,(sid,label) in labels.items()],
          'stages':[{'id':int(k),'label':cp('기초' if k=='0' else '정예화 '+k,'Base' if k=='0' else 'Promotion '+k,'未昇進' if k=='0' else '昇進'+k,'未精英化' if k=='0' else '精英化'+k)} for k in stages], 'rows':frames}
        staticbasis={l:cp('Lv.90 · 정예화 4. ','Lv.90 · Promotion 4. ','Lv.90・昇進4。','90级 · 精英化4。')[l]+basis[l] for l in LOCALES}
        stats=[{'id':s['id'],'label':s['label'],'value':last['values'][s['id']],'basis':staticbasis,**({'group':'detail'} if s.get('group')=='detail' else {})} for s in progression['stats']]
        self.counts['progressionRows']+=len(frames)
        return stats,progression

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,required=True);ap.add_argument('--output-dir',type=Path,required=True);ap.add_argument('--cache-dir',type=Path,required=True);ap.add_argument('--offline',action='store_true');a=ap.parse_args()
    src=Sources(a.cache_dir,a.offline)
    # Read Korean official before any extracted numerical source.
    src.fetch(OFFICIAL,Path('official-ko.html'))
    src.fetch(src.url('README.md'),Path('rmx-readme.md'))
    tree=json.loads(src.fetch(f'https://api.github.com/repos/{REPO}/git/trees/61867efc302bd03b96488273a518ca9eb2fdf376?recursive=1',Path('rmx-table-tree.json')))
    if tree.get('truncated'):raise ValueError('Incomplete table directory')
    tables={name:src.table(name,tree['tree']) for name in TABLES}
    source=json.loads(a.input.read_text());doc=copy.deepcopy(source)
    if isinstance(doc,list):doc=next(x for x in doc if x['gameId']=='endfield')
    if doc['gameId']!='endfield':raise ValueError('Expected Endfield roster')
    e=Enricher(src,tables);patches={};bindings=[]
    for row in doc['characters']:
        native=MAPPING.get(row['id'])
        if not native:
            if row['id']!='minghe':raise ValueError('Unreviewed identity '+row['id'])
            src.omissions.append({'id':row['id'],'fact':'numerical detail','reason':'Announced operator: official event begins 2026-11-05; no released-client record in reviewed 1.6 dump.'});continue
        growth=tables['CharGrowthTable'][native]
        if e.text(growth['name'],'ko')!=row['name']['ko']:raise ValueError('Native Korean identity mismatch '+row['id'])
        stats,progression=e.stats(native);skills=e.combat(native,growth);sections=e.sections(native,growth)
        retained=[x for x in row.get('sections',[]) if not x['id'].startswith('endfield-detail-')]
        if len(retained)+len(sections)>30:raise ValueError('Preserved section limit '+row['id'])
        provenance=[{'url':src.url('TableCfg/CharacterTable.json'),'kind':'community','label':cp('클라이언트 1.6 추출 표 · 기본 능력치','Client 1.6 extracted table · base attributes','クライアント1.6抽出表・基礎能力','客户端1.6提取表·基础属性')},
          {'url':src.url('TableCfg/CharGrowthTable.json'),'kind':'community','label':cp('성장·스킬·재능 해금 표','Growth, skills and talent unlock table','成長・スキル・素質解放表','成长、技能和天赋解锁表')},
          {'url':src.url('TableCfg/SkillPatchTable.json'),'kind':'community','label':cp('스킬 랭크별 원본 수치','Native skill rank coefficients','スキルランク別元データ','各技能等级原始数值')},
          {'url':src.url('TableCfg/PotentialTalentEffectTable.json'),'kind':'community','label':cp('잠재·재능 효과 표','Potential and talent effects','潜在・素質効果表','潜能、天赋效果表')},
          {'url':src.url('TableCfg/SpaceshipSkillTable.json'),'kind':'community','label':cp('거점 스킬 표','Base skill table','基地スキル表','基建技能表')}]
        prior=[x for x in row.get('detailSources',[]) if x['url'] not in {p['url'] for p in provenance}]
        patch={'stats':stats,'statProgression':progression,'skillTables':skills,'sections':retained+sections,'detailSources':prior+provenance}
        row.update(patch);patches[row['id']]=patch;e.counts['matchedCharacters']+=1
        bindings.append({'id':row['id'],'nativeId':native,'nativeNames':e.textcopy(growth['name']),'existingNamesPreserved':row['name'],
          'evidence':'Exact reviewed showcase form mapping and matching native Korean name; gender-specific official originals visually verified by parent.' if row['id'].startswith('endministrator') else 'Explicit reviewed native ID plus exact Korean name match.'})
    reward_path=Path(__file__).with_name('endfield')/'potential-rewards.json'
    rewards=json.loads(reward_path.read_text())
    by_id={r['id']:r for r in rewards}
    if set(by_id)!=set(MAPPING):raise ValueError('Reviewed reward identity set differs')
    for row in doc['characters']:
        if row['id'] not in MAPPING:continue
        reward=by_id[row['id']]
        if reward['nativeId']!=MAPPING[row['id']]:raise ValueError('Reward native identity mismatch')
        if row['id'].startswith('endministrator') and any(r['level']==5 for r in reward['potentialRewards']):raise ValueError('Unconfirmed Endministrator potential5 reward')
        row['potentialRewards']=copy.deepcopy(reward['potentialRewards'])
        patches[row['id']]['potentialRewards']=row['potentialRewards']
    old=source if isinstance(source,dict) else next(x for x in source if x['gameId']=='endfield')
    for prev,now in zip(old['characters'],doc['characters']):
        for k in set(prev)|set(now):
            if k not in {'stats','statProgression','skillTables','sections','detailSources','potentialRewards'} and prev.get(k)!=now.get(k):raise ValueError('Identity preservation failure '+k)
    version='detailed native client 1.6 @'+PIN
    if version not in doc.get('sourceVersion',''):doc['sourceVersion']=(doc.get('sourceVersion','')+'; '+version).strip('; ')
    checked=datetime.datetime.now(datetime.timezone.utc).isoformat();doc['checkedAt']=checked
    encoded=json.dumps(doc,ensure_ascii=False).encode()
    if len(encoded)>4_400_000:raise ValueError('Roster exceeds ingest cap: '+str(len(encoded)))
    a.output_dir.mkdir(parents=True,exist_ok=True);dump(a.output_dir/'endfield.json',doc);dump(a.output_dir/'patches.json',patches)
    manifest={'checkedAt':checked,'sourceVersion':'client 1.6','repository':REPO,'commit':PIN,
      'officialFirst':OFFICIAL,'sourceBasis':'Public client extraction, community provenance; no official numerical endorsement.',
      'counts':e.counts,'rosterCharacters':len(doc['characters']),'defaultJsonBytes':len(encoded),
      'reviewedBindings':bindings,'omissions':src.omissions,'sources':src.receipts,
      'rawTrustUnlockRequirements':[{'nativeId':native,'nodeId':node['nodeId'],
        'promotion':node['attributeNodeInfo']['breakStage'],
        'rawFavorability':node['attributeNodeInfo']['favorability']}
        for native in MAPPING.values() for node in tables['CharGrowthTable'][native]['talentNodeMap'].values()
        if node['nodeType']==3 and node['attributeNodeInfo']['favorability']>0],
      'identityEvidence':[
        {'id':'endministrator1','nativeId':'chr_0003_endminf','form':'female',
          'officialOriginal':'https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/endministrator1.ec409283.png',
          'sha256':'48909c0e98405917915492304e4bc83c91ed965ce6096ce37cb8bcfe0c4ccc02',
          'verification':'Parent visually inspected this exact official original.'},
        {'id':'endministrator2','nativeId':'chr_0002_endminm','form':'male',
          'officialOriginal':'https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/endministrator2.1ec20a16.png',
          'sha256':'23432dc54b2f7e6533499ca8ad8a60fc1b9c77462320717397963167fbb9fe09',
          'verification':'Parent visually inspected this exact official original.'}],
      'limitations':['Raw base HP/ATK/DEF are not final character-panel totals; attributes are shown separately.',
        'No speculative announced-character numbers. No copied artwork or owner-field changes.',
        'Indexed talent tokens omitted where the export lacks their parameter list; absence is explicit in this manifest.',
        'Native friendship-to-display-percent conversion is unavailable. Public attribute unlocks retain a trust condition without a guessed percentage; raw values are retained in this audit.']}
    dump(a.output_dir/'manifest.json',manifest)
    print(json.dumps({'counts':e.counts,'bytes':len(encoded),'omissions':len(src.omissions),'output':str(a.output_dir)},ensure_ascii=False))

if __name__=='__main__':main()
