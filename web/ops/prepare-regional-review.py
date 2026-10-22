"""Assemble reviewed evidence as field-preserving sync proposals (never sends it)."""
import copy, datetime, json, pathlib, sys
from PIL import Image
root=pathlib.Path(sys.argv[1]).resolve();base=json.loads(pathlib.Path(sys.argv[2]).read_text())['entries'];by={e['id']:e for e in base}
mapping=json.loads((root/'asset-map.json').read_text());now=datetime.datetime.now(datetime.timezone.utc).isoformat()
kr=json.loads((root/'arknights-kr/report.json').read_text());jp=json.loads((root/'jp/evidence-report.json').read_text());cn=json.loads((root/'cn/evidence-report.json').read_text());extra=json.loads((root/'jp/supplementary-report.json').read_text())
def loc(ko,en,ja,zh):return dict(ko=ko,en=en,ja=ja,zh=zh)
def art(path,locale,w,h,caption):return {**{k:v for k,v in mapping[path].items() if k!='sha256'},'imageVerified':True,'imageLocale':locale,'imageKind':'banner','imageFit':'contain','width':w,'height':h,'verifiedAt':now,'imageCaption':caption}
def root_art(e,a):
 e.update({k:v for k,v in a.items() if k not in ['width','height','verifiedAt']});e['detailImages']=[a]
def member(m):
 out={k:v for k,v in m.items() if k in ['name','role','type','rarity']};a=m.get('existingReviewedArtwork')
 if a and a.get('imageVerified') and a.get('imageLocale')=='neutral':out.update({k:v for k,v in a.items() if k in ['image','imageSource','imageVerified','imageLocale','imageKind','previewFocus','imagePosition'] and v is not None})
 if m.get('newReviewedArtwork'):
  a=m['newReviewedArtwork'];out.update({k:v for k,v in mapping[a['path']].items() if k!='sha256'},imageVerified=True,imageLocale='neutral',imageKind='splash',imageCaption=loc('공식 2차 정예화 전체 일러스트의 위키 수록 원본입니다. 이번 가챠 배너 원본과 구분합니다.','Official full Elite2 artwork mirrored by the wiki; distinct from this recruitment banner.','公式昇進2の全体イラストのWiki掲載原本です。今回の募集バナーとは区別します。','Wiki收录的官方精二完整立绘，与本期招募横幅区分。'))
 return out
updates=[]
caption=loc('현재 한국 공식 모집 배너의 공개 커뮤니티 재게시물입니다. X 원문은 접근되지 않았습니다.','Current Korean official recruitment banner reproduced publicly; original X post inaccessible.','現在の韓国公式募集バナーの公開コミュニティ再掲。X原文はアクセス不可。','公开社区转载的本期韩服官方招募横幅，X原文未能访问。')
for p in kr['proposals']:
 summary=loc('6성 좌락·이네스가 주 픽업이며, 5성 프로바이조·스푸리아·레코드키퍼는 별도 확률 상승입니다.','Zuo Le and Ines are the two headline6-stars; Proviso, Spuria and Record Keeper are separate5-star rate-ups.','★6ズオ・ラウとイネスが主対象。★5プロヴァイゾ、スプリア、レコードキーパーは別枠の昇率対象です。','主UP为六星左乐与伊内丝，五星但书、空构、录武官为独立副UP。')
 if p.get('selectionCount'):summary=loc('6성 후보 12명 중 2명과 5성 후보 24명 중 3명을 선택합니다. 총 5명이며 후보 전원이 동시에 확률 상승하지 않습니다.','Select2 of12 six-stars and3 of24 five-stars, five total choices. Candidates are not all simultaneously rate-up.','★6候補12名から2名、★5候補24名から3名、計5名を選択。候補全員が同時に昇率対象にはなりません。','从12位六星中选2位、24位五星中选3位，共5位；并非全部候选同时UP。')
 e=dict(id=p['suggestedId'],gameId='arknights',region='kr',server='Korea · UTC+9',kind='pickup',poolType='standard',pickupType='rerun',pickupGroup=p['suggestedId'],title=p['title'],summary=summary,startAt=p['startAt'],endAt=p['endAt'],publishedAt=p['publishedAt'],verifiedAt=now,sourceUrl=p['sourceUrl'],sourceTitle='커널 로케이팅 기간 한정 개방' if p.get('selectionCount') else '상기 캐릭터 출현 확률 UP!!!',sourceLocale='ko',sourceKind='official',officialLocales=['ko'],translatedLocales=['en','ja','zh'],pickupMembers=[member(m) for m in p['pickupMembers']],pickupArchive=dict(status='announced',startDate=p['startAt'][:10],endDate=p['endAt'][:10]),relatedSources=[dict(kind='community',url=p['rosterVerificationUrl'],title='공개 공유된 정확한 한국어 공식 배너',publisher='theqoo')])
 e['timingNote']=loc('배너 현지 시각을 기존 검수된 한국 클라이언트 UTC+9 근거와 대조했습니다. 배너에 없는 종료 초는 추가하지 않았습니다. X 검색 발췌·공유 배너와 원문 직접 열람을 구분합니다.','Printed local times cross-checked against the previously reviewed KR client UTC+9 basis. No unprinted ending seconds added. X excerpts/shared banners are distinct from direct original access.','現地時刻を既存の韓国クライアントUTC+9検証値と照合。未印刷の終了秒は追加していません。X検索抜粋・再掲と原文直接閲覧を区別します。','本地时间与此前核实的韩服客户端UTC+9基准核对，未加未印刷的结束秒数。区分X摘录、转载与直接原文访问。')
 if p.get('selectionCount'):e['selectionCount']=p['selectionCount']
 a=p['assets'][0];root_art(e,art(a['path'],'ko',a['nativeWidth'],a['nativeHeight'],caption));updates.append(e)
