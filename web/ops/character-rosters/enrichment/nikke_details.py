"""Exact BlablaLink character facts through the fixed public community mirror.

No guessed asset paths, player APIs, stat interpolation or treasure-as-character
duplicates. One invalid detail leaves that character's previous facts intact.
"""
import copy, html, re

BASE='https://nikke-api-gunwoos-projects.vercel.app/api/nikkes/'
FIELDS='id,name,weapon,icons,costumes,details.backstory,details.squad,details.combat,details.skills,details.statsPerLevel'
LANGS=('ko','en','ja','zh')
def words(ko,en,ja,zh):return dict(zip(LANGS,(ko,en,ja,zh)))
def clean(value):
    text=html.unescape(str(value or '')).replace('\\n','\n')
    text=re.sub(r'<br\s*/?>','\n',text,flags=re.I)
    return re.sub(r'<[^>]*>','',text).strip()
def native(value):return {l:clean((value or {}).get('zh-TW' if l=='zh' else l,'')) for l in LANGS}
LABELS={'hp':words('HP','HP','HP','生命值'),'atk':words('공격력','ATK','攻撃力','攻击力'),'def':words('방어력','DEF','防御力','防御力')}
BASIS=words('BlablaLink 원본 성장표 Lv.1–200 · 장비·돌파·호감도 등 추가 보너스 제외','BlablaLink native growth table, Lv.1–200; equipment, limit break, bond and other bonuses excluded','BlablaLink成長表 Lv.1–200。装備・限界突破・好感度などの追加効果を除く','BlablaLink原始成长表Lv.1–200，不含装备、突破、好感等额外加成')
SKILL_BASIS=words('BlablaLink 기본 스킬 원본 Lv.1–10 · 소장품 강화 효과 제외','BlablaLink base skill table, Lv.1–10; favorite-item upgrades excluded','BlablaLink基本スキル Lv.1–10。宝もの強化効果を除く','BlablaLink基础技能Lv.1–10，不含珍藏品强化效果')
SLOTS={'skill1':words('스킬 1','Skill 1','スキル1','技能1'),'skill2':words('스킬 2','Skill 2','スキル2','技能2'),'burst':words('버스트 스킬','Burst skill','バーストスキル','爆裂技能')}
TRAIT_LABELS={'element':words('속성','Code','コード','代码'),'class':words('클래스','Class','クラス','类型'),'weapon':words('무기','Weapon','武器','武器'),'manufacturer':words('기업','Manufacturer','企業','企业'),'burstType':words('버스트 단계','Burst stage','バースト段階','爆裂阶段'),'rank':words('등급','Rarity','レアリティ','稀有度')}
TRAIT_VALUES={
    'Fire':words('작열','Fire','灼熱','燃烧'),'Water':words('수냉','Water','水冷','水冷'),'Wind':words('풍압','Wind','風圧','风压'),'Electric':words('전격','Electric','電撃','电击'),'Iron':words('철갑','Iron','鉄甲','铁甲'),
    'Attacker':words('화력형','Attacker','火力型','火力型'),'Defender':words('방어형','Defender','防御型','防御型'),'Supporter':words('지원형','Supporter','支援型','辅助型'),
    'Elysion':words('엘리시온','Elysion','エリシオン','极乐净土'),'Missilis':words('미실리스','Missilis','ミシリス','米西利斯'),'Tetra':words('테트라','Tetra','テトラ','泰特拉'),'Pilgrim':words('필그림','Pilgrim','ピルグリム','朝圣者'),'Abnormal':words('어브노멀','Abnormal','アブノーマル','反常'),
    'Assault Rifle':words('소총','Assault Rifle','アサルトライフル','步枪'),'Minigun':words('머신건','Machine Gun','マシンガン','机枪'),'Rocket Launcher':words('런처','Rocket Launcher','ロケットランチャー','发射器'),'SMG':words('기관단총','SMG','サブマシンガン','冲锋枪'),'Shotgun':words('샷건','Shotgun','ショットガン','霰弹枪'),'Sniper Rifle':words('저격소총','Sniper Rifle','スナイパーライフル','狙击步枪'),
    **{str(i):words(v,v,v,v)for i,v in [(1,'I'),(2,'II'),(3,'III')]},**{v:words(v,v,v,v)for v in ['R','SR','SSR']}}

