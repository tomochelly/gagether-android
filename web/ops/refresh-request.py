import json, os, time, http.client, urllib.request, urllib.parse, urllib.error
endpoint='https://gagether.wiki/api/fast-refresh'
agent='GAGETHER-OfficialRefresh/1.0 (+https://github.com/tomochelly/gagether-android)'
# Leave six minutes for final readback, cleanup and the 18-minute workflow limit.
deadline=time.monotonic()+12*60
max_steps=240
class BudgetReached(Exception): pass
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): return None
opener=urllib.request.build_opener(NoRedirect)
def post_stage():
    for attempt in range(4):
        remaining=deadline-time.monotonic()
        if remaining<25: raise BudgetReached()
        try:
            url=os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']+'&audience='+urllib.parse.quote(endpoint,safe='')
            with urllib.request.urlopen(urllib.request.Request(url,headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']}),timeout=min(20,remaining)) as r: token=json.load(r)['value']
            print('::add-mask::'+token)
            remaining=deadline-time.monotonic()
            if remaining<5: raise BudgetReached()
            req=urllib.request.Request(endpoint,data=b'',method='POST',headers={'X-Gagether-Refresh-Identity':token,'Accept':'application/json','User-Agent':agent})
            with opener.open(req,timeout=min(180,remaining)) as r: return json.load(r)
        except (urllib.error.URLError,TimeoutError,ConnectionError,http.client.IncompleteRead) as error:
            if isinstance(error,urllib.error.HTTPError) and error.code not in [429,500,502,503,504]: raise
            if attempt==3: raise
            time.sleep(min(2**(attempt+1),12))
def summary(outcome,**details):
    print(json.dumps({'outcome':outcome,**details},ensure_ascii=False))
    with open(os.environ.get('GITHUB_STEP_SUMMARY','/dev/null'),'a') as f:
        f.write('GAGETHER refresh: **'+outcome+'**\n\n'+json.dumps(details,ensure_ascii=False)+'\n')
def checkpoint(status):
    saved=status.get('result') or {}
    return (saved.get('ok') is True and saved.get('continuation') is True
            and isinstance(saved.get('runId'),str) and bool(saved['runId'])
            and isinstance(saved.get('stage'),str) and saved['stage'] not in ['', 'done']
            and isinstance(saved.get('cursor',0),int) and saved.get('cursor',0)>=0
            and saved.get('startedAt')==status.get('lastStartedAt'))
result=None
for step in range(max_steps):
    try: result=post_stage()
    except BudgetReached: break
    if result.get('ok') is not True: raise RuntimeError('Refresh stage failed')
    if not result.get('continuation'): break
    print(json.dumps({'stage':result.get('stage'),'cursor':result.get('cursor',0),'busy':result.get('busy',False)}))
    if result.get('busy'): time.sleep(5)
with opener.open(urllib.request.Request(endpoint,headers={'Accept':'application/json','User-Agent':agent}),timeout=30) as r: status=json.load(r)
saved=status.get('result') or {}
finished=status.get('lastFinishedAt')
if saved.get('continuation'):
    if not checkpoint(status): raise RuntimeError('Durable refresh checkpoint is missing or failed')
    if result and result.get('runId') and result['runId']!=saved['runId']: raise RuntimeError('Refresh checkpoint belongs to a different run')
    summary('continuing',runId=saved['runId'],stage=saved['stage'],cursor=saved.get('cursor',0),startedAt=status['lastStartedAt'])
    print('::notice::Checkpoint verified; the next scheduled invocation resumes this run. No completed outcome is claimed.')
elif result and result.get('skipped') and status.get('lastStartedAt','')>(finished or ''):
    raise RuntimeError('Refresh is running without a readable durable checkpoint')
else:
    readback=saved.get('readback')
    if not finished or not isinstance(readback,dict) or any(type(readback.get(k)) is not int or readback[k]<0 for k in ['automatic','effective']): raise RuntimeError('Persisted readback is missing')
    if saved.get('finishedAt')!=finished or status.get('lastStartedAt','')>finished: raise RuntimeError('Persisted refresh outcome is stale')
    outcome=saved.get('outcome')
    if outcome not in ['complete','partial'] or saved.get('ok') is not True: raise RuntimeError('Refresh '+str(outcome or 'failed'))
    summary(outcome,noticesAdded=saved.get('noticesAdded'),finishedAt=finished,readback=readback)
    if outcome=='partial': print('::warning::Partial source failure; inspect /owner/operations.')