p=jp['newRotation'];e=copy.deepcopy(updates[0]);a=jp['assets'][0]
e.update(id=p['suggestedId'],region='jp',server='Japan · notice time zone unconfirmed',pickupGroup=p['suggestedId'],sourceUrl=p['sourceUrl'],sourceTitle='ピックアップ開催予定!!!',sourceLocale='ja',officialLocales=['ja'],translatedLocales=['ko','en','zh'],startAt=None,endAt=None,startDate=p['startDate'],endDate=p['endDate'],publishedAt=p['sourcePublishedAt'],relatedSources=[dict(kind='community',url=p['communityCrossCheckUrl'],title='当該日本版ローテーション照合',publisher='gameludens')])
e['timingNote']=loc('원문: 2026년10월23일04:00~11월6일03:59. 공지 시간대가 명시되지 않아 날짜만 반영하고 정확한 시각은 비웁니다.','Original: October23,2026 04:00–November6 03:59. Notice time zone unverified; dates only, exact timestamps empty.','原文：2026年10月23日4:00～11月6日3:59。告知の時区未確認のため日付のみ、時刻は空欄。','原文：2026年10月23日04:00～11月6日03:59。公告时区未核实，仅录日期，精确时间戳留空。')
root_art(e,art(a['localPath'],'ja',a['width'],a['height'],loc('일본 공식 X 첨부 배너를 Yahoo 공개 재게시에서 확인했습니다. X 원문은 403이며 실제 해상도를 보존합니다.','Japanese official X attachment verified through Yahoo’s public redistribution; X returned403. Native resolution retained.','公式X添付バナーをYahoo公開再掲で確認。X原文は403、実解像度を保持。','通过Yahoo公开转载核实日本官方X附件，X原文403，保留实际分辨率。')));updates.append(e)
e=copy.deepcopy(cn['newEntryProposals'][0]);a=e.pop('proposedArtworkAsset');e.pop('relatedEvidence',None)
e.update(verifiedAt=now,sourceTitle='常驻标准寻访',pickupGroup=e['id'],pickupArchive=dict(status='announced',startDate=e['startDate'],endDate=e['endDate']),relatedSources=[dict(kind='official',url='https://ak.hypergryph.com/news/3020',title='中国官方更新预告',publisher='HYPERGRYPH'),dict(kind='community',url=a['sourceUrl'],title='当期完整中文横幅转载',publisher='TapTap')])
root_art(e,art(a['path'],'zh',a['width'],a['height'],loc('이번 회차 중국어 배너의 공개 커뮤니티 재게시물입니다. 인증된 공식 계정의 Sina 본문으로 명단·기간을 대조했습니다.','Public reproduction of this Chinese banner; roster/period cross-checked with the verified publisher’s Sina post.','当該中国語バナーの公開再掲。認証公式アカウントのSina本文で名簿・期間を照合。','本期中文横幅公开转载，名单及期间与认证官方账号的新浪正文核对。')))
for m in e['pickupMembers']:
 if m.get('role')=='featured':
  candidates=[v for x in base if x['gameId']=='arknights' for v in x.get('pickupMembers',[]) if v['name'].get('zh')==m['name']['zh'] and v.get('imageVerified') and v.get('imageLocale')=='neutral']
  if candidates:m.update({k:v for k,v in candidates[0].items() if k not in ['name','type','role','rarity']})
updates.append(e)
for change in jp['entryArtworkChanges']:
 e=copy.deepcopy(by[change['id']]);a=next(a for a in jp['assets'] if pathlib.Path(a['localPath']).name==change['asset']);v=art(a['localPath'],'ja',a['width'],a['height'],loc('현재 일본 서비스의 정확한 공식 모집 배너입니다. 기존 개별 그림은 보존합니다.','Exact current Japanese official recruitment banner; individual images retained.','現在の日本版の正確な公式募集バナー。個別画像を保持。','本期日本服务准确官方招募横幅，保留各自图片。'))
 e['localizedArtwork']={**e.get('localizedArtwork',{}),'ja':v};e['detailImages']=e.get('detailImages',[])+[v];e['verifiedAt']=now;updates.append(e)
