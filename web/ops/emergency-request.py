import json, os, time, urllib.request, urllib.parse, urllib.error
endpoint='https://gagether.wiki/api/emergency'
agent='GAGETHER-OfficialRefresh/1.0 (+https://github.com/tomochelly/gagether-android)'
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): return None
url=os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']+'&audience='+urllib.parse.quote(endpoint,safe='')
with urllib.request.urlopen(urllib.request.Request(url,headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']}),timeout=20) as r: token=json.load(r)['value']
print('::add-mask::'+token)
request=urllib.request.Request(endpoint,data=b'',method='POST',headers={'X-Gagether-Emergency-Identity':token,'Accept':'application/json','User-Agent':agent})
# A replay uses the committed request ID and server audit. Never change the ID to retry an uncertain response.
for attempt in range(3):
    try:
        with urllib.request.build_opener(NoRedirect).open(request,timeout=90) as response: result=json.load(response)
        print(json.dumps({k:result.get(k) for k in ['ok','dryRun','replayed','requestId','id','revision','error']},ensure_ascii=False))
        if not result.get('ok'): raise RuntimeError('Emergency change failed')
        break
    except urllib.error.HTTPError as error:
        print(error.read().decode()[:3000])
        if error.code not in [429,500,502,503,504] or attempt==2: raise
        time.sleep(2**attempt)
