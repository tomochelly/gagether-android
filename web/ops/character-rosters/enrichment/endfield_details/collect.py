#!/usr/bin/env python3
"""Add exact same-game native glyphs; never rewrite numerical/text/art facts."""
from __future__ import annotations
import argparse, copy, hashlib, importlib.util, json, struct
from pathlib import Path

ROOT=Path(__file__).resolve().parent
STAT_TYPES={'hp':1,'atk':2,'def':3,'crit-rate':9,'str':39,'agi':40,'int':41,'wil':42}
def digest(b):return hashlib.sha256(b).hexdigest()
def read_json(p):return json.loads(p.read_text())
def native_mapping():
 spec=importlib.util.spec_from_file_location('published_endfield_details',ROOT.parent/'enrich_endfield_details.py')
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 return module.MAPPING

def load_registry(root=ROOT):
 source=read_json(root/'source-manifest.json');tables={}
 for row in source['tables']:
  b=(root/row['file']).read_bytes()
  if len(b)!=row['bytes']or digest(b)!=row['sha256']:raise ValueError('Native table original hash mismatch: '+row['file'])
  tables[Path(row['file']).stem]=json.loads(b)
 selected_bytes=(root/'selected-assets.json').read_bytes()
 if digest(selected_bytes)!=source['selectedAssetsSHA256']:raise ValueError('Selected source tree binding hash mismatch')
 selected=json.loads(selected_bytes);originals=read_json(root/'originals-manifest.json');icons={}
 for row in originals:
  if 'error'in row:raise ValueError('Native glyph original was not verified')
  name=row['nativeIconId'];declared=selected[name];path=root/row['localFile'];b=path.read_bytes()
  git=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
  if len(b)!=declared['size']or git!=declared['sha']or git!=row['gitBlobSha']or digest(b)!=row['sha256']:raise ValueError('Native glyph original hash mismatch: '+name)
  if b[:8]!=b'\x89PNG\r\n\x1a\n':raise ValueError('Native glyph is not PNG')
  dimensions=struct.unpack('>II',b[16:24])
  if dimensions!=(row['width'],row['height'])or any(not 1<=x<=2048 for x in dimensions):raise ValueError('Native glyph dimensions mismatch')
  expected='https://raw.githubusercontent.com/'+source['assetRepository']+'/'+source['assetPin']+'/'+source['assetPrefix']+declared['path']
  if row['url']!=expected or name in icons:raise ValueError('Native glyph identity mismatch')
  icons[name]=row
 if set(icons)!=set(selected):raise ValueError('Incomplete declared native glyph registry')
 return source,tables,icons

def enrich(document,root=ROOT):
 source,tables,icons=load_registry(root);mapping=native_mapping();doc=copy.deepcopy(document)
 if isinstance(doc,list):doc=next(r for r in doc if r.get('gameId')=='endfield')
 if doc.get('gameId')!='endfield':raise ValueError('Expected exact Endfield roster')
 counts={'characters':0,'skillIcons':0,'statIcons':0,'progressionStatIcons':0,'talentIcons':0,'attributeNodeIcons':0,'baseSkillIcons':0,'preservedExistingIcons':0}
 bindings=[];patches={}
 def attach(row,name,kind,records,slot):
  if not name:return
  if name not in icons:raise ValueError('Native icon absent from checked originals: '+name)
  if row.get('icon'):
   counts['preservedExistingIcons']+=1;return
  row['icon']=icons[name]['url'];counts[kind]+=1;records[slot]=row['icon']
 for c in doc['characters']:
  native=mapping.get(c['id'])
  if not native:continue
  growth=tables['CharGrowthTable'][native]
  if growth['charId']!=native:raise ValueError('Native character identity mismatch')
  p={'nativeId':native,'skillTables':{},'stats':{},'statProgression':{},'sections':{}}
  for skill in c.get('skillTables',[]):
   group=growth['skillGroupMap'].get(skill['id'])
   if group:attach(skill,group['icon'],'skillIcons',p['skillTables'],skill['id'])
  for field,kind in [('stats','statIcons'),('statProgression','progressionStatIcons')]:
   rows=c.get('stats',[])if field=='stats'else c.get('statProgression',{}).get('stats',[])
   for stat in rows:
    code=STAT_TYPES.get(stat['id'])
    if code:attach(stat,tables['AttributeMetaTable'][str(code)]['iconName'],kind,p[field],stat['id'])
  sections={s['id']:s for s in c.get('sections',[])}
  for node in growth['talentNodeMap'].values():
   section=sections.get('endfield-detail-'+node['nodeId'])
   if not section:continue
   if node['nodeType']==4:attach(section,node['passiveSkillNodeInfo']['iconId'],'talentIcons',p['sections'],section['id'])
   elif node['nodeType']==3:
    info=node['attributeNodeInfo'];types={a['attrType']for a in info['attributeModifiers']}
    name=info['customIcon']or(tables['AttributeMetaTable'][str(next(iter(types)))]['iconName']if len(types)==1 else'')
    attach(section,name,'attributeNodeIcons',p['sections'],section['id'])
  for link in tables['SpaceshipCharSkillTable'].get(native,{}).get('skillList',[]):
   section=sections.get('endfield-detail-'+link['skillId'])
   if section:attach(section,tables['SpaceshipSkillTable'][link['skillId']]['icon'],'baseSkillIcons',p['sections'],section['id'])
  if any(p[key]for key in ['skillTables','stats','statProgression','sections']):
   counts['characters']+=1;patches[c['id']]=p
   additions=[{'url':source['uiTreeURL'],'kind':'community','label':{'ko':'게임 원본 아이콘 · 정확한 클라이언트 식별자 대응','en':'Native game glyphs · exact client identifier bindings','ja':'ゲーム原本アイコン・クライアント識別子対応','zh':'游戏原始图标·精确客户端标识对应'}}]
   c['detailSources']=[*c.get('detailSources',[]),*[s for s in additions if not any(t['url']==s['url']for t in c.get('detailSources',[]))]]
   bindings.append({'id':c['id'],'nativeId':native,**{key:len(p[key])for key in ['skillTables','stats','statProgression','sections']}})
 wire=json.dumps(doc,ensure_ascii=False,separators=(',',':')).encode()
 if len(wire)>4_400_000:raise ValueError('Existing per-game ingest bound exceeded')
 report={'gameId':'endfield','sourceDataPin':source['dataPin'],'sourceAssetPin':source['assetPin'],'counts':counts,'bindings':bindings,'sourceIdentitiesPreserved':True,'existingNumbersTextAndArtPreserved':True,'rosterBytes':len(wire),'glyphOriginals':len(icons),'glyphBytes':sum(i['bytes']for i in icons.values()),'limitations':source['limitations']}
 return doc,patches,report

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--input',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--patches',type=Path);parser.add_argument('--report',type=Path);args=parser.parse_args()
 doc,patches,report=enrich(read_json(args.input));args.output.write_text(json.dumps(doc,ensure_ascii=False,separators=(',',':'))+'\n')
 for path,value in [(args.patches,patches),(args.report,report)]:
  if path:path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':main()
