import argparse,copy,io,json,os,tempfile,unittest,urllib.error,urllib.request
from pathlib import Path
from unittest.mock import patch
import collect_rosters as c
from asset_policy import classify_image

def character(i='1',name='Same'):
 return {'id':i,'name':c.names(en=name),'sourceUrl':'https://example.test/source','sourceKind':'community'}
def document(game='genshin',count=1):
 return {'gameId':game,'sourceName':'test','sourceUrls':['https://example.test/source'],'checkedAt':'2026-01-01T00:00:00Z','characters':[character(str(i))for i in range(count)],'coverage':{'sourceCount':count,'includedCount':count}}
class ReliabilityTests(unittest.TestCase):
 def test_truncated_tree_rejected(self):
  with self.assertRaises(c.SourceError):c.decode_source(c.Source('art','https://example.test','tree'),b'{"truncated":true,"tree":[{"path":"valid"}]}')
 def test_200_javascript_shell_not_success(self):
  with self.assertRaises(c.SourceError):c.decode_source(c.Source('roster','https://example.test','py:characters'),b'<html><script src="app.js"></script></html>')
 def test_duplicate_source_ids_rejected(self):
  d=document(count=2);d['characters'][1]['id']='0'
  with self.assertRaises(c.SourceError):c.validate_normalized(d)
 def test_no_image_cross_form_or_name(self):
  prior=document();prior['characters'][0]['image']={'url':'https://example.test/art.png','kind':'portrait','sourceUrl':'https://example.test'}
  new=document();new['characters'][0]['name']=c.names(en='Different form');self.assertEqual(c.preserve_images(new,prior),0)
  new=document();self.assertEqual(c.preserve_images(new,prior),1);self.assertEqual(new['characters'][0]['image']['url'],'https://example.test/art.png')
 def test_unknown_asset_never_inherits_neutral(self):
  im=classify_image({'url':'https://unknown.test/art.jpg','kind':'card','locale':'neutral'});self.assertNotIn('locale',im)
 def test_exact_language_exception_wins(self):
  im=classify_image({'url':'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/characters/char_285_medic2_1.png','kind':'full-body'});self.assertEqual(im['locale'],'en')
 def test_blocked_source_preserves_valid_cache(self):
  with tempfile.TemporaryDirectory()as td:
   p=Path(td)/'sources'/'genshin';p.mkdir(parents=True);(p/'en.body').write_bytes(b'{"lastGood":true}')
   error=urllib.error.HTTPError('https://example.test',403,'Forbidden',{},None)
   with patch('urllib.request.urlopen',side_effect=error):
    with self.assertRaises(c.SourceError):c.Fetcher(Path(td),retries=0).fetch('genshin',c.Source('en','https://example.test'))
   self.assertEqual((p/'en.body').read_bytes(),b'{"lastGood":true}')
 def test_bad_200_never_replaces_valid_cache(self):
  with tempfile.TemporaryDirectory()as td:
   p=Path(td)/'sources'/'genshin';p.mkdir(parents=True);(p/'en.body').write_bytes(b'{"lastGood":true}')
   class Response:
    status=200;headers={}
    def read(self,n):return b'<!doctype html>temporary error'
   with patch('urllib.request.urlopen',return_value=Response()):
    with self.assertRaises(c.SourceError):c.Fetcher(Path(td),retries=0).fetch('genshin',c.Source('en','https://example.test'))
   self.assertEqual((p/'en.body').read_bytes(),b'{"lastGood":true}')
 def test_game_failure_not_ingest_eligible(self):
  with tempfile.TemporaryDirectory()as td:
   p=Path(td);b=p/'bootstrap';b.mkdir();c.atomic_json(b/'genshin.json',document(count=10));args=argparse.Namespace(workdir=p/'work',bootstrap=b,timeout=1,retries=0)
   with patch.object(c.Fetcher,'fetch',side_effect=c.SourceError('HTTP403 blocked')):r=c.collect_one('genshin',args)
   self.assertFalse(r['eligibleForIngest']);self.assertEqual(r['status'],'failed');self.assertEqual(len(c.read_json(Path(r['path']))['characters']),10)
 def test_partial_count_cannot_replace_bootstrap(self):
  with tempfile.TemporaryDirectory()as td:
   p=Path(td);b=p/'bootstrap';b.mkdir();c.atomic_json(b/'genshin.json',document(count=10));args=argparse.Namespace(workdir=p/'work',bootstrap=b,timeout=1,retries=0)
   with patch.object(c.Fetcher,'fetch',return_value=({},{})),patch.object(c,'normalize',return_value=document(count=1)):r=c.collect_one('genshin',args)
   self.assertFalse(r['eligibleForIngest']);self.assertIn('shrank',r['error']);self.assertEqual(len(c.read_json(Path(r['path']))['characters']),10)
 def test_unchanged_output_preserves_checked_at(self):
  with tempfile.TemporaryDirectory()as td:
   p=Path(td);old=document();c.atomic_json(p/'normalized/genshin.json',old);args=argparse.Namespace(workdir=p,bootstrap=p/'missing',timeout=1,retries=0);fresh={**old,'checkedAt':'2099-01-01T00:00:00Z'}
   with patch.object(c.Fetcher,'fetch',return_value=({},{})),patch.object(c,'normalize',return_value=fresh):r=c.collect_one('genshin',args)
   self.assertEqual(r['status'],'unchanged');self.assertFalse(r['changed']);self.assertEqual(c.read_json(Path(r['path']))['checkedAt'],old['checkedAt'])
