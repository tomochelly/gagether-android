import importlib.util, pathlib, unittest
spec=importlib.util.spec_from_file_location('game_runner',pathlib.Path(__file__).with_name('game-refresh-request.py'));runner=importlib.util.module_from_spec(spec);spec.loader.exec_module(runner)
START='2026-10-25T06:00:00Z';FINISH='2026-10-25T06:01:00Z'
def task(game='wuwa',lane='notices'):return {'gameId':game,'lane':lane,'key':'official-game:'+game+':'+lane}
def saved(t,outcome='complete'):
 return {'version':2,'task':{'key':t['key']},'lastStartedAt':START,'lastFinishedAt':FINISH,'result':{'ok':outcome!='failed','outcome':outcome,'startedAt':START,'finishedAt':FINISH,'readback':{'automatic':3,'effective':3}}}
def continuation(t):return {'version':2,'taskKey':t['key'],'ok':True,'continuation':True,'runId':'exact-run','stage':'regional','cursor':1,'startedAt':START}
class GameRefreshRequestTest(unittest.TestCase):
 def test_fixed_selectors_cannot_send_credentials_to_arbitrary_urls(self):
  for t in [task('https://attacker.invalid'),task('wuwa','sync'),task('all'),task('wuwa','maintenance')]:
   with self.subTest(t=t):
    with self.assertRaises(ValueError):runner.task_url(t)
  self.assertEqual(runner.task_url(task()),runner.ENDPOINT+'?game=wuwa&lane=notices')
 def test_final_requires_exact_persistent_game_readback(self):
  t=task();calls=[]
  def request(url,post=False):calls.append((url,post));return {'version':2,'taskKey':t['key'],'ok':True} if post else saved(t)
  result=runner.step(t,request);self.assertEqual(result['outcome'],'complete');self.assertEqual([p for _,p in calls],[True,False]);self.assertEqual(result['readback']['effective'],3)
 def test_wrong_task_stale_or_missing_readback_and_validation_remain_failures(self):
  t=task()
  for mutate in [lambda s:s['task'].update(key='other'),lambda s:s['result'].update(readback=None),lambda s:s.update(lastStartedAt='2026-10-25T07:00:00Z'),lambda s:s['result'].update(outcome='validation-failed')]:
   status=saved(t);mutate(status)
   def request(url,post=False):return {'version':2,'taskKey':t['key']} if post else status
   with self.assertRaises(RuntimeError):runner.step(t,request)
 def test_source_failure_is_reported_separately_from_broken_delivery(self):
  t=task();result=runner.step(t,lambda url,post=False:{'version':2,'taskKey':t['key']} if post else saved(t,'failed'))
  self.assertEqual(result['outcome'],'failed');self.assertFalse(result['pending'])
 def test_partial_and_cached_results_keep_original_clocks(self):
  t=task();result=runner.step(t,lambda url,post=False:{'version':2,'taskKey':t['key'],'skipped':True} if post else saved(t,'partial'))
  self.assertEqual(result['outcome'],'partial');self.assertTrue(result['cached']);self.assertEqual(result['finishedAt'],FINISH)
 def test_failed_game_does_not_abort_other_games(self):
  a,b=task('wuwa'),task('nikke')
  def request(url,post=False):
   t=a if 'game=wuwa' in url else b
   if t==a:raise ConnectionError('Unavailable writer')
   return {'version':2,'taskKey':t['key']} if post else saved(t)
  result=runner.wave([a,b],10,2,request)
  self.assertEqual(len(result['errors']),1);self.assertEqual(result['completed'][0]['task']['gameId'],'nikke')
 def test_pending_requires_matching_run_and_persisted_start(self):
  t=task();status={'version':2,'task':{'key':t['key']},'lastStartedAt':START,'result':continuation(t)}
  self.assertTrue(runner.verified_pending(t,lambda url:status));status['result']['startedAt']='old';self.assertFalse(runner.verified_pending(t,lambda url:status))
 def test_incomplete_game_resumes_fairly_instead_of_monopolizing_one_worker(self):
  a,b=task('wuwa'),task('nikke');counts={a['key']:0,b['key']:0};order=[]
  def request(url,post=False):
   t=a if 'game=wuwa' in url else b
   if not post:return saved(t)
   order.append(t['key']);counts[t['key']]+=1
   return continuation(t) if counts[t['key']]==1 else {'version':2,'taskKey':t['key']}
  result=runner.wave([a,b],10,1,request);self.assertEqual(order[:2],[a['key'],b['key']]);self.assertEqual(len(result['completed']),2);self.assertEqual(result['errors'],[])
 def test_only_due_registered_tasks_are_polled_using_server_time(self):
  a,b=task(),task('nikke');a.update(lastFinishedAt=FINISH,intervalMinutes=3);b.update(lastFinishedAt=FINISH,intervalMinutes=3,result={'continuation':True})
  plan={'serverTime':'2026-10-25T06:02:00Z','tasks':[a,b]};self.assertEqual(runner.due_tasks(plan,'fast'),[b])
  plan['serverTime']='2026-10-25T06:04:00Z';self.assertEqual(runner.due_tasks(plan,'fast'),[a,b])
  plan['serverTime']='bad'
  with self.assertRaises(RuntimeError):runner.due_tasks(plan,'fast')
 def test_budget_defers_unstarted_tasks_and_accepts_final_readback_of_a_queued_continuation(self):
  a,b=task('wuwa'),task('nikke');clock=[0];posts=[]
  def request(url,post=False):
   if post:posts.append(url);clock[0]=2;return continuation(a)
   return saved(a)
  result=runner.wave([a,b],1,1,request,lambda:clock[0])
  self.assertEqual(len(posts),1);self.assertEqual(result['completed'][0]['task'],a);self.assertEqual(result['deferred'][0]['gameId'],'nikke');self.assertEqual(result['continuing'],[]);self.assertEqual(result['errors'],[])
 def test_never_started_budget_queue_is_not_a_fabricated_checkpoint_or_failure(self):
  result=runner.wave([task()],0,1,lambda *a:(_ for _ in ()).throw(AssertionError('No request expected')),lambda:0)
  self.assertEqual(result['requests'],0);self.assertEqual(len(result['deferred']),1);self.assertEqual(result['completed'],[]);self.assertEqual(result['continuing'],[]);self.assertEqual(result['errors'],[])
 def test_transient_final_readback_retries_only_get_and_persistent_or_wrong_identity_still_fail(self):
  t=task();calls=[]
  def request(url,post=False):
   calls.append(post)
   if post:return {'version':2,'taskKey':t['key']}
   value=saved(t)
   if len(calls)==2:value['result']['readback']=None
   return value
  self.assertEqual(runner.step(t,request)['outcome'],'complete');self.assertEqual(calls,[True,False,False])
 def test_stalled_checkpoint_is_not_successful_continuation(self):
  t=task('all','maintenance');t['intervalMinutes']=30
  status={'version':2,'task':{'key':t['key']},'lastStartedAt':START,'serverTime':'2026-10-25T09:00:00Z','result':continuation(t)}
  with self.assertRaisesRegex(RuntimeError,'stalled'):runner.persisted(t,status)
  self.assertFalse(runner.verified_pending(t,lambda url:status))
 def test_a_recovered_error_clears_only_after_same_game_lane_verified_completion(self):
  a,b=task(),task('nikke');error={'gameId':a['gameId'],'lane':a['lane'],'error':'Readback missing'};unresolved={}
  runner.reconcile_errors(unresolved,{'completed':[],'errors':[error]});self.assertEqual(len(unresolved),1)
  runner.reconcile_errors(unresolved,{'completed':[{'task':b}],'errors':[]});self.assertEqual(len(unresolved),1)
  self.assertEqual(runner.reconcile_errors(unresolved,{'completed':[{'task':a}],'errors':[]}),[error]);self.assertEqual(unresolved,{})
if __name__=='__main__':unittest.main()
