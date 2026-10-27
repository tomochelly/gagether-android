import importlib.util,json,pathlib,tempfile,unittest
spec=importlib.util.spec_from_file_location('roster_delivery_runner',pathlib.Path(__file__).with_name('run.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class DeliveryReceipts(unittest.TestCase):
 def source(self,folder,game='zzz'):
  p=pathlib.Path(folder)/'roster.json';p.write_text(json.dumps({'gameId':game,'characters':[{'id':'1631'}]}));return p
 def test_failed_ingest_records_failed_health_without_advancing_last_success(self):
  calls=[];health={'lastSuccessAt':'2026-10-20T00:00:00Z','hash':'last-good','count':61};before=dict(health)
  def send(body):
   calls.append(body)
   if body['action']=='ingest':raise RuntimeError('503 source ingest failed')
   health.update({k:v for k,v in body.items()if k not in ('action','gameId')});return {'saved':True}
  with tempfile.TemporaryDirectory()as folder:
   p=self.source(folder);original=p.read_bytes();receipt=m.deliver_game('zzz',p,send=send)
   self.assertEqual(p.read_bytes(),original)
  self.assertEqual(receipt['status'],'delivery-failed');self.assertEqual(receipt['error'],'503 source ingest failed');self.assertTrue(receipt['healthReported'])
  self.assertEqual(health['status'],'failed');self.assertEqual({k:health[k]for k in before},before)
  self.assertEqual(set(calls[1]),{'action','gameId','status','error'})
 def test_missing_readback_cannot_become_success_after_health_post(self):
  calls=[]
  def send(body):calls.append(body);return {'readback':False}if body['action']=='ingest'else{'saved':True}
  with tempfile.TemporaryDirectory()as folder:receipt=m.deliver_game('zzz',self.source(folder),send=send)
  self.assertEqual(receipt['status'],'delivery-failed');self.assertEqual(receipt['error'],'Missing server readback');self.assertEqual(calls[-1]['status'],'failed')
 def test_health_post_error_is_separate_and_keeps_original_delivery_error(self):
  def send(body):raise RuntimeError('ingest broke'if body['action']=='ingest'else'health also broke')
  with tempfile.TemporaryDirectory()as folder:receipt=m.deliver_game('zzz',self.source(folder),send=send)
  self.assertEqual(receipt,{'gameId':'zzz','status':'delivery-failed','error':'ingest broke','healthError':'health also broke'})
 def test_wrong_source_identity_is_delivery_failure_and_never_ingests(self):
  calls=[]
  def send(body):calls.append(body);return {'saved':True}
  with tempfile.TemporaryDirectory()as folder:receipt=m.deliver_game('zzz',self.source(folder,'hsr'),send=send)
  self.assertEqual(receipt['status'],'delivery-failed');self.assertEqual(receipt['error'],'Game identity mismatch');self.assertEqual([b['action']for b in calls],['health'])
 def test_failed_source_preserves_its_error_when_health_transport_fails(self):
  def send(body):raise RuntimeError('health transport failed')
  self.assertEqual(m.deliver_game('zzz',source_error='upstream503',send=send),{'gameId':'zzz','status':'delivery-failed','error':'upstream503','healthError':'health transport failed'})
 def test_confirmed_readback_remains_the_only_success(self):
  calls=[]
  def send(body):calls.append(body);return {'readback':True,'count':62,'changed':True,'hash':'checked'}
  with tempfile.TemporaryDirectory()as folder:receipt=m.deliver_game('zzz',self.source(folder),send=send)
  self.assertEqual(receipt,{'gameId':'zzz','status':'ok','count':62,'changed':True,'hash':'checked'});self.assertEqual(len(calls),1)
 def test_optional_art_warning_is_limited_after_confirmed_readback_and_keeps_success_clock(self):
  calls=[];health={'lastSuccessAt':'old','count':61,'hash':'old-hash'};warning={'key':'art','url':'https://api.github.com/repos/o/r/git/trees/main','error':'art source HTTP403 (blocked)','httpStatus':403,'type':'artwork-source-failed','fallback':'empty-tree'}
  def send(body):
   calls.append(body)
   if body['action']=='ingest':health.update(status='ok',lastSuccessAt='confirmed-now',count=62,hash='checked');return {'readback':True,'count':62,'changed':True,'hash':'checked'}
   health.update({k:v for k,v in body.items()if k not in ('action','gameId')});return {'saved':True}
  with tempfile.TemporaryDirectory()as folder:receipt=m.deliver_game('zzz',self.source(folder),send=send,warnings=[warning])
  self.assertEqual(receipt['status'],'limited');self.assertEqual(receipt['warnings'],[warning]);self.assertTrue(receipt['healthReported']);self.assertEqual(receipt['count'],62)
  self.assertEqual(calls[-1],{'action':'health','gameId':'zzz','status':'limited','error':warning['error']});self.assertEqual(health,{'status':'limited','lastSuccessAt':'confirmed-now','count':62,'hash':'checked','error':warning['error']})
 def test_warning_health_failure_cannot_report_green_or_hide_confirmed_delivery(self):
  calls=[]
  def send(body):
   calls.append(body)
   if body['action']=='ingest':return {'readback':True,'count':62,'changed':False,'hash':'checked'}
   raise RuntimeError('warning health transport failed')
  with tempfile.TemporaryDirectory()as folder:receipt=m.deliver_game('zzz',self.source(folder),send=send,warnings=[{'error':'art HTTP403'}])
  self.assertEqual(receipt['status'],'delivery-failed');self.assertEqual(receipt['healthError'],'warning health transport failed');self.assertEqual(receipt['hash'],'checked');self.assertEqual(receipt['count'],62);self.assertIn('Roster saved',receipt['error']);self.assertEqual([b['action']for b in calls],['ingest','health'])
 def test_art_warning_never_overrides_failed_readback(self):
  calls=[]
  def send(body):calls.append(body);return {'readback':False}if body['action']=='ingest'else{'saved':True}
  with tempfile.TemporaryDirectory()as folder:receipt=m.deliver_game('zzz',self.source(folder),send=send,warnings=[{'error':'art HTTP403'}])
  self.assertEqual(receipt['status'],'delivery-failed');self.assertEqual(receipt['error'],'Missing server readback');self.assertEqual(calls[-1]['status'],'failed')
if __name__=='__main__':unittest.main()