class OptionalArtworkTests(unittest.TestCase):
 def genshin(self):
  return {l:[{'id':str(i),'name':l+str(i),'rarity':5,'elementText':'Wind','weaponText':'Sword','version':'1.0'}for i in range(90)]for l in c.LOCALES}
 def blocked(self,spec):
  try:raise urllib.error.HTTPError(spec.url,403,'Forbidden',{},None)
  except urllib.error.HTTPError as error:raise c.SourceError(f'{spec.key} {spec.url}: HTTP403 (blocked)')from error
 def test_only_three_declared_art_trees_are_optional(self):
  optional=[(g,s.key,s.kind)for g in c.GAMES for s in c.source_specs(g)if s.optional]
  self.assertEqual(optional,[('genshin','art','tree'),('arknights','art','tree'),('stellasora','art','tree')])
 def test_art_only_403_keeps_complete_identity_roster_and_exact_last_good_art(self):
  with tempfile.TemporaryDirectory()as td:
   root=Path(td);raw=self.genshin();before=copy.deepcopy(raw);old=c.normalize('genshin',{**raw,'art':{'truncated':False,'tree':[]}})
   old['characters'][0]['image']={'url':'https://example.test/verified-original.png','sourceUrl':'https://example.test/checked','kind':'splash'}
   c.atomic_json(root/'bootstrap/genshin.json',old)
   # A cached path must not be mistaken for a freshly checked art inventory.
   cache=root/'work/sources/genshin/art.body';c.atomic_json(cache,{'truncated':False,'tree':[{'path':'genshin/splash/1.png'}]});cached=cache.read_bytes()
   args=argparse.Namespace(workdir=root/'work',bootstrap=root/'bootstrap',timeout=1,retries=0)
   def fetch(game,spec):
    if spec.key=='art':self.blocked(spec)
    return c.decode_source(spec,json.dumps(raw[spec.key]).encode()),{'key':spec.key,'url':spec.url,'status':'changed','httpStatus':200}
   with patch.object(c.Fetcher,'fetch',side_effect=fetch):receipt=c.collect_one('genshin',args)
   self.assertEqual(raw,before);self.assertTrue(receipt['eligibleForIngest']);self.assertEqual(receipt['status'],'limited');self.assertEqual(receipt['includedCount'],90);self.assertEqual(receipt['preservedImages'],1)
   saved=c.read_json(Path(receipt['path']));self.assertEqual([r['id']for r in saved['characters']],[r['id']for r in old['characters']]);self.assertEqual([r.get('image')for r in saved['characters']if r.get('image')],[old['characters'][0]['image']]);self.assertEqual(cache.read_bytes(),cached)
   failed=receipt['sources'][-1];self.assertEqual((failed['key'],failed['httpStatus'],failed['status'],failed['optional']),('art',403,'failed',True));self.assertIn('HTTP403',failed['error']);self.assertEqual(failed['url'],c.source_specs('genshin')[-1].url)
   self.assertEqual(receipt['warnings'],[{**failed,'type':'artwork-source-failed','fallback':'empty-tree'}])
 def test_identity_403_remains_fatal_and_preserves_failure_receipt(self):
  with tempfile.TemporaryDirectory()as td:
   root=Path(td);raw=self.genshin();args=argparse.Namespace(workdir=root/'work',bootstrap=root/'bootstrap',timeout=1,retries=0);seen=[]
   def fetch(game,spec):
    seen.append(spec.key)
    if spec.key=='ko':self.blocked(spec)
    return c.decode_source(spec,json.dumps(raw[spec.key]).encode()),{'key':spec.key,'status':'changed'}
   with patch.object(c.Fetcher,'fetch',side_effect=fetch):receipt=c.collect_one('genshin',args)
   self.assertFalse(receipt['eligibleForIngest']);self.assertEqual(receipt['status'],'failed');self.assertIsNone(receipt['path']);self.assertEqual(receipt['warnings'],[]);self.assertNotIn('art',seen)
   self.assertEqual((receipt['sources'][-1]['key'],receipt['sources'][-1]['httpStatus'],receipt['sources'][-1]['optional']),('ko',403,False))
 def test_other_optional_art_games_keep_native_membership_without_guessed_images(self):
  arknights={l:{f'char_{i}':{'name':l+str(i),'rarity':'TIER_6','profession':'CASTER'if i<300 else'TOKEN','position':'RANGED'}for i in range(600)}for l in c.LOCALES}
  arknights.update({'patch_'+l:{'infos':{},'patchChars':{},'fixture':True}for l in c.LOCALES})
  stella={'characters':{str(i):{'Id':i,'Name':f'Role{i}','DefaultSkinId':1000+i,'Visible':True,'Available':True}for i in range(30)}}
  stella.update({l:{f'Role{i}':l+str(i)for i in range(30)}for l in c.LOCALES})
  for game,raw,count in [('arknights',arknights,300),('stellasora',stella,30)]:
   with self.subTest(game=game),tempfile.TemporaryDirectory()as td:
    root=Path(td);args=argparse.Namespace(workdir=root/'work',bootstrap=root/'bootstrap',timeout=1,retries=0)
    def fetch(game,spec):
     if spec.key=='art':self.blocked(spec)
     return c.decode_source(spec,json.dumps(raw[spec.key]).encode()),{'key':spec.key,'status':'changed'}
    with patch.object(c.Fetcher,'fetch',side_effect=fetch):receipt=c.collect_one(game,args)
    self.assertTrue(receipt['eligibleForIngest']);self.assertEqual(receipt['status'],'limited');self.assertEqual(receipt['includedCount'],count);self.assertEqual(receipt['images'],0)
    saved=c.read_json(Path(receipt['path']));self.assertEqual(len({r['id']for r in saved['characters']}),count);self.assertTrue(all(not r.get('image')for r in saved['characters']))
    if game=='arknights':self.assertTrue(all(r['regions']==['global','kr','jp','cn']for r in saved['characters']))
 def test_empty_art_fallback_does_not_relax_identity_set_validation(self):
  with tempfile.TemporaryDirectory()as td:
   root=Path(td);raw=self.genshin();raw['ko'][0]['id']='different-id';args=argparse.Namespace(workdir=root/'work',bootstrap=root/'bootstrap',timeout=1,retries=0)
   def fetch(game,spec):
    if spec.key=='art':self.blocked(spec)
    return c.decode_source(spec,json.dumps(raw[spec.key]).encode()),{'key':spec.key,'status':'changed'}
   with patch.object(c.Fetcher,'fetch',side_effect=fetch):receipt=c.collect_one('genshin',args)
   self.assertFalse(receipt['eligibleForIngest']);self.assertEqual(receipt['status'],'failed');self.assertIn('ID sets differ',receipt['error']);self.assertEqual(len(receipt['warnings']),1)
