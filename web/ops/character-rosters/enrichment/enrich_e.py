#!/usr/bin/env python3
"""Read-only sourced enrichment for HI3 / Endfield / Blue Archive roster JSON.

No Site credentials or writes. A per-game failure retains its input. Exact native
names bind Endfield rows; internal rows and unmatched newer operators are omitted.
Only explicit source-table values are emitted; no level scaling is calculated.
"""
from __future__ import annotations
import argparse, copy, datetime, hashlib, io, json, pathlib, urllib.request, zipfile

KO_HOME='https://endfield.gryphline.com/ko-kr'
RELEASES='https://api.github.com/repos/3aKHP/EndFieldGameData/releases?per_page=10'
TABLE_HOME='https://github.com/3aKHP/EndFieldGameData'
ENUM_SOURCE='https://endfield.moeyinlo.cn/original-game/actions/damage-infliction/damage-action.html'
ASUKA_API='https://sg-public-api-static.hoyoverse.com/content_v2_user/app/f4395662cb524b05/getContent?iInfoId=109619&sLangKey=ko-kr'
ASUKA_PAGE='https://honkaiimpact3.hoyoverse.com/kr/ko-kr/news/109619?source=v1'
ASUKA_IMAGE='https://webstatic.hoyoverse.com/upload/uploadstatic/contentweb/20210111/2021011114105830624.png'
ASUKA_IMAGE_SHA='f9f5c98bcf117b7bf0d8a5cf0ad93a62d926b4ea8684f84860ab28ef96470a69'
LOCALES=('ko','en','ja','zh')

