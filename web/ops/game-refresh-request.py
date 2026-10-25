"""Fixed same-origin game jobs, fair bounded parallelism and persisted readback.

Registered per-flow revisions resume through their server-provided task keys.
Scheduled runs keep a bounded heartbeat alive so a late cron does not gate each
poll. Push runs bootstrap the heartbeat; manual runs exercise one complete wave. No Site secrets or arbitrary
URLs; every POST uses a newly minted workflow-scoped GitHub OIDC identity.
"""
import argparse, datetime, collections, concurrent.futures, http.client, json, os, re, time, urllib.error, urllib.parse, urllib.request
ENDPOINT='https://gagether.wiki/api/fast-refresh'
AGENT='GAGETHER-OfficialRefresh/2.0 (+https://github.com/tomochelly/gagether-android)'
LANES={'broadcasts','notices','uploads','details','maintenance'}
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None

def fetch_json(url,post=False):
 opener=urllib.request.build_opener(NoRedirect)
 for attempt in range(3):
  try:
   headers={'Accept':'application/json','User-Agent':AGENT}
   if post:
    identity_url=os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']+'&audience='+urllib.parse.quote(ENDPOINT,safe='')
    with urllib.request.urlopen(urllib.request.Request(identity_url,headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']}),timeout=20) as response:identity=json.load(response)['value']
    print('::add-mask::'+identity,flush=True);headers['X-Gagether-Refresh-Identity']=identity
   request=urllib.request.Request(url,data=b'' if post else None,method='POST' if post else 'GET',headers=headers)
   with opener.open(request,timeout=90 if post else 30) as response:return json.load(response)
  except (urllib.error.URLError,TimeoutError,ConnectionError,http.client.IncompleteRead) as error:
   if isinstance(error,urllib.error.HTTPError) and error.code not in [429,500,502,503,504]:raise
   if attempt==2:raise
   time.sleep(min(2**(attempt+1),8))

def task_url(task):
 game,lane=task.get('gameId'),task.get('lane')
 if not isinstance(game,str) or not re.fullmatch('[a-z][a-z0-9_-]{0,40}',game) or lane not in LANES or (lane=='maintenance')!=(game=='all'):raise ValueError('Invalid registered task selector')
 return ENDPOINT+'?'+urllib.parse.urlencode({'game':game,'lane':lane})

def step(task,request=fetch_json):
 url=task_url(task);result=request(url,True)
 if result.get('version')!=2 or result.get('taskKey')!=task['key']:raise RuntimeError('Scoped updater deployment is missing or mismatched')
 if result.get('continuation'):
  if result.get('ok') is not True:raise RuntimeError('Refresh stage failed')
  return {'task':task,'pending':True,'runId':result.get('runId'),'stage':result.get('stage'),'cursor':result.get('cursor',0),'busy':result.get('busy',False)}
 status=request(url);saved=status.get('result') or {}
 if status.get('version')!=2 or status.get('task',{}).get('key')!=task['key']:raise RuntimeError('Readback task identity mismatch')
 if saved.get('continuation'):
  if saved.get('ok') is not True or not saved.get('runId') or saved.get('startedAt')!=status.get('lastStartedAt'):raise RuntimeError('Durable checkpoint readback failed')
  return {'task':task,'pending':True,'runId':saved['runId'],'stage':saved.get('stage'),'cursor':saved.get('cursor',0)}
 readback=saved.get('readback');finished=status.get('lastFinishedAt')
 if not finished or saved.get('finishedAt')!=finished or status.get('lastStartedAt','')>finished or saved.get('startedAt')!=status.get('lastStartedAt') or not isinstance(readback,dict) or any(type(readback.get(k)) is not int or readback[k]<0 for k in ['automatic','effective']):raise RuntimeError('Persisted game readback missing')
 if saved.get('outcome')=='validation-failed':raise RuntimeError('Persistent game validation failed')
 if saved.get('outcome') not in ['complete','partial','failed']:raise RuntimeError('Unknown source outcome')
 return {'task':task,'pending':False,'outcome':saved['outcome'],'finishedAt':finished,'readback':readback,'noticesAdded':saved.get('noticesAdded',0),'cached':bool(result.get('skipped'))}

def verified_pending(task,request=fetch_json):
 status=request(task_url(task));saved=status.get('result') or {}
 return bool(status.get('task',{}).get('key')==task['key'] and saved.get('continuation') is True and saved.get('ok') is True and saved.get('runId') and saved.get('stage') and saved.get('startedAt')==status.get('lastStartedAt'))

def wave(tasks,budget_seconds,workers=4,request=fetch_json,clock=time.monotonic):
 deadline=clock()+budget_seconds;queue=collections.deque(tasks);active={};completed=[];errors=[];pending=[];calls=0;ready={}
 with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
  while queue or active:
   slots=len(queue)
   while queue and slots>0 and len(active)<workers and clock()<deadline:
    slots-=1;task=queue.popleft()
    if ready.get(task['key'],0)>clock():queue.append(task);continue
    active[pool.submit(step,task,request)]=task;calls+=1
   if not active:
    if queue and clock()<deadline:time.sleep(1);continue
    break
   done,_=concurrent.futures.wait(active,timeout=1,return_when=concurrent.futures.FIRST_COMPLETED)
   for future in done:
    task=active.pop(future)
    try:
     value=future.result()
     if value['pending']:
      if value.get('busy'):ready[task['key']]=clock()+5
      queue.append(task)
     else:completed.append(value)
    except Exception as error:errors.append({'gameId':task['gameId'],'lane':task['lane'],'error':str(error)})
   # Busy jobs yield a slot; bounded backoff avoids spinning on another lease.
   if not done and not active:time.sleep(1)
 for task in queue:
  try:
   if not verified_pending(task,request):raise RuntimeError('Unfinished job has no verified checkpoint')
   pending.append({'gameId':task['gameId'],'lane':task['lane'],'outcome':'continuing'})
  except Exception as error:errors.append({'gameId':task['gameId'],'lane':task['lane'],'error':str(error)})
 return {'completed':completed,'continuing':pending,'errors':errors,'requests':calls}

def due_tasks(plan,mode):
 try:now=datetime.datetime.fromisoformat(plan['serverTime'].replace('Z','+00:00'))
 except (KeyError,ValueError,TypeError):raise RuntimeError('Authoritative scheduler clock missing')
 selected=[];registered=0
 for task in plan['tasks']:
  if (task['lane'] in ['details','maintenance'])!=(mode=='details'):continue
  task_url(task);registered+=1
  if (task.get('result') or {}).get('continuation') or not task.get('lastFinishedAt'):selected.append(task);continue
  try:
   age=(now-datetime.datetime.fromisoformat(task['lastFinishedAt'].replace('Z','+00:00'))).total_seconds()
   if age>=float(task['intervalMinutes'])*60:selected.append(task)
  except (ValueError,TypeError,KeyError):selected.append(task)
 if not registered:raise RuntimeError('No registered tasks for this mode')
 return selected

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--mode',choices=['fast','details'],default='fast');parser.add_argument('--once',action='store_true');args=parser.parse_args()
 lease_url=ENDPOINT+'?runner='+args.mode+'&action='
 claim=fetch_json(lease_url+'claim',True)
 if claim.get('version')!=2:raise RuntimeError('Independent scheduler deployment is missing')
 if not claim.get('claimed'):
  print('::notice::Another healthy runner owns this mode; duplicate wake-up completed without collecting twice.',flush=True)
  return
 continuous=args.mode=='fast' and os.environ.get('GITHUB_EVENT_NAME') in ['schedule','push'] and not args.once
 end=time.monotonic()+(45*60 if continuous else 12*60);wave_number=0;all_errors=[];lost_lease=False;result=None
 try:
  while True:
   if not fetch_json(lease_url+'renew',True).get('claimed'):
    lost_lease=True;print('::notice::A newer scheduled runner took over; stopping this bounded heartbeat cleanly.',flush=True);break
   plan=fetch_json(ENDPOINT+'?plan=1')
   if plan.get('version')!=2 or not isinstance(plan.get('tasks'),list):raise RuntimeError('Deploy independent updater before enabling this runner')
   tasks=due_tasks(plan,args.mode)
   for task in tasks:task_url(task)
   result=wave(tasks,min(8*60,max(10,end-time.monotonic())),workers=4)
   wave_number+=1;all_errors.extend(result['errors'])
   print(json.dumps({'wave':wave_number,'mode':args.mode,**result},ensure_ascii=False),flush=True)
   with open(os.environ.get('GITHUB_STEP_SUMMARY','/dev/null'),'a') as summary:
    summary.write('### Independent '+args.mode+' refresh · wave '+str(wave_number)+'\n\n'+json.dumps(result,ensure_ascii=False)+'\n\n')
   if result['errors']:print('::warning::Independent task errors recorded; other games continue.',flush=True)
   if any(v.get('outcome') in ['partial','failed'] for v in result['completed']):print('::warning::Some source checks remain partial/failed; last-good data retained.',flush=True)
   if not continuous or time.monotonic()+60>=end:break
   if not fetch_json(lease_url+'renew',True).get('claimed'):
    lost_lease=True;break
   time.sleep(60)
 finally:
  fetch_json(lease_url+'release',True)
 if all_errors:raise RuntimeError('One or more independent task transport/auth/validation/readback checks failed')
 if lost_lease:return
 if result is None:raise RuntimeError('No registered refresh outcomes')
 if result['completed'] and not result['continuing'] and all(v['outcome']=='failed' for v in result['completed']):raise RuntimeError('Every source task failed')
if __name__=='__main__':main()