class GitHubReadTokenTests(unittest.TestCase):
 def test_token_is_only_attached_to_exact_https_api_host(self):
  with patch.dict(os.environ,{'GAGETHER_GITHUB_READ_TOKEN':'test-job-read-token'}):
   self.assertEqual(c.github_read_headers('https://api.github.com/repos/owner/repo/git/trees/main'),{'Authorization':'Bearer test-job-read-token'})
   for url in ['http://api.github.com/repos/o/r','https://raw.githubusercontent.com/o/r/main/data.json','https://github.com/o/r','https://api.github.com.evil.test/repos/o/r','https://api.github.com@evil.test/repos/o/r','https://evil.test@api.github.com/repos/o/r','https://api.github.com:443/repos/o/r','https://cdn.example.test/art.png']:
    with self.subTest(url=url):self.assertEqual(c.github_read_headers(url),{})
  with patch.dict(os.environ,{'GAGETHER_GITHUB_READ_TOKEN':''}):self.assertEqual(c.github_read_headers('https://api.github.com/repos/o/r'),{})
 def test_api_auth_uses_nonredirecting_opener_and_is_never_saved(self):
  class Response:
   status=200;headers={}
   def read(self,n):return b'{"truncated":false,"tree":[{"path":"declared.png"}]}'
  with tempfile.TemporaryDirectory()as td,patch.dict(os.environ,{'GAGETHER_GITHUB_READ_TOKEN':'test-job-read-token'}):
   root=Path(td);spec=c.Source('art','https://api.github.com/repos/o/r/git/trees/main','tree')
   with patch.object(c.github_opener,'open',return_value=Response())as authenticated,patch('urllib.request.urlopen')as ordinary:
    value,receipt=c.Fetcher(root,retries=0).fetch('genshin',spec)
   self.assertEqual(value['tree'],[{'path':'declared.png'}]);self.assertEqual(authenticated.call_args.args[0].get_header('Authorization'),'Bearer test-job-read-token');ordinary.assert_not_called()
   self.assertNotIn('test-job-read-token',json.dumps(receipt));self.assertTrue(all(b'test-job-read-token'not in p.read_bytes()for p in root.rglob('*')if p.is_file()))
 def test_authenticated_redirect_is_refused_without_a_second_request(self):
  request=urllib.request.Request('https://api.github.com/repos/o/r',headers={'Authorization':'Bearer test-job-read-token'})
  self.assertIsNone(c.NoCredentialRedirect().redirect_request(request,None,302,'Found',{},'https://raw.githubusercontent.com/o/r/data.json'))
  with tempfile.TemporaryDirectory()as td,patch.dict(os.environ,{'GAGETHER_GITHUB_READ_TOKEN':'test-job-read-token'}):
   error=urllib.error.HTTPError(request.full_url,302,'Found',{'Location':'https://evil.test/data'},None)
   with patch.object(c.github_opener,'open',side_effect=error)as authenticated,patch('urllib.request.urlopen')as ordinary:
    with self.assertRaisesRegex(c.SourceError,'HTTP302'):c.Fetcher(Path(td),retries=0).fetch('genshin',c.Source('art',request.full_url,'tree'))
   self.assertEqual(authenticated.call_count,1);ordinary.assert_not_called()