def now():return datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')
def copies(ko,en,ja,zh):return dict(zip(LOCALES,[ko,en,ja,zh]))
def fetch(url,cache_dir,name,max_bytes=32*1024*1024):
    request=urllib.request.Request(url,headers={'User-Agent':'GAGETHER-sourced-roster-enrichment/1.0','Accept':'application/json,text/html,*/*;q=0.5'})
    with urllib.request.urlopen(request,timeout=40)as r:
        if r.status!=200:raise ValueError('Source did not return HTTP200')
        b=r.read(max_bytes+1)
        if len(b)>max_bytes:raise ValueError('Source exceeds byte limit')
    p=pathlib.Path(cache_dir);p.mkdir(parents=True,exist_ok=True);(p/name).write_bytes(b)
    return b,{'url':url,'status':200,'checkedAt':now(),'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)}

def add_sources(doc,urls):
    doc['sourceUrls']=list(dict.fromkeys([*doc['sourceUrls'],*urls]))
    if len(doc['sourceUrls'])>40:raise ValueError('Too many source URLs')

def meaningful(doc):return {k:v for k,v in doc.items()if k!='checkedAt'}

def enrich(game,document,cache_dir):
    old=copy.deepcopy(document);doc=copy.deepcopy(document);report={'gameId':game,'sources':[],'checkedAt':now()}
    if game=='hi3':
        b,receipt=fetch(ASUKA_API,cache_dir,'hi3-asuka.json');report['sources'].append(receipt)
        source=json.loads(b)
        if source.get('retcode')!=0 or str(source.get('data',{}).get('iInfoId'))!='109619':raise ValueError('HI3 official article identity mismatch')
        article=source['data']
        if '내일을 향한 기도'not in article.get('sTitle','')or '아스카'not in article.get('sContent',''):raise ValueError('HI3 official native identity missing')
        matches=[c for c in doc['characters']if c['id']=='hi3-129944' and c['name'].get('zh')=='明日福音']
        if len(matches)!=1:raise ValueError('HI3 exact stored source identity mismatch')
        c=matches[0];c['name']['ko']='내일을 향한 기도'
        # This asset was visually inspected: the exact default red-plugsuit Asuka
        # introduction scene, with a Korean game logo. It is not a gacha splash.
        if ASUKA_IMAGE not in article['sContent']:raise ValueError('Reviewed introduction image no longer declared')
        art,receipt=fetch(ASUKA_IMAGE,cache_dir,'asuka-official.png',8*1024*1024);report['sources'].append(receipt)
        if hashlib.sha256(art).hexdigest()!=ASUKA_IMAGE_SHA:raise ValueError('Reviewed image changed; retain previous artwork')
        prior=c.get('image');c['images']=[a for a in [prior,*c.get('images',[])]if a and a['url']!=ASUKA_IMAGE]
        c['images']=list({a['url']:a for a in c['images']}.values())
        c['image']={'url':ASUKA_IMAGE,'sourceUrl':ASUKA_PAGE,'sourceKind':'official','kind':'splash','width':900,'height':506,'locale':'ko','caption':copies('공식 캐릭터 소개 일러스트','Official character introduction illustration','公式キャラクター紹介イラスト','官方角色介绍插画')}
        add_sources(doc,[ASUKA_API,ASUKA_PAGE])
        report.update(koreanNameAdditions=1,exactIntroductionImageAdditions=1,statsAdded=0,limit='Official showcase has no numeric base combat table; no values fabricated.')
    elif game=='endfield':
        home,receipt=fetch(KO_HOME,cache_dir,'endfield-ko.html');report['sources'].append(receipt)
        if '엔드필드'not in home.decode('utf-8')or '오퍼레이터'not in home.decode('utf-8'):raise ValueError('Korean official game page mismatch')
        raw,receipt=fetch(RELEASES,cache_dir,'endfield-releases.json');report['sources'].append(receipt)
        candidates=[(rel,a)for rel in json.loads(raw)if not rel.get('draft')and not rel.get('prerelease')for a in rel.get('assets',[])if a['name']=='endfield-tables.zip']
        if not candidates:raise ValueError('No declared game-table release asset')
        release,asset=candidates[0];url=asset['browser_download_url']
        if not url.startswith('https://github.com/3aKHP/EndFieldGameData/releases/download/'):raise ValueError('Untrusted release asset')
        raw,receipt=fetch(url,cache_dir,'endfield-tables.zip');report['sources'].append(receipt)
        z=zipfile.ZipFile(io.BytesIO(raw))
        for required in ['tables/CharacterTable.json','i18n/KR.json','i18n/EN.json']:
            if required not in z.namelist():raise ValueError('Missing required named table')
        table=json.loads(z.read('tables/CharacterTable.json'));ko=json.loads(z.read('i18n/KR.json'));en=json.loads(z.read('i18n/EN.json'))
        if len(table)<25:raise ValueError('Partial character export')
        def native(c,l):
            t=ko if l=='ko'else en
            return str(t.get(str(c['name']['id']))or c['name'].get('text')or'').strip()
        basis=copies('Lv.90·돌파 단계 4의 클라이언트 원시 기본값. 무기·장비·잠재능력·재능 및 힘/주·부속성에 의한 HP·ATK 보정 제외. 커뮤니티 추출표 '+release['tag_name']+' ('+str(release.get('published_at',''))[:10]+').',
          'Lv.90, break stage 4, raw client base values. Excludes weapons, gear, potentials, talents, and STR/main/sub-attribute HP/ATK conversions. Community extraction '+release['tag_name']+' ('+str(release.get('published_at',''))[:10]+').',
          'Lv.90・突破段階4のクライアント生の基礎値。武器・装備・潜在能力・素質および筋力/主・副能力によるHP・ATK補正を除外。コミュニティ抽出表 '+release['tag_name']+' ('+str(release.get('published_at',''))[:10]+')。',
          '90级、突破阶段4的客户端原始基础值。不含武器、装备、潜能、天赋及力量/主副属性带来的HP和攻击修正。社区提取表 '+release['tag_name']+' ('+str(release.get('published_at',''))[:10]+')。')
        matched=[];missing=[];identity_map={}
        for c in doc['characters']:
            rows=[(sid,s)for sid,s in table.items()if not sid.startswith('chr_9')and native(s,'ko')==c['name'].get('ko')and native(s,'en')==c['name'].get('en')]
            if not rows:missing.append(c['id']);continue
            data_rows=[]
            for sid,s in rows:
                candidates=[a for a in s['attributes']if a['breakStage']==4 and any(v['attrType']==0 and v['attrValue']==90 for v in a['Attribute']['attrs'])]
                if len(candidates)!=1:raise ValueError('Missing/duplicate explicit level90 row for '+sid)
                data_rows.append((sid,{int(v['attrType']):v['attrValue']for v in candidates[0]['Attribute']['attrs']}))
            if any(d!=data_rows[0][1]for sid,d in data_rows):raise ValueError('Ambiguous native-name match with differing values for '+c['id'])
            sid,attrs=data_rows[0]
            specs=[(1,'hp',copies('기본 HP','Base HP','基礎HP','基础生命值')),(2,'atk',copies('기본 공격력','Base ATK','基礎攻撃力','基础攻击力')),(3,'def',copies('기본 방어력','Base DEF','基礎防御力','基础防御力')),(9,'crit-rate',copies('치명타 확률','Critical rate','会心率','暴击率'))]
            if any(k not in attrs for k,_,_ in specs):raise ValueError('Required explicit attribute missing for '+sid)
            stats=[]
            for key,stat_id,label in specs:
                value=attrs[key]*100 if key==9 else attrs[key]
                if not isinstance(value,(int,float))or value<0:raise ValueError('Invalid source stat')
                value=format(value,'.8g')+('%'if key==9 else'')
                stats.append({'id':stat_id,'label':label,'value':value,'basis':basis})
            c['stats']=stats;matched.append(c['id']);identity_map[c['id']]=[sid for sid,_ in data_rows]
        add_sources(doc,[KO_HOME,TABLE_HOME,url,ENUM_SOURCE])
        report.update(statsAdded=len(matched),matchedIds=matched,sourceIdentityMap=identity_map,missingStatsIds=missing,tableVersion=release['tag_name'],tablePublishedAt=release.get('published_at'),limit='Only explicit Lv.90 breakStage4 raw values; newer official forms absent from this export remain blank. No derived final panel values.')
    elif game=='bluearchive':
        tree_url='https://api.github.com/repos/nico0748/SchaleDB/git/trees/main?recursive=1'
        raw,receipt=fetch(tree_url,cache_dir,'ba-tree.json');report['sources'].append(receipt)
        tree=json.loads(raw)
        if tree.get('truncated')or not isinstance(tree.get('tree'),list)or len(tree['tree'])<1000:raise ValueError('Incomplete Blue Archive asset source tree')
        paths={item['path']for item in tree['tree']}
        missing=[c['id']for c in doc['characters']if not c.get('image')]
        report.update(statsAdded=0,existingStats=sum(bool(c.get('stats')or c.get('regionalStats'))for c in doc['characters']),missingImageIds=missing,missingDeclaredPaths=['images/student/portrait/'+id+'.webp'for id in missing if 'images/student/portrait/'+id+'.webp'not in paths],newDeclaredImagePaths=['images/student/portrait/'+id+'.webp'for id in missing if 'images/student/portrait/'+id+'.webp'in paths],limit='Existing native names/stat basis retained. Missing art checked against a complete source tree; any newly declared paths are review candidates, not automatically verified illustrations.')
    else:raise ValueError('Unsupported enrichment game')
    report['changed']=meaningful(doc)!=meaningful(old)
    if report['changed']:doc['checkedAt']=now()
    return doc,report

def main():
    p=argparse.ArgumentParser();p.add_argument('--input-dir',required=True);p.add_argument('--output-dir',required=True);p.add_argument('--cache-dir');a=p.parse_args()
    inp=pathlib.Path(a.input_dir);out=pathlib.Path(a.output_dir);out.mkdir(parents=True,exist_ok=True);cache=pathlib.Path(a.cache_dir)if a.cache_dir else out/'sources';reports=[]
    for game in ['hi3','endfield','bluearchive']:
        path=inp/(game+'.json')
        if not path.exists():continue
        document=json.loads(path.read_text())
        try:
            result,report=enrich(game,document,cache/game);report['status']='ok'
        except Exception as error:
            result=document;report={'gameId':game,'status':'failed','changed':False,'error':type(error).__name__+': '+str(error),'preservedInput':True,'checkedAt':now()}
        (out/(game+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');reports.append(report)
    (out/'manifest.json').write_text(json.dumps({'results':reports},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(reports,ensure_ascii=False))
if __name__=='__main__':main()
