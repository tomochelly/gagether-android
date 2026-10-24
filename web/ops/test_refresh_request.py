import contextlib, http.client, io, json, os, pathlib, runpy, unittest, urllib.error
from unittest.mock import patch

class RefreshRequestTest(unittest.TestCase):
 def run_script(self, failures, status=None):
  calls=[]; sleeps=[]; events=iter(failures); output=io.StringIO()
  class Opener:
   def open(_,request,timeout):
    calls.append(request.get_method())
    if request.get_method()=='POST':
     value=next(events)
     if isinstance(value,Exception): raise value
    else:value=status or {'lastStartedAt':'2026-10-23T23:18:42Z','lastFinishedAt':'2026-10-23T22:50:58Z','result':{'outcome':'partial','readback':{'automatic':1,'effective':1}}}
    return contextlib.closing(io.BytesIO(json.dumps(value).encode()))
  def oidc(*a,**kw):return contextlib.closing(io.BytesIO(b'{"value":"test-identity"}'))
  environ={'ACTIONS_ID_TOKEN_REQUEST_URL':'https://example.invalid/oidc?request=1','ACTIONS_ID_TOKEN_REQUEST_TOKEN':'test-only','GITHUB_STEP_SUMMARY':os.devnull}
  with patch.dict(os.environ,environ),patch('urllib.request.build_opener',return_value=Opener()),patch('urllib.request.urlopen',side_effect=oidc),patch('time.sleep',side_effect=sleeps.append),contextlib.redirect_stdout(output):
   try:runpy.run_path(str(pathlib.Path(__file__).with_name('refresh-request.py')),run_name='__main__')
   except BaseException as exc:return exc,calls,sleeps,output.getvalue()
  return None,calls,sleeps,output.getvalue()
 def test_disconnected_post_retries_then_respects_running_lease(self):
  error,calls,sleeps,out=self.run_script([http.client.RemoteDisconnected('closed'),{'ok':True,'skipped':True}])
  self.assertIsInstance(error,SystemExit);self.assertEqual(error.code,0);self.assertEqual(calls,['POST','POST','GET']);self.assertEqual(sleeps,[2]);self.assertIn('no completed outcome is claimed',out);self.assertNotIn('"outcome": "complete"',out)
 def test_transport_failures_stop_after_four_attempts(self):
  error,calls,sleeps,_=self.run_script([ConnectionResetError('reset')]*4)
  self.assertIsInstance(error,ConnectionResetError);self.assertEqual(calls,['POST']*4);self.assertEqual(sleeps,[2,4,8])
 def test_partial_outcome_is_not_promoted_to_full_success(self):
  error,calls,_,out=self.run_script([{'ok':True,'outcome':'partial','readback':{'automatic':1,'effective':1}}])
  self.assertIsNone(error);self.assertEqual(calls,['POST','GET']);self.assertIn('::warning::Partial source failure',out)
 def test_nontransient_authorization_error_is_not_retried(self):
  failure=urllib.error.HTTPError('https://example.invalid',403,'Forbidden',{},None)
  error,calls,sleeps,_=self.run_script([failure])
  self.assertIs(error,failure);self.assertEqual(calls,['POST']);self.assertEqual(sleeps,[])
 def test_durable_stages_and_busy_response_continue_until_actual_readback(self):
  error,calls,sleeps,out=self.run_script([{'ok':True,'continuation':True,'stage':'channels','cursor':6},{'ok':True,'continuation':True,'busy':True},{'ok':True,'continuation':True,'stage':'collection'},{'ok':True,'outcome':'partial','readback':{'automatic':18,'effective':18}}])
  self.assertIsNone(error);self.assertEqual(calls,['POST']*4+['GET']);self.assertEqual(sleeps,[5]);self.assertIn('Partial source failure',out)
 def test_incomplete_stages_are_bounded_and_never_claim_completed(self):
  error,calls,sleeps,out=self.run_script([{'ok':True,'continuation':True,'busy':True}]*80)
  self.assertIsInstance(error,RuntimeError);self.assertEqual(calls,['POST']*80);self.assertNotIn('"outcome": "complete"',out)

if __name__=='__main__':unittest.main()
