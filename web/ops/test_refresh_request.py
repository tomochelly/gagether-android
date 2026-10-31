import contextlib, http.client, io, json, os, pathlib, runpy, unittest, urllib.error
from unittest.mock import patch
START='2026-10-25T03:00:00Z'
FINISH='2026-10-25T03:10:00Z'
def pending(cursor=6):
 return {'ok':True,'continuation':True,'runId':'durable-run','stage':'broadcasts','cursor':cursor,'startedAt':START}
def persisted(value):
 return {'lastStartedAt':START,'lastFinishedAt':value.get('finishedAt'),'result':value}
def complete(outcome='partial'):
 return {'ok':outcome in ['partial','complete'],'outcome':outcome,'finishedAt':FINISH,'readback':{'automatic':18,'effective':18}}

class RefreshRequestTest(unittest.TestCase):
 def run_script(self, responses, status=None, clock=None):
  calls=[]; sleeps=[]; events=iter(responses); output=io.StringIO()
  class Opener:
   def open(_,request,timeout):
    calls.append(request.get_method())
    if request.get_method()=='POST':
     value=next(events)
     if isinstance(value,Exception): raise value
    else:value=status if status is not None else persisted(complete())
    return contextlib.closing(io.BytesIO(json.dumps(value).encode()))
  def oidc(*a,**kw):return contextlib.closing(io.BytesIO(b'{"value":"test-identity"}'))
  environ={'ACTIONS_ID_TOKEN_REQUEST_URL':'https://example.invalid/oidc?request=1','ACTIONS_ID_TOKEN_REQUEST_TOKEN':'test-only','GITHUB_STEP_SUMMARY':os.devnull}
  with patch.dict(os.environ,environ),patch('urllib.request.build_opener',return_value=Opener()),patch('urllib.request.urlopen',side_effect=oidc),patch('time.monotonic',side_effect=clock or (lambda:0)),patch('time.sleep',side_effect=sleeps.append),contextlib.redirect_stdout(output):
   try:runpy.run_path(str(pathlib.Path(__file__).with_name('refresh-request.py')),run_name='__main__')
   except BaseException as exc:return exc,calls,sleeps,output.getvalue()
  return None,calls,sleeps,output.getvalue()
 def test_disconnected_post_retries_then_reports_existing_checkpoint(self):
  error,calls,sleeps,out=self.run_script([http.client.RemoteDisconnected('closed'),{'ok':True,'skipped':True}],persisted(pending()))
  self.assertIsNone(error);self.assertEqual(calls,['POST','POST','GET']);self.assertEqual(sleeps,[2]);self.assertIn('"outcome": "continuing"',out);self.assertNotIn('"outcome": "complete"',out)
 def test_transport_failures_stop_after_four_attempts(self):
  error,calls,sleeps,_=self.run_script([ConnectionResetError('reset')]*4)
  self.assertIsInstance(error,ConnectionResetError);self.assertEqual(calls,['POST']*4);self.assertEqual(sleeps,[2,4,8])
 def test_partial_outcome_is_not_promoted_to_full_success(self):
  error,calls,_,out=self.run_script([complete()])
  self.assertIsNone(error);self.assertEqual(calls,['POST','GET']);self.assertIn('::warning::Partial source failure',out)
 def test_nontransient_authorization_error_is_not_retried(self):
  failure=urllib.error.HTTPError('https://example.invalid',403,'Forbidden',{},None)
  error,calls,sleeps,_=self.run_script([failure])
  self.assertIs(error,failure);self.assertEqual(calls,['POST']);self.assertEqual(sleeps,[])
 def test_durable_stages_and_busy_response_continue_until_actual_readback(self):
  error,calls,sleeps,out=self.run_script([pending(),{**pending(),'busy':True},pending(12),complete()])
  self.assertIsNone(error);self.assertEqual(calls,['POST']*4+['GET']);self.assertEqual(sleeps,[5]);self.assertIn('Partial source failure',out)
 def test_step_limit_yields_only_after_persistent_checkpoint_readback(self):
  error,calls,sleeps,out=self.run_script([pending()]*240,persisted(pending()))
  self.assertIsNone(error);self.assertEqual(calls,['POST']*240+['GET']);self.assertIn('"outcome": "continuing"',out);self.assertIn('No completed outcome is claimed',out)
 def test_time_budget_yields_verified_checkpoint_before_workflow_timeout(self):
  error,calls,_,out=self.run_script([pending()],persisted(pending()),iter([0,0,0,721]).__next__)
  self.assertIsNone(error);self.assertEqual(calls,['POST','GET']);self.assertIn('"outcome": "continuing"',out)
 def test_missing_or_failed_checkpoint_is_a_real_failure(self):
  for value in [{}, {**pending(),'ok':False}, {**pending(),'startedAt':'old'}, {**pending(),'runId':'another-run'}]:
   with self.subTest(value=value):
    error,_,_,out=self.run_script([pending()]*240,persisted(value))
    self.assertIsInstance(error,RuntimeError);self.assertNotIn('"outcome": "continuing"',out)
 def test_failed_stage_is_not_hidden_by_continuation(self):
  error,calls,_,out=self.run_script([{**pending(),'ok':False}])
  self.assertIsInstance(error,RuntimeError);self.assertEqual(calls,['POST']);self.assertNotIn('"outcome":',out)
 def test_final_post_requires_actual_persisted_readback(self):
  for value in [{}, {**complete(),'readback':None}, {**complete(),'finishedAt':'old'}, complete('validation-failed'), {**complete(),'readback':{'automatic':True,'effective':18}}]:
   with self.subTest(value=value):
    status=persisted(value);status['lastFinishedAt']=FINISH
    error,_,_,out=self.run_script([complete()],status)
    self.assertIsInstance(error,RuntimeError);self.assertNotIn('"outcome": "partial"',out)
 def test_skipped_running_without_checkpoint_does_not_claim_success(self):
  error,_,_,out=self.run_script([{'ok':True,'skipped':True}],{'lastStartedAt':START,'result':None})
  self.assertIsInstance(error,RuntimeError);self.assertNotIn('"outcome":',out)
 def test_complete_outcome_has_persistent_counts(self):
  error,_,_,out=self.run_script([complete('complete')],persisted(complete('complete')))
  self.assertIsNone(error);self.assertIn('"outcome": "complete"',out);self.assertIn('"automatic": 18',out)

if __name__=='__main__':unittest.main()