class NativeRankTests(unittest.TestCase):
 def source(self,rank='SSR',unit=229,**extra):
  return {'name':f'Unit {unit}','slug':f'unit-{unit}','rarity':rank,'data':{'unitId':unit},'cardImage':f'https://example.test/nikke-{unit}.webp','thumbnailUrl':f'https://example.test/nte-{unit}.webp',**extra}
 def test_verified_native_ranks_supply_matching_label_and_numeric_without_changing_source(self):
  for game,ranks in [('nikke',{'R':1,'SR':2,'SSR':3}),('nte',{'A':4,'S':5})]:
   for rank,numeric in ranks.items():
    with self.subTest(game=game,rank=rank):
     raw={'characters':[self.source(rank)]};before=copy.deepcopy(raw);row=c.normalize(game,raw)['characters'][0]
     self.assertEqual(raw,before);self.assertEqual((row['rarityLabel'],row['rarity']),(rank,numeric));self.assertEqual(row['id'],'229');self.assertEqual(row['name'],c.names(en='Unit 229'))
     self.assertEqual([t['value']for t in row['traits']if t['id']=='rank'],[c.names(en=rank)]);self.assertEqual(row['sourceUrl'],'https://www.prydwen.gg/'+c.PY_URLS[game]+'unit-229/');self.assertEqual(row['sourceKind'],'community');self.assertEqual(row['image']['kind'],'card'if game=='nikke'else'portrait')
 def test_unknown_cross_game_lowercase_and_numeric_ranks_remain_unconverted(self):
  for game,unknown in [('nikke',['A','S','UR','SSR+','ssr',' SSR','',None,3,5]),('nte',['R','SR','SSR','S+','s',' S','',None,4,5])]:
   for rank in unknown:
    with self.subTest(game=game,rank=rank):
     raw={'characters':[self.source(rank)]};before=copy.deepcopy(raw);row=c.normalize(game,raw)['characters'][0]
     self.assertEqual(raw,before);self.assertNotIn('rarity',row);self.assertNotIn('rarityLabel',row);self.assertEqual(row['traits'],[c.trait('rank',rank)]);self.assertEqual(row['id'],'229');self.assertEqual(row['name']['en'],'Unit 229')
 def test_new_ssr_ids_keep_exact_identity_art_and_existing_release_exclusions(self):
  raw={'characters':[self.source(unit=i)for i in [229,230,231]]+[self.source(unit=232,is_upcoming=True),self.source(unit=233,upcoming=True),self.source(unit=234,hasTreasure=True)]};before=copy.deepcopy(raw)
  result=c.normalize('nikke',raw);self.assertEqual(raw,before);self.assertEqual(result['coverage']['sourceCount'],6);self.assertEqual(result['coverage']['includedCount'],3)
  self.assertEqual([r['id']for r in result['characters']],['229','230','231'])
  for row in result['characters']:
   self.assertEqual((row['rarity'],row['rarityLabel']),(3,'SSR'));self.assertEqual(row['image']['url'],f'https://example.test/nikke-{row["id"]}.webp');self.assertEqual(row['traits'],[c.trait('rank','SSR')])
