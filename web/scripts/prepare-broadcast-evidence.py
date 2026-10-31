#!/usr/bin/env python3
"""Prepare exact local broadcast frames/transcript evidence; never download or infer facts.

A reviewer fills factual copy separately and submits the authenticated review API.
The original video/transcript bytes are never edited or published by this tool.
"""
import argparse,datetime,hashlib,json,re,subprocess
from pathlib import Path
LIMIT=8*1024*1024

def digest_file(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def public_video(url):
 from urllib.parse import urlsplit,parse_qs
 u=urlsplit(url)
 if u.scheme!='https' or u.username or u.password or u.port:raise ValueError('Use the exact official public video URL')
 ident=(parse_qs(u.query).get('v')or[''])[0] if u.hostname in ('www.youtube.com','youtube.com') and u.path=='/watch' else u.path[1:] if u.hostname=='youtu.be' else ''
 if not re.fullmatch(r'[A-Za-z0-9_-]{11}',ident):raise ValueError('Use an exact YouTube video identity')
 return ident

def seconds(text):
 if not re.fullmatch(r'\d{1,5}(?:\.\d{1,3})?|\d{1,2}:\d{2}(?::\d{2})?',text):raise ValueError('Use seconds, mm:ss or hh:mm:ss')
 parts=[float(v) for v in text.split(':')]
 if len(parts)>1 and any(v>=60 for v in parts[1:]):raise ValueError('Invalid time component')
 total=sum(v*60**i for i,v in enumerate(reversed(parts)))
 if total>43200:raise ValueError('Evidence exceeds twelve-hour bound')
 return total

def local_file(raw):
 if '://'in raw:raise ValueError('A local media file is required; network downloading is not supported')
 p=Path(raw).expanduser().resolve(strict=True)
 if not p.is_file():raise ValueError('A local ordinary file is required')
 return p

def transcript_pack(path,expected_id):
 if path.stat().st_size>2_000_000:raise ValueError('Transcript exceeds2MB bound')
 text=path.read_text(encoding='utf-8-sig');cues=[]
 declared=re.search(r'^Video ID:\s*(\S+)',text,re.M)
 if declared and declared[1]!=expected_id:raise ValueError('Transcript video identity mismatch')
 for line in text.splitlines():
  m=re.match(r'^\[([0-9:]+)\]\s*(.*)$',line)
  if m and m[2].strip():cues.append({'timeSeconds':seconds(m[1]),'text':m[2].strip()})
 if not cues:raise ValueError('No timestamped transcript cues found')
 if len(cues)>20000:raise ValueError('Transcript cue bound exceeded')
 return {'file':path.name,'sha256':digest_file(path),'bytes':path.stat().st_size,'cues':cues,'interpretation':'source-transcript-not-verified-video','automaticCaptions':'Captions: auto-generated'in text[:500]}

def frames(video,times,output,fmt,crop):
 from PIL import Image,ImageStat
 probe=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height:format=duration','-of','json',str(video)],capture_output=True,text=True,check=True,timeout=30)
 data=json.loads(probe.stdout);stream=data['streams'][0];duration=float(data['format']['duration']);w=int(stream['width']);h=int(stream['height'])
 if w*h>16777216 or min(w,h)<135:raise ValueError('Source video dimensions exceed frame bounds')
 if crop:
  if not re.fullmatch(r'\d+:\d+:\d+:\d+',crop):raise ValueError('Crop format is x:y:width:height in source pixels')
  x,y,cw,ch=map(int,crop.split(':'))
  if cw<240 or ch<135 or x+cw>w or y+ch>h:raise ValueError('Crop lies outside native frame')
  filter_arg=['-vf',f'crop={cw}:{ch}:{x}:{y}']
 else:filter_arg=[]
 out=[]
 for i,at in enumerate(times):
  if at%1:raise ValueError('Use integer frame seconds matching the review API')
  if at>=duration:raise ValueError('Capture time exceeds actual media duration')
  name=f'frame-{i+1:02d}.{fmt}';dest=output/name
  if dest.exists() or dest.resolve()==video:raise ValueError('Choose a new evidence directory; existing source files are never overwritten')
  command=['ffmpeg','-v','error','-ss',str(at),'-i',str(video),'-map','0:v:0','-frames:v','1','-an','-sn','-dn','-map_metadata','-1',*filter_arg]
  if fmt=='jpg':command+=['-q:v','2']
  subprocess.run([*command,'-y',str(dest)],check=True,timeout=60)
  if dest.stat().st_size>LIMIT:dest.unlink();raise ValueError('Native PNG frame exceeds8MB; select explicit --format jpg or a smaller factual crop')
  with Image.open(dest)as im:
   im.load();rgb=im.convert('RGB');stat=ImageStat.Stat(rgb);nearblack=sum(1 for p in rgb.resize((64,64)).getdata()if max(p)<12)/4096
   if nearblack>.98 and max(stat.mean)<12:dest.unlink();raise ValueError('Blank/black playback frame rejected; no evidence was fabricated')
   width,height=im.size
  out.append({'file':name,'sha256':digest_file(dest),'bytes':dest.stat().st_size,'timeSeconds':at,'width':width,'height':height,'contentType':'image/jpeg'if fmt=='jpg'else'image/png','visualChecked':False,'transform':{'crop':crop,'resize':None,'format':fmt}})
 return out,{'file':video.name,'sha256':digest_file(video),'bytes':video.stat().st_size,'durationSeconds':duration,'width':w,'height':h}

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--source-url',required=True);p.add_argument('--recap-id',required=True);p.add_argument('--body-hash',required=True);p.add_argument('--video');p.add_argument('--transcript');p.add_argument('--at',action='append',default=[]);p.add_argument('--format',choices=['png','jpg'],default='png');p.add_argument('--crop');p.add_argument('--output',type=Path,required=True);a=p.parse_args()
 ident=public_video(a.source_url)
 if not re.fullmatch(r'recap-[a-z0-9]+-(?:ko|en|ja|zh)-'+re.escape(ident),a.recap_id)or not re.fullmatch(r'[a-f0-9]{64}',a.body_hash):raise ValueError('Exact queued recap ID and body hash required')
 if not a.video and not a.transcript:raise ValueError('Provide a local video and/or timestamped transcript')
 if len(a.at)>8 or a.video and not a.at or a.at and not a.video:raise ValueError('Choose one to eight actual frame times with a local video')
 a.output=a.output.resolve()
 if (a.output/'evidence.json').exists():raise ValueError('Choose a new evidence directory; an existing manifest is never overwritten')
 for candidate in [a.video,a.transcript]:
  if candidate and local_file(candidate)==a.output/'evidence.json':raise ValueError('Evidence manifest cannot replace an original source file')
 a.output.mkdir(parents=True,exist_ok=True)
 result={'version':1,'recapId':a.recap_id,'bodyHash':a.body_hash,'sourceUrl':a.source_url,'youtubeId':ident,'preparedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'state':'awaiting-factual-review','videoWatched':False,'frames':[]}
 if a.transcript:result['transcript']=transcript_pack(local_file(a.transcript),ident)
 if a.video:result['frames'],result['localVideo']=frames(local_file(a.video),[seconds(t)for t in a.at],a.output,a.format,a.crop)
 (a.output/'evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'manifest':str(a.output/'evidence.json'),'frames':len(result['frames']),'transcriptCues':len(result.get('transcript',{}).get('cues',[])),'state':result['state']}))
if __name__=='__main__':
 try:main()
 except (ValueError,subprocess.SubprocessError,KeyError,IndexError) as error:raise SystemExit(str(error))
