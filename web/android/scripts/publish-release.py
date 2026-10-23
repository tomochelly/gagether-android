"""Publish only the tested owner-signed update; never generate or replace a signing key."""
import hashlib,json,os,pathlib,re,subprocess,sys
request=json.loads(pathlib.Path('.gagether/android-release.json').read_text());version=request['version'];code=request['versionCode']
if not re.fullmatch(r'1\.0\.3',version) or code!=10 or request.get('publish') is not True:raise SystemExit('No matching approved release request')
gradle=pathlib.Path('app/build.gradle').read_text()
if "versionName '"+version+"'" not in gradle or 'versionCode '+str(code) not in gradle:raise SystemExit('Release request/source mismatch')
def gh(*args):return subprocess.check_output(['gh',*args],text=True)
repo=os.environ['GITHUB_REPOSITORY'];sha=os.environ['RELEASE_SOURCE_SHA'];tag='v'+version
apk=pathlib.Path('app/build/outputs/apk/release/app-release.apk');digest=hashlib.sha256(apk.read_bytes()).hexdigest()
# Both artifacts must be signed by the same certificate as the already distributed release.
previous=pathlib.Path(os.environ['RUNNER_TEMP'])/'previous-apk';previous.mkdir(exist_ok=True)
subprocess.run(['gh','release','download','v1.0.0','--repo',repo,'--pattern','GAGETHER-1.0.0.apk','--dir',str(previous)],check=True)
old=previous/'GAGETHER-1.0.0.apk'
if hashlib.sha256(old.read_bytes()).hexdigest()!='b61ba9432f196ba61a3e56ed36dc384c763d63587a03179450f9474707133664':raise SystemExit('Previous public APK digest mismatch')
signer=pathlib.Path(os.environ['ANDROID_HOME'])/'build-tools/35.0.0/apksigner'
def certificate(file):
 output=subprocess.check_output([str(signer),'verify','--print-certs',str(file)],text=True)
 match=re.search(r'Signer #1 certificate SHA-256 digest: ([0-9a-fA-F]+)',output)
 if not match:raise SystemExit('Certificate unavailable')
 return match.group(1).lower()
cert=certificate(apk)
if cert!=certificate(old):raise SystemExit('Update signing certificate differs from 1.0.0; publication blocked')
out=pathlib.Path('release-files');out.mkdir(exist_ok=True);name='GAGETHER-'+version+'.apk';target=out/name;target.write_bytes(apk.read_bytes());(out/'SHA256SUMS.txt').write_text(digest+'  '+name+'\n')
(out/'verification.json').write_text(json.dumps({'version':version,'versionCode':code,'sourceCommit':sha,'sha256':digest,'certificateSha256':cert,'previousCertificateMatched':True,'runtimeWorkflowRun':os.environ.get('RUNTIME_RUN_URL'),'scope':'Android API30/API36 emulator alarms/notification delivery; Galaxy/Fold physical device not tested'},indent=2)+'\n')
def find_release():
 pages=json.loads(gh('api','repos/'+repo+'/releases?per_page=100','--paginate','--slurp'))
 releases=[r for page in pages for r in page]
 exact=next((r for r in releases if r['tag_name']==tag),None)
 if exact:return exact
 # GitHub may temporarily assign an untagged-* identity to an unpublished draft.
 drafts=[r for r in releases if r.get('draft') and r.get('name')=='GAGETHER '+version+' — Android' and not r.get('assets')]
 if len(drafts)>1:raise SystemExit('Ambiguous empty release drafts; refusing publication')
 return drafts[0] if drafts else None
release=find_release()
if release is None:
 payload={'tag_name':tag,'target_commitish':sha,'draft':True,'name':'GAGETHER '+version+' — Android','body':pathlib.Path('docs/RELEASE_NOTES_1.0.3.md').read_text()}
 release=json.loads(subprocess.check_output(['gh','api','--method','POST','repos/'+repo+'/releases','--input','-'],input=json.dumps(payload),text=True))
if not isinstance(release.get('id'),int):raise SystemExit('Release ID unavailable; stop without publishing')
if release.get('draft'):
 release=json.loads(gh('api','--method','PATCH','repos/'+repo+'/releases/'+str(release['id']),'-f','tag_name='+tag,'-f','target_commitish='+sha,'-f','body='+pathlib.Path('docs/RELEASE_NOTES_1.0.3.md').read_text()))
for file in out.iterdir():
 existing=next((a for a in release['assets'] if a['name']==file.name),None)
 if existing:
  if existing.get('digest')!='sha256:'+hashlib.sha256(file.read_bytes()).hexdigest():raise SystemExit('Existing release asset differs; refusing replacement')
 else:subprocess.run(['gh','api','--method','POST','-H','Content-Type: application/octet-stream','--input',str(file),'https://uploads.github.com/repos/'+repo+'/releases/'+str(release['id'])+'/assets?name='+file.name],check=True,stdout=subprocess.DEVNULL)
subprocess.run(['gh','api','--method','PATCH','repos/'+repo+'/releases/'+str(release['id']),'-F','draft=false','-f','make_latest=true','-f','target_commitish='+sha],check=True,stdout=subprocess.DEVNULL)
print(json.dumps({'published':True,'version':version,'sha256':digest,'certificateSha256':cert,'url':'https://github.com/'+repo+'/releases/tag/'+tag}))