class ReviewedAnnouncementTests(unittest.TestCase):
 def setUp(self):
  # Fixture-only allowlist: tests must run from a code-only public checkout.
  self.directory=tempfile.TemporaryDirectory();self.addCleanup(self.directory.cleanup)
  registry=Path(self.directory.name)/'checked-previews.json'
  rule={'gameId':'zzz','nativeId':'1631','nativeNameKey':'Fixture_Announced_Avatar','name':'Severian','providerId':'fixture-provider-row','providerUnitId':'61','providerSlug':'severian','rarity':4,'rarityLabel':'S','specialty':'Attack','elements':['Wind'],'sourceUrl':'https://zenless.hoyoverse.com/en-us/news/166054','confirmationUrl':'https://zenless.hoyoverse.com/en-us/news/166963'}
  c.atomic_json(registry,{'version':1,'characters':[rule]})
  override=patch.object(c,'ANNOUNCEMENTS',registry);override.start();self.addCleanup(override.stop)
 def zzz(self,upcoming=True):
  rule=c.reviewed_announcements()[0]
  native={'Name':rule['nativeNameKey'],'Rarity':4,'ProfessionType':'Attack','ElementTypes':['Wind'],'stats':{'hp':999999},'Skills':[{'Name':'unpublished beta skill'}]}
  provider={'id':rule['providerId'],'unitId':rule['providerUnitId'],'slug':'severian','name':'Severian','rarity':'S','element':'Wind','upcoming':upcoming,'cardImage':'https://cdn.prydwen.gg/images/zenless-zone-zero/characters/severian_card.webp','stats':{'hp':999999}}
  translated={'ko':'세베리안','en':'Severian','ja':'セヴェリアン','zh-cn':'赛维里安'}
  return {'avatars':{'1':{'Name':'Existing','Rarity':3,'ProfessionType':'Stun','ElementTypes':['Electric']},'1631':native},'locs':{l:{rule['nativeNameKey']:translated[l],'Existing':'Existing'}for l in translated},'release':[{'name':'Existing','slug':'existing','upcoming':False},provider]}
 def test_exact_official_announced_identity_preserves_native_names_and_no_beta_facts(self):
  raw=self.zzz();before=copy.deepcopy(raw);result=c.normalize('zzz',raw);self.assertEqual(raw,before)
  row=next(r for r in result['characters']if r['id']=='1631')
  self.assertEqual(row['name'],{'ko':'세베리안','en':'Severian','ja':'セヴェリアン','zh':'赛维里安'})
  self.assertEqual(row['availability'],{'status':'announced','sourceUrl':'https://zenless.hoyoverse.com/en-us/news/166054'})
  self.assertEqual((row['rarity'],row['rarityLabel']),(4,'S'));self.assertEqual([r['value']['en']for r in row['traits']],['Attack','Wind'])
  self.assertEqual(row['image']['kind'],'card');self.assertEqual(row['image']['sourceKind'],'community');self.assertEqual(row['sourceKind'],'community')
  self.assertTrue(all(s['url'].endswith('/locs.json')and s['kind']=='community'for s in row['nameSources'].values()))
  self.assertEqual({s['url']for s in row['detailSources']},{'https://zenless.hoyoverse.com/en-us/news/166054','https://zenless.hoyoverse.com/en-us/news/166963'})
  self.assertTrue(all(s['kind']=='official'for s in row['detailSources']))
  self.assertFalse(set(row)&{'stats','skillTables','statProgression','statGrowth','sections','debut','releaseDate','startAt'})
 def test_similarly_named_or_different_native_and_provider_ids_never_match(self):
  for change in ['native-id','name-key','name','provider-id','provider-unit','provider-slug','rarity','element','specialty','missing-locale']:
   with self.subTest(change=change):
    raw=self.zzz();native=raw['avatars']['1631'];provider=raw['release'][1]
    if change=='native-id':raw['avatars']['16310']=raw['avatars'].pop('1631')
    elif change=='name-key':
     native['Name']+='Extra'
     for l in raw['locs']:raw['locs'][l][native['Name']]=raw['locs'][l][native['Name'][:-5]]
    elif change=='name':
     raw['locs']['en'][native['Name']]='Severian Prime';provider['name']='Severian Prime'
    elif change=='provider-id':provider['id']+='-another-form'
    elif change=='provider-unit':provider['unitId']='610'
    elif change=='provider-slug':provider['slug']='severian-another-form'
    elif change=='rarity':provider['rarity']='A'
    elif change=='element':native['ElementTypes']=['Fire'];provider['element']='Fire'
    elif change=='specialty':native['ProfessionType']='Stun'
    elif change=='missing-locale':raw['locs']['ko'][native['Name']]=''
    self.assertEqual([r['id']for r in c.normalize('zzz',raw)['characters']],['1'])
 def test_released_provider_row_explicitly_retires_announced_status(self):
  doc=c.normalize('zzz',self.zzz(False));row=next(r for r in doc['characters']if r['id']=='1631')
  self.assertEqual(row['availability'],{'status':'released','sourceUrl':'https://zenless.hoyoverse.com/en-us/news/166054'})
  self.assertNotIn('availability',next(r for r in doc['characters']if r['id']=='1'))
 def test_unreviewed_hsr_aha_remains_excluded(self):
  native={'1':{'name':'Released','rarity':5,'path':'Elation','element':'Ice'},'2':{'name':'Aha','rarity':5,'path':'Elation','element':'Quantum'}}
  data={l:copy.deepcopy(native)for l in c.LOCALES};data.update(info={'version':'4.6'},release=[{'name':'Aha','upcoming':True,'isReleased':False}])
  self.assertEqual([r['id']for r in c.normalize('hsr',data)['characters']],['1'])
 def test_missing_preview_registry_keeps_released_agents_without_authorizing_future(self):
  raw=self.zzz();before=copy.deepcopy(raw)
  with patch.object(c,'ANNOUNCEMENTS',Path(self.directory.name)/'absent.json'),patch.object(c,'read_json',side_effect=AssertionError('Missing allowlist must not load substitute data')):
   result=c.normalize('zzz',raw)
  self.assertEqual(raw,before);self.assertEqual([r['id']for r in result['characters']],['1'])
  self.assertNotIn('availability',result['characters'][0]);self.assertEqual(result['coverage']['sourceCount'],2)
 def test_invalid_present_review_registry_fails_instead_of_silently_authorizing_future(self):
  raw=self.zzz()
  with patch.object(c,'read_json',return_value=None):
   with self.assertRaisesRegex(c.SourceError,'announcement registry'):c.normalize('zzz',raw)
if __name__=='__main__':unittest.main()
