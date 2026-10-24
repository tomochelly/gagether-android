import json, os, time, http.client, urllib.request, urllib.parse, urllib.error
endpoint='https://gagether.wiki/api/fast-refresh'
agent='GAGETHER-OfficialRefresh/1.0 (+https://github.com/tomochelly/gagether-android)'
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): return None
opener=urllib.request.build_opener(NoRedirect)
def post_stage():
    for attempt in range(4):
        url=os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']+'&audience='+urllib.parse.quote(endpoint,safe='')
        with urllib.request.urlopen(urllib.request.Request(url,headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']}),timeout=20) as r: token=json.load(r)['value']
        print('::add-mask::'+token)
        try:
            req=urllib.request.Request(endpoint,data=b'',method='POST',headers={'X-Gagether-Refresh-Identity':token,'Accept':'application/json','User-Agent':agent})
            with opener.open(req,timeout=180) as r: return json.load(r)
        except (urllib.error.URLError,TimeoutError,ConnectionError,http.client.IncompleteRead) as error:
            if isinstance(error,urllib.error.HTTPError) and error.code not in [429,500,502,503,504]: raise
            if attempt==3: raise
            time.sleep(min(2**(attempt+1),12))
for step in range(80):
    result=post_stage()
    if not result.get('continuation'): break
    if not result.get('ok'): raise RuntimeError('Refresh stage failed')
    print(json.dumps({'stage':result.get('stage'),'cursor':result.get('cursor',0),'busy':result.get('busy',False)}))
    if result.get('busy'): time.sleep(5)
else: raise RuntimeError('Refresh continuation limit reached; checkpoint preserved')
with opener.open(urllib.request.Request(endpoint,headers={'Accept':'application/json','User-Agent':agent}),timeout=30) as r: status=json.load(r)
saved=(status.get('result') or {}) if result.get('skipped') else result
finished=status.get('lastFinishedAt')
if result.get('skipped') and status.get('lastStartedAt','')>(finished or ''):
    print('::notice::Refresh already running; no completed outcome is claimed by this invocation.')
    raise SystemExit(0)
if not finished or not saved.get('readback'): raise RuntimeError('Persisted readback is missing')
outcome=saved.get('outcome') or ('partial' if saved.get('partial') else 'complete' if saved.get('ok') else 'failed')
print(json.dumps({'outcome':outcome,'noticesAdded':saved.get('noticesAdded'),'finishedAt':finished,'readback':saved.get('readback')},ensure_ascii=False))
with open(os.environ.get('GITHUB_STEP_SUMMARY','/dev/null'),'a') as f: f.write('GAGETHER refresh: **'+outcome+'**\n\nLast finish: '+str(finished)+'\n')
if outcome=='partial': print('::warning::Partial source failure; inspect /owner/operations.')
if outcome in ['failed','validation-failed']: raise RuntimeError('Refresh '+outcome)
