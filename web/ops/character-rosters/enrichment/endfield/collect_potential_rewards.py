import json,pathlib,hashlib,datetime
ROOT=pathlib.Path('/tmp/gagether-endfield-promotion')
T=pathlib.Path('/tmp/gagether-endfield-validation/current/TableCfg')
L=pathlib.Path('/tmp/gagether-endfield-details/cache/rmx')
locs={lang:json.load(open(L/f'I18nTextTable_{suffix}.json')) for lang,suffix in [('ko','KR'),('en','EN'),('ja','JP'),('zh','CN')]}
read=lambda n:json.load(open(T/f'{n}.json'))
pictures=read('PictureTable');items=read('ItemTable');potential=read('CharacterPotentialTable');picture_items=read('PictureItemTable')
validation=json.load(open('/tmp/gagether-endfield-validation/promotion-rewards.json'))
def loc(v):
 if isinstance(v,str):return {k:v for k in locs}
 return {k:(d.get(str(v.get('id')),v.get('text','')) if isinstance(v,dict) else '') for k,d in locs.items()}
result={'sourceRef':validation['sourceRef'],'sourceKind':'community-client-data','sources':validation['sources'],'terms':{'ko':{'potential':'잠재 능력','picture':'기념사진','cardTheme':'명함 테마'}},'note':'Artwork rewards are explicitly listed under potentialUnlockBundle at levels 1, 3 and 5. No illustration is inferred from level promotion or trust. Asset URLs are added only after an anonymously readable page declares the exact artwork.','characters':[]}
for c in validation['characters']:
 rewards=[]
 for p in potential[c['nativeId']]['potentialUnlockBundle']:
  for itemid in p['unlockCharPictureItemList']:
   picid=picture_items[itemid];pic=pictures[picid];item=items[itemid]
   rewards.append({'id':itemid,'level':p['level'],'type':'illustration','nativePictureId':picid,'nativeImageId':pic['imgId'],'title':loc(pic['name']),'description':loc(item['desc'] if 'desc' in item else item.get('description',{})),'credit':next(iter(loc(pic['author']).values())),'creditLocalized':loc(pic['author']),'sourceUrl':'https://github.com/rmxlinux/EndfieldData/blob/'+validation['sourceRef']+'/TableCfg/PictureTable.json','sourceKind':'community','image':None,'imageAvailability':'unresolved-original','unlockEvidence':{'field':'CharacterPotentialTable.potentialUnlockBundle.unlockCharPictureItemList','potentialLevel':p['level'],'itemId':itemid}})
  if p['unlockCardTopicItem']:
   itemid=p['unlockCardTopicItem'];item=items[itemid]
   rewards.append({'id':itemid,'level':p['level'],'type':'namecard','title':loc(item['name']),'description':loc(item['desc'] if 'desc' in item else item.get('description',{})),'sourceUrl':'https://github.com/rmxlinux/EndfieldData/blob/'+validation['sourceRef']+'/TableCfg/CharacterPotentialTable.json','sourceKind':'community','image':None,'imageAvailability':'unresolved-original','unlockEvidence':{'field':'CharacterPotentialTable.potentialUnlockBundle.unlockCardTopicItem','potentialLevel':p['level'],'itemId':itemid}})
 result['characters'].append({'nativeId':c['nativeId'],'nameKo':c['nameKo'],'potentialRewards':rewards})
out=ROOT/'potential-rewards-localized.json';out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'file':str(out),'characters':len(result['characters']),'illustrations':sum(r['type']=='illustration' for c in result['characters'] for r in c['potentialRewards']),'themes':sum(r['type']=='namecard' for c in result['characters'] for r in c['potentialRewards']),'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}))
