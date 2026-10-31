"""Frozen exact-image presentation proposals from the 2026-10-27 pixel review."""
import hashlib,json,pathlib,shutil
ROOT=pathlib.Path(__file__).resolve().parent
HEADS={
'akekuri':(49,16,78,37),'alesh':(39,15,53,33),'antal':(47,8,65,28),'arclight':(44,6,63,33),'ardelia':(37,22,60,44),'avywenna':(46,25,64,45),
'camille':(44,21,58,36),'catcher':(22,13,43,33),'chen':(47,23,64,45),'dapan':(42,28,57,43),'ember':(29,27,72,54),'endministrator1':(39,24,63,46),
'endministrator2':(38,22,55,40),'estella':(41,18,62,40),'fluorite':(35,8,64,31),'gilberta':(36,4,84,45),'jsspsi':(34,22,55,43),'laevatain':(31,21,49,39),
'lastrite':(35,29,64,48),'lifeng':(42,27,57,45),'liino':(35,9,79,47),'lizhiyan':(42,17,60,36),'mifu':(43,27,66,50),'minghe':(39,12,61,39),
'perlica':(44,17,66,45),'pogranichnik':(41,20,56,40),'purrche':(32,27,60,49),'rossi':(46,28,65,48),'snowshine':(40,15,57,31),'tangtang':(39,14,61,45),
'typhoea':(32,24,49,43),'wulfgard':(43,13,55,29),'xaihi':(33,15,60,41),'yvonne':(38,29,63,47),'zhuangfy':(37,22,54,41)}
C=lambda ko,en,ja,zh:dict(ko=ko,en=en,ja=ja,zh=zh)
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def main():
 audit=json.loads((ROOT/'originals/audit.json').read_text());rows=audit['originals'];assert set(HEADS)=={r['characterId']for r in rows};assert len(rows)==35
 patches=[];focus=[];bounds={};manifest=[]
 for r in rows:
  ident=r['characterId'];locale='en'if ident=='perlica'else'neutral';head=dict(zip(['left','top','right','bottom'],HEADS[ident]));head['width']=r['width'];head['height']=r['height']
  assert 0<=head['left']<head['right']<=100 and 0<=head['top']<head['bottom']<=100
  f={k:r[k]for k in ['gameId','url','sha256','width','height','kind']};f.update(id=ident,head={k:head[k]for k in ['left','top','right','bottom']},visualReview='all35 original contact sheets; exact face/crown/ears/horns/hood; trailing hair/effects may crop in gallery');focus.append(f)
  bounds[r['url']]={**r['alphaBounds'],'width':r['width'],'height':r['height']}
  caption=C('공식 오퍼레이터 소개 일러스트 원본','Original official operator showcase illustration','公式オペレーター紹介イラスト原本','官方干员介绍插画原图')
  if ident=='perlica':caption=C('영어 이름 표기가 포함된 공식 원본','Official original containing the English name label','英語の名前表記を含む公式原図','含英文姓名标注的官方原图')
  image={k:r[k]for k in ['url','sourceUrl','kind','sourceKind','width','height']};image.update(locale=locale,caption=caption);patches.append({'id':ident,'image':image})
  m={k:r[k]for k in ['gameId','characterId','url','sourceUrl','sourceKind','sha256','width','height','bytes','mime','kind','delivery','status','unchanged']};m.update(locale=locale,originalPath=r['path'],publicUrl='https://gagether.wiki/roster-bootstrap/'+r['sha256']+'.png',path='public/roster-bootstrap/'+r['sha256']+'.png',ext='png',quality='official-declared-complete-showcase-original',visualStatus='reviewed-original-contact-sheet',matchEvidence='Exact current official character key in illust:W[e.key] and same existing stable roster URL; no identity inferred from appearance');manifest.append(m)
 p=audit['perlicaListAlternative'];ident='perlica';img={k:p[k]for k in ['url','sourceUrl','width','height']};img.update(kind='portrait',sourceKind='official',locale='neutral',caption=C('공식 도감의 초상 원본 · 전신과 머리카락 일부가 원본에서 잘려 있음','Official codex portrait original; body and some hair are cropped in the source','公式図鑑のポートレート原本。身体と髪の一部は原図で切れています','官方图鉴头像原图；身体及部分头发在原图中已裁切'))
 next(r for r in patches if r['id']=='perlica')['appendImages']=[img]
 b={**p['alphaBounds'],'width':p['width'],'height':p['height']};bounds[p['url']]=b
 focus.append({'gameId':'endfield','id':'perlica','url':p['url'],'sha256':p['sha256'],'width':p['width'],'height':p['height'],'kind':'portrait','head':{'left':0,'top':0,'right':100,'bottom':83},'visualReview':'The entire source-cropped hair/ears visible in this genuine portrait are protected; never called full body.'})
 m={k:p[k]for k in ['url','sourceUrl','sha256','width','height','bytes']};m.update(gameId='endfield',characterId=ident,sourceKind='official',locale='neutral',mime='image/png',kind='portrait',delivery='source-original',status='ok',unchanged=True,originalPath=p['path'],publicUrl='https://gagether.wiki/roster-bootstrap/'+p['sha256']+'.png',path='public/roster-bootstrap/'+p['sha256']+'.png',ext='png',quality='official-declared-source-cropped-portrait',visualStatus='reviewed-full-original',matchEvidence='Exact same official Perlica key in portrait:F[e.key]; never called complete standing art');manifest.append(m)
 for row in rows:row['visualReview']='complete original viewed in six contact sheets';row['reviewedHead']=HEADS[row['characterId']]
 audit['visualReview']='all35 original illustrations and entire Perlica portrait inspected';write(ROOT/'originals/audit.json',audit)
 result={'version':1,'gameId':'endfield','count':35,'sourceOriginalBytes':sum(r['bytes']for r in manifest),'primaryUrlsPreserved':True,'gachaOriginalClaim':False,'animatedAssetsActivated':False,'patches':patches,'manifest':manifest,'focus':{'version':1,'entries':focus},'subjectBounds':bounds,'limitations':['These are explicitly declared official showcase illustrations; no unproven claim that they are pristine ingame gacha export files.','Perlica full illustration retains English name labeling; the neutral fallback is an honestly labeled source-cropped303x386portrait.','Only gallery presentation may crop peripheral effects or trailing hair. Full detail and original bytes are unchanged.','No source HTML/JavaScript is executed by the collector.']}
 write(ROOT/'result.json',result);write(pathlib.Path('/tmp/gagether-endfield-art-result.json'),result)
 sources=ROOT/'sources';sources.mkdir(exist_ok=True);shutil.copyfile('/tmp/gagether-endfield-official-ko.html',sources/'official-ko.html');shutil.copyfile('/tmp/endfield-official-script-0.js',sources/'operator-data.js.txt')
 print(json.dumps({'primaryOriginals':len(rows),'manifestBindings':len(manifest),'headPresets':len(focus),'sourceOriginalBytes':result['sourceOriginalBytes'],'output':str(ROOT/'result.json')}))
if __name__=='__main__':main()