for change in cn['updates']:
 e=copy.deepcopy(by[change['id']]);a=next((a for a in cn['assets'] if a.get('entryId')==change['id']),None)
 if not a:continue
 caption=change['appendChineseArtworkVariant']['imageCaption']
 if e['gameId']=='reverse1999':caption=loc('현재 중국어 선택 모집 배너의 공개 커뮤니티 재게시물입니다. 개별 후보 그림은 보존합니다.','Public community reproduction of this Chinese selection banner; candidate images retained.','当該中国語選択募集バナーの公開再掲。各候補画像を保持。','本期中文自选招募横幅的公开社区转载，保留各候选图片。')
 v=art(a['path'],'zh',a['width'],a['height'],caption);e['localizedArtwork']={**e.get('localizedArtwork',{}),'zh':v};e['detailImages']=e.get('detailImages',[])+[v]
 if change.get('appendDetailSection'):
  section=copy.deepcopy(change['appendDetailSection']);section['body']['ko']=section['body']['ko'].replace('하위 등급 확률 상승은 ','하위 등급 확률 상승의 중국어 원문 이름은 ');section['body']['en']=section['body']['en'].replace('are the separate standard-doll rate-ups','are the separate standard-doll rate-ups (Chinese source names)');section['body']['ja']=section['body']['ja'].replace('標準人形の別枠昇率は','標準人形の別枠昇率の中国語原名は');e['detailSections']=e.get('detailSections',[])+[section]
 if change.get('timingNote'):e['timingNote']=change['timingNote']
 if e['gameId']=='gfl2' and e.get('imageVerified') and e.get('imageLocale')=='neutral' and e.get('image','').startswith('/assets/'):
  original=pathlib.Path(__file__).resolve().parent.parent/'public'/e['image'].lstrip('/')
  if original.exists():
   width,height=Image.open(original).size
   e['detailImages'].append({k:e[k] for k in ['image','imageSource','imageVerified','imageLocale','imageKind','previewFocus'] if k in e}|{'width':width,'height':height,'verifiedAt':by[e['id']]['verifiedAt'],'imageCaption':loc('기존 검수된 무문자 전체 캐릭터 일러스트 원본을 보존합니다.','Previously reviewed complete text-free character original retained.','既存検証済みの文字なしキャラクター全体原画を保持。','保留此前核实的无文字完整角色原图。')})
 e['verifiedAt']=now;updates.append(e)
for a in extra['assets']:
 e=copy.deepcopy(by[a['entryId']]);v=art(a['localPath'],'ja',a['width'],a['height'],loc('같은 공통 서비스 회차의 일본어 공식 전체 픽업 배너입니다.','Official complete Japanese banner for this shared-service rotation.','同じ共通サービス回次の日本語公式全体ピックアップバナー。','同一共通服务轮次的日文官方完整招募横幅。'));e['localizedArtwork']={**e.get('localizedArtwork',{}),'ja':v};e['detailImages']=e.get('detailImages',[])+[v];e['verifiedAt']=now;updates.append(e)
# Global rotation is independently verified against the same official EN post, UTC-7.
global_report=json.loads((root/'jp/supplemental-pool-report.json').read_text())['globalNextStandard'];e=copy.deepcopy(updates[0]);a=global_report['artwork']
e.update(id='arknights-global-standard-20261023',region='global',server='Global · UTC-7',pickupGroup='arknights-global-standard-20261023',sourceUrl=global_report['sourceUrls'][1],sourceTitle='Standard Headhunting',sourceLocale='en',officialLocales=['en'],translatedLocales=['ko','ja','zh'],startAt=global_report['startAt'],endAt=global_report['endAt'],publishedAt=None,relatedSources=[dict(kind='official',url=global_report['sourceUrls'][0],title='Official EN rotation announcement',publisher='Arknights EN')])
e['timingNote']=loc('글로벌 공식 본문에 명시된 UTC-7 기준입니다. 한국·일본과 같은 명단이어도 글로벌 시각을 독립적으로 검증했습니다.','The official Global post explicitly specifies UTC-7. Identical rosters do not imply identical service clocks.','グローバル公式本文に明記されたUTC-7基準。名簿が同じでもサービス時刻は個別に検証。','按国际服官方正文明确的UTC-7记录，阵容相同不代表服务时刻相同。')
root_art(e,art(str(root/'jp'/a['file']),'en',a['width'],a['height'],loc('현재 회차 글로벌 공식 영어 전체 배너입니다. 첨부 그림에는 날짜가 없으며 같은 공식 게시물 본문으로 기간을 확인했습니다.','Full official EN banner for this rotation. The image has no printed dates; the period is verified from the same official post.','当該回のグローバル公式英語全体バナー。画像に日付はなく、同一公式投稿本文で期間を確認。','本期国际服官方完整英文横幅，图片未印日期，期间依据同一官方帖子正文核实。')));updates.append(e)
for e in updates:
 e.pop('editor',None)
 if e.get('detailImages'):e['detailImages']=list({a['image']:a for a in e['detailImages']}.values())
(root/'verified-entry-updates.json').write_text(json.dumps({'entries':updates},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'entries':len(updates),'ids':[e['id'] for e in updates]}))
