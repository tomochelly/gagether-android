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
if __name__=='__main__':unittest.main()