def patch(character,data):
    url=character['sourceUrl']
    if not url.startswith(BASE)or not url.removeprefix(BASE).isdigit()or str(data.get('id'))!=url.removeprefix(BASE):raise ValueError('NIKKE native identity mismatch')
    detail=data.get('details')or{};growth=detail.get('statsPerLevel')or{}
    columns={k:growth.get(v) for k,v in [('hp','hp'),('atk','attack'),('def','defence')]}
    if any(not isinstance(a,list)or len(a)<200 or any(isinstance(v,bool)or not isinstance(v,(int,float))or v<=0 for v in a[:200])for a in columns.values()):raise ValueError('Incomplete native Lv.1–200 table')
    # Discrete, sourced checkpoints. Never interpolate omitted levels.
    levels=[1,*range(10,201,10)]
    progression={'sourceUrl':url,'sourceKind':'community','basis':{l:v+suffix for l,v,suffix in [(l,BASIS[l],{'ko':' · 10레벨 간격 원본값','en':'; native values at 10-level checkpoints','ja':'・10レベル間隔の原本値','zh':'；每10级的原始值'}[l])for l in LANGS]},'stats':[{'id':k,'label':LABELS[k]}for k in columns],'rows':[{'level':level,'values':{k:str(a[level-1])for k,a in columns.items()}}for level in levels]}
    stats=[{'id':k,'label':LABELS[k],'value':str(a[0]),'basis':words('BlablaLink 기본 Lv.1','BlablaLink base Lv.1','BlablaLink基礎Lv.1','BlablaLink基础Lv.1')}for k,a in columns.items()]
    for key,field,label in [('crit_rate','criticalRatio',words('치명타 확률','CRIT Rate','クリティカル率','暴击率')),('crit_dmg','criticalDamage',words('치명타 피해','CRIT DMG','クリティカルダメージ','暴击伤害'))]:
        value=detail.get('combat',{}).get(field)
        if value:stats.append({'id':key,'label':label,'value':str(value),'group':'detail','basis':words('BlablaLink 기본 전투값 · 추가 보너스 제외','BlablaLink base combat values; additional bonuses excluded','BlablaLink基本戦闘値・追加効果を除く','BlablaLink基础战斗值，不含额外加成')})
    ammo=data.get('weapon',{}).get('ammo')
    if isinstance(ammo,int)and ammo>0:stats.append({'id':'ammo','label':words('장탄 수','Ammo capacity','装弾数','装弹量'),'value':str(ammo),'group':'detail','basis':words('BlablaLink 기본 전투값 · 추가 보너스 제외','BlablaLink base combat values; additional bonuses excluded','BlablaLink基本戦闘値・追加効果を除く','BlablaLink基础战斗值，不含额外加成')})
    skills=[];slots=set()
    for s in detail.get('skills',[]):
        slot=s.get('slot')
        if slot not in SLOTS or slot in slots:raise ValueError('Unknown/duplicate native skill slot')
        slots.add(slot);templates=native(s.get('descriptionTemplate'));names=native(s.get('name'));raw=s.get('values')or[]
        if not all(templates[l]and names[l]for l in ['ko','en']):raise ValueError('Missing Korean/English native skill')
        used=set()
        for l,text in templates.items():
            templates[l]=re.sub(r'\{description_value_(\d+)\}',lambda m:'{'+str(int(m[1]))+'}',text)
            if re.search(r'\{[^\d}][^}]*\}',templates[l]):raise ValueError('Unbound native skill token')
            used.update(int(n)for n in re.findall(r'\{(\d+)\}',templates[l]))
        parameters=[]
        for n in range(1,max(used,default=0)+1):
            values=raw[n-1]if n<=len(raw)else None
            if n in used and (not isinstance(values,list)or len(values)!=10 or any(v is None for v in values)):raise ValueError('Unbound native skill rank values')
            parameters.append([str(v)for v in values]if n in used else [''])
        table={'id':'nikke-'+str(s['id']),'name':names,'type':SLOTS[slot],'sourceUrl':url,'sourceKind':'community','basis':SKILL_BASIS,'descriptionTemplate':templates,'parameters':{'en':parameters},'maxLevel':10,'values':[]}
        if s.get('icon'):table['icon']=s['icon']
        if s.get('cooltime'):
            times=s['cooltime']
            if len(times)!=10:raise ValueError('Invalid native cooldown ranks')
            table['values'].append({'id':'cooldown','label':words('재사용 시간','Cooldown','クールタイム','冷却时间'),'levels':[str(v)+' s'for v in times]})
        skills.append(table)
    if slots!=set(SLOTS):raise ValueError('Incomplete three-skill set')
    sections=[]
    for ident,title,body in [('profile',words('소개','Profile','プロフィール','角色介绍'),detail.get('backstory')),('squad',words('소속 스쿼드','Squad','所属部隊','所属部队'),{l:(detail.get('squad',{}).get('name',{}).get(l,'')+'\n'+detail.get('squad',{}).get('description',{}).get(l,''))for l in ['ko','en','ja','zh-TW']})]:
        localized=native(body)
        if any(localized.values()):sections.append({'id':'nikke-'+ident,'title':title,'body':localized})
    # Preserve other editorial/source sections; replace only our own namespace.
    sections=[s for s in character.get('sections',[])if not s['id'].startswith('nikke-')]+sections
    result={'stats':stats,'statProgression':progression,'skillTables':skills,'sections':sections}
    images=copy.deepcopy(character.get('images',[]));base=copy.deepcopy(character.get('image'))
    if base:
        base.update(variantId='default',variantLabel=words('기본','Default','デフォルト','默认'))
        result['image']=base
        images=[a for a in images if not a.get('variantId','').startswith('costume-')]
        for costume in data.get('costumes',[]):
            art=costume.get('images',{}).get('full');name=native(costume.get('name'))
            if art and name['ko']and name['en']:images.append({'url':art,'sourceUrl':url,'sourceKind':'community','locale':'neutral','kind':'full-body','variantId':'costume-'+str(costume['id']),'variantLabel':name,'caption':native(costume.get('description'))})
        images=list({a['url']:a for a in images if a['url']!=base['url']}.values())
        if len(images)>10:raise ValueError('Too many exact costume originals')
        result['images']=images
    # Native, same-game icons only; keep existing localized classification names.
    traits=copy.deepcopy(character.get('traits',[]))
    for trait in traits:
        if trait['id']in TRAIT_LABELS:trait['label']=TRAIT_LABELS[trait['id']]
        value=TRAIT_VALUES.get(trait.get('value',{}).get('en'))
        if value:trait['value']=value
        icon=data.get('icons',{}).get({'element':'element','class':'class','rank':'grade'}.get(trait['id'],''))
        if icon:trait['icon']=icon
    squad=native(detail.get('squad',{}).get('name'))
    traits=[t for t in traits if t['id']!='squad']
    if all(squad.values()):traits.append({'id':'squad','label':words('스쿼드','Squad','部隊','部队'),'value':squad})
    result['traits']=traits
    sources={s['url']:s for s in character.get('detailSources',[])}
    sources[url]={'url':url,'kind':'community','label':words('BlablaLink 원본 테이블 · 커뮤니티 API','BlablaLink native tables · community API','BlablaLink原本テーブル・コミュニティAPI','BlablaLink原始数据表・社区API')}
    result['detailSources']=list(sources.values())
    return result
