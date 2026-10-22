# Character weapon shortcuts

Standalone weapon pools are retained and collapsed initially; their artwork is mounted only after expanding. Each compact shortcut is a sibling button of character information, opening the existing weapon entry, without rewriting data or creating archives. Mobile Simple layout does not mount shortcut images.

`Entry.signatureWeapons` contains reviewed, rotation-specific references: `{entryId, memberName?, sourceUrl, sourceKind, verifiedAt}`. API operations v18 documents collection. Omission preserves reviewed links; `[]` explicitly clears them. A combined weapon pool requires an exact localized featured member name. The renderer rejects other games/services, hidden/archive records, support pools, selectable pools and secondary rate-ups. Unknown links are omitted rather than inferred from dates/order. Names and artwork come from effective data so owner overrides remain authoritative.

`lib/weapon-links.ts` bootstraps existing immutable rotation IDs. Future rotations use the API field, without a deployment. The bootstrap does not change schedule/source status or content verification times.

Relationship evidence checked for the existing rotations (2026-10-17):
- WuWa: Korean weapon notice https://wutheringwaves.kurogames.com/kr/main/news/detail/5572 and https://wutheringwaves.kurogames.com/en/main/news/detail/5546; Lucilla weapon discussion https://vortexgaming.io/en/postdetail/951538 ; Suoming https://critatlas.com/suoming .
- Endfield: official notices https://endfield.gryphline.com/ko-kr/news/2652 and /9560; signature relationships are community catalog classifications https://endfieldhub.org/guides/essence-reference (not a new official claim).
- NTE: Korean notice https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html and community equipment guide https://gigle.kr/nte .
- Genshin: current combined pool https://genshin.hoyoverse.com/ko/news/detail/166634 ; Azurelight→Skirk, Symphonist of Scents→Escoffier are selected separately, never by pool order.
- ZZZ: official corresponding character/engine classes https://zenless.hoyoverse.com/zh-cn/news/166497 and character equipment catalog https://zzz.honeyhunterworld.com/1621-char/?lang=CN .
- HSR: official Pearl/light cone announcement https://x.com/honkaisr_kr/status/2104088651378446705 and version pool notice https://www.hoyolab.com/article/46851682 .
- GFL2: official paired announcements https://steamcommunity.com/app/3347400?l=english ; Liushih imprint https://iopwiki.com/wiki/Liushih ; China official publisher update https://www.taptap.cn/moment/858783673263065951?group_id=232066 and https://gf2.sunborngame.com/NewsInfo?id=2026&typeId=4 . Local service records remain independent.

Validation: relation isolation/combined member selection/owner edits/schema retention/closed artwork/no nested buttons/all four locales in `tests/weapon-links.test.mjs`. No changes to original artwork files, editor overrides, notifications, source schedules or Android binaries.
