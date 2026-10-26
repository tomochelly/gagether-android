import type {Entry} from "./types";
import {separateEntityRewards} from './content-roles';
const rawSeedEntries: Entry[] =[
  {
    "region": "global",
    "startAt": null,
    "endAt": "2026-11-05T11:59:00+08:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.140689+00:00",
    "gameId": "endfield",
    "server": "Asia · UTC+8",
    "version": "Sanctuary of Ink",
    "id": "endfield-si",
    "kind": "pickup",
    "title": {
      "ko": "사 · 만물의 재구성",
      "en": "Si · Rejuvenation",
      "ja": "スー · 万象一新",
      "zh": "祀 · 萬物更新"
    },
    "summary": {
      "ko": "신규 6성 오퍼레이터 사의 획득 확률이 증가합니다.",
      "en": "New 6-star operator Si is featured.",
      "ja": "新★6オペレーター・スーの提供割合が上昇。",
      "zh": "全新6星幹員祀獲得機率提升。"
    },
    "sourceUrl": "https://endfield.gryphline.com/ko-kr/news/4489",
    "sourceTitle": "「만물의 재구성」 특별 허가 헤드헌팅 | 명일방주: 엔드필드",
    "image": "/assets/entities/endfield-si-splash-full-8d3ee8ef.webp",
    "imageSource": "https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/jsspsi.fea4b0c4.png",
    "rarity": 6,
    "featured": true,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://endfield.gryphline.com/ko-kr/news/9560",
      "en": "https://endfield.gryphline.com/en-us/news/9560",
      "ja": "https://endfield.gryphline.com/ja-jp/news/9560",
      "zh": "https://endfield.gryphline.com/zh-tw/news/9560"
    },
    "pickupType": "new",
    "pickupGroup": "endfield-sanctuary-ink-phase-1",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "사",
          "en": "Si",
          "ja": "スー",
          "zh": "祀"
        },
        "type": "new",
        "rarity": 6,
        "image": "/assets/entities/endfield-si-splash-full-8d3ee8ef.webp",
        "imageSource": "https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/jsspsi.fea4b0c4.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 42%",
        "imageVerified": true
      }
    ],
    "versionTitle": {
      "ko": "단청도",
      "en": "Sanctuary of Ink",
      "ja": "丹青渡",
      "zh": "丹青渡"
    },
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 42%",
    "imageVerified": true,
    "sourceLocale": "ko"
  },
  {
    "region": "global",
    "startAt": null,
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.140689+00:00",
    "gameId": "endfield",
    "server": "Asia · UTC+8",
    "version": "Sanctuary of Ink",
    "id": "endfield-jade-vessel",
    "kind": "weapon",
    "title": {
      "ko": "옥에 깃든 형체 · 전옥 신청",
      "en": "Jade Vessel · Seal of Jade Issue",
      "ja": "玉中身 · 玉書・申請",
      "zh": "玉中身 · 篆玉申領"
    },
    "summary": {
      "ko": "6성 대검 확률 상승. 관련 캐릭터 배너 3회가 지나면 종료.",
      "en": "Rate-up 6-star greatsword. Ends after three relevant character banners.",
      "ja": "星6大剣の確率アップ。対象のキャラクター募集3回後に終了。",
      "zh": "六星双手剑概率提升，相关角色寻访三期后结束。"
    },
    "sourceUrl": "https://endfield.gryphline.com/ko-kr/news/9560",
    "sourceTitle": "「단청도」 버전 업데이트 설명",
    "image": "/assets/entities/endfield-jade-vessel-exact-d1348b06.webp",
    "imageSource": "https://web-static.hg-cdn.com/upload/image/20261012/ae4a0d5301f2ecd124be805ebd31d30f.jpg",
    "rarity": 6,
    "timingNote": {
      "ko": "정확한 종료 일시는 공식 공지에 기재되지 않았습니다.",
      "en": "No fixed end timestamp is published.",
      "ja": "終了日時の明記はありません。",
      "zh": "官方未公布固定结束时间。"
    },
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://endfield.gryphline.com/ko-kr/news/9560",
      "en": "https://endfield.gryphline.com/en-us/news/9560",
      "ja": "https://endfield.gryphline.com/ja-jp/news/9560",
      "zh": "https://endfield.gryphline.com/zh-tw/news/9560"
    },
    "pickupType": "new",
    "pickupGroup": "endfield-sanctuary-ink-phase-1",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "옥에 깃든 형체",
          "en": "Jade Vessel",
          "ja": "玉中身",
          "zh": "玉中身"
        },
        "type": "new",
        "rarity": 6,
        "image": "/assets/entities/endfield-jade-vessel-exact-d1348b06.webp",
        "imageSource": "https://web-static.hg-cdn.com/upload/image/20261012/ae4a0d5301f2ecd124be805ebd31d30f.jpg",
        "imageKind": "weapon",
        "imageFit": "cover",
        "imagePosition": "25% 48%",
        "imageVerified": true
      }
    ],
    "versionTitle": {
      "ko": "단청도",
      "en": "Sanctuary of Ink",
      "ja": "丹青渡",
      "zh": "丹青渡"
    },
    "imageKind": "weapon",
    "imageFit": "cover",
    "imagePosition": "25% 48%",
    "imageVerified": true,
    "sourceLocale": "ko"
  },
  {
    "region": "global",
    "startAt": null,
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.140689+00:00",
    "gameId": "endfield",
    "server": "Asia · UTC+8",
    "version": "Sanctuary of Ink",
    "id": "endfield-update-ink",
    "kind": "update",
    "title": {
      "ko": "단청도",
      "en": "Sanctuary of Ink",
      "ja": "丹青渡",
      "zh": "丹青渡"
    },
    "summary": {
      "ko": "사의 그림 지역과 새 스토리, 오퍼레이터·무기 추가.",
      "en": "Si’s Painting, new story, operators and weapons.",
      "ja": "スーの絵、新ストーリー、オペレーター・武器を追加。",
      "zh": "新增祀的畫區域、劇情、幹員與武器。"
    },
    "sourceUrl": "https://endfield.gryphline.com/ko-kr/news/9560",
    "sourceTitle": "「단청도」 버전 업데이트 설명",
    "image": "/assets/endfield-background.webp",
    "imageSource": "https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/kv_v1d6.32f51a5b.jpg",
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://endfield.gryphline.com/ko-kr/news/9560",
      "en": "https://endfield.gryphline.com/en-us/news/9560",
      "ja": "https://endfield.gryphline.com/ja-jp/news/9560",
      "zh": "https://endfield.gryphline.com/zh-tw/news/9560"
    },
    "versionTitle": {
      "ko": "단청도",
      "en": "Sanctuary of Ink",
      "ja": "丹青渡",
      "zh": "丹青渡"
    },
    "sourceLocale": "ko"
  },
  {
    "region": "global",
    "startAt": null,
    "endAt": "2026-11-05T12:00:00+08:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.140689+00:00",
    "gameId": "endfield",
    "server": "Asia · UTC+8",
    "version": "Sanctuary of Ink",
    "id": "endfield-inky-hues",
    "kind": "event",
    "title": {
      "ko": "먹에서 피어난 색채",
      "en": "All the Inky Hues",
      "ja": "墨に彩あり",
      "zh": "墨分諸彩"
    },
    "summary": {
      "ko": "지정 임무를 완료해 오로베릴 1,200개 등을 획득.",
      "en": "Complete designated tasks for 1,200 Oroberyl and other rewards.",
      "ja": "指定クエスト達成で赤晶玉1,200などを獲得。",
      "zh": "完成指定任務可獲嵌晶玉1,200等獎勵。"
    },
    "sourceUrl": "https://endfield.gryphline.com/ko-kr/news/9560",
    "sourceTitle": "「단청도」 버전 업데이트 설명",
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://endfield.gryphline.com/ko-kr/news/9560",
      "en": "https://endfield.gryphline.com/en-us/news/9560",
      "ja": "https://endfield.gryphline.com/ja-jp/news/9560",
      "zh": "https://endfield.gryphline.com/zh-tw/news/9560"
    },
    "versionTitle": {
      "ko": "단청도",
      "en": "Sanctuary of Ink",
      "ja": "丹青渡",
      "zh": "丹青渡"
    },
    "highlights": [
      {
        "ko": "오로베릴 1,200개",
        "en": "1,200 Oroberyl",
        "ja": "赤晶玉1,200",
        "zh": "嵌晶玉1,200"
      },
      {
        "ko": "사의 그림 · 지정 임무",
        "en": "Si’s Painting · Assigned tasks",
        "ja": "スーの絵・指定クエスト",
        "zh": "祀的画・指定任务"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "진행 방법",
          "en": "How to play",
          "ja": "進め方",
          "zh": "玩法"
        },
        "body": {
          "ko": "무릉 지역의 사의 그림에서 지정 임무를 완료하면 오로베릴 1,200개와 존속의 흔적을 받는다.",
          "en": "Complete designated tasks in Si’s Painting, Wuling, for 1,200 Oroberyl and other rewards.",
          "ja": "武陵・スーの絵の指定クエストをクリアし、赤晶玉1,200などを獲得する。",
          "zh": "在武陵祀的画区域完成指定任务，领取嵌晶玉1,200等奖励。"
        }
      }
    ],
    "relatedSources": [
      {
        "kind": "community",
        "url": "https://www.inven.co.kr/board/party/6553/166",
        "title": "단청도 업데이트 상세 공지",
        "publisher": "인벤 · Noori",
        "publishedAt": "2026-10-15T17:56:00+09:00"
      },
      {
        "kind": "video",
        "url": "https://www.youtube.com/watch?v=1TPiuhgcEO8",
        "title": "단청도 버전 미리보기 특별 방송",
        "publisher": "명일방주: 엔드필드 공식 YouTube",
        "publishedAt": "2026-10-06T20:30:00+09:00"
      }
    ],
    "sourceLocale": "ko"
  },
  {
    "region": "global",
    "startAt": null,
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.140689+00:00",
    "gameId": "endfield",
    "server": "Asia · UTC+8",
    "version": "Sanctuary of Ink",
    "id": "endfield-stoves",
    "kind": "event",
    "title": {
      "ko": "불꽃으로 맺은 인연",
      "en": "Yuanyuan's Blazing Stoves",
      "ja": "俗世の縁",
      "zh": "煙火生緣"
    },
    "summary": {
      "ko": "인연 마을 객잔을 운영하고 임무·이정표를 달성해 오로베릴 1,000개 획득.",
      "en": "Manage Yuanyuan Manor Inn and complete tasks for 1,000 Oroberyl.",
      "ja": "縁縁荘を経営し、クエストを達成して赤晶玉1,000を獲得。",
      "zh": "经营缘缘庄客栈完成任务，获得嵌晶玉1,000。"
    },
    "sourceUrl": "https://endfield.gryphline.com/ko-kr/news/9560",
    "sourceTitle": "「단청도」 버전 업데이트 설명",
    "timingNote": {
      "ko": "다음 버전 점검 전까지 진행됩니다.",
      "en": "Ends before the next version maintenance.",
      "ja": "次回バージョンのメンテナンス前まで。",
      "zh": "持续至下次版本维护前。"
    },
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://endfield.gryphline.com/ko-kr/news/9560",
      "en": "https://endfield.gryphline.com/en-us/news/9560",
      "ja": "https://endfield.gryphline.com/ja-jp/news/9560",
      "zh": "https://endfield.gryphline.com/zh-tw/news/9560"
    },
    "versionTitle": {
      "ko": "단청도",
      "en": "Sanctuary of Ink",
      "ja": "丹青渡",
      "zh": "丹青渡"
    },
    "highlights": [
      {
        "ko": "오로베릴 1,000개",
        "en": "1,000 Oroberyl",
        "ja": "赤晶玉1,000",
        "zh": "嵌晶玉1,000"
      },
      {
        "ko": "10.22 콘텐츠 추가",
        "en": "More content Oct 22",
        "ja": "10/22コンテンツ追加",
        "zh": "10月22日追加内容"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "진행 방법",
          "en": "How to play",
          "ja": "進め方",
          "zh": "玩法"
        },
        "body": {
          "ko": "무릉의 사의 그림에서 객잔을 운영하고 운영 이정표를 올린다. 10월 22일 04:00 서버 시간에 콘텐츠가 추가된다.",
          "en": "Run the inn in Si’s Painting, Wuling, and increase management milestones. More content opens Oct 22 at 04:00 server time.",
          "ja": "武陵・スーの絵で宿屋を経営してマイルストーンを進める。10月22日04:00サーバー時間に内容追加。",
          "zh": "在武陵祀的画区域经营客栈、提升经营里程碑；10月22日服务器时间04:00追加内容。"
        }
      },
      {
        "title": {
          "ko": "수령·판매 기한",
          "en": "Claim and sale deadlines",
          "ja": "受取・販売期限",
          "zh": "领取与销售期限"
        },
        "body": {
          "ko": "기간 한정 임무와 보상은 다음 버전 점검 전에 끝난다. 객잔 자체와 운영 이정표 단계 보상은 이후에도 계속 이용 가능하다.",
          "en": "Limited tasks and rewards end before the next version maintenance. The inn itself and milestone-stage rewards remain available.",
          "ja": "期間限定任務と報酬は次期アップデート前に終了。宿屋と経営マイルストーン報酬は継続利用可能。",
          "zh": "限时任务与奖励在下版本维护前结束，客栈玩法和经营里程碑阶段奖励继续保留。"
        }
      }
    ],
    "relatedSources": [
      {
        "kind": "community",
        "url": "https://www.inven.co.kr/board/party/6553/166",
        "title": "단청도 업데이트 상세 공지",
        "publisher": "인벤 · Noori",
        "publishedAt": "2026-10-15T17:56:00+09:00"
      },
      {
        "kind": "video",
        "url": "https://www.youtube.com/watch?v=1TPiuhgcEO8",
        "title": "단청도 버전 미리보기 특별 방송",
        "publisher": "명일방주: 엔드필드 공식 YouTube",
        "publishedAt": "2026-10-06T20:30:00+09:00"
      }
    ],
    "sourceLocale": "ko"
  },
  {
    "region": "global",
    "startAt": null,
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.140689+00:00",
    "gameId": "endfield",
    "server": "Asia · UTC+8",
    "version": "Sanctuary of Ink",
    "id": "endfield-ink-pass",
    "kind": "package",
    "title": {
      "ko": "프로토콜 통행증 · 묵권",
      "en": "Protocol Pass: Ink Scroll",
      "ja": "協約通行証・墨画",
      "zh": "協議通行證·墨卷"
    },
    "summary": {
      "ko": "새 버전 판매 목록. 가격과 상세 구성은 게임 내에서 확인.",
      "en": "Listed in the new-version shop; price and contents require an in-game check.",
      "ja": "新バージョン販売商品。価格と詳細内容はゲーム内で確認。",
      "zh": "新版本商店商品，价格和具体内容需在游戏内确认。"
    },
    "sourceUrl": "https://endfield.gryphline.com/ko-kr/news/9560",
    "sourceTitle": "「단청도」 버전 업데이트 설명",
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://endfield.gryphline.com/ko-kr/news/9560",
      "en": "https://endfield.gryphline.com/en-us/news/9560",
      "ja": "https://endfield.gryphline.com/ja-jp/news/9560",
      "zh": "https://endfield.gryphline.com/zh-tw/news/9560"
    },
    "versionTitle": {
      "ko": "단청도",
      "en": "Sanctuary of Ink",
      "ja": "丹青渡",
      "zh": "丹青渡"
    },
    "sourceLocale": "ko"
  },
  {
    "region": "global",
    "startAt": null,
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.140689+00:00",
    "gameId": "endfield",
    "server": "Asia · UTC+8",
    "version": "Sanctuary of Ink",
    "id": "endfield-wondrous",
    "kind": "package",
    "title": {
      "ko": "기묘한 시선 소장 패키지",
      "en": "Wondrous View Collection Pack",
      "ja": "不思議な視線パック",
      "zh": "奇妙視線收藏包"
    },
    "summary": {
      "ko": "새 버전 판매 목록. 가격과 상세 구성은 게임 내에서 확인.",
      "en": "Listed in the new-version shop; price and contents require an in-game check.",
      "ja": "新バージョン販売商品。価格と詳細内容はゲーム内で確認。",
      "zh": "新版本商店商品，价格和具体内容需在游戏内确认。"
    },
    "sourceUrl": "https://endfield.gryphline.com/ko-kr/news/9560",
    "sourceTitle": "「단청도」 버전 업데이트 설명",
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://endfield.gryphline.com/ko-kr/news/9560",
      "en": "https://endfield.gryphline.com/en-us/news/9560",
      "ja": "https://endfield.gryphline.com/ja-jp/news/9560",
      "zh": "https://endfield.gryphline.com/zh-tw/news/9560"
    },
    "versionTitle": {
      "ko": "단청도",
      "en": "Sanctuary of Ink",
      "ja": "丹青渡",
      "zh": "丹青渡"
    },
    "sourceLocale": "ko"
  },
  {
    "region": "global",
    "startAt": null,
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.140689+00:00",
    "gameId": "endfield",
    "server": "Asia · UTC+8",
    "version": "Sanctuary of Ink",
    "id": "endfield-protocol-flow",
    "kind": "package",
    "title": {
      "ko": "프로토콜 기원 조합 패키지",
      "en": "Protocol Flow Bundle",
      "ja": "協約起源パック",
      "zh": "協議源流組合包"
    },
    "summary": {
      "ko": "새 버전 판매 목록. 가격과 상세 구성은 게임 내에서 확인.",
      "en": "Listed in the new-version shop; price and contents require an in-game check.",
      "ja": "新バージョン販売商品。価格と詳細内容はゲーム内で確認。",
      "zh": "新版本商店商品，价格和具体内容需在游戏内确认。"
    },
    "sourceUrl": "https://endfield.gryphline.com/ko-kr/news/9560",
    "sourceTitle": "「단청도」 버전 업데이트 설명",
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://endfield.gryphline.com/ko-kr/news/9560",
      "en": "https://endfield.gryphline.com/en-us/news/9560",
      "ja": "https://endfield.gryphline.com/ja-jp/news/9560",
      "zh": "https://endfield.gryphline.com/zh-tw/news/9560"
    },
    "versionTitle": {
      "ko": "단청도",
      "en": "Sanctuary of Ink",
      "ja": "丹青渡",
      "zh": "丹青渡"
    },
    "sourceLocale": "ko"
  },
  {
    "region": "global",
    "startAt": null,
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.140689+00:00",
    "gameId": "endfield",
    "server": "Asia · UTC+8",
    "version": "Sanctuary of Ink",
    "id": "endfield-omnipresence",
    "kind": "package",
    "title": {
      "ko": "만물 헤드헌팅 조합 패키지",
      "en": "Omnipresence HH Bundle",
      "ja": "万象スカウトパック",
      "zh": "萬象尋訪組合包"
    },
    "summary": {
      "ko": "새 버전 판매 목록. 가격과 상세 구성은 게임 내에서 확인.",
      "en": "Listed in the new-version shop; price and contents require an in-game check.",
      "ja": "新バージョン販売商品。価格と詳細内容はゲーム内で確認。",
      "zh": "新版本商店商品，价格和具体内容需在游戏内确认。"
    },
    "sourceUrl": "https://endfield.gryphline.com/ko-kr/news/9560",
    "sourceTitle": "「단청도」 버전 업데이트 설명",
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://endfield.gryphline.com/ko-kr/news/9560",
      "en": "https://endfield.gryphline.com/en-us/news/9560",
      "ja": "https://endfield.gryphline.com/ja-jp/news/9560",
      "zh": "https://endfield.gryphline.com/zh-tw/news/9560"
    },
    "versionTitle": {
      "ko": "단청도",
      "en": "Sanctuary of Ink",
      "ja": "丹青渡",
      "zh": "丹青渡"
    },
    "sourceLocale": "ko"
  },
  {
    "region": "global",
    "startAt": null,
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.140689+00:00",
    "gameId": "endfield",
    "server": "Asia · UTC+8",
    "version": "Sanctuary of Ink",
    "id": "endfield-star-river",
    "kind": "package",
    "title": {
      "ko": "천하 헤드헌팅 조합 패키지",
      "en": "Star River HH Bundle",
      "ja": "天河スカウトパック",
      "zh": "天河尋訪組合包"
    },
    "summary": {
      "ko": "새 버전 판매 목록. 가격과 상세 구성은 게임 내에서 확인.",
      "en": "Listed in the new-version shop; price and contents require an in-game check.",
      "ja": "新バージョン販売商品。価格と詳細内容はゲーム内で確認。",
      "zh": "新版本商店商品，价格和具体内容需在游戏内确认。"
    },
    "sourceUrl": "https://endfield.gryphline.com/ko-kr/news/9560",
    "sourceTitle": "「단청도」 버전 업데이트 설명",
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://endfield.gryphline.com/ko-kr/news/9560",
      "en": "https://endfield.gryphline.com/en-us/news/9560",
      "ja": "https://endfield.gryphline.com/ja-jp/news/9560",
      "zh": "https://endfield.gryphline.com/zh-tw/news/9560"
    },
    "versionTitle": {
      "ko": "단청도",
      "en": "Sanctuary of Ink",
      "ja": "丹青渡",
      "zh": "丹青渡"
    },
    "sourceLocale": "ko"
  },
  {
    "region": "global",
    "startAt": "2026-11-05T12:00:00+08:00",
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.140689+00:00",
    "gameId": "endfield",
    "server": "Asia · UTC+8",
    "version": "Sanctuary of Ink",
    "id": "endfield-argent-flow",
    "kind": "pickup",
    "title": {
      "ko": "명하",
      "en": "Argent Flow",
      "ja": "ミンホ",
      "zh": "明河"
    },
    "summary": {
      "ko": "다음 6성 오퍼레이터 픽업.",
      "en": "Upcoming featured 6-star operator.",
      "ja": "次回の星6オペレーターピックアップ。",
      "zh": "即将开启的六星干员寻访。"
    },
    "sourceUrl": "https://endfield.gryphline.com/ko-kr/news/9560",
    "sourceTitle": "「단청도」 버전 업데이트 설명",
    "rarity": 6,
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://endfield.gryphline.com/ko-kr/news/9560",
      "en": "https://endfield.gryphline.com/en-us/news/9560",
      "ja": "https://endfield.gryphline.com/ja-jp/news/9560",
      "zh": "https://endfield.gryphline.com/zh-tw/news/9560"
    },
    "pickupType": "new",
    "pickupGroup": "endfield-sanctuary-ink-phase-2",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "명하",
          "en": "Argent Flow",
          "ja": "ミンホ",
          "zh": "明河"
        },
        "type": "new",
        "rarity": 6,
        "image": "/assets/entities/endfield-argent-flow-splash-full-202a5513.webp",
        "imageSource": "https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/minghe.117b2c1b.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 36%",
        "imageVerified": true
      }
    ],
    "versionTitle": {
      "ko": "단청도",
      "en": "Sanctuary of Ink",
      "ja": "丹青渡",
      "zh": "丹青渡"
    },
    "image": "/assets/entities/endfield-argent-flow-splash-full-202a5513.webp",
    "imageSource": "https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/minghe.117b2c1b.png",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 36%",
    "imageVerified": true,
    "sourceLocale": "ko"
  },
  {
    "id": "wuwa-chisa",
    "gameId": "wuwa",
    "kind": "pickup",
    "title": {
      "ko": "치사",
      "en": "Chisa",
      "ja": "千咲",
      "zh": "千咲"
    },
    "summary": {
      "ko": "3.7 전반 5성 공명자 픽업.",
      "en": "Version 3.7 phase I featured 5-star Resonator.",
      "ja": "3.7前半の限定星5共鳴者。",
      "zh": "3.7上半五星共鸣者唤取。"
    },
    "region": "global",
    "server": "Asia · UTC+8",
    "startAt": null,
    "endAt": "2026-10-22T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:17:47.191463+00:00",
    "sourceUrl": "https://wutheringwaves.kurogames.com/en/main/news/detail/5546",
    "sourceTitle": "Version 3.7 Featured Resonator/Weapon Convene: Phase I",
    "image": "/assets/entities/wuwa-chisa-splash-full-63525a92.webp",
    "imageSource": "https://wutheringwaves.kurogames.com/static4.0/assets/qianxiao-63525a92.webp",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 40%",
    "imageVerified": true,
    "version": "3.7",
    "rarity": 5,
    "featured": true,
    "timingNote": {
      "ko": "아시아 종료: 10월 22일 10:59 KST/JST. 일본 공식 공지에서 시간대를 명시했습니다.",
      "en": "Asia end: October 22, 10:59 JST (UTC+9), explicitly stated in the Japanese official notice.",
      "ja": "アジア終了：10月22日10:59（日本標準時）。",
      "zh": "亞洲結束：10月22日09:59（UTC+8），據日文官方公告換算。"
    },
    "pickupType": "rerun",
    "pickupGroup": "wuwa-37-phase-1",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "치사",
          "en": "Chisa",
          "ja": "千咲",
          "zh": "千咲"
        },
        "type": "rerun",
        "rarity": 5,
        "image": "/assets/entities/wuwa-chisa-splash-full-63525a92.webp",
        "imageSource": "https://wutheringwaves.kurogames.com/static4.0/assets/qianxiao-63525a92.webp",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 40%",
        "imageVerified": true
      }
    ],
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://wutheringwaves.kurogames.com/kr/main/news/detail/3618",
      "en": "https://wutheringwaves.kurogames.com/en/main/news/detail/5571",
      "ja": "https://wutheringwaves.kurogames.com/jp/main/news/detail/5547",
      "zh": "https://media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/zh/article/3663.json"
    },
    "entityDetails": [
      {
        "id": "wuwa-chisa",
        "name": {
          "ko": "치사",
          "en": "Chisa",
          "ja": "千咲",
          "zh": "千咲"
        },
        "category": {
          "ko": "5★ · 인멸 · 대검 · 복각",
          "en": "5★ · Havoc · Broadblade · Rerun",
          "ja": "星5・消滅・長刃・復刻",
          "zh": "5★ · 湮灭 · 长刃 · 复刻"
        },
        "basis": {
          "ko": "Lv.90 · 최종 돌파 · 공명 체인 0 · 무기·에코·능력치 노드·전투 버프 제외. HP/공격력/방어력은 출처의 정수 표시값. 계수는 별도 표기된 스킬 레벨 기준.",
          "en": "Lv.90, final ascension, Sequence 0; excludes weapons, Echoes, stat nodes and combat buffs. HP/ATK/DEF follow the source’s integer display. Skill levels are specified separately.",
          "ja": "Lv.90・最終突破・共鳴チェーン0。武器・音骸・ステータスノード・戦闘バフなし。HP/攻撃力/防御力は出典の整数表示。倍率のスキルLv.は別記。",
          "zh": "90级、最终突破、共鸣链0；不含武器、声骸、属性节点及战斗增益。生命/攻击/防御采用来源的整数显示值，技能倍率另注等级。"
        },
        "stats": [
          {
            "label": {
              "ko": "HP",
              "en": "HP",
              "ja": "HP",
              "zh": "生命"
            },
            "value": "10,775"
          },
          {
            "label": {
              "ko": "공격력",
              "en": "ATK",
              "ja": "攻撃力",
              "zh": "攻击"
            },
            "value": "438"
          },
          {
            "label": {
              "ko": "방어력",
              "en": "DEF",
              "ja": "防御力",
              "zh": "防御"
            },
            "value": "1,137"
          },
          {
            "label": {
              "ko": "크리티컬",
              "en": "CRIT Rate",
              "ja": "クリティカル",
              "zh": "暴击率"
            },
            "value": "5%"
          },
          {
            "label": {
              "ko": "크리티컬 피해",
              "en": "CRIT DMG",
              "ja": "クリティカルダメージ",
              "zh": "暴击伤害"
            },
            "value": "150%"
          },
          {
            "label": {
              "ko": "공명 효율",
              "en": "Energy Regen",
              "ja": "共鳴効率",
              "zh": "共鸣效率"
            },
            "value": "100%"
          },
          {
            "label": {
              "ko": "능력치 노드 · 크리티컬",
              "en": "Stat nodes · CRIT Rate",
              "ja": "属性ノード・クリティカル",
              "zh": "属性节点 · 暴击率"
            },
            "value": "+8%",
            "note": {
              "ko": "기본값과 별도",
              "en": "Separate from base values",
              "ja": "基本値と別枠",
              "zh": "未计入基础值"
            }
          },
          {
            "label": {
              "ko": "능력치 노드 · 공격력",
              "en": "Stat nodes · ATK",
              "ja": "属性ノード・攻撃力",
              "zh": "属性节点 · 攻击力"
            },
            "value": "+12%",
            "note": {
              "ko": "기본값과 별도",
              "en": "Separate from base values",
              "ja": "基本値と別枠",
              "zh": "未计入基础值"
            }
          }
        ],
        "statSourceKind": "community",
        "groups": [
          {
            "title": {
              "ko": "기본 공격 · 적막",
              "en": "Normal Attack · Reign of Silence",
              "ja": "基本攻撃 · 絶対的無音",
              "zh": "常态攻击 · 俱寂"
            },
            "body": {
              "ko": "일반 공격 2단→파열 관통→운명을 가르는 가위로 이어집니다. 가위의 마지막 타격은 파티를 회복시키며 공명 해방 피해로 계산됩니다.",
              "en": "Two basic stages lead to Rending Lunge and Death Snip. The scissors’ final hit heals the party and counts as Liberation DMG.",
              "ja": "通常2段から突進、続いてハサミの攻撃へ接続。最後の切断で味方を回復し、共鳴解放ダメージ扱いになります。",
              "zh": "普攻2段后接突进与剪击；最终剪断治疗队伍，伤害视为共鸣解放伤害。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://wuwaguide.kurogames.com/ko/?role_id=1508"
            ]
          },
          {
            "title": {
              "ko": "공명 스킬 · 절단면 구도",
              "en": "Resonance Skill · Fractured Composition",
              "ja": "共鳴スキル · 砕けた構図",
              "zh": "共鸣技能 · 碎面构图"
            },
            "body": {
              "ko": "해답의 눈빛은 적을 정체시킵니다. 톱니바퀴의 잔향이100pt이고 지상에 있으면 강화 스킬로 적을 끌어당기고 전기톱 모드에 진입합니다.",
              "en": "Eye of Unraveling stagnates the target. At 100 Ring of Chainsaw on the ground, the enhanced skill groups enemies and enters Chainsaw Mode.",
              "ja": "通常スキルで敵を停滞させます。地上で資源100ptなら強化スキルで敵を引き寄せ、チェンソーモードへ。",
              "zh": "常态技能使敌人停滞；地面且资源100点时，强化技能聚怪并进入链锯模式。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://wuwaguide.kurogames.com/ko/?role_id=1508"
            ]
          },
          {
            "title": {
              "ko": "공명 회로 · 현을 꿰뚫는 시야 · 모든 건 먼지로",
              "en": "Forte Circuit · Sight of Unraveling - Oblivion",
              "ja": "共鳴回路 · 解弦の視界・解体される万物",
              "zh": "共鸣回路 · 解弦视界·万理归尘"
            },
            "body": {
              "ko": "공허히 얽힌 흔적은30초 유지되며 직접 피해를 받으면2초마다 암흑1스택을 부여합니다. 파멸의 선을 가진 캐릭터는 표식 대상의 방어18%를 무시합니다. 전기톱 공격으로 자원을 소모하고 종결 공격으로 파티 실드30초를 제공합니다.",
              "en": "The 30-second mark applies one Havoc Bane stack every 2 seconds when directly damaged. Resonators with Thread of Bane ignore 18% DEF against marked targets. Chainsaw attacks spend resource; the finisher grants a 30-second party shield.",
              "ja": "30秒の印は直接ダメージで2秒ごとに異常1重を付与。対応バフを持つ味方は印の敵の防御18%を無視。チェンソー攻撃で資源を使い、終結攻撃で全員に30秒シールド。",
              "zh": "标记持续30秒，受到直接伤害时每2秒施加1层异常。拥有对应增益的角色攻击标记敌人可无视18%防御。链锯攻击消耗资源，终结攻击提供全队30秒护盾。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://wuwaguide.kurogames.com/ko/?role_id=1508"
            ]
          },
          {
            "title": {
              "ko": "공명 해방 · 즉시 · 초기화",
              "en": "Resonance Liberation · Moment of Nihility",
              "ja": "共鳴解放 · 即刻・虚無回帰",
              "zh": "共鸣解放 · 即刻·归无"
            },
            "body": {
              "ko": "파티 전체를 회복하고 톱니바퀴의 잔향40pt를 얻습니다.15초 동안 전기톱 주요 공격과 자원 소모에 따른 종결 배율 증가 효과가120% 상승하며, 종결 공격 후 종료됩니다.",
              "en": "Heals the party and grants 40 Ring of Chainsaw. For 15 seconds, key chainsaw multipliers and the resource-based finisher bonus rise by 120%; the state ends after the finisher.",
              "ja": "全員を回復し資源40ptを獲得。15秒間、主要チェンソー攻撃と資源消費による終結倍率上昇を120%強化。終結後に終了。",
              "zh": "治疗全队并获得40点资源。15秒内主要链锯攻击及资源消耗带来的终结倍率提升强化120%，终结后状态结束。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://wuwaguide.kurogames.com/ko/?role_id=1508"
            ]
          },
          {
            "title": {
              "ko": "변주 스킬 · 굉음 · 재림",
              "en": "Intro Skill · Reverberance - Return",
              "ja": "変奏スキル · 鳴り響き・再び",
              "zh": "变奏技能 · 鸣响·再临"
            },
            "body": {
              "ko": "등장 시 인멸 피해와 톱니바퀴의 잔향20pt를 제공합니다. 일반 상태는 일반 공격2단, 전기톱 상태는 톱니바퀴·속공2단으로 이어집니다.",
              "en": "Deals Havoc damage and grants 20 Ring of Chainsaw. Follow with basic stage 2 normally or Sawring Blitz stage 2 in Chainsaw Mode.",
              "ja": "登場時に消滅ダメージと資源20pt。通常時は通常2段、チェンソー時は強化攻撃2段へ接続します。",
              "zh": "登场造成湮灭伤害并获得20点资源；通常状态衔接普攻2段，链锯状态衔接强化攻击2段。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://wuwaguide.kurogames.com/ko/?role_id=1508"
            ]
          },
          {
            "title": {
              "ko": "반주 스킬",
              "en": "Outro Skill",
              "ja": "終奏スキル",
              "zh": "延奏技能"
            },
            "body": {
              "ko": "파티에20초 효과를 부여합니다. 공격 명중으로 적의 이상 효과·자기 폭발 스택 상한을3 높이며15초 유지합니다. 이상 효과 부여/피해 후15초간 파멸의 선을 획득합니다.",
              "en": "Grants a 20-second party effect. Hits raise the target’s Negative Status/Electro Rage cap by three for 15 seconds. Applying a status or dealing status damage grants Thread of Bane for 15 seconds.",
              "ja": "全員へ20秒の効果。命中で敵の異常・関連効果の上限を3増やし15秒維持。異常付与または異常ダメージで防御無視用の効果を15秒獲得。",
              "zh": "赋予全队20秒效果，命中后将敌方异常及相关状态层数上限提高3，持续15秒。施加异常或异常伤害后获得15秒对应无视防御效果。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://guide-server.aki-game.net/introduction/info?roleGbId=1508&id=13132"
            ]
          },
          {
            "title": {
              "ko": "고유 스킬",
              "en": "Inherent skills",
              "ja": "固有スキル",
              "zh": "固有技能"
            },
            "body": {
              "ko": "표식 대상 처치 시 공명 스킬 쿨타임을 리셋합니다(3초 간격). 변주 또는 해방 후 인멸 피해와 치료 효과 보너스가 각각20% 증가하며12초 지속됩니다.",
              "en": "Defeating a marked target resets the skill cooldown, at most once every 3 seconds. Intro or Liberation grants 20% Havoc DMG and 20% Healing Bonus for 12 seconds.",
              "ja": "印の敵撃破でスキルCDをリセット（3秒間隔）。変奏または解放後、消滅ダメージと回復効果が各20%増え12秒持続。",
              "zh": "击败标记敌人重置技能冷却，间隔3秒。变奏或解放后湮灭伤害与治疗加成各+20%，持续12秒。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://guide-server.aki-game.net/introduction/info?roleGbId=1508&id=13132"
            ]
          },
          {
            "title": {
              "ko": "주요 계수 · 스킬 Lv.10",
              "en": "Key coefficients · Skill Lv.10",
              "ja": "主要倍率・スキルLv.10",
              "zh": "主要倍率 · 技能10级"
            },
            "body": {
              "ko": "Lv.10 · 체인 0의 표기 계수. 공격력 기준이며 버프·저항·방어 계산 전입니다. 다단 공격은 합산하지 않고 원래 구성을 유지했습니다. 치유·실드는 별도로 표시합니다.",
              "en": "Skill Lv.10, Sequence 0. ATK-based listed coefficients before buffs, resistance and defense. Multi-hit terms remain separate; healing and shields are labeled.",
              "ja": "スキルLv.10・チェーン0の表記倍率。攻撃力基準でバフ・耐性・防御計算前。多段攻撃は元の内訳を維持し、回復とシールドを区別。",
              "zh": "技能10级、共鸣链0的标示倍率，以攻击力为基准，未计算增益、抗性与防御。保留多段构成，治疗和护盾另行标注。"
            },
            "sourceKind": "community",
            "sourceUrls": [
              "https://www.prydwen.gg/wuthering-waves/characters/chisa"
            ],
            "rows": [
              {
                "label": {
                  "ko": "운명을 가르는 가위 피해",
                  "en": "Death Snip damage",
                  "ja": "ハサミ攻撃ダメージ",
                  "zh": "剪击伤害"
                },
                "value": "29.81%+14.91%+104.34%"
              },
              {
                "label": {
                  "ko": "운명을 가르는 가위 치유",
                  "en": "Death Snip healing",
                  "ja": "ハサミ攻撃の回復",
                  "zh": "剪击治疗"
                },
                "value": "1140+50.40% ATK"
              },
              {
                "label": {
                  "ko": "톱니바퀴 궤도 회전",
                  "en": "Serrated Loop",
                  "ja": "強化共鳴スキル",
                  "zh": "强化共鸣技能"
                },
                "value": "17.45%×8"
              },
              {
                "label": {
                  "ko": "공명 해방 피해",
                  "en": "Liberation damage",
                  "ja": "共鳴解放ダメージ",
                  "zh": "共鸣解放伤害"
                },
                "value": "954.29%"
              },
              {
                "label": {
                  "ko": "공명 해방 치유",
                  "en": "Liberation healing",
                  "ja": "共鳴解放の回復",
                  "zh": "共鸣解放治疗"
                },
                "value": "2660+117.60% ATK"
              },
              {
                "label": {
                  "ko": "톱니바퀴·종결 기본 피해",
                  "en": "Finisher base damage",
                  "ja": "終結攻撃の基本倍率",
                  "zh": "终结攻击基础伤害"
                },
                "value": "51.54%+206.13%"
              },
              {
                "label": {
                  "ko": "잔향1pt당 종결 추가 배율",
                  "en": "Finisher bonus per resource point",
                  "ja": "資源1ptごとの終結倍率加算",
                  "zh": "每点资源的终结追加倍率"
                },
                "value": "2.59%"
              },
              {
                "label": {
                  "ko": "톱니바퀴·종결 실드",
                  "en": "Finisher shield",
                  "ja": "終結攻撃シールド",
                  "zh": "终结攻击护盾"
                },
                "value": "3800+168.00% ATK"
              },
              {
                "label": {
                  "ko": "해방 쿨타임",
                  "en": "Liberation cooldown",
                  "ja": "解放CD",
                  "zh": "解放冷却"
                },
                "value": "25s"
              },
              {
                "label": {
                  "ko": "해방 에너지 소모",
                  "en": "Liberation energy cost",
                  "ja": "解放消費エネルギー",
                  "zh": "解放能量消耗"
                },
                "value": "125"
              }
            ]
          },
          {
            "title": {
              "ko": "공명 체인 · 1~6 요약",
              "en": "Resonance Chain · S1–S6",
              "ja": "共鳴チェーン・1〜6要約",
              "zh": "共鸣链 · 1～6摘要"
            },
            "body": {
              "ko": "각 체인의 주요 변화만 요약했습니다. 기본 스탯·계수 표에는 체인 효과를 포함하지 않습니다.",
              "en": "Selected changes per Sequence; the base stats and coefficient table exclude these effects.",
              "ja": "各チェーンの主な変化を要約。基本ステータスと倍率表には反映していません。",
              "zh": "仅摘要各阶主要变化，基础属性与倍率表均未计入这些效果。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://guide-server.aki-game.net/introduction/info?roleGbId=1508&id=13132"
            ],
            "rows": [
              {
                "label": {
                  "ko": "1체인",
                  "en": "S1",
                  "ja": "1チェーン",
                  "zh": "1链"
                },
                "value": "1",
                "note": {
                  "ko": "전기톱 공격 경직 면역. 표식 부여 시 공격력+30%/15초; 대상당1회61,803고정 피해(HP61.80% 아래로 내리지 못함).",
                  "en": "Chainsaw interruption immunity. Marking grants ATK+30%/15s and once-per-target 61,803 fixed damage, capped at reducing HP to61.80%.",
                  "ja": "チェンソー攻撃中断無効。印付与で攻撃+30%・15秒、敵ごと1回61,803固定ダメージ（HP61.80%まで）。",
                  "zh": "链锯抗打断；标记时攻击+30%/15秒，并对每目标一次造成61,803固定伤害，最多降至61.80%生命。"
                }
              },
              {
                "label": {
                  "ko": "2체인",
                  "en": "S2",
                  "ja": "2チェーン",
                  "zh": "2链"
                },
                "value": "2",
                "note": {
                  "ko": "자신의 인멸 저항10% 무시; 파멸의 선 보유 아군 전체 속성 피해+50%.",
                  "en": "Ignores10% Havoc RES; allies with Thread of Bane gain50% All-Attribute DMG.",
                  "ja": "自身は消滅耐性10%無視、対応バフの味方は全属性+50%。",
                  "zh": "自身无视10%湮灭抗性，持有对应增益的队友全属性伤害+50%。"
                }
              },
              {
                "label": {
                  "ko": "3체인",
                  "en": "S3",
                  "ja": "3チェーン",
                  "zh": "3链"
                },
                "value": "3",
                "note": {
                  "ko": "전기톱 주요 배율+120%, 해방 강화와 중첩. 해당 공격의 공진 수치 감소+50%.",
                  "en": "Key chainsaw multipliers+120%, stacks with Liberation; their Vibration Strength reduction+50%.",
                  "ja": "主要チェンソー倍率+120%、解放と重複。共振度削り+50%。",
                  "zh": "主要链锯倍率+120%，与解放叠加；削减共振度效果+50%。"
                }
              },
              {
                "label": {
                  "ko": "4체인",
                  "en": "S4",
                  "ja": "4チェーン",
                  "zh": "4链"
                },
                "value": "4",
                "note": {
                  "ko": "표식의 암흑 효과 부여 간격2초→1초.",
                  "en": "Marked-target Havoc Bane interval2s→1s.",
                  "ja": "印の異常付与間隔2秒→1秒。",
                  "zh": "标记异常施加间隔2秒→1秒。"
                }
              },
              {
                "label": {
                  "ko": "5체인",
                  "en": "S5",
                  "ja": "5チェーン",
                  "zh": "5链"
                },
                "value": "5",
                "note": {
                  "ko": "해방 피해 보너스+100%, 특수 회피 자원 소모−50%.",
                  "en": "Liberation DMG Bonus+100%; special-dodge resource cost−50%.",
                  "ja": "解放ダメージボーナス+100%、特殊回避の資源消費−50%。",
                  "zh": "解放伤害加成+100%，特殊闪避资源消耗−50%。"
                }
              },
              {
                "label": {
                  "ko": "6체인",
                  "en": "S6",
                  "ja": "6チェーン",
                  "zh": "6链"
                },
                "value": "6",
                "note": {
                  "ko": "전기톱 특정 공격 중HP최소1 유지. 강화 표식 적은 이상 피해30% 부스트 및 치사로부터 받는 피해+40%.",
                  "en": "Cannot fall below1HP during specified chainsaw attacks. Enhanced-mark targets take30% amplified status damage and40% more Chisa damage.",
                  "ja": "対象のチェンソー攻撃中HP1を維持。強化印の敵は異常ダメージ30%増幅、千咲からの被ダメージ+40%。",
                  "zh": "指定链锯攻击期间保留至少1生命；强化标记使异常伤害加深30%，千咲造成的承伤+40%。"
                }
              }
            ]
          }
        ],
        "sources": [
          {
            "kind": "official",
            "url": "https://wuwaguide.kurogames.com/ko/?role_id=1508",
            "title": "명조 공식 공략 · 공명자 스킬 DB",
            "publisher": "KURO GAMES"
          },
          {
            "kind": "community",
            "url": "https://wuwaguide.kurogames.com/ko/?role_id=1508&strategy_id=13132",
            "title": "공식 공략 사이트 수록 WW Echoes 가이드",
            "publisher": "WW Echoes"
          },
          {
            "kind": "community",
            "url": "https://www.prydwen.gg/wuthering-waves/characters/chisa",
            "title": "Chisa · stats and skill Lv.10 multipliers",
            "publisher": "Prydwen"
          },
          {
            "kind": "official",
            "url": "https://guide-server.aki-game.net/introduction/info?roleGbId=1508&id=13132",
            "title": "공식 스킬·공명 체인 원문 데이터",
            "publisher": "KURO GAMES"
          }
        ],
        "verifiedAt": "2026-10-16T14:17:47.191463+00:00",
        "notes": [
          {
            "ko": "캐릭터명과 기본 5종 스킬명은 공식 한·영·일·중 표기입니다. 설명·표 라벨은 PATCHWORK의 요약·번역이며, 공식 스킬 자료와 커뮤니티 수치를 구분했습니다.",
            "en": "Character names and the five main skill names use official KO/EN/JA/ZH localization. Explanations and table labels are PATCHWORK summaries/translations; official mechanics and community numbers are labeled separately.",
            "ja": "キャラクター名と主要5種のスキル名は公式の韓・英・日・中表記です。説明と表の項目名はPATCHWORKの要約・翻訳で、公式仕様とコミュニティ数値を区別しています。",
            "zh": "角色及五类主要技能名称采用官方韩、英、日、中本地化。说明与表格标签为PATCHWORK摘要/翻译，并区分官方机制与社区数值。"
          }
        ]
      }
    ]
  },
  {
    "id": "wuwa-iuno",
    "gameId": "wuwa",
    "kind": "pickup",
    "title": {
      "ko": "유노",
      "en": "Iuno",
      "ja": "ユーノ",
      "zh": "尤诺"
    },
    "summary": {
      "ko": "3.7 전반 5성 공명자 픽업.",
      "en": "Version 3.7 phase I featured 5-star Resonator.",
      "ja": "3.7前半の限定星5共鳴者。",
      "zh": "3.7上半五星共鸣者唤取。"
    },
    "region": "global",
    "server": "Asia · UTC+8",
    "startAt": null,
    "endAt": "2026-10-22T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:17:47.191470+00:00",
    "sourceUrl": "https://wutheringwaves.kurogames.com/en/main/news/detail/5546",
    "sourceTitle": "Version 3.7 Featured Resonator/Weapon Convene: Phase I",
    "image": "/assets/entities/wuwa-iuno-splash-full-691764b5.webp",
    "imageSource": "https://wutheringwaves.kurogames.com/static4.0/assets/younuo-691764b5.webp",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 38%",
    "imageVerified": true,
    "version": "3.7",
    "rarity": 5,
    "featured": false,
    "timingNote": {
      "ko": "아시아 종료: 10월 22일 10:59 KST/JST. 일본 공식 공지에서 시간대를 명시했습니다.",
      "en": "Asia end: October 22, 10:59 JST (UTC+9), explicitly stated in the Japanese official notice.",
      "ja": "アジア終了：10月22日10:59（日本標準時）。",
      "zh": "亞洲結束：10月22日09:59（UTC+8），據日文官方公告換算。"
    },
    "pickupType": "rerun",
    "pickupGroup": "wuwa-37-phase-1",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "유노",
          "en": "Iuno",
          "ja": "ユーノ",
          "zh": "尤诺"
        },
        "type": "rerun",
        "rarity": 5,
        "image": "/assets/entities/wuwa-iuno-splash-full-691764b5.webp",
        "imageSource": "https://wutheringwaves.kurogames.com/static4.0/assets/younuo-691764b5.webp",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 38%",
        "imageVerified": true
      }
    ],
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://wutheringwaves.kurogames.com/kr/main/news/detail/4043",
      "en": "https://wutheringwaves.kurogames.com/en/main/news/detail/5571",
      "ja": "https://wutheringwaves.kurogames.com/jp/main/news/detail/5547",
      "zh": "https://media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/zh/article/3211.json"
    },
    "entityDetails": [
      {
        "id": "wuwa-iuno",
        "name": {
          "ko": "유노",
          "en": "Iuno",
          "ja": "ユーノ",
          "zh": "尤诺"
        },
        "category": {
          "ko": "5★ · 기류 · 권갑 · 복각",
          "en": "5★ · Aero · Gauntlets · Rerun",
          "ja": "星5・気動・手甲・復刻",
          "zh": "5★ · 气动 · 臂铠 · 复刻"
        },
        "basis": {
          "ko": "Lv.90 · 최종 돌파 · 공명 체인 0 · 무기·에코·능력치 노드·전투 버프 제외. HP/공격력/방어력은 출처의 정수 표시값. 계수는 별도 표기된 스킬 레벨 기준.",
          "en": "Lv.90, final ascension, Sequence 0; excludes weapons, Echoes, stat nodes and combat buffs. HP/ATK/DEF follow the source’s integer display. Skill levels are specified separately.",
          "ja": "Lv.90・最終突破・共鳴チェーン0。武器・音骸・ステータスノード・戦闘バフなし。HP/攻撃力/防御力は出典の整数表示。倍率のスキルLv.は別記。",
          "zh": "90级、最终突破、共鸣链0；不含武器、声骸、属性节点及战斗增益。生命/攻击/防御采用来源的整数显示值，技能倍率另注等级。"
        },
        "stats": [
          {
            "label": {
              "ko": "HP",
              "en": "HP",
              "ja": "HP",
              "zh": "生命"
            },
            "value": "10,525"
          },
          {
            "label": {
              "ko": "공격력",
              "en": "ATK",
              "ja": "攻撃力",
              "zh": "攻击"
            },
            "value": "450"
          },
          {
            "label": {
              "ko": "방어력",
              "en": "DEF",
              "ja": "防御力",
              "zh": "防御"
            },
            "value": "1,124"
          },
          {
            "label": {
              "ko": "크리티컬",
              "en": "CRIT Rate",
              "ja": "クリティカル",
              "zh": "暴击率"
            },
            "value": "5%"
          },
          {
            "label": {
              "ko": "크리티컬 피해",
              "en": "CRIT DMG",
              "ja": "クリティカルダメージ",
              "zh": "暴击伤害"
            },
            "value": "150%"
          },
          {
            "label": {
              "ko": "공명 효율",
              "en": "Energy Regen",
              "ja": "共鳴効率",
              "zh": "共鸣效率"
            },
            "value": "100%"
          },
          {
            "label": {
              "ko": "능력치 노드 · 크리티컬",
              "en": "Stat nodes · CRIT Rate",
              "ja": "属性ノード・クリティカル",
              "zh": "属性节点 · 暴击率"
            },
            "value": "+8%",
            "note": {
              "ko": "기본값과 별도",
              "en": "Separate from base values",
              "ja": "基本値と別枠",
              "zh": "未计入基础值"
            }
          },
          {
            "label": {
              "ko": "능력치 노드 · 공격력",
              "en": "Stat nodes · ATK",
              "ja": "属性ノード・攻撃力",
              "zh": "属性节点 · 攻击力"
            },
            "value": "+12%",
            "note": {
              "ko": "기본값과 별도",
              "en": "Separate from base values",
              "ja": "基本値と別枠",
              "zh": "未计入基础值"
            }
          }
        ],
        "statSourceKind": "community",
        "groups": [
          {
            "title": {
              "ko": "기본 공격 · 예언자의 발걸음",
              "en": "Normal Attack · Moon Steps",
              "ja": "基本攻撃 · 予言する者の孤行",
              "zh": "常态攻击 · 祭者独步"
            },
            "body": {
              "ko": "달의 고리와 달의 활 모두 일반 공격3단입니다. 초승달 상태의 달의 활 일반 공격·회피 반격은 공명 해방 피해로 적용됩니다.",
              "en": "Both Moonring and Moonbow use three basic stages. In New Moon, Moonbow basics and dodge counters count as Liberation DMG.",
              "ja": "月の輪・月の弓とも通常3段。三日月側の月の弓通常・回避反撃は共鳴解放ダメージ扱いです。",
              "zh": "月环与月弓普攻均为3段；新月形态月弓普攻和闪避反击视为共鸣解放伤害。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://wuwaguide.kurogames.com/ko/?role_id=1410"
            ]
          },
          {
            "title": {
              "ko": "공명 스킬 · 예언의 인도",
              "en": "Resonance Skill · Foresight Fugue",
              "ja": "共鳴スキル · 予見の導き",
              "zh": "共鸣技能 · 先觉赋格"
            },
            "body": {
              "ko": "종결의 소리로 달의 순환에 진입합니다. 반달에서는 미완의 소리, 초승달에서는2회 충전식 경계를 넘은 활시위로 바뀝니다. 활시위 공격은 공명 해방 피해입니다.",
              "en": "Closing Refrain enters Lunar Cycle. Half Moon uses Unfinished Refrain; New Moon instead uses the two-charge Arc Beyond the Edge, counted as Liberation DMG.",
              "ja": "対応スキルで月相状態へ。半月では通常の連続攻撃、三日月では2回分の移動射撃へ切替。後者は共鳴解放ダメージ扱い。",
              "zh": "相应技能开启月相循环；半月使用连续攻击，新月改为2次充能的位移射击，后者视为共鸣解放伤害。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://wuwaguide.kurogames.com/ko/?role_id=1410"
            ]
          },
          {
            "title": {
              "ko": "공명 회로 · 차고 기울 때의 움직임",
              "en": "Forte Circuit · Ebb and Flow",
              "ja": "共鳴回路 · 満ち欠けの間に揺らぐ",
              "zh": "共鸣回路 · 于盈亏间涨落"
            },
            "body": {
              "ko": "영성 최대100pt: 변주40, 해방60, 종결/미완의 소리25를 얻습니다. 반달에서 모으고 초승달 공격으로 소모해 피해·협주 회복·치유를 강화합니다. 협주가 가득 차면 완벽한 결말로 파티 치유와 보름달 영역을 펼칩니다. 영역에서 실드를 받으면 전체 피해4% 부스트를 최대10스택 얻습니다(교대 시 해제).",
              "en": "Sentience caps at100: Intro grants40, Liberation60, Closing/Unfinished Refrain25. Build it in Half Moon and spend it in New Moon for enhanced damage, Concerto and healing. Full Concerto unlocks Absolute Fullness and a healing domain. Shield gains inside the domain build4% all-DMG amplification per stack, up to10; switching clears it.",
              "ja": "資源上限100：変奏40・解放60・対応スキル25。半月で蓄え、三日月で消費して攻撃・協奏回復・回復を強化。協奏満タンで強化重撃と回復領域を展開。領域でシールド獲得時、全ダメージ4%増幅を最大10重（交代で解除）。",
              "zh": "资源上限100：变奏40、解放60、对应技能25。半月积累、新月消耗以强化伤害、协奏恢复与治疗。协奏满后强化重击展开治疗领域；领域内获得护盾可叠全伤害加深4%，最多10层，切人清除。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://wuwaguide.kurogames.com/ko/?role_id=1410"
            ]
          },
          {
            "title": {
              "ko": "공명 해방 · 추락한 달의 바다",
              "en": "Resonance Liberation · Beneath Lunar Tides",
              "ja": "共鳴解放 · 溺れし月の海",
              "zh": "共鸣解放 · 溺失月海"
            },
            "body": {
              "ko": "기류 피해를 입히고 달의 순환·반달 상태로 진입합니다. 영성60pt를 얻으며 공중에서도 사용할 수 있습니다.",
              "en": "Deals Aero damage, enters Half Moon Lunar Cycle and grants60 Sentience. Usable in mid-air.",
              "ja": "気動ダメージを与えて半月状態へ入り、資源60ptを獲得。空中でも使用可能。",
              "zh": "造成气动伤害，进入半月循环并获得60点资源，可在空中释放。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://wuwaguide.kurogames.com/ko/?role_id=1410"
            ]
          },
          {
            "title": {
              "ko": "변주 스킬 · 내가 비추어 낸 모습",
              "en": "Intro Skill · Illuminated Manifestation",
              "ja": "変奏スキル · 私が照らし顕す",
              "zh": "变奏技能 · 照我以显"
            },
            "body": {
              "ko": "기류 피해를 입히고 영성40pt를 얻습니다. 고유 스킬 해제 후에는 창백한 달빛의 축복5스택도 즉시 획득합니다.",
              "en": "Deals Aero damage and grants40 Sentience. With the inherent unlocked, it also immediately grants five Pale Moon’s Blessing stacks.",
              "ja": "気動ダメージと資源40ptを獲得。固有スキル解放後はダメージ増幅効果も即時5重獲得。",
              "zh": "造成气动伤害并获得40点资源；解锁固有技能后立即获得5层伤害加深效果。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://wuwaguide.kurogames.com/ko/?role_id=1410"
            ]
          },
          {
            "title": {
              "ko": "반주 스킬",
              "en": "Outro Skill",
              "ja": "終奏スキル",
              "zh": "延奏技能"
            },
            "body": {
              "ko": "기류100% 공격 후 다음 등장 캐릭터의 강공격 피해를50%/14초 부스트합니다. 다른 캐릭터로 교대하면 종료됩니다. 완벽한 결말 도중 교대해도 해당 공격과 반주 효과가 유지됩니다.",
              "en": "Deals100% Aero damage and grants the incoming Resonator50% Heavy Attack amplification for14 seconds, ending on their switch. Swapping during Absolute Fullness preserves the attack and Outro effect.",
              "ja": "気動100%の攻撃後、次のキャラの重撃を50%・14秒増幅。再交代で終了。強化重撃中の交代でも攻撃と終奏効果は有効。",
              "zh": "造成100%气动伤害，使下位角色重击伤害加深50%、持续14秒，切人后结束。强化重击期间切换不会中断攻击或延奏效果。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://guide-server.aki-game.net/introduction/info?roleGbId=1410&id=13127"
            ]
          },
          {
            "title": {
              "ko": "고유 스킬",
              "en": "Inherent skills",
              "ja": "固有スキル",
              "zh": "固有技能"
            },
            "body": {
              "ko": "일반·강공격·회피 반격·스킬·해방·변주 사용 시 공격력32% 실드15초를 자신에게 부여합니다. 변주 또는 해방은 창백한 달빛의 축복5스택을 즉시 제공합니다.",
              "en": "Basic, heavy, dodge-counter, Skill, Liberation and Intro actions grant a personal32%-ATK shield for15 seconds. Intro or Liberation directly grants five amplification stacks.",
              "ja": "通常・重撃・回避反撃・スキル・解放・変奏で自身に攻撃力32%のシールド15秒。変奏または解放で増幅効果5重を即時獲得。",
              "zh": "普攻、重击、闪避反击、技能、解放及变奏会赋予自身攻击力32%的护盾15秒。变奏或解放立即获得5层加深效果。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://guide-server.aki-game.net/introduction/info?roleGbId=1410&id=13127"
            ]
          },
          {
            "title": {
              "ko": "주요 계수 · 스킬 Lv.10",
              "en": "Key coefficients · Skill Lv.10",
              "ja": "主要倍率・スキルLv.10",
              "zh": "主要倍率 · 技能10级"
            },
            "body": {
              "ko": "Lv.10 · 체인 0의 표기 계수. 공격력 기준이며 버프·저항·방어 계산 전입니다. 다단 공격은 합산하지 않고 원래 구성을 유지했습니다. 치유·실드는 별도로 표시합니다.",
              "en": "Skill Lv.10, Sequence 0. ATK-based listed coefficients before buffs, resistance and defense. Multi-hit terms remain separate; healing and shields are labeled.",
              "ja": "スキルLv.10・チェーン0の表記倍率。攻撃力基準でバフ・耐性・防御計算前。多段攻撃は元の内訳を維持し、回復とシールドを区別。",
              "zh": "技能10级、共鸣链0的标示倍率，以攻击力为基准，未计算增益、抗性与防御。保留多段构成，治疗和护盾另行标注。"
            },
            "sourceKind": "community",
            "sourceUrls": [
              "https://www.prydwen.gg/wuthering-waves/characters/iuno"
            ],
            "rows": [
              {
                "label": {
                  "ko": "달의 고리 일반 공격3단",
                  "en": "Moonring basic stage3",
                  "ja": "月の輪・通常3段",
                  "zh": "月环普攻第3段"
                },
                "value": "87.98%×2 + 90.65%"
              },
              {
                "label": {
                  "ko": "영성 소비 · 달의 활3단",
                  "en": "Sentience-enhanced Moonbow stage3",
                  "ja": "資源消費・月の弓3段",
                  "zh": "消耗资源的月弓第3段"
                },
                "value": "266.41%×2"
              },
              {
                "label": {
                  "ko": "영성 소비 · 경계를 넘은 활시위",
                  "en": "Sentience-enhanced Arc Beyond the Edge",
                  "ja": "資源消費・移動射撃",
                  "zh": "消耗资源的位移射击"
                },
                "value": "319.19%×2"
              },
              {
                "label": {
                  "ko": "공명 해방 피해",
                  "en": "Liberation damage",
                  "ja": "共鳴解放ダメージ",
                  "zh": "共鸣解放伤害"
                },
                "value": "1093.46%"
              },
              {
                "label": {
                  "ko": "완벽한 결말 피해",
                  "en": "Absolute Fullness damage",
                  "ja": "強化重撃ダメージ",
                  "zh": "强化重击伤害"
                },
                "value": "159.05%"
              },
              {
                "label": {
                  "ko": "완벽한 결말 치유",
                  "en": "Absolute Fullness healing",
                  "ja": "強化重撃の回復",
                  "zh": "强化重击治疗"
                },
                "value": "194.26% ATK"
              },
              {
                "label": {
                  "ko": "보름달 영역 회당 치유",
                  "en": "Domain healing per tick",
                  "ja": "領域1回の回復",
                  "zh": "领域每次治疗"
                },
                "value": "32.38% ATK"
              },
              {
                "label": {
                  "ko": "보름달 영역 지속(초)",
                  "en": "Domain duration (s)",
                  "ja": "領域持続（秒）",
                  "zh": "领域持续（秒）"
                },
                "value": "30"
              },
              {
                "label": {
                  "ko": "영역 회복 간격(초)",
                  "en": "Domain tick interval (s)",
                  "ja": "領域回復間隔（秒）",
                  "zh": "领域恢复间隔（秒）"
                },
                "value": "5"
              },
              {
                "label": {
                  "ko": "해방 쿨타임(초)",
                  "en": "Liberation cooldown (s)",
                  "ja": "解放CD（秒）",
                  "zh": "解放冷却（秒）"
                },
                "value": "25"
              },
              {
                "label": {
                  "ko": "해방 에너지 소모",
                  "en": "Liberation energy cost",
                  "ja": "解放消費エネルギー",
                  "zh": "解放能量消耗"
                },
                "value": "125"
              }
            ]
          },
          {
            "title": {
              "ko": "공명 체인 · 1~6 요약",
              "en": "Resonance Chain · S1–S6",
              "ja": "共鳴チェーン・1〜6要約",
              "zh": "共鸣链 · 1～6摘要"
            },
            "body": {
              "ko": "각 체인의 주요 변화만 요약했습니다. 기본 스탯·계수 표에는 체인 효과를 포함하지 않습니다.",
              "en": "Selected changes per Sequence; the base stats and coefficient table exclude these effects.",
              "ja": "各チェーンの主な変化を要約。基本ステータスと倍率表には反映していません。",
              "zh": "仅摘要各阶主要变化，基础属性与倍率表均未计入这些效果。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://guide-server.aki-game.net/introduction/info?roleGbId=1410&id=13127"
            ],
            "rows": [
              {
                "label": {
                  "ko": "1체인",
                  "en": "S1",
                  "ja": "1チェーン",
                  "zh": "1链"
                },
                "value": "1",
                "note": {
                  "ko": "달의 순환 공격력+40%; 보름달 영역에서 공명 에너지1/초. 활시위·완벽한 결말 경직 면역.",
                  "en": "Lunar Cycle ATK+40%;1 energy/s in the domain; interruption immunity for Arc and Absolute Fullness.",
                  "ja": "月相中の攻撃+40%、領域内1エネルギー/秒。移動射撃・強化重撃の中断無効。",
                  "zh": "月相状态攻击+40%，领域内每秒1能量；位移射击与强化重击抗打断。"
                }
              },
              {
                "label": {
                  "ko": "2체인",
                  "en": "S2",
                  "ja": "2チェーン",
                  "zh": "2链"
                },
                "value": "2",
                "note": {
                  "ko": "창백한 달빛의 축복10스택에서 전체 피해 추가40% 부스트.",
                  "en": "At10 amplification stacks, gain an additional40% all-DMG amplification.",
                  "ja": "増幅効果10重で全ダメージを追加40%増幅。",
                  "zh": "增益10层时全伤害额外加深40%。"
                }
              },
              {
                "label": {
                  "ko": "3체인",
                  "en": "S3",
                  "ja": "3チェーン",
                  "zh": "3链"
                },
                "value": "3",
                "note": {
                  "ko": "달의 활·활시위·달의 활 반격 피해65% 부스트; 활시위가 일반 공격 연계를 끊지 않음.",
                  "en": "Moonbow basics/counters and Arc gain65% amplification; Arc preserves the basic combo.",
                  "ja": "月の弓通常・反撃と移動射撃を65%増幅、移動射撃で通常連携を維持。",
                  "zh": "月弓普攻、反击与位移射击加深65%；位移射击保留普攻连段。"
                }
              },
              {
                "label": {
                  "ko": "4체인",
                  "en": "S4",
                  "ja": "4チェーン",
                  "zh": "4链"
                },
                "value": "4",
                "note": {
                  "ko": "완벽한 결말로 파티에 공격력160% 실드/30초. 교대 시 전달되는 실드는 아님.",
                  "en": "Absolute Fullness grants each ally a160%-ATK shield for30s; shields are not passed between characters.",
                  "ja": "強化重撃で各味方に攻撃力160%のシールド30秒。交代先への引継ぎは不可。",
                  "zh": "强化重击给予每位队友攻击力160%护盾30秒，不随切换传递。"
                }
              },
              {
                "label": {
                  "ko": "5체인",
                  "en": "S5",
                  "ja": "5チェーン",
                  "zh": "5链"
                },
                "value": "5",
                "note": {
                  "ko": "공명 해방 피해 보너스+20%.",
                  "en": "Liberation DMG Bonus+20%.",
                  "ja": "共鳴解放ダメージボーナス+20%。",
                  "zh": "共鸣解放伤害加成+20%。"
                }
              },
              {
                "label": {
                  "ko": "6체인",
                  "en": "S6",
                  "ja": "6チェーン",
                  "zh": "6链"
                },
                "value": "6",
                "note": {
                  "ko": "완벽한 결말 배율+1600%. 사용 후 초승달 재진입·영성100 회복·활시위 충전 리셋.",
                  "en": "Absolute Fullness multiplier+1600%; re-enters New Moon, restores100 Sentience and resets Arc charges.",
                  "ja": "強化重撃倍率+1600%。使用後三日月へ再突入、資源100回復・移動射撃をリセット。",
                  "zh": "强化重击倍率+1600%；之后重新进入新月、恢复100资源并重置位移射击充能。"
                }
              }
            ]
          }
        ],
        "sources": [
          {
            "kind": "official",
            "url": "https://wuwaguide.kurogames.com/ko/?role_id=1410",
            "title": "명조 공식 공략 · 공명자 스킬 DB",
            "publisher": "KURO GAMES"
          },
          {
            "kind": "community",
            "url": "https://wuwaguide.kurogames.com/ko/?role_id=1410&strategy_id=13127",
            "title": "공식 공략 사이트 수록 WW Echoes 가이드",
            "publisher": "WW Echoes"
          },
          {
            "kind": "community",
            "url": "https://www.prydwen.gg/wuthering-waves/characters/iuno",
            "title": "Iuno · stats and skill Lv.10 multipliers",
            "publisher": "Prydwen"
          },
          {
            "kind": "official",
            "url": "https://guide-server.aki-game.net/introduction/info?roleGbId=1410&id=13127",
            "title": "공식 스킬·공명 체인 원문 데이터",
            "publisher": "KURO GAMES"
          }
        ],
        "verifiedAt": "2026-10-16T14:17:47.191470+00:00",
        "notes": [
          {
            "ko": "캐릭터명과 기본 5종 스킬명은 공식 한·영·일·중 표기입니다. 설명·표 라벨은 PATCHWORK의 요약·번역이며, 공식 스킬 자료와 커뮤니티 수치를 구분했습니다.",
            "en": "Character names and the five main skill names use official KO/EN/JA/ZH localization. Explanations and table labels are PATCHWORK summaries/translations; official mechanics and community numbers are labeled separately.",
            "ja": "キャラクター名と主要5種のスキル名は公式の韓・英・日・中表記です。説明と表の項目名はPATCHWORKの要約・翻訳で、公式仕様とコミュニティ数値を区別しています。",
            "zh": "角色及五类主要技能名称采用官方韩、英、日、中本地化。说明与表格标签为PATCHWORK摘要/翻译，并区分官方机制与社区数值。"
          }
        ]
      }
    ]
  },
  {
    "id": "wuwa-kumokiri",
    "gameId": "wuwa",
    "kind": "weapon",
    "title": {
      "ko": "쿠모키리(曇斬)",
      "en": "Kumokiri",
      "ja": "曇斬",
      "zh": "昙切"
    },
    "summary": {
      "ko": "3.7 전반 5성 무기 픽업.",
      "en": "Version 3.7 phase I featured 5-star weapon.",
      "ja": "3.7前半の星5武器ピックアップ。",
      "zh": "3.7上半五星武器唤取。"
    },
    "region": "global",
    "server": "Asia · UTC+8",
    "startAt": null,
    "endAt": "2026-10-22T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:09:38.816210Z",
    "sourceUrl": "https://wutheringwaves.kurogames.com/en/main/news/detail/5546",
    "sourceTitle": "Version 3.7 Featured Resonator/Weapon Convene: Phase I",
    "image": "/assets/entities/wuwa-kumokiri-exact-ad8e4c16.webp",
    "imageSource": "https://hw-media-cdn-mingchao.kurogame.com/object/1790524800000/bp1ghgcr0axdqnq3tg-1790599781062.jpg",
    "imageKind": "weapon",
    "imageFit": "cover",
    "imagePosition": "65% 50%",
    "imageVerified": true,
    "version": "3.7",
    "rarity": 5,
    "featured": false,
    "timingNote": {
      "ko": "아시아 종료: 10월 22일 10:59 KST/JST. 일본 공식 공지에서 시간대를 명시했습니다.",
      "en": "Asia end: October 22, 10:59 JST (UTC+9), explicitly stated in the Japanese official notice.",
      "ja": "アジア終了：10月22日10:59（日本標準時）。",
      "zh": "亞洲結束：10月22日09:59（UTC+8），據日文官方公告換算。"
    },
    "pickupType": "rerun",
    "pickupGroup": "wuwa-37-phase-1",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "쿠모키리(曇斬)",
          "en": "Kumokiri",
          "ja": "曇斬",
          "zh": "昙切"
        },
        "type": "rerun",
        "rarity": 5,
        "image": "/assets/entities/wuwa-kumokiri-exact-ad8e4c16.webp",
        "imageSource": "https://hw-media-cdn-mingchao.kurogame.com/object/1790524800000/bp1ghgcr0axdqnq3tg-1790599781062.jpg",
        "imageKind": "weapon",
        "imageFit": "cover",
        "imagePosition": "65% 50%",
        "imageVerified": true
      }
    ],
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://wutheringwaves.kurogames.com/kr/main/news/detail/4183",
      "en": "https://wutheringwaves.kurogames.com/en/main/news/detail/5571",
      "ja": "https://wutheringwaves.kurogames.com/jp/main/news/detail/5547",
      "zh": "https://media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/zh/article/3663.json"
    },
    "entityDetails": [
      {
        "id": "weapon-21010056",
        "name": {
          "ko": "쿠모키리(曇斬)",
          "en": "Kumokiri",
          "ja": "曇斬",
          "zh": "昙切"
        },
        "category": {
          "ko": "5★ 대검",
          "en": "5★ Broadblade",
          "ja": "★5 長刃",
          "zh": "五星 长刃"
        },
        "basis": {
          "ko": "무기 단독 기본 수치 · Lv.1 / 최종 돌파 Lv.90. 패시브·캐릭터·에코 보정 미포함. 효과 설명은 공명 1단계, 아래 비교표는 공명 1→5단계 순서.",
          "en": "Weapon-only base stats at Lv.1 / fully ascended Lv.90; passive, character and Echo bonuses excluded. Effect summary: rank 1. Comparison rows: ranks 1→5.",
          "ja": "武器単体の基礎値。Lv.1／最終突破後Lv.90。パッシブ・キャラ・音骸の補正を除外。効果説明はランク1、比較値はランク1→5の順。",
          "zh": "武器基础数值：1级／最终突破后90级，不含被动、角色或声骸加成。效果说明按谐振1阶，比较表依次为1→5阶。"
        },
        "stats": [
          {
            "label": {
              "ko": "기초 공격력 · Lv.1",
              "en": "Base ATK · Lv.1",
              "ja": "基礎攻撃力 · Lv.1",
              "zh": "基础攻击力 · 1级"
            },
            "value": "40"
          },
          {
            "label": {
              "ko": "기초 공격력 · Lv.90",
              "en": "Base ATK · Lv.90",
              "ja": "基礎攻撃力 · Lv.90",
              "zh": "基础攻击力 · 90级"
            },
            "value": "500"
          },
          {
            "label": {
              "ko": "크리티컬 · Lv.1",
              "en": "Crit. Rate · Lv.1",
              "ja": "クリティカル率 · Lv.1",
              "zh": "暴击率 · 1级"
            },
            "value": "8.0%"
          },
          {
            "label": {
              "ko": "크리티컬 · Lv.90",
              "en": "Crit. Rate · Lv.90",
              "ja": "クリティカル率 · Lv.90",
              "zh": "暴击率 · 90级"
            },
            "value": "36.0%"
          }
        ],
        "statSourceKind": "community",
        "groups": [
          {
            "title": {
              "ko": "생명의 현 · 공명 1단계",
              "en": "Thread of Fate · Rank 1",
              "ja": "武器効果 · ランク1",
              "zh": "武器效果 · 谐振1阶"
            },
            "body": {
              "ko": "공격력 +12%. 변주 스킬을 사용하거나 이상 효과를 추가할 때마다 자신의 공명 해방 피해 보너스가 8%씩 증가합니다. 최대 3스택이면 파티원이 이상 효과를 추가할 때 그 캐릭터가 전체 속성 피해 보너스 24%를 받습니다.",
              "en": "ATK +12%. Casting Intro Skill or inflicting Negative Status grants the wielder 8% Resonance Liberation DMG Bonus per stack. At 3 stacks, a teammate who inflicts Negative Status gains 24% All-Attribute DMG Bonus.",
              "ja": "攻撃力+12%。変奏スキル使用または異常効果付与で、自身の共鳴解放ダメージボーナスが1スタックにつき8%増加。3スタック時、異常効果を付与したチーム内キャラは全属性ダメージボーナス24%を獲得。",
              "zh": "攻击+12%。施放变奏技能或附加异常效应时，自身每层获得8%共鸣解放伤害加成。达到3层后，队伍成员附加异常效应时，该角色获得24%全属性伤害加成。"
            },
            "sourceKind": "community",
            "sourceUrls": [
              "https://phro.love/db/weapon/21010056",
              "https://wuthering.gg/ko/weapons/kumokiri",
              "https://gamevika.com/ko/wuwa/weapon/kumokiri"
            ]
          },
          {
            "title": {
              "ko": "발동 조건·지속·중첩",
              "en": "Triggers, duration and stacks",
              "ja": "発動・持続・重複条件",
              "zh": "触发、持续与叠加"
            },
            "body": {
              "ko": "공명 해방 피해 보너스: 최대 3스택, 15초 지속. 최대 스택에서 발생하는 파티원 속성 보너스도 15초 지속하며, 같은 이름의 효과는 중첩되지 않습니다. 공명 1단계 3스택 합계는 24%입니다.",
              "en": "Liberation bonus: up to 3 stacks, lasting 15 seconds. The ally Attribute bonus lasts 15 seconds and does not stack with the same-name effect. Rank 1 at 3 stacks totals 24% Liberation DMG Bonus.",
              "ja": "共鳴解放ボーナスは最大3スタック、15秒持続。最大スタック時の味方属性ボーナスも15秒で、同名効果は重複不可。ランク1の3スタック合計は24%。",
              "zh": "共鸣解放加成最多3层，持续15秒；满层后的队友属性加成也持续15秒，同名效果不可叠加。谐振1阶满3层共24%共鸣解放伤害加成。"
            },
            "sourceKind": "community",
            "sourceUrls": [
              "https://phro.love/db/weapon/21010056",
              "https://wuthering.gg/ko/weapons/kumokiri",
              "https://gamevika.com/ko/wuwa/weapon/kumokiri"
            ]
          },
          {
            "title": {
              "ko": "공명 단계별 수치",
              "en": "Values by rank",
              "ja": "ランク別の数値",
              "zh": "各谐振等阶数值"
            },
            "body": {
              "ko": "각 행은 공명 1 → 2 → 3 → 4 → 5단계 순서입니다.",
              "en": "Each row lists ranks 1 → 2 → 3 → 4 → 5.",
              "ja": "各行はランク1 → 2 → 3 → 4 → 5の順です。",
              "zh": "每行依次为谐振1 → 2 → 3 → 4 → 5阶。"
            },
            "sourceKind": "community",
            "sourceUrls": [
              "https://phro.love/db/weapon/21010056",
              "https://wuthering.gg/ko/weapons/kumokiri",
              "https://gamevika.com/ko/wuwa/weapon/kumokiri"
            ],
            "rows": [
              {
                "label": {
                  "ko": "공격력 증가",
                  "en": "ATK increase",
                  "ja": "攻撃力増加",
                  "zh": "攻击力提升"
                },
                "value": "12 / 15 / 18 / 21 / 24%"
              },
              {
                "label": {
                  "ko": "공명 해방 피해 보너스 · 1스택",
                  "en": "Liberation DMG Bonus · per stack",
                  "ja": "共鳴解放ダメージボーナス · 1スタック",
                  "zh": "共鸣解放伤害加成 · 每层"
                },
                "value": "8 / 10 / 12 / 14 / 16%"
              },
              {
                "label": {
                  "ko": "공명 해방 피해 보너스 · 3스택 합계",
                  "en": "Liberation DMG Bonus · 3-stack total",
                  "ja": "共鳴解放ダメージボーナス · 3スタック合計",
                  "zh": "共鸣解放伤害加成 · 3层合计"
                },
                "value": "24 / 30 / 36 / 42 / 48%",
                "note": {
                  "ko": "1스택 수치 × 3으로 계산.",
                  "en": "Calculated as per-stack value × 3.",
                  "ja": "1スタック値×3で算出。",
                  "zh": "按每层数值×3计算。"
                }
              },
              {
                "label": {
                  "ko": "이상 효과를 추가한 파티원 속성 보너스",
                  "en": "Attribute bonus for the teammate inflicting status",
                  "ja": "異常効果を付与した味方の属性ボーナス",
                  "zh": "附加异常效应者的属性加成"
                },
                "value": "24 / 30 / 36 / 42 / 48%"
              }
            ]
          }
        ],
        "sources": [
          {
            "kind": "official",
            "url": "https://wutheringwaves.kurogames.com/kr/main/news/detail/4183",
            "title": "[쿠모키리(曇斬)] 무기 이벤트 튜닝 — 공식 한국어 무기명",
            "publisher": "KURO GAMES 한국 공식"
          },
          {
            "kind": "community",
            "url": "https://phro.love/db/weapon/21010056",
            "title": "쿠모키리(曇斬) — 상세 도감",
            "publisher": "Phro.Love"
          },
          {
            "kind": "community",
            "url": "https://wuthering.gg/ko/weapons/kumokiri",
            "title": "쿠모키리(曇斬) — 한국어 효과 확인",
            "publisher": "Wuthering.gg"
          },
          {
            "kind": "community",
            "url": "https://gamevika.com/ko/wuwa/weapon/kumokiri",
            "title": "쿠모키리(曇斬) — 스탯·공명 단계 교차 확인",
            "publisher": "GameVika"
          }
        ],
        "verifiedAt": "2026-10-16T14:09:38.816210Z",
        "notes": [
          {
            "ko": "무기명은 한국 공식 공지에서 확인했습니다. 상세 능력치는 공개 커뮤니티 도감의 현재 데이터끼리 대조한 값이며, 설명은 편집 요약입니다.",
            "en": "The Korean weapon name is verified in official notices. Detailed stats are cross-checked between public community databases; descriptions are editorial summaries.",
            "ja": "韓国語の武器名は公式告知で確認。詳細値は公開コミュニティ図鑑同士で照合し、説明は編集要約です。",
            "zh": "韩文武器名称已核对官方公告；详细数值对照公开社区图鉴，说明为编辑摘要。"
          }
        ]
      }
    ]
  },
  {
    "id": "wuwa-moongazer",
    "gameId": "wuwa",
    "kind": "weapon",
    "title": {
      "ko": "세상 만물의 진리",
      "en": "Moongazer's Sigil",
      "ja": "万物を書き留める月相",
      "zh": "万物持存的注释"
    },
    "summary": {
      "ko": "3.7 전반 5성 무기 픽업.",
      "en": "Version 3.7 phase I featured 5-star weapon.",
      "ja": "3.7前半の星5武器ピックアップ。",
      "zh": "3.7上半五星武器唤取。"
    },
    "region": "global",
    "server": "Asia · UTC+8",
    "startAt": null,
    "endAt": "2026-10-22T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:09:38.816210Z",
    "sourceUrl": "https://wutheringwaves.kurogames.com/en/main/news/detail/5546",
    "sourceTitle": "Version 3.7 Featured Resonator/Weapon Convene: Phase I",
    "image": "/assets/entities/wuwa-moongazer-exact-86b0d95e.webp",
    "imageSource": "https://hw-media-cdn-mingchao.kurogame.com/object/1790524800000/5se8wi7o764x037898-1790599812463.jpg",
    "imageKind": "weapon",
    "imageFit": "cover",
    "imagePosition": "75% 50%",
    "imageVerified": true,
    "version": "3.7",
    "rarity": 5,
    "featured": false,
    "timingNote": {
      "ko": "아시아 종료: 10월 22일 10:59 KST/JST. 일본 공식 공지에서 시간대를 명시했습니다.",
      "en": "Asia end: October 22, 10:59 JST (UTC+9), explicitly stated in the Japanese official notice.",
      "ja": "アジア終了：10月22日10:59（日本標準時）。",
      "zh": "亞洲結束：10月22日09:59（UTC+8），據日文官方公告換算。"
    },
    "pickupType": "rerun",
    "pickupGroup": "wuwa-37-phase-1",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "세상 만물의 진리",
          "en": "Moongazer's Sigil",
          "ja": "万物を書き留める月相",
          "zh": "万物持存的注释"
        },
        "type": "rerun",
        "rarity": 5,
        "image": "/assets/entities/wuwa-moongazer-exact-86b0d95e.webp",
        "imageSource": "https://hw-media-cdn-mingchao.kurogame.com/object/1790524800000/5se8wi7o764x037898-1790599812463.jpg",
        "imageKind": "weapon",
        "imageFit": "cover",
        "imagePosition": "75% 50%",
        "imageVerified": true
      }
    ],
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://wutheringwaves.kurogames.com/kr/main/news/detail/4051",
      "en": "https://wutheringwaves.kurogames.com/en/main/news/detail/5571",
      "ja": "https://wutheringwaves.kurogames.com/jp/main/news/detail/5547",
      "zh": "https://media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/zh/article/3211.json"
    },
    "entityDetails": [
      {
        "id": "weapon-21040046",
        "name": {
          "ko": "세상 만물의 진리",
          "en": "Moongazer's Sigil",
          "ja": "万物を書き留める月相",
          "zh": "万物持存的注释"
        },
        "category": {
          "ko": "5★ 권갑",
          "en": "5★ Gauntlets",
          "ja": "★5 手甲",
          "zh": "五星 臂铠"
        },
        "basis": {
          "ko": "무기 단독 기본 수치 · Lv.1 / 최종 돌파 Lv.90. 패시브·캐릭터·에코 보정 미포함. 효과 설명은 공명 1단계, 아래 비교표는 공명 1→5단계 순서.",
          "en": "Weapon-only base stats at Lv.1 / fully ascended Lv.90; passive, character and Echo bonuses excluded. Effect summary: rank 1. Comparison rows: ranks 1→5.",
          "ja": "武器単体の基礎値。Lv.1／最終突破後Lv.90。パッシブ・キャラ・音骸の補正を除外。効果説明はランク1、比較値はランク1→5の順。",
          "zh": "武器基础数值：1级／最终突破后90级，不含被动、角色或声骸加成。效果说明按谐振1阶，比较表依次为1→5阶。"
        },
        "stats": [
          {
            "label": {
              "ko": "기초 공격력 · Lv.1",
              "en": "Base ATK · Lv.1",
              "ja": "基礎攻撃力 · Lv.1",
              "zh": "基础攻击力 · 1级"
            },
            "value": "40"
          },
          {
            "label": {
              "ko": "기초 공격력 · Lv.90",
              "en": "Base ATK · Lv.90",
              "ja": "基礎攻撃力 · Lv.90",
              "zh": "基础攻击力 · 90级"
            },
            "value": "500"
          },
          {
            "label": {
              "ko": "크리티컬 · Lv.1",
              "en": "Crit. Rate · Lv.1",
              "ja": "クリティカル率 · Lv.1",
              "zh": "暴击率 · 1级"
            },
            "value": "8.0%"
          },
          {
            "label": {
              "ko": "크리티컬 · Lv.90",
              "en": "Crit. Rate · Lv.90",
              "ja": "クリティカル率 · Lv.90",
              "zh": "暴击率 · 90级"
            },
            "value": "36.0%"
          }
        ],
        "statSourceKind": "community",
        "groups": [
          {
            "title": {
              "ko": "만물을 연결하는 달 · 공명 1단계",
              "en": "Plenilune Radiance · Rank 1",
              "ja": "武器効果 · ランク1",
              "zh": "武器效果 · 谐振1阶"
            },
            "body": {
              "ko": "공격력 +12%. 변주 스킬이나 공명 해방 사용 후 15초 동안 공명 해방 피해 보너스 +20%. 실드를 획득하면 공명 해방 피해가 목표 방어력을 스택당 7.2% 무시합니다.",
              "en": "ATK +12%. Intro Skill or Resonance Liberation grants 20% Resonance Liberation DMG Bonus for 15 seconds. Gaining a shield makes Liberation damage ignore 7.2% target DEF per stack.",
              "ja": "攻撃力+12%。変奏スキルまたは共鳴解放の使用後、15秒間共鳴解放ダメージボーナス+20%。シールド獲得で共鳴解放ダメージが敵の防御力を1スタックにつき7.2%無視。",
              "zh": "攻击+12%。施放变奏技能或共鸣解放后，15秒内共鸣解放伤害加成+20%。获得护盾时，共鸣解放伤害每层无视目标7.2%防御。"
            },
            "sourceKind": "community",
            "sourceUrls": [
              "https://phro.love/db/weapon/21040046",
              "https://wuthering.gg/ko/weapons/moongazers-sigil",
              "https://gamevika.com/ko/wuwa/weapon/moongazers-sigil"
            ]
          },
          {
            "title": {
              "ko": "발동 조건·지속·중첩",
              "en": "Triggers, duration and stacks",
              "ja": "発動・持続・重複条件",
              "zh": "触发、持续与叠加"
            },
            "body": {
              "ko": "실드로 얻는 방어력 무시는 0.5초마다 최대 1회, 최대 5스택, 7초 지속. 변주 스킬 사용 직후에는 3초간 최대 스택으로 간주됩니다. 공명 1단계 5스택은 방어력 무시 36%입니다.",
              "en": "Shield-triggered DEF ignore can trigger once per 0.5 seconds, lasts 7 seconds, and stacks up to 5 times. Intro Skill immediately treats it as max stacks for 3 seconds. Rank 1 at 5 stacks ignores 36% DEF.",
              "ja": "シールドによる防御無視は0.5秒に1回まで、最大5スタック、7秒持続。変奏スキル直後は3秒間最大スタック扱い。ランク1の5スタックで防御力36%無視。",
              "zh": "护盾触发的防御无视每0.5秒最多触发1次，最多5层，持续7秒。施放变奏后3秒内按满层计算。谐振1阶满5层无视36%防御。"
            },
            "sourceKind": "community",
            "sourceUrls": [
              "https://phro.love/db/weapon/21040046",
              "https://wuthering.gg/ko/weapons/moongazers-sigil",
              "https://gamevika.com/ko/wuwa/weapon/moongazers-sigil"
            ]
          },
          {
            "title": {
              "ko": "공명 단계별 수치",
              "en": "Values by rank",
              "ja": "ランク別の数値",
              "zh": "各谐振等阶数值"
            },
            "body": {
              "ko": "각 행은 공명 1 → 2 → 3 → 4 → 5단계 순서입니다.",
              "en": "Each row lists ranks 1 → 2 → 3 → 4 → 5.",
              "ja": "各行はランク1 → 2 → 3 → 4 → 5の順です。",
              "zh": "每行依次为谐振1 → 2 → 3 → 4 → 5阶。"
            },
            "sourceKind": "community",
            "sourceUrls": [
              "https://phro.love/db/weapon/21040046",
              "https://wuthering.gg/ko/weapons/moongazers-sigil",
              "https://gamevika.com/ko/wuwa/weapon/moongazers-sigil"
            ],
            "rows": [
              {
                "label": {
                  "ko": "공격력 증가",
                  "en": "ATK increase",
                  "ja": "攻撃力増加",
                  "zh": "攻击力提升"
                },
                "value": "12 / 15 / 18 / 21 / 24%"
              },
              {
                "label": {
                  "ko": "공명 해방 피해 보너스",
                  "en": "Liberation DMG Bonus",
                  "ja": "共鳴解放ダメージボーナス",
                  "zh": "共鸣解放伤害加成"
                },
                "value": "20 / 25 / 30 / 35 / 40%"
              },
              {
                "label": {
                  "ko": "방어력 무시 · 1스택",
                  "en": "DEF ignore · per stack",
                  "ja": "防御力無視 · 1スタック",
                  "zh": "防御无视 · 每层"
                },
                "value": "7.2 / 8.4 / 9.6 / 10.8 / 12%"
              },
              {
                "label": {
                  "ko": "방어력 무시 · 5스택 합계",
                  "en": "DEF ignore · 5-stack total",
                  "ja": "防御力無視 · 5スタック合計",
                  "zh": "防御无视 · 5层合计"
                },
                "value": "36 / 42 / 48 / 54 / 60%",
                "note": {
                  "ko": "1스택 수치 × 5로 계산.",
                  "en": "Calculated as per-stack value × 5.",
                  "ja": "1スタック値×5で算出。",
                  "zh": "按每层数值×5计算。"
                }
              }
            ]
          }
        ],
        "sources": [
          {
            "kind": "official",
            "url": "https://wutheringwaves.kurogames.com/kr/main/news/detail/4051",
            "title": "[무기의 울림] 세상 만물의 진리 확률 UP — 공식 한국어 무기명",
            "publisher": "KURO GAMES 한국 공식"
          },
          {
            "kind": "community",
            "url": "https://phro.love/db/weapon/21040046",
            "title": "세상 만물의 진리 — 상세 도감",
            "publisher": "Phro.Love"
          },
          {
            "kind": "community",
            "url": "https://wuthering.gg/ko/weapons/moongazers-sigil",
            "title": "세상 만물의 진리 — 한국어 효과 확인",
            "publisher": "Wuthering.gg"
          },
          {
            "kind": "community",
            "url": "https://gamevika.com/ko/wuwa/weapon/moongazers-sigil",
            "title": "세상 만물의 진리 — 스탯·공명 단계 교차 확인",
            "publisher": "GameVika"
          }
        ],
        "verifiedAt": "2026-10-16T14:09:38.816210Z",
        "notes": [
          {
            "ko": "무기명은 한국 공식 공지에서 확인했습니다. 상세 능력치는 공개 커뮤니티 도감의 현재 데이터끼리 대조한 값이며, 설명은 편집 요약입니다.",
            "en": "The Korean weapon name is verified in official notices. Detailed stats are cross-checked between public community databases; descriptions are editorial summaries.",
            "ja": "韓国語の武器名は公式告知で確認。詳細値は公開コミュニティ図鑑同士で照合し、説明は編集要約です。",
            "zh": "韩文武器名称已核对官方公告；详细数值对照公开社区图鉴，说明为编辑摘要。"
          }
        ]
      }
    ]
  },
  {
    "region": "global",
    "startAt": null,
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:02:13.778662+00:00",
    "id": "wuwa-update-37",
    "gameId": "wuwa",
    "kind": "update",
    "title": {
      "ko": "3.7 · 거울에 잠긴 허상, 마음이 비추는 인간 세상",
      "en": "3.7 · Prism's Illusion, Heart's Illumination",
      "ja": "3.7 · 鏡に鎖す妄世、心で照らす紅塵",
      "zh": "3.7 · 镜锁妄世，心照红尘"
    },
    "summary": {
      "ko": "여우의 별자리·쇄명과 새 지역, 콘텐츠를 소개하는 3.7 업데이트.",
      "en": "Version 3.7 introduces Hsin, Suoming, a new area and activities.",
      "ja": "心・鎖暝、新エリアとイベントを紹介するVer.3.7。",
      "zh": "3.7版本介紹心、锁暝、新區域與活動。"
    },
    "server": "Asia · UTC+8",
    "sourceUrl": "https://wutheringwaves.kurogames.com/kr/main/news/detail/5572",
    "sourceTitle": "「거울에 잠긴 허상, 마음이 비추는 인간 세상」 3.7 버전 업데이트 내용 안내",
    "version": "3.7",
    "image": "/assets/wuwa-wallpaper-0.webp",
    "imageSource": "https://hw-media-cdn-mingchao.kurogame.com/object/1791734400000/hkbm7pcp8gurgihc69-1791807905497.jpg",
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://wutheringwaves.kurogames.com/kr/main/news/detail/5572",
      "en": "https://wutheringwaves.kurogames.com/en/main/news/detail/5571",
      "ja": "https://wutheringwaves.kurogames.com/jp/main/news/detail/5570",
      "zh": "https://media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/zh/article/5569.json"
    },
    "sourceLocale": "ko"
  },
  {
    "region": "global",
    "startAt": "2026-10-15T10:00:00+08:00",
    "endAt": "2026-11-01T09:59:00+08:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:02:13.778662+00:00",
    "id": "wuwa-fishing",
    "gameId": "wuwa",
    "kind": "event",
    "title": {
      "ko": "조월 풍어",
      "en": "Waking Moon Fishing",
      "ja": "朝月の魚群",
      "zh": "朝月鱼涌"
    },
    "summary": {
      "ko": "낚시 도감과 임무를 완료해 별의 소리를 받는 웹 이벤트.",
      "en": "Complete fishing index entries and tasks for Astrites.",
      "ja": "釣り図鑑と任務で星声を獲得できるWebイベント。",
      "zh": "完成钓鱼图鉴与任务获取星声的网页活动。"
    },
    "server": "Asia · UTC+8",
    "sourceUrl": "https://wutheringwaves.kurogames.com/kr/main/news/detail/5572",
    "sourceTitle": "「거울에 잠긴 허상, 마음이 비추는 인간 세상」 3.7 버전 업데이트 내용 안내",
    "version": "3.7",
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://wutheringwaves.kurogames.com/kr/main/news/detail/5572",
      "en": "https://wutheringwaves.kurogames.com/en/main/news/detail/5571",
      "ja": "https://wutheringwaves.kurogames.com/jp/main/news/detail/5570",
      "zh": "https://media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/zh/article/5569.json"
    },
    "sourceLocale": "ko"
  },
  {
    "id": "nte-blackbird",
    "gameId": "nte",
    "kind": "pickup",
    "title": {
      "ko": "레이븐",
      "en": "Blackbird",
      "ja": "クロバネ",
      "zh": "黑羽"
    },
    "summary": {
      "ko": "기간 한정 S급 캐릭터 배너.",
      "en": "Limited S-class character board.",
      "ja": "期間限定Sクラスキャラクター。",
      "zh": "限时S级角色卡池。"
    },
    "region": "global",
    "server": "Asia · UTC+8",
    "startAt": null,
    "endAt": "2026-10-21T05:59:00+08:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:11:03.794663+00:00",
    "sourceUrl": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
    "sourceTitle": "1.4 버전 「누구를 위하여 기도를 올리나」 업데이트 공지",
    "image": "/assets/entities/nte-blackbird-ko-full-3e4f6a25.jpg",
    "imageSource": "https://nng-phinf.pstatic.net/MjAyNjA5MjRfMjIy/MDAxNzkwMjUwMDA0MTM0.lPsOnbyfW3Txna-I-n2Jn0PO2awMCMdo_1azjov5z8Eg.VBBvl34mA8y6Z1wXvYc_wQhsprk-1Umno7d4O2c7Umkg.JPEG/1920x1080-kr.jpg",
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true,
    "version": "1.4",
    "featured": true,
    "pickupType": "new",
    "pickupGroup": "nte-14-phase-1",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "레이븐",
          "en": "Blackbird",
          "ja": "クロバネ",
          "zh": "黑羽"
        },
        "type": "new",
        "image": "/assets/entities/nte-blackbird-ko-full-3e4f6a25.jpg",
        "imageSource": "https://nng-phinf.pstatic.net/MjAyNjA5MjRfMjIy/MDAxNzkwMjUwMDA0MTM0.lPsOnbyfW3Txna-I-n2Jn0PO2awMCMdo_1azjov5z8Eg.VBBvl34mA8y6Z1wXvYc_wQhsprk-1Umno7d4O2c7Umkg.JPEG/1920x1080-kr.jpg",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
      "en": "https://nte.perfectworld.com/en/article/news/gamenews/20260929/264409.html",
      "ja": "https://nte.perfectworld.com/jp/article/news/gamenews/20260929/264412.html",
      "zh": "https://nte.perfectworld.com/cn/article/news/gamenews/20260929/264407.html"
    },
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://game.naver.com/lounge/NTE/board/detail/8252353",
        "title": "한국 공식 픽업 배너",
        "publisher": "이환 공식 라운지"
      }
    ]
  },
  {
    "id": "nte-lacrimosa",
    "gameId": "nte",
    "kind": "pickup",
    "title": {
      "ko": "라크리모사",
      "en": "Lacrimosa",
      "ja": "レクイエム",
      "zh": "安魂曲"
    },
    "summary": {
      "ko": "기간 한정 S급 캐릭터 배너.",
      "en": "Limited S-class character board.",
      "ja": "期間限定Sクラスキャラクター。",
      "zh": "限时S级角色卡池。"
    },
    "region": "global",
    "server": "Asia · UTC+8",
    "startAt": null,
    "endAt": "2026-10-21T05:59:00+08:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:11:03.794663+00:00",
    "sourceUrl": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
    "sourceTitle": "1.4 버전 「누구를 위하여 기도를 올리나」 업데이트 공지",
    "image": "/assets/entities/nte-lacrimosa-ko-full-76fd214f.jpg",
    "imageSource": "https://nng-phinf.pstatic.net/MjAyNjA5MjRfMjI1/MDAxNzkwMjQ1NjA5ODIw.fl2abbSUcgBRjIPr8XxISE7qlHMtyp6zWx_mgGUiUmQg.vjkL6oMqwLwWwvzesoqoQSkzC3B6GOylkZ5zYo5fyV4g.JPEG/1920x1080-KR.jpg",
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true,
    "version": "1.4",
    "featured": false,
    "pickupType": "rerun",
    "pickupGroup": "nte-14-phase-1",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "라크리모사",
          "en": "Lacrimosa",
          "ja": "レクイエム",
          "zh": "安魂曲"
        },
        "type": "rerun",
        "image": "/assets/entities/nte-lacrimosa-ko-full-76fd214f.jpg",
        "imageSource": "https://nng-phinf.pstatic.net/MjAyNjA5MjRfMjI1/MDAxNzkwMjQ1NjA5ODIw.fl2abbSUcgBRjIPr8XxISE7qlHMtyp6zWx_mgGUiUmQg.vjkL6oMqwLwWwvzesoqoQSkzC3B6GOylkZ5zYo5fyV4g.JPEG/1920x1080-KR.jpg",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
      "en": "https://nte.perfectworld.com/en/article/news/gamenews/20260929/264409.html",
      "ja": "https://nte.perfectworld.com/jp/article/news/gamenews/20260929/264412.html",
      "zh": "https://nte.perfectworld.com/cn/article/news/gamenews/20260929/264407.html"
    },
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://game.naver.com/lounge/NTE/board/detail/8252739",
        "title": "한국 공식 픽업 배너",
        "publisher": "이환 공식 라운지"
      }
    ]
  },
  {
    "id": "nte-crime-punishment",
    "gameId": "nte",
    "kind": "weapon",
    "title": {
      "ko": "죄와 벌",
      "en": "Crime and Punishment",
      "ja": "罪と罰",
      "zh": "罪与罚"
    },
    "summary": {
      "ko": "기간 한정 S급 아크 연구 모집.",
      "en": "Limited S-Class Arc research.",
      "ja": "期間限定Sランク弧盤研究。",
      "zh": "限時S級弧盤研究。"
    },
    "region": "global",
    "server": "Asia · UTC+8",
    "startAt": null,
    "endAt": "2026-10-21T05:59:00+08:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:11:03.794663+00:00",
    "sourceUrl": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
    "sourceTitle": "1.4 버전 「누구를 위하여 기도를 올리나」 업데이트 공지",
    "image": "/assets/entities/nte-crime-punishment-ko-full-a30f85e1.jpg",
    "imageSource": "https://nng-phinf.pstatic.net/MjAyNjA5MjRfMTI0/MDAxNzkwMjUwMzE4ODI3.WvOv27cJUzIV6YqNnRKJDaq3tN4NuA9Lw3iivYCdwUwg.Y6UaJL952fqsCXA4SG4X48hUcvgJCFbN6DZYOefbatUg.JPEG/1920x1080-kr.jpg",
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true,
    "version": "1.4",
    "featured": false,
    "pickupType": "new",
    "pickupGroup": "nte-14-phase-1",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "죄와 벌",
          "en": "Crime and Punishment",
          "ja": "罪と罰",
          "zh": "罪与罚"
        },
        "type": "new",
        "image": "/assets/entities/nte-crime-punishment-ko-full-a30f85e1.jpg",
        "imageSource": "https://nng-phinf.pstatic.net/MjAyNjA5MjRfMTI0/MDAxNzkwMjUwMzE4ODI3.WvOv27cJUzIV6YqNnRKJDaq3tN4NuA9Lw3iivYCdwUwg.Y6UaJL952fqsCXA4SG4X48hUcvgJCFbN6DZYOefbatUg.JPEG/1920x1080-kr.jpg",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
      "en": "https://nte.perfectworld.com/en/article/news/gamenews/20260929/264409.html",
      "ja": "https://nte.perfectworld.com/jp/article/news/gamenews/20260929/264412.html",
      "zh": "https://nte.perfectworld.com/cn/article/news/gamenews/20260929/264407.html"
    },
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://game.naver.com/lounge/NTE/board/detail/8252406",
        "title": "한국 공식 픽업 배너",
        "publisher": "이환 공식 라운지"
      }
    ]
  },
  {
    "id": "nte-last-rose",
    "gameId": "nte",
    "kind": "weapon",
    "title": {
      "ko": "마지막 장미",
      "en": "The Last Rose",
      "ja": "ラスト・ローズ",
      "zh": "最后一朵玫瑰"
    },
    "summary": {
      "ko": "기간 한정 S급 아크 연구 모집.",
      "en": "Limited S-Class Arc research.",
      "ja": "期間限定Sランク弧盤研究。",
      "zh": "限時S級弧盤研究。"
    },
    "region": "global",
    "server": "Asia · UTC+8",
    "startAt": null,
    "endAt": "2026-10-21T05:59:00+08:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:11:03.794663+00:00",
    "sourceUrl": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
    "sourceTitle": "1.4 버전 「누구를 위하여 기도를 올리나」 업데이트 공지",
    "image": "/assets/entities/nte-last-rose-ko-full-4986a9f5.jpg",
    "imageSource": "https://nng-phinf.pstatic.net/MjAyNjA5MjRfMTQ2/MDAxNzkwMjQ1NjIxNzQz.473Y0eZtcFwD1r1MnELCqxT8d9CfdNa7ChgtggGLq7Ag.2HyuIjXYSgitdde8nwLn3onZyCpI5tY6t7i-OxDflZUg.JPEG/1920x1080-KR.jpg",
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true,
    "version": "1.4",
    "featured": false,
    "pickupType": "rerun",
    "pickupGroup": "nte-14-phase-1",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "마지막 장미",
          "en": "The Last Rose",
          "ja": "ラスト・ローズ",
          "zh": "最后一朵玫瑰"
        },
        "type": "rerun",
        "image": "/assets/entities/nte-last-rose-ko-full-4986a9f5.jpg",
        "imageSource": "https://nng-phinf.pstatic.net/MjAyNjA5MjRfMTQ2/MDAxNzkwMjQ1NjIxNzQz.473Y0eZtcFwD1r1MnELCqxT8d9CfdNa7ChgtggGLq7Ag.2HyuIjXYSgitdde8nwLn3onZyCpI5tY6t7i-OxDflZUg.JPEG/1920x1080-KR.jpg",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
      "en": "https://nte.perfectworld.com/en/article/news/gamenews/20260929/264409.html",
      "ja": "https://nte.perfectworld.com/jp/article/news/gamenews/20260929/264412.html",
      "zh": "https://nte.perfectworld.com/cn/article/news/gamenews/20260929/264407.html"
    },
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://game.naver.com/lounge/NTE/board/detail/8252739",
        "title": "한국 공식 픽업 배너",
        "publisher": "이환 공식 라운지"
      }
    ]
  },
  {
    "region": "global",
    "startAt": null,
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.146546+00:00",
    "gameId": "nte",
    "server": "Asia · UTC+8",
    "version": "1.4",
    "sourceUrl": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
    "sourceTitle": "1.4 버전 「누구를 위하여 기도를 올리나」 업데이트 공지",
    "id": "nte-update-14",
    "kind": "update",
    "title": {
      "ko": "1.4 · 누구를 위하여 기도를 올리나",
      "en": "1.4 · For Whom the Verses Mourn",
      "ja": "1.4 · 名もなき祈歌",
      "zh": "1.4 · 祷歌为谁而诵"
    },
    "summary": {
      "ko": "푸카 파라다이스·성 알보 마을과 레이븐 관련 콘텐츠 추가.",
      "en": "Pukaland, St. Arbor and content featuring Blackbird.",
      "ja": "プカランド・セントアルボ村とクロバネの新コンテンツ。",
      "zh": "新增噗卡乐园、圣阿尔博镇與黑羽相關內容。"
    },
    "image": "/assets/nte-background.webp",
    "imageSource": "https://nte.perfectworld.com/public/images/cover260930/box1.jpg",
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
      "en": "https://nte.perfectworld.com/en/article/news/gamenews/20260929/264409.html",
      "ja": "https://nte.perfectworld.com/jp/article/news/gamenews/20260929/264412.html",
      "zh": "https://nte.perfectworld.com/cn/article/news/gamenews/20260929/264407.html"
    },
    "sourceLocale": "ko"
  },
  {
    "region": "global",
    "startAt": "2026-10-08T10:00:00+08:00",
    "endAt": "2026-11-11T05:59:00+08:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.146546+00:00",
    "gameId": "nte",
    "server": "Asia · UTC+8",
    "version": "1.4",
    "sourceUrl": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
    "sourceTitle": "1.4 버전 「누구를 위하여 기도를 올리나」 업데이트 공지",
    "id": "nte-coal-lump",
    "kind": "event",
    "title": {
      "ko": "숯덩이의 보물",
      "en": "Coal Lump's Treasure",
      "ja": "炭団子の秘宝",
      "zh": "炭团的宝藏"
    },
    "summary": {
      "ko": "이벤트 미션과 상점에서 성장 재료 등을 획득.",
      "en": "Earn progression materials through event tasks and the shop.",
      "ja": "イベント任務と交換所で育成素材などを獲得。",
      "zh": "通过活动任务与商店获取养成材料等奖励。"
    },
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
      "en": "https://nte.perfectworld.com/en/article/news/gamenews/20260929/264409.html",
      "ja": "https://nte.perfectworld.com/jp/article/news/gamenews/20260929/264412.html",
      "zh": "https://nte.perfectworld.com/cn/article/news/gamenews/20260929/264407.html"
    },
    "sourceLocale": "ko"
  },
  {
    "region": "global",
    "startAt": null,
    "endAt": "2026-11-11T05:59:00+08:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.146546+00:00",
    "gameId": "nte",
    "server": "Asia · UTC+8",
    "version": "1.4",
    "sourceUrl": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
    "sourceTitle": "1.4 버전 「누구를 위하여 기도를 올리나」 업데이트 공지",
    "id": "nte-circle-gifts",
    "kind": "event",
    "title": {
      "ko": "시즌 선물",
      "en": "Circle Gifts",
      "ja": "7Daysボーナス",
      "zh": "环期赠礼"
    },
    "summary": {
      "ko": "7일 누적 출석으로 진실의 주사위 10개 획득.",
      "en": "Log in on seven days to receive 10 Solid Dice.",
      "ja": "7日間ログインで本質サイコロ10個を獲得。",
      "zh": "累計簽到7日獲得質實骰子10個。"
    },
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
      "en": "https://nte.perfectworld.com/en/article/news/gamenews/20260929/264409.html",
      "ja": "https://nte.perfectworld.com/jp/article/news/gamenews/20260929/264412.html",
      "zh": "https://nte.perfectworld.com/cn/article/news/gamenews/20260929/264407.html"
    },
    "sourceLocale": "ko"
  },
  {
    "region": "global",
    "startAt": "2026-10-07T06:30:00+08:00",
    "endAt": "2026-11-11T05:59:00+08:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.146546+00:00",
    "gameId": "nte",
    "server": "Asia · UTC+8",
    "version": "1.4",
    "sourceUrl": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
    "sourceTitle": "1.4 버전 「누구를 위하여 기도를 올리나」 업데이트 공지",
    "id": "nte-wandering-stars",
    "kind": "package",
    "title": {
      "ko": "레이븐 · 별지기",
      "en": "Blackbird · Wandering Stars",
      "ja": "クロバネ · 蒼羽ソワレ",
      "zh": "黑羽 · 牧星者"
    },
    "summary": {
      "ko": "레이븐 의상 할인: 이상 수정 2,680개. 정가 3,280개.",
      "en": "Blackbird outfit: 2,680 Riftcrystal during the offer, normally 3,280.",
      "ja": "クロバネ衣装の期間限定割引。",
      "zh": "黑羽時裝限時優惠。"
    },
    "price": {
      "amount": 2680,
      "currency": "Riftcrystal",
      "platform": "In-game"
    },
    "timingNote": {
      "ko": "의상은 상시 판매되며 표시 기간은 할인 기간입니다.",
      "en": "The outfit remains available; dates indicate the sale window.",
      "ja": "衣装は常設販売。表示期間は割引期間です。",
      "zh": "服装为常驻商品，所示时间为折扣期。"
    },
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://nte.perfectworld.com/kr/article/news/gamenews/20260929/264413.html",
      "en": "https://nte.perfectworld.com/en/article/news/gamenews/20260929/264409.html",
      "ja": "https://nte.perfectworld.com/jp/article/news/gamenews/20260929/264412.html",
      "zh": "https://nte.perfectworld.com/cn/article/news/gamenews/20260929/264407.html"
    },
    "sourceLocale": "ko"
  },
  {
    "id": "arknights-sealed",
    "gameId": "arknights",
    "kind": "pickup",
    "title": {
      "ko": "켈시 에스페란타 / 클로저",
      "en": "Kal'tsit Esperanta / Closure",
      "ja": "ケルシー・エスペランタ / クロージャ",
      "zh": "凯尔希·思衡托 / 可露希尔"
    },
    "summary": {
      "ko": "서약 한정 헤드헌팅. 켈시 에스페란타·클로저·크랙본 신규 등장.",
      "en": "Sealed With Time features new operators Kal’tsit Esperanta, Closure and Crackborne.",
      "ja": "約諾：ケルシー・エスペランタ、クロージャ、クラックボーンが新登場。",
      "zh": "承諾：凯尔希·思衡托、可露希尔、裂响新登場。"
    },
    "region": "global",
    "server": "Global UTC−7",
    "startAt": "2026-10-14T08:00:00-07:00",
    "endAt": "2026-10-28T03:59:00-07:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T13:39:48.836700+00:00",
    "sourceUrl": "https://www.arknights.global/news/4814",
    "sourceTitle": "Main Theme Episode 17: Critical Phase Transition",
    "image": "/assets/entities/ark-kaltsit-e2-full-7f16f169.webp",
    "imageSource": "https://patchwiki.biligame.com/images/arknights/f/f1/gat3rpwcimqbetg26o6pe1kzs4bes1b.png",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "43% 50%",
    "imageVerified": true,
    "version": "Episode 17",
    "versionTitle": {
      "ko": "메인 스토리 제17장",
      "en": "Episode 17",
      "ja": "第17章",
      "zh": "第十七章"
    },
    "rarity": 6,
    "featured": true,
    "pickupType": "new",
    "pickupGroup": "arknights-global-sealed-with-time",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "켈시 에스페란타",
          "en": "Kal'tsit Esperanta",
          "ja": "ケルシー・エスペランタ",
          "zh": "凯尔希·思衡托"
        },
        "type": "new",
        "role": "featured",
        "rarity": 6,
        "image": "/assets/entities/ark-kaltsit-e2-full-7f16f169.webp",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/f/f1/gat3rpwcimqbetg26o6pe1kzs4bes1b.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "43% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "클로저",
          "en": "Closure",
          "ja": "クロージャ",
          "zh": "可露希尔"
        },
        "type": "new",
        "role": "featured",
        "rarity": 6,
        "image": "/assets/entities/ark-closure-e2-full-c8409a3d.webp",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/0/0a/np6cjo1ea1t8vd7s96g9tc5j7rqfd5m.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "크랙본",
          "en": "Crackborne",
          "ja": "クラックボーン",
          "zh": "裂响"
        },
        "type": "new",
        "role": "rate-up",
        "rarity": 5,
        "image": "/assets/entities/ark-crackborne-e2-full-c9777867.webp",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/9/97/4ye63oksjsx23cbm09kz34pllj2e7be.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true
      }
    ],
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "en",
    "localizationSources": {
      "ko": "https://x.com/ArknightsKorea/status/2109910414112985274",
      "en": "https://www.arknights.global/news/4814",
      "ja": "https://arknights.jp/news/4805",
      "zh": "https://ak.hypergryph.com/news/3046"
    },
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/2109910414112985274",
        "title": "한국 공식 캐릭터·픽업 안내",
        "publisher": "한국 공식"
      }
    ],
    "highlights": [
      {
        "ko": "주 픽업 6★ 2명 · 추가 확률 상승 5★ 1명",
        "en": "2 featured 6★ operators · 1 additional 5★ rate-up",
        "ja": "主対象★6・2名／追加確率UP★5・1名",
        "zh": "主推6★两名，另有5★一名概率提升"
      }
    ],
    "bannerName": {
      "ko": "한정 헤드헌팅 · 서약",
      "en": "Limited · Sealed With Time",
      "ja": "限定スカウト・約諾",
      "zh": "限定寻访 · 约诺"
    }
  },
  {
    "region": "global",
    "startAt": "2026-10-14T08:00:00-07:00",
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T10:45:48.444398Z",
    "gameId": "arknights",
    "server": "Global UTC−7",
    "sourceUrl": "https://www.arknights.global/news/4814",
    "sourceTitle": "Main Theme Episode 17: Critical Phase Transition",
    "version": "Episode 17",
    "id": "arknights-ep17",
    "kind": "update",
    "title": {
      "ko": "메인 스토리 제17장",
      "en": "Episode 17 · Critical Phase Transition",
      "ja": "第十七章 · 相変臨界",
      "zh": "第十七章 · 相变临界"
    },
    "summary": {
      "ko": "메인 스토리 17장 개방 및 기간 한정 보상.",
      "en": "Main story Episode 17 opens with limited-time rewards.",
      "ja": "メインストーリー第17章と期間限定報酬。",
      "zh": "主线第17章开放并附有限时奖励。"
    },
    "image": "/assets/arknights-hero.webp",
    "imageSource": "https://webusstatic.yo-star.com/web-cms-test/upload/content/2026/10/09/RPgofnTc.jpg",
    "featured": false,
    "officialLocales": [
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "en": "https://www.arknights.global/news/4814",
      "ja": "https://arknights.jp/news/4805",
      "zh": "https://ak.hypergryph.com/news/3046"
    },
    "translatedLocales": [
      "ko"
    ],
    "sourceLocale": "en",
    "versionTitle": {
      "ko": "메인 스토리 제17장",
      "en": "Episode 17",
      "ja": "第17章",
      "zh": "第十七章"
    }
  },
  {
    "region": "global",
    "startAt": "2026-10-14T08:00:00-07:00",
    "endAt": "2026-10-28T03:59:00-07:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T10:45:48.444398Z",
    "gameId": "arknights",
    "server": "Global UTC−7",
    "sourceUrl": "https://www.arknights.global/news/4814",
    "sourceTitle": "Main Theme Episode 17: Critical Phase Transition",
    "version": "Episode 17",
    "id": "arknights-free-pull",
    "kind": "event",
    "title": {
      "ko": "매일 무료 헤드헌팅",
      "en": "Daily free headhunting",
      "ja": "毎日無料スカウト",
      "zh": "每日免費尋訪"
    },
    "summary": {
      "ko": "서약 한정 헤드헌팅에서 하루 1회 무료. 미사용 횟수는 이월되지 않습니다.",
      "en": "One free pull per day in Sealed With Time. Unused pulls do not carry over.",
      "ja": "約諾で毎日1回無料。未使用回数は翌日に引き継がれません。",
      "zh": "承諾限定尋訪每日免費1次，未用次數不累積。"
    },
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://x.com/ArknightsKorea/status/2109910414112985274",
      "en": "https://www.arknights.global/news/4814",
      "ja": "https://arknights.jp/news/4805",
      "zh": "https://ak.hypergryph.com/news/3046"
    },
    "versionTitle": {
      "ko": "메인 스토리 제17장",
      "en": "Episode 17",
      "ja": "第17章",
      "zh": "第十七章"
    }
  },
  {
    "region": "global",
    "startAt": "2026-10-14T08:00:00-07:00",
    "endAt": "2026-11-11T03:59:00-07:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T10:45:48.444398Z",
    "gameId": "arknights",
    "server": "Global UTC−7",
    "sourceUrl": "https://www.arknights.global/news/4814",
    "sourceTitle": "Main Theme Episode 17: Critical Phase Transition",
    "version": "Episode 17",
    "id": "arknights-duck-purse",
    "kind": "package",
    "title": {
      "ko": "덕로드의 잔돈 지갑",
      "en": "Duck Lord's Change Purse",
      "ja": "ダック卿の小銭入れ",
      "zh": "鸭爵的零钱包"
    },
    "summary": {
      "ko": "순오리지늄 13개 + 용문폐 300,000",
      "en": "13 Originite Prime + 300,000 LMD",
      "ja": "純正源石13個＋龍門幣300,000",
      "zh": "至纯源石13个＋龙门币300,000"
    },
    "contents": [
      {
        "ko": "순오리지늄 13개 + 용문폐 300,000",
        "en": "13 Originite Prime + 300,000 LMD",
        "ja": "純正源石13個＋龍門幣300,000",
        "zh": "至纯源石13个＋龙门币300,000"
      }
    ],
    "image": "/assets/arknights-packs-basic.webp",
    "imageSource": "https://webusstatic.yo-star.com/web-cms-test/upload/content/2026/10/09/sQB8HdvH.jpg",
    "featured": false,
    "officialLocales": [
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "en": "https://www.arknights.global/news/4814",
      "ja": "https://arknights.jp/news/4806",
      "zh": "https://ak.hypergryph.com/news/3046"
    },
    "translatedLocales": [
      "ko"
    ],
    "sourceLocale": "en",
    "versionTitle": {
      "ko": "메인 스토리 제17장",
      "en": "Episode 17",
      "ja": "第17章",
      "zh": "第十七章"
    }
  },
  {
    "region": "global",
    "startAt": "2026-10-14T08:00:00-07:00",
    "endAt": "2026-11-11T03:59:00-07:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T10:45:48.444398Z",
    "gameId": "arknights",
    "server": "Global UTC−7",
    "sourceUrl": "https://www.arknights.global/news/4814",
    "sourceTitle": "Main Theme Episode 17: Critical Phase Transition",
    "version": "Episode 17",
    "id": "arknights-briefcase",
    "kind": "package",
    "title": {
      "ko": "켈시의 서류 가방",
      "en": "Kal'tsit's Briefcase",
      "ja": "ケルシーの鞄",
      "zh": "凯尔希的手提箱"
    },
    "summary": {
      "ko": "순오리지늄 16개 + 용문폐 700,000",
      "en": "16 Originite Prime + 700,000 LMD",
      "ja": "純正源石16個＋龍門幣700,000",
      "zh": "至纯源石16个＋龙门币700,000"
    },
    "contents": [
      {
        "ko": "순오리지늄 16개 + 용문폐 700,000",
        "en": "16 Originite Prime + 700,000 LMD",
        "ja": "純正源石16個＋龍門幣700,000",
        "zh": "至纯源石16个＋龙门币700,000"
      }
    ],
    "image": "/assets/arknights-packs-basic.webp",
    "imageSource": "https://webusstatic.yo-star.com/web-cms-test/upload/content/2026/10/09/sQB8HdvH.jpg",
    "featured": false,
    "officialLocales": [
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "en": "https://www.arknights.global/news/4814",
      "ja": "https://arknights.jp/news/4806",
      "zh": "https://ak.hypergryph.com/news/3046"
    },
    "translatedLocales": [
      "ko"
    ],
    "sourceLocale": "en",
    "versionTitle": {
      "ko": "메인 스토리 제17장",
      "en": "Episode 17",
      "ja": "第17章",
      "zh": "第十七章"
    }
  },
  {
    "id": "genshin-71-skirk",
    "gameId": "genshin",
    "kind": "pickup",
    "title": {
      "ko": "스커크",
      "en": "Skirk",
      "ja": "スカーク",
      "zh": "丝柯克"
    },
    "summary": {
      "ko": "한정 5★ · 얼음. 달리아·캔디스·미카 확률 UP.",
      "en": "Limited 5★ Cryo. Dahlia, Candace and Mika also rate up.",
      "ja": "限定★5・氷。ダリア、キャンディス、ミカも確率UP。",
      "zh": "限定5★冰元素角色。「虚星临渡」；塔利雅、坎蒂丝、米卡同步概率提升。"
    },
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": "2026-10-13T18:00:00+08:00",
    "endAt": "2026-11-03T14:59:00+08:00",
    "publishedAt": "2026-10-08",
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://genshin.hoyoverse.com/ko/news/detail/166634",
    "sourceTitle": "7.1 버전 이벤트 기원 알림 제2회",
    "version": "7.1",
    "image": "/assets/entities/skirk-8f6cf04f.webp",
    "imageSource": "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2025/06/16/c811574d08b3291a38980c2c51d2c408_2989697503942306840.png",
    "rarity": 5,
    "featured": true,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://genshin.hoyoverse.com/ko/news/detail/166634",
      "en": "https://genshin.hoyoverse.com/en/news/detail/166634",
      "ja": "https://genshin.hoyoverse.com/ja/news/detail/166634",
      "zh": "https://ys.mihoyo.com/main/news/detail/166763"
    },
    "poolType": "character",
    "pickupType": "rerun",
    "pickupGroup": "genshin-global-asia-7.1-phase2-character",
    "pickupMembers": [
      {
        "name": {
          "ko": "스커크",
          "en": "Skirk",
          "ja": "スカーク",
          "zh": "丝柯克"
        },
        "type": "rerun",
        "rarity": 5,
        "image": "/assets/entities/skirk-8f6cf04f.webp",
        "imageSource": "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2025/06/16/c811574d08b3291a38980c2c51d2c408_2989697503942306840.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 32%",
        "imageVerified": true
      }
    ],
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 32%",
    "imageVerified": true,
    "sourceLocale": "ko"
  },
  {
    "id": "genshin-71-escoffier",
    "gameId": "genshin",
    "kind": "pickup",
    "title": {
      "ko": "에스코피에",
      "en": "Escoffier",
      "ja": "エスコフィエ",
      "zh": "爱可菲"
    },
    "summary": {
      "ko": "한정 5★ · 얼음. 「베리 샹송」 이벤트 기원.",
      "en": "Limited 5★ Cryo. La Chanson Cerise event wish.",
      "ja": "限定★5・氷。「苺色のシャンソン」。",
      "zh": "限定5★冰元素角色。「莓色香颂」活动祈愿返场。"
    },
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": "2026-10-13T18:00:00+08:00",
    "endAt": "2026-11-03T14:59:00+08:00",
    "publishedAt": "2026-10-08",
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://genshin.hoyoverse.com/ko/news/detail/166634",
    "sourceTitle": "7.1 버전 이벤트 기원 알림 제2회",
    "version": "7.1",
    "image": "/assets/entities/escoffier-29c50598.webp",
    "imageSource": "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2025/04/30/7144e05505e492dbea93ed4addb4c6ee_1454738046342063990.png",
    "rarity": 5,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://genshin.hoyoverse.com/ko/news/detail/166634",
      "en": "https://genshin.hoyoverse.com/en/news/detail/166634",
      "ja": "https://genshin.hoyoverse.com/ja/news/detail/166634",
      "zh": "https://ys.mihoyo.com/main/news/detail/166763"
    },
    "poolType": "character",
    "pickupType": "rerun",
    "pickupGroup": "genshin-global-asia-7.1-phase2-character",
    "pickupMembers": [
      {
        "name": {
          "ko": "에스코피에",
          "en": "Escoffier",
          "ja": "エスコフィエ",
          "zh": "爱可菲"
        },
        "type": "rerun",
        "rarity": 5,
        "image": "/assets/entities/escoffier-29c50598.webp",
        "imageSource": "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2025/04/30/7144e05505e492dbea93ed4addb4c6ee_1454738046342063990.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "51% 34%",
        "imageVerified": true
      }
    ],
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "51% 34%",
    "imageVerified": true,
    "sourceLocale": "ko"
  },
  {
    "id": "genshin-71-weapon",
    "gameId": "genshin",
    "kind": "weapon",
    "title": {
      "ko": "창백한 섬광 · 맛의 지휘자",
      "en": "Azurelight · Symphonist of Scents",
      "ja": "蒼耀・香りのシンフォニスト",
      "zh": "苍耀 · 香韵奏者"
    },
    "summary": {
      "ko": "한정 5★ 한손검·장병기. 「신의 주조」 확률 UP.",
      "en": "Limited 5★ sword and polearm in Epitome Invocation.",
      "ja": "限定★5片手剣・長柄武器。「神鋳賦形」で確率UP。",
      "zh": "限定5★单手剑与长柄武器。「神铸赋形」概率提升。"
    },
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": "2026-10-13T18:00:00+08:00",
    "endAt": "2026-11-03T14:59:00+08:00",
    "publishedAt": "2026-10-08",
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://genshin.hoyoverse.com/ko/news/detail/166634",
    "sourceTitle": "7.1 버전 이벤트 기원 알림 제2회",
    "version": "7.1",
    "image": "/assets/entities/azurelight-298e5509.webp",
    "imageSource": "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2025/06/12/f217352d0464adbdf45112fcaf722128_3502992130143524197.png",
    "rarity": 5,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://genshin.hoyoverse.com/ko/news/detail/166634",
      "en": "https://genshin.hoyoverse.com/en/news/detail/166634",
      "ja": "https://genshin.hoyoverse.com/ja/news/detail/166634",
      "zh": "https://ys.mihoyo.com/main/news/detail/166763"
    },
    "poolType": "weapon",
    "pickupType": "rerun",
    "pickupGroup": "genshin-global-asia-7.1-phase2-weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "창백한 섬광",
          "en": "Azurelight",
          "ja": "蒼耀",
          "zh": "苍耀"
        },
        "type": "rerun",
        "rarity": 5,
        "image": "/assets/entities/azurelight-298e5509.webp",
        "imageSource": "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2025/06/12/f217352d0464adbdf45112fcaf722128_3502992130143524197.png",
        "imageKind": "weapon",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "맛의 지휘자",
          "en": "Symphonist of Scents",
          "ja": "香りのシンフォニスト",
          "zh": "香韵奏者"
        },
        "type": "rerun",
        "rarity": 5,
        "image": "/assets/entities/symphonist-8f77b408.webp",
        "imageSource": "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2025/04/29/de828ce33b8616998260d71c2f84d93f_1382184822064401171.png",
        "imageKind": "weapon",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "imageKind": "weapon",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true,
    "sourceLocale": "ko"
  },
  {
    "id": "genshin-71-update",
    "gameId": "genshin",
    "kind": "update",
    "title": {
      "ko": "7.1 · 죽음의 진혼곡",
      "en": "7.1 · A Rekviem for the Underworld",
      "ja": "7.1・冥府へのレクイエム",
      "zh": "7.1・往冥府的安魂歌"
    },
    "summary": {
      "ko": "「죽음의 진혼곡」 버전의 업데이트 및 보상 안내.",
      "en": "Update and compensation details for A Rekviem for the Underworld.",
      "ja": "「冥府へのレクイエム」のアップデートおよび補償内容。",
      "zh": "「往冥府的安魂歌」版本更新与补偿说明。"
    },
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": null,
    "endAt": null,
    "publishedAt": "2026-09-23",
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://genshin.hoyoverse.com/ko/news/detail/166383",
    "sourceTitle": "「죽음의 진혼곡」 7.1 버전 업데이트 안내",
    "version": "7.1",
    "image": "/assets/genshin-update-hero.webp",
    "imageSource": "https://fastcdn.hoyoverse.com/content-v2/hk4e/166383/769afb257533e1e3fc075b3262ba0623_964197228136751306.jpg",
    "timingNote": {
      "ko": "업데이트 완료 시각은 별도로 확인하지 않았습니다.",
      "en": "Exact maintenance completion time was not verified.",
      "ja": "メンテナンスの正確な終了時刻は未確認。",
      "zh": "维护实际完成时间尚未单独确认。"
    },
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://genshin.hoyoverse.com/ko/news/detail/166383",
      "en": "https://genshin.hoyoverse.com/en/news/detail/166383",
      "ja": "https://genshin.hoyoverse.com/ja/news/detail/166383",
      "zh": "https://genshin.hoyoverse.com/zh-tw/news/detail/166383"
    },
    "sourceLocale": "ko"
  },
  {
    "id": "zzz-32-roxy",
    "gameId": "zzz",
    "kind": "pickup",
    "title": {
      "ko": "록시",
      "en": "Roxy",
      "ja": "ロクシー",
      "zh": "洛克茜"
    },
    "summary": {
      "ko": "한정 S급 · 바람·격파. 「잿빛 밤에 내린 안식」.",
      "en": "Limited S-Rank Wind / Stun. Cindernight Respite.",
      "ja": "限定S級・風・撃破。「燃えさしのまどろみ」。",
      "zh": "限定S级・风・击破。「烬夜安眠」。"
    },
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": "2026-09-30T12:00:00+08:00",
    "endAt": "2026-10-20T14:59:00+08:00",
    "publishedAt": "2026-09-28",
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://zenless.hoyoverse.com/ko-kr/news/166475",
    "sourceTitle": "3.2 버전 기간 한정 채널(하반기)",
    "version": "3.2",
    "image": "/assets/entities/roxy-pickup-full-ko-full-403993e1.webp",
    "imageSource": "https://fastcdn.hoyoverse.com/content-v2/nap/166475/8f07f00c3db0d2ccacd6b5a99e67e353_482773711433485537.jpg",
    "rarity": 5,
    "featured": true,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://zenless.hoyoverse.com/ko-kr/news/166475",
      "en": "https://zenless.hoyoverse.com/en-us/news/166475",
      "ja": "https://zenless.hoyoverse.com/ja-jp/news/166475",
      "zh": "https://zenless.hoyoverse.com/zh-cn/news/166475"
    },
    "poolType": "character",
    "pickupType": "new",
    "pickupGroup": "zzz-global-asia-3.2-phase2-character",
    "pickupMembers": [
      {
        "name": {
          "ko": "록시",
          "en": "Roxy",
          "ja": "ロクシー",
          "zh": "洛克茜"
        },
        "type": "new",
        "rarity": 5,
        "image": "/assets/entities/roxy-pickup-full-ko-full-403993e1.webp",
        "imageSource": "https://fastcdn.hoyoverse.com/content-v2/nap/166475/8f07f00c3db0d2ccacd6b5a99e67e353_482773711433485537.jpg",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "76% 38%",
        "imageVerified": true
      }
    ],
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "76% 38%",
    "imageVerified": true,
    "sourceLocale": "ko"
  },
  {
    "id": "zzz-32-promeia",
    "gameId": "zzz",
    "kind": "pickup",
    "title": {
      "ko": "프로미아",
      "en": "Promeia",
      "ja": "プロメイア",
      "zh": "普罗米娅"
    },
    "summary": {
      "ko": "한정 S급 · 얼음·이상. 「찬비가 그치는 밤」.",
      "en": "Limited S-Rank Ice / Anomaly. Cold Rain Wanes in the Night.",
      "ja": "限定S級・氷・異常。「冷たい雨の止む夜に」。",
      "zh": "限定S级・冰・异常。「冷雨将尽之夜」。"
    },
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": "2026-09-30T12:00:00+08:00",
    "endAt": "2026-10-20T14:59:00+08:00",
    "publishedAt": "2026-09-28",
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://zenless.hoyoverse.com/ko-kr/news/166475",
    "sourceTitle": "3.2 버전 기간 한정 채널(하반기)",
    "version": "3.2",
    "image": "/assets/entities/promeia-pickup-full-ko-full-b6438e4c.webp",
    "imageSource": "https://fastcdn.hoyoverse.com/content-v2/nap/166475/9d255479db74fc33363a6b5037679e29_8927813296241621736.jpg",
    "rarity": 5,
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://zenless.hoyoverse.com/ko-kr/news/166475",
      "en": "https://zenless.hoyoverse.com/en-us/news/166475",
      "ja": "https://zenless.hoyoverse.com/ja-jp/news/166475",
      "zh": "https://zenless.hoyoverse.com/zh-cn/news/166475"
    },
    "poolType": "character",
    "pickupType": "rerun",
    "pickupGroup": "zzz-global-asia-3.2-phase2-character",
    "pickupMembers": [
      {
        "name": {
          "ko": "프로미아",
          "en": "Promeia",
          "ja": "プロメイア",
          "zh": "普罗米娅"
        },
        "type": "rerun",
        "rarity": 5,
        "image": "/assets/entities/promeia-pickup-full-ko-full-b6438e4c.webp",
        "imageSource": "https://fastcdn.hoyoverse.com/content-v2/nap/166475/9d255479db74fc33363a6b5037679e29_8927813296241621736.jpg",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "74% 34%",
        "imageVerified": true
      }
    ],
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "74% 34%",
    "imageVerified": true,
    "sourceLocale": "ko"
  },
  {
    "id": "zzz-32-crimson-moon",
    "gameId": "zzz",
    "kind": "weapon",
    "title": {
      "ko": "진홍달의 은관",
      "en": "Crimson Moon Casket",
      "ja": "緋月の銀棺",
      "zh": "绯月银棺"
    },
    "summary": {
      "ko": "한정 S급 W-엔진 · 격파.",
      "en": "Limited S-Rank Stun W-Engine.",
      "ja": "限定S級音動機・撃破。",
      "zh": "限定S级音擎・击破。"
    },
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": "2026-09-30T12:00:00+08:00",
    "endAt": "2026-10-20T14:59:00+08:00",
    "publishedAt": "2026-09-28",
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://zenless.hoyoverse.com/ko-kr/news/166475",
    "sourceTitle": "3.2 버전 기간 한정 채널(하반기)",
    "version": "3.2",
    "image": "/assets/entities/crimson-3b64c338.webp",
    "imageSource": "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/09/29/d0b9026b4bd2641c63dcebe0bb53d3ab_3998106390675837827.png",
    "rarity": 5,
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://zenless.hoyoverse.com/ko-kr/news/166475",
      "en": "https://zenless.hoyoverse.com/en-us/news/166475",
      "ja": "https://zenless.hoyoverse.com/ja-jp/news/166475",
      "zh": "https://zenless.hoyoverse.com/zh-cn/news/166475"
    },
    "poolType": "weapon",
    "pickupType": "new",
    "pickupGroup": "zzz-global-asia-3.2-phase2-weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "진홍달의 은관",
          "en": "Crimson Moon Casket",
          "ja": "緋月の銀棺",
          "zh": "绯月银棺"
        },
        "type": "new",
        "rarity": 5,
        "image": "/assets/entities/crimson-3b64c338.webp",
        "imageSource": "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/09/29/d0b9026b4bd2641c63dcebe0bb53d3ab_3998106390675837827.png",
        "imageKind": "weapon",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "imageKind": "weapon",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true,
    "sourceLocale": "ko"
  },
  {
    "id": "zzz-32-frostfall",
    "gameId": "zzz",
    "kind": "weapon",
    "title": {
      "ko": "삭월에 끊어지는 서리",
      "en": "Frostfall Sickle",
      "ja": "フロスト・クレセント",
      "zh": "朔月裁霜"
    },
    "summary": {
      "ko": "한정 S급 W-엔진 · 이상.",
      "en": "Limited S-Rank Anomaly W-Engine.",
      "ja": "限定S級音動機・異常。",
      "zh": "限定S级音擎・异常。"
    },
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": "2026-09-30T12:00:00+08:00",
    "endAt": "2026-10-20T14:59:00+08:00",
    "publishedAt": "2026-09-28",
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://zenless.hoyoverse.com/ko-kr/news/166475",
    "sourceTitle": "3.2 버전 기간 한정 채널(하반기)",
    "version": "3.2",
    "image": "/assets/entities/frostfall-8c0e277b.webp",
    "imageSource": "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/05/06/8225136d9d3436f3b92211ac1a6635f7_4904353841212928551.png",
    "rarity": 5,
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://zenless.hoyoverse.com/ko-kr/news/166475",
      "en": "https://zenless.hoyoverse.com/en-us/news/166475",
      "ja": "https://zenless.hoyoverse.com/ja-jp/news/166475",
      "zh": "https://zenless.hoyoverse.com/zh-cn/news/166475"
    },
    "poolType": "weapon",
    "pickupType": "rerun",
    "pickupGroup": "zzz-global-asia-3.2-phase2-weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "삭월에 끊어지는 서리",
          "en": "Frostfall Sickle",
          "ja": "フロスト・クレセント",
          "zh": "朔月裁霜"
        },
        "type": "rerun",
        "rarity": 5,
        "image": "/assets/entities/frostfall-8c0e277b.webp",
        "imageSource": "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/05/06/8225136d9d3436f3b92211ac1a6635f7_4904353841212928551.png",
        "imageKind": "weapon",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "imageKind": "weapon",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true,
    "sourceLocale": "ko"
  },
  {
    "id": "hsr-46-update",
    "gameId": "hsr",
    "kind": "update",
    "title": {
      "ko": "4.6 · 달 뜨기 전, 괴수와 춤을",
      "en": "4.6 · Dance With the Beast Before Moonrise",
      "ja": "4.6・月立つ前に獣と踊れ",
      "zh": "4.6・月升之前，与兽共舞"
    },
    "summary": {
      "ko": "신규 5★ 펄(환락·얼음), 광추 「내일에 바치는 색채」 및 신규 지역.",
      "en": "New 5★ Pearl (Elation / Ice), Colors for Tomorrow Light Cone and a new area.",
      "ja": "新★5パール（愉悦・氷）、光円錐「明日に捧げる色」、新マップ。",
      "zh": "新增5星真珠（欢愉・冰）、光锥「献给明日的色彩」及新地图。"
    },
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": null,
    "endAt": "2026-11-11T06:00:00+08:00",
    "publishedAt": "2026-09-28",
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://hsr.hoyoverse.com/ko-kr/news/166468",
    "sourceTitle": "4.6 버전 「달 뜨기 전, 괴수와 춤을」 버전 업데이트 안내",
    "version": "4.6",
    "image": "/assets/hsr-hero.webp",
    "imageSource": "https://fastcdn.hoyoverse.com/content-v2/hkrpg/166468/03ccbfaa1c724301496b60c7390705b6_4566461937848408160.jpg",
    "featured": true,
    "timingNote": {
      "ko": "9월 28일 업데이트 후 시작. 정확한 완료 시각은 미확인.",
      "en": "Begins after the September 28 update; exact completion time unverified.",
      "ja": "9月28日の更新後開始。正確な完了時刻は未確認。",
      "zh": "9月28日更新后开始；实际完成时刻未核实。"
    },
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://hsr.hoyoverse.com/ko-kr/news/166468",
      "en": "https://hsr.hoyoverse.com/en-us/news/166468",
      "ja": "https://hsr.hoyoverse.com/ja-jp/news/166468",
      "zh": "https://hsr.hoyoverse.com/zh-cn/news/166468"
    },
    "sourceLocale": "ko"
  },
  {
    "id": "hsr-46-warm-cotton",
    "gameId": "hsr",
    "kind": "package",
    "title": {
      "ko": "히아킨 · 구름 곁의 따스함",
      "en": "Hyacine · Warm Cotton Skies",
      "ja": "ヒアンシー・雲間からこぼれる陽光",
      "zh": "风堇・云边拾暖"
    },
    "summary": {
      "ko": "코스튬 할인 판매. 기간 종료 후 오래된 꿈 1,680개.",
      "en": "Outfit sale. Regular price: 1,680 Oneiric Shards after the discount.",
      "ja": "コスチューム特別価格。期間終了後は往日の夢華1,680。",
      "zh": "时装特惠；结束后恢复古老梦华1,680。"
    },
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": null,
    "endAt": "2026-11-11T03:59:00+08:00",
    "publishedAt": "2026-09-28",
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://hsr.hoyoverse.com/ko-kr/news/166468",
    "sourceTitle": "4.6 버전 「달 뜨기 전, 괴수와 춤을」 버전 업데이트 안내",
    "version": "4.6",
    "price": {
      "amount": 1350,
      "currency": "Oneiric Shards",
      "platform": "In-game Outfit Show Window"
    },
    "contents": [
      {
        "ko": "히아킨 코스튬 1종",
        "en": "One Hyacine outfit",
        "ja": "ヒアンシーのコスチューム1点",
        "zh": "风堇时装1套"
      }
    ],
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://hsr.hoyoverse.com/ko-kr/news/166468",
      "en": "https://hsr.hoyoverse.com/en-us/news/166468",
      "ja": "https://hsr.hoyoverse.com/ja-jp/news/166468",
      "zh": "https://hsr.hoyoverse.com/zh-cn/news/166468"
    },
    "highlights": [
      {
        "ko": "1,350 오래된 꿈 → 1,680 오래된 꿈",
        "en": "1,350 Oneiric Shards → 1,680 Oneiric Shards",
        "ja": "1,350 往日の夢華 → 1,680 往日の夢華",
        "zh": "1,350 古老梦华 → 1,680 古老梦华"
      },
      {
        "ko": "11.11 04:59 KST/JST 할인 종료",
        "en": "Offer ends Nov 11, 04:59 KST/JST",
        "ja": "割引終了11/11 04:59 KST/JST",
        "zh": "优惠截止11月11日04:59 KST/JST"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "구성",
          "en": "Contents",
          "ja": "内容",
          "zh": "内容"
        },
        "body": {
          "ko": "코스튬 1종을 코스튬 디스플레이에서 구매한다. 표시 가격은 현금이 아닌 게임 내 재화 기준이다.",
          "en": "Buy one outfit in Outfit Show Window. The displayed price uses in-game currency, not cash.",
          "ja": "コスチューム展示で衣装1点を購入。表示価格は現金ではなくゲーム内通貨。",
          "zh": "在时装橱窗购买1套时装，标价为游戏内货币。"
        }
      },
      {
        "title": {
          "ko": "수령·판매 기한",
          "en": "Claim and sale deadlines",
          "ja": "受取・販売期限",
          "zh": "领取与销售期限"
        },
        "body": {
          "ko": "할인 종료 후에도 판매되며 정가는 오래된 꿈 1,680개다.",
          "en": "The outfit remains on sale after the offer at its regular price of 1,680 Oneiric Shards.",
          "ja": "割引終了後も販売され、通常価格は往日の夢華1,680。",
          "zh": "优惠结束后继续销售，原价为古老梦华1,680。"
        }
      }
    ],
    "sourceLocale": "ko"
  },
  {
    "id": "hsr-46-lunar-blossoming",
    "gameId": "hsr",
    "kind": "package",
    "title": {
      "ko": "에바네시아 · 꽃 피길 기다리는 달",
      "en": "Evanescia · Lunar Blossoming",
      "ja": "緋英・月待つ花時",
      "zh": "绯英・月待花时"
    },
    "summary": {
      "ko": "코스튬 할인 판매. 기간 종료 후 성옥 3,280개.",
      "en": "Outfit sale. Regular price: 3,280 Stellar Jades after the discount.",
      "ja": "コスチューム特別価格。期間終了後は星玉3,280。",
      "zh": "时装特惠；结束后恢复星琼3,280。"
    },
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": null,
    "endAt": "2026-11-11T03:59:00+08:00",
    "publishedAt": "2026-09-28",
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://hsr.hoyoverse.com/ko-kr/news/166468",
    "sourceTitle": "4.6 버전 「달 뜨기 전, 괴수와 춤을」 버전 업데이트 안내",
    "version": "4.6",
    "price": {
      "amount": 2680,
      "currency": "Stellar Jade",
      "platform": "In-game Outfit Show Window"
    },
    "contents": [
      {
        "ko": "에바네시아 코스튬 1종",
        "en": "One Evanescia outfit",
        "ja": "緋英のコスチューム1点",
        "zh": "绯英时装1套"
      }
    ],
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://hsr.hoyoverse.com/ko-kr/news/166468",
      "en": "https://hsr.hoyoverse.com/en-us/news/166468",
      "ja": "https://hsr.hoyoverse.com/ja-jp/news/166468",
      "zh": "https://hsr.hoyoverse.com/zh-cn/news/166468"
    },
    "highlights": [
      {
        "ko": "2,680 성옥 → 3,280 성옥",
        "en": "2,680 Stellar Jade → 3,280 Stellar Jade",
        "ja": "2,680 星玉 → 3,280 星玉",
        "zh": "2,680 星琼 → 3,280 星琼"
      },
      {
        "ko": "11.11 04:59 KST/JST 할인 종료",
        "en": "Offer ends Nov 11, 04:59 KST/JST",
        "ja": "割引終了11/11 04:59 KST/JST",
        "zh": "优惠截止11月11日04:59 KST/JST"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "구성",
          "en": "Contents",
          "ja": "内容",
          "zh": "内容"
        },
        "body": {
          "ko": "코스튬 1종을 코스튬 디스플레이에서 구매한다. 표시 가격은 현금이 아닌 게임 내 재화 기준이다.",
          "en": "Buy one outfit in Outfit Show Window. The displayed price uses in-game currency, not cash.",
          "ja": "コスチューム展示で衣装1点を購入。表示価格は現金ではなくゲーム内通貨。",
          "zh": "在时装橱窗购买1套时装，标价为游戏内货币。"
        }
      },
      {
        "title": {
          "ko": "수령·판매 기한",
          "en": "Claim and sale deadlines",
          "ja": "受取・販売期限",
          "zh": "领取与销售期限"
        },
        "body": {
          "ko": "할인 종료 후에도 판매되며 정가는 성옥 3,280개다.",
          "en": "The outfit remains on sale after the offer at its regular price of 3,280 Stellar Jade.",
          "ja": "割引終了後も販売され、通常価格は星玉3,280。",
          "zh": "优惠结束后继续销售，原价为星琼3,280。"
        }
      }
    ],
    "sourceLocale": "ko"
  },
  {
    "id": "hsr-46-love-ghosts",
    "gameId": "hsr",
    "kind": "event",
    "title": {
      "ko": "러브, 고스트 + 로봇",
      "en": "Love, Ghosts & Robots",
      "ja": "愛、幽霊とロボット",
      "zh": "爱，幽灵与机器人"
    },
    "summary": {
      "ko": "개척 레벨 21 이상. 「외로운 늑대 선글라스」 획득 가능.",
      "en": "Trailblaze Level 21+. Earn the Lone Wolf Shades headwear.",
      "ja": "開拓レベル21以上。ヘッドアクセサリー「一匹狼のサングラス」を獲得可能。",
      "zh": "开拓等级21级以上；可获得头饰「孤狼墨镜」。"
    },
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": null,
    "endAt": "2026-11-11T03:59:00+08:00",
    "publishedAt": "2026-09-28",
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://hsr.hoyoverse.com/ko-kr/news/166468",
    "sourceTitle": "4.6 버전 「달 뜨기 전, 괴수와 춤을」 버전 업데이트 안내",
    "version": "4.6",
    "timingNote": {
      "ko": "4.6 업데이트 후 시작.",
      "en": "Begins after the Version 4.6 update.",
      "ja": "Ver.4.6アップデート後開始。",
      "zh": "4.6版本更新后开始。"
    },
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://hsr.hoyoverse.com/ko-kr/news/166468",
      "en": "https://hsr.hoyoverse.com/en-us/news/166468",
      "ja": "https://hsr.hoyoverse.com/ja-jp/news/166468",
      "zh": "https://hsr.hoyoverse.com/zh-cn/news/166468"
    },
    "highlights": [
      {
        "ko": "개척 레벨 21 이상",
        "en": "Trailblaze Level 21+",
        "ja": "開拓レベル21以上",
        "zh": "开拓等级21级以上"
      },
      {
        "ko": "외로운 늑대 선글라스 보상",
        "en": "Lone Wolf Shades reward",
        "ja": "一匹狼のサングラス報酬",
        "zh": "孤狼墨镜奖励"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "참여 조건",
          "en": "Requirements",
          "ja": "参加条件",
          "zh": "参与条件"
        },
        "body": {
          "ko": "개척 레벨 21 이상. 종말의 시야로 먼저 체험할 수 있으며, 4.6 메인 스토리 완료 후 진행이 권장된다.",
          "en": "Requires Trailblaze Lv.21. Finality’s Vision permits early access; completing the 4.6 story first is recommended.",
          "ja": "開拓Lv.21以上。終焉の視界で先行体験可能。Ver.4.6の開拓クエスト後のプレイを推奨。",
          "zh": "开拓等级21级以上，可通过终末视界提前体验，建议先完成4.6开拓任务。"
        }
      },
      {
        "title": {
          "ko": "진행 방법",
          "en": "How to play",
          "ja": "進め方",
          "zh": "玩法"
        },
        "body": {
          "ko": "유령 스코트의 메카아머 생산라인을 운영하고 심사를 통과하도록 돕는 이벤트다. 머리장식 외로운 늑대 선글라스를 획득할 수 있다.",
          "en": "Run ghost Skott’s mechatron production line and help him pass inspection. The event awards Lone Wolf Shades headwear.",
          "ja": "幽霊スコートのメカヨロイ生産ラインを運営し、審査通過を手伝う。一匹狼のサングラスを獲得可能。",
          "zh": "经营幽灵斯科特的机甲生产线并协助通过评审，可获得头饰孤狼墨镜。"
        }
      }
    ],
    "sourceLocale": "ko"
  },
  {
    "id": "hsr-46-one-take",
    "gameId": "hsr",
    "kind": "event",
    "title": {
      "ko": "스타피스 페스티벌: 원 테이크",
      "en": "Interastral Peace Gala: One Take",
      "ja": "スターピースフェスティバル：ワンカット",
      "zh": "星际和平盛典：一镜到底"
    },
    "summary": {
      "ko": "개척 레벨 21 이상. 전투 오디션 이벤트.",
      "en": "Combat audition event. Trailblaze Level 21+.",
      "ja": "開拓レベル21以上。戦闘オーディションイベント。",
      "zh": "战斗试镜活动；开拓等级21级以上。"
    },
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": "2026-10-21T12:00:00+08:00",
    "endAt": "2026-11-11T03:59:00+08:00",
    "publishedAt": "2026-09-28",
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://hsr.hoyoverse.com/ko-kr/news/166468",
    "sourceTitle": "4.6 버전 「달 뜨기 전, 괴수와 춤을」 버전 업데이트 안내",
    "version": "4.6",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://hsr.hoyoverse.com/ko-kr/news/166468",
      "en": "https://hsr.hoyoverse.com/en-us/news/166468",
      "ja": "https://hsr.hoyoverse.com/ja-jp/news/166468",
      "zh": "https://hsr.hoyoverse.com/zh-cn/news/166468"
    },
    "sourceLocale": "ko"
  },
  {
    "id": "ba-jp-20261007-pickup-1",
    "gameId": "bluearchive",
    "kind": "pickup",
    "title": {
      "ko": "츠무기",
      "en": "Tsumugi",
      "ja": "ツムギ",
      "zh": "ツムギ"
    },
    "summary": {
      "ko": "일본 서버 신규 ★3 픽업. 같은 기간에 5개 모집이 동시에 개최됩니다.",
      "en": "Japan server new 3★ pickup. Five recruitment pools run simultaneously.",
      "ja": "日本サーバーの新規★3ピックアップ。5種の募集を同時開催。",
      "zh": "日服新角色★3精选招募；同期共有5个招募池。"
    },
    "region": "jp",
    "server": "Japan / Yostar",
    "startAt": null,
    "endAt": "2026-10-21T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://bluearchive.jp/news/newsJump/696",
    "sourceTitle": "10/7(水) ピックアップ募集の予告",
    "image": "/assets/entities/verified-bluearchive-pickup-1-985dca6f.webp",
    "rarity": 3,
    "timingNote": {
      "ko": "일본 공식 명칭 기준. 한국어·영어 음역은 공식 현지화 확인 전 표기입니다.",
      "en": "Japanese official name; other-language transliterations are not verified official localized names.",
      "ja": "日本語公式名。ほかの言語の表記は公式訳未確認です。",
      "zh": "采用日文官方名称；其他语言译名尚未核实为官方译名。"
    },
    "featured": true,
    "imageSource": "https://webusstatic.yo-star.com/bluearchive_jp_web/mainsite/upload/news/2026/10/05/I__RfZeX.png",
    "officialLocales": [
      "ja"
    ],
    "translatedLocales": [
      "ko",
      "en",
      "zh"
    ],
    "sourceLocale": "ja",
    "localizationSources": {
      "ja": "https://bluearchive.jp/news/newsJump/696"
    },
    "pickupType": "new",
    "pickupGroup": "bluearchive:jp:20261007:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "츠무기",
          "en": "Tsumugi",
          "ja": "ツムギ",
          "zh": "ツムギ"
        },
        "type": "new",
        "rarity": 3,
        "image": "/assets/entities/verified-bluearchive-pickup-1-985dca6f.webp",
        "imageSource": "https://webusstatic.yo-star.com/bluearchive_jp_web/mainsite/upload/news/2026/10/05/I__RfZeX.png",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true
  },
  {
    "id": "ba-jp-20261007-pickup-2",
    "gameId": "bluearchive",
    "kind": "pickup",
    "title": {
      "ko": "에리",
      "en": "Eri",
      "ja": "エリ",
      "zh": "エリ"
    },
    "summary": {
      "ko": "일본 서버 복각 ★3 픽업. 같은 기간에 5개 모집이 동시에 개최됩니다.",
      "en": "Japan server rerun 3★ pickup. Five recruitment pools run simultaneously.",
      "ja": "日本サーバーの復刻★3ピックアップ。5種の募集を同時開催。",
      "zh": "日服复刻★3精选招募；同期共有5个招募池。"
    },
    "region": "jp",
    "server": "Japan / Yostar",
    "startAt": null,
    "endAt": "2026-10-21T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://bluearchive.jp/news/newsJump/696",
    "sourceTitle": "10/7(水) ピックアップ募集の予告",
    "image": "/assets/entities/verified-bluearchive-pickup-2-7cabf8fe.webp",
    "rarity": 3,
    "timingNote": {
      "ko": "일본 공식 명칭 기준. 한국어·영어 음역은 공식 현지화 확인 전 표기입니다.",
      "en": "Japanese official name; other-language transliterations are not verified official localized names.",
      "ja": "日本語公式名。ほかの言語の表記は公式訳未確認です。",
      "zh": "采用日文官方名称；其他语言译名尚未核实为官方译名。"
    },
    "featured": false,
    "imageSource": "https://webusstatic.yo-star.com/bluearchive_jp_web/mainsite/upload/news/2026/10/05/amlUiofk.png",
    "officialLocales": [
      "ja"
    ],
    "translatedLocales": [
      "ko",
      "en",
      "zh"
    ],
    "sourceLocale": "ja",
    "localizationSources": {
      "ja": "https://bluearchive.jp/news/newsJump/696"
    },
    "pickupType": "rerun",
    "pickupGroup": "bluearchive:jp:20261007:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "에리",
          "en": "Eri",
          "ja": "エリ",
          "zh": "エリ"
        },
        "type": "rerun",
        "rarity": 3,
        "image": "/assets/entities/verified-bluearchive-pickup-2-7cabf8fe.webp",
        "imageSource": "https://webusstatic.yo-star.com/bluearchive_jp_web/mainsite/upload/news/2026/10/05/amlUiofk.png",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true
  },
  {
    "id": "ba-jp-20261007-pickup-3",
    "gameId": "bluearchive",
    "kind": "pickup",
    "title": {
      "ko": "카노에",
      "en": "Kanoe",
      "ja": "カノエ",
      "zh": "カノエ"
    },
    "summary": {
      "ko": "일본 서버 복각 ★3 픽업. 같은 기간에 5개 모집이 동시에 개최됩니다.",
      "en": "Japan server rerun 3★ pickup. Five recruitment pools run simultaneously.",
      "ja": "日本サーバーの復刻★3ピックアップ。5種の募集を同時開催。",
      "zh": "日服复刻★3精选招募；同期共有5个招募池。"
    },
    "region": "jp",
    "server": "Japan / Yostar",
    "startAt": null,
    "endAt": "2026-10-21T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://bluearchive.jp/news/newsJump/696",
    "sourceTitle": "10/7(水) ピックアップ募集の予告",
    "image": "/assets/entities/verified-bluearchive-pickup-3-6457ef18.webp",
    "rarity": 3,
    "timingNote": {
      "ko": "일본 공식 명칭 기준. 한국어·영어 음역은 공식 현지화 확인 전 표기입니다.",
      "en": "Japanese official name; other-language transliterations are not verified official localized names.",
      "ja": "日本語公式名。ほかの言語の表記は公式訳未確認です。",
      "zh": "采用日文官方名称；其他语言译名尚未核实为官方译名。"
    },
    "featured": false,
    "imageSource": "https://webusstatic.yo-star.com/bluearchive_jp_web/mainsite/upload/news/2026/10/05/WWbPQSg1.png",
    "officialLocales": [
      "ja"
    ],
    "translatedLocales": [
      "ko",
      "en",
      "zh"
    ],
    "sourceLocale": "ja",
    "localizationSources": {
      "ja": "https://bluearchive.jp/news/newsJump/696"
    },
    "pickupType": "rerun",
    "pickupGroup": "bluearchive:jp:20261007:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "카노에",
          "en": "Kanoe",
          "ja": "カノエ",
          "zh": "カノエ"
        },
        "type": "rerun",
        "rarity": 3,
        "image": "/assets/entities/verified-bluearchive-pickup-3-6457ef18.webp",
        "imageSource": "https://webusstatic.yo-star.com/bluearchive_jp_web/mainsite/upload/news/2026/10/05/WWbPQSg1.png",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true
  },
  {
    "id": "ba-jp-20261007-pickup-4",
    "gameId": "bluearchive",
    "kind": "pickup",
    "title": {
      "ko": "미야코(수영복)",
      "en": "Miyako (Swimsuit)",
      "ja": "ミヤコ(水着)",
      "zh": "宫子（泳装）"
    },
    "summary": {
      "ko": "일본 서버 복각 ★3 픽업. 같은 기간에 5개 모집이 동시에 개최됩니다.",
      "en": "Japan server rerun 3★ pickup. Five recruitment pools run simultaneously.",
      "ja": "日本サーバーの復刻★3ピックアップ。5種の募集を同時開催。",
      "zh": "日服复刻★3精选招募；同期共有5个招募池。"
    },
    "region": "jp",
    "server": "Japan / Yostar",
    "startAt": null,
    "endAt": "2026-10-21T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://bluearchive.jp/news/newsJump/696",
    "sourceTitle": "10/7(水) ピックアップ募集の予告",
    "image": "/assets/entities/verified-bluearchive-pickup-4-32c063ff.webp",
    "rarity": 3,
    "timingNote": {
      "ko": "일본 공식 명칭 기준. 한국어·영어 음역은 공식 현지화 확인 전 표기입니다.",
      "en": "Japanese official name; other-language transliterations are not verified official localized names.",
      "ja": "日本語公式名。ほかの言語の表記は公式訳未確認です。",
      "zh": "采用日文官方名称；其他语言译名尚未核实为官方译名。"
    },
    "featured": false,
    "imageSource": "https://webusstatic.yo-star.com/bluearchive_jp_web/mainsite/upload/news/2026/10/05/Z4Yzn72I.png",
    "officialLocales": [
      "ja"
    ],
    "translatedLocales": [
      "ko",
      "en",
      "zh"
    ],
    "sourceLocale": "ja",
    "localizationSources": {
      "ja": "https://bluearchive.jp/news/newsJump/696"
    },
    "pickupType": "rerun",
    "pickupGroup": "bluearchive:jp:20261007:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "미야코(수영복)",
          "en": "Miyako (Swimsuit)",
          "ja": "ミヤコ(水着)",
          "zh": "宫子（泳装）"
        },
        "type": "rerun",
        "rarity": 3,
        "image": "/assets/entities/verified-bluearchive-pickup-4-32c063ff.webp",
        "imageSource": "https://webusstatic.yo-star.com/bluearchive_jp_web/mainsite/upload/news/2026/10/05/Z4Yzn72I.png",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true
  },
  {
    "id": "ba-jp-20261007-pickup-5",
    "gameId": "bluearchive",
    "kind": "pickup",
    "title": {
      "ko": "사키(수영복)",
      "en": "Saki (Swimsuit)",
      "ja": "サキ(水着)",
      "zh": "咲（泳装）"
    },
    "summary": {
      "ko": "일본 서버 복각 ★3 픽업. 같은 기간에 5개 모집이 동시에 개최됩니다.",
      "en": "Japan server rerun 3★ pickup. Five recruitment pools run simultaneously.",
      "ja": "日本サーバーの復刻★3ピックアップ。5種の募集を同時開催。",
      "zh": "日服复刻★3精选招募；同期共有5个招募池。"
    },
    "region": "jp",
    "server": "Japan / Yostar",
    "startAt": null,
    "endAt": "2026-10-21T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://bluearchive.jp/news/newsJump/696",
    "sourceTitle": "10/7(水) ピックアップ募集の予告",
    "image": "/assets/entities/verified-bluearchive-pickup-5-29546413.webp",
    "rarity": 3,
    "timingNote": {
      "ko": "일본 공식 명칭 기준. 한국어·영어 음역은 공식 현지화 확인 전 표기입니다.",
      "en": "Japanese official name; other-language transliterations are not verified official localized names.",
      "ja": "日本語公式名。ほかの言語の表記は公式訳未確認です。",
      "zh": "采用日文官方名称；其他语言译名尚未核实为官方译名。"
    },
    "featured": false,
    "imageSource": "https://webusstatic.yo-star.com/bluearchive_jp_web/mainsite/upload/news/2026/10/05/k3Nmy7fC.png",
    "officialLocales": [
      "ja"
    ],
    "translatedLocales": [
      "ko",
      "en",
      "zh"
    ],
    "sourceLocale": "ja",
    "localizationSources": {
      "ja": "https://bluearchive.jp/news/newsJump/696"
    },
    "pickupType": "rerun",
    "pickupGroup": "bluearchive:jp:20261007:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "사키(수영복)",
          "en": "Saki (Swimsuit)",
          "ja": "サキ(水着)",
          "zh": "咲（泳装）"
        },
        "type": "rerun",
        "rarity": 3,
        "image": "/assets/entities/verified-bluearchive-pickup-5-29546413.webp",
        "imageSource": "https://webusstatic.yo-star.com/bluearchive_jp_web/mainsite/upload/news/2026/10/05/k3Nmy7fC.png",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true
  },
  {
    "id": "ba-jp-20261007-occult",
    "gameId": "bluearchive",
    "kind": "event",
    "title": {
      "ko": "오컬트 연구회! 복각",
      "en": "Occult Research Society — rerun",
      "ja": "我らオカルト研究会！ 復刻",
      "zh": "「我らオカルト研究会！」复刻"
    },
    "summary": {
      "ko": "일본 서버 복각 이벤트. 보상 교환은 10월 28일 10:59까지.",
      "en": "Japan-server rerun. Reward exchange remains available until Oct 28, 10:59 JST.",
      "ja": "復刻イベント。報酬交換は10月28日10:59まで。",
      "zh": "日服复刻活动，奖励兑换至10月28日10:59（JST）。"
    },
    "region": "jp",
    "server": "Japan / Yostar",
    "startAt": null,
    "endAt": "2026-10-21T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T10:45:00Z",
    "sourceUrl": "https://bluearchive.jp/news/newsJump/698",
    "sourceTitle": "復刻イベント「我らオカルト研究会！ ～学院の不思議と古の呪文～」開催",
    "image": "/assets/bluearchive-bg-event.webp",
    "featured": true,
    "timingNote": {
      "ko": "10월 7일 점검 후 시작.",
      "en": "Started after maintenance on Oct 7.",
      "ja": "10月7日メンテナンス後に開始。",
      "zh": "10月7日维护后开始。"
    },
    "imageSource": "https://webusstatic.yo-star.com/bluearchive_jp_web/mainsite/upload/news/2026/10/05/t4soS6YD.png",
    "officialLocales": [
      "ja"
    ],
    "translatedLocales": [
      "ko",
      "en",
      "zh"
    ],
    "sourceLocale": "ja",
    "localizationSources": {
      "ja": "https://bluearchive.jp/news/newsJump/698"
    }
  },
  {
    "id": "ba-jp-20261014-geburah",
    "gameId": "bluearchive",
    "kind": "event",
    "title": {
      "ko": "대결전: 야외 게부라",
      "en": "Grand Assault: Geburah (Outdoor)",
      "ja": "大決戦 屋外戦・ゲブラ",
      "zh": "大决战：室外战・ゲブラ"
    },
    "summary": {
      "ko": "일본 서버 대결전 진행 중.",
      "en": "Grand Assault on the Japanese server.",
      "ja": "日本サーバーの大決戦。",
      "zh": "日服大决战活动。"
    },
    "region": "jp",
    "server": "Japan / Yostar",
    "startAt": "2026-10-14T11:00:00+09:00",
    "endAt": "2026-10-21T03:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T10:45:00Z",
    "sourceUrl": "https://bluearchive.jp/news/newsJump/697",
    "sourceTitle": "10/7(水) アップデートのお知らせ",
    "officialLocales": [
      "ja"
    ],
    "translatedLocales": [
      "ko",
      "en",
      "zh"
    ],
    "sourceLocale": "ja",
    "localizationSources": {
      "ja": "https://bluearchive.jp/news/newsJump/697"
    }
  },
  {
    "id": "ba-jp-20261007-growth",
    "gameId": "bluearchive",
    "kind": "package",
    "title": {
      "ko": "츠무기 성장 패키지",
      "en": "Tsumugi Growth Package",
      "ja": "生徒成長パッケージ(ツムギ)",
      "zh": "ツムギ成长礼包"
    },
    "summary": {
      "ko": "일본 가격 ¥4,900 · 계정당 2회. 종료 시간은 공식 자료 간 차이로 확인 중.",
      "en": "¥4,900 in Japan · Purchase limit: 2. Official sources disagree on the closing hour.",
      "ja": "日本価格4,900円・2回まで。終了時刻は公式本文と画像で相違あり。",
      "zh": "日本售价¥4,900，限购2次。官方正文与图片的结束时刻不一致。"
    },
    "region": "jp",
    "server": "Japan / Yostar",
    "startAt": null,
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T10:45:00Z",
    "sourceUrl": "https://bluearchive.jp/news/newsJump/697",
    "sourceTitle": "10/7(水) アップデートのお知らせ",
    "image": "/assets/bluearchive-package-growth.webp",
    "price": {
      "amount": 4900,
      "currency": "JPY",
      "platform": "Japan in-game shop (official notice)"
    },
    "contents": [
      {
        "ko": "청휘석 1,200개",
        "en": "Pyroxene ×1,200",
        "ja": "青輝石×1,200",
        "zh": "青辉石×1,200"
      },
      {
        "ko": "성장 재료·설계도·선물·크레딧 포함",
        "en": "Includes reports, stones, blueprints, gifts and credits",
        "ja": "レポート・強化珠・設計図・贈り物・クレジットを含む",
        "zh": "含报告、强化珠、设计图、礼物和信用点"
      }
    ],
    "timingNote": {
      "ko": "10월 7일 점검 후 판매. 본문은 10월 28일 03:59, 이미지는 10:59로 표기. 정확한 종료 시간 확인 필요.",
      "en": "On sale after Oct 7 maintenance. Text says Oct 28 03:59 JST; image says 10:59 JST. Closing time needs confirmation.",
      "ja": "10月7日メンテナンス後販売。本文は10月28日3:59、画像は10:59と記載。要確認。",
      "zh": "10月7日维护后开售。正文写10月28日03:59，图片写10:59（JST），待核实。"
    },
    "imageSource": "https://webusstatic.yo-star.com/bluearchive_jp_web/mainsite/upload/news/2026/10/05/tOHF8SdO.png",
    "officialLocales": [
      "ja"
    ],
    "translatedLocales": [
      "ko",
      "en",
      "zh"
    ],
    "sourceLocale": "ja",
    "localizationSources": {
      "ja": "https://bluearchive.jp/news/newsJump/697"
    }
  },
  {
    "id": "ba-jp-20261007-eleph",
    "gameId": "bluearchive",
    "kind": "package",
    "title": {
      "ko": "픽업 학생 엘레프 패키지",
      "en": "Pickup Student Eleph Packs",
      "ja": "ピックアップ生徒 神名文字パッケージ",
      "zh": "精选学生神名文字礼包"
    },
    "summary": {
      "ko": "각 ¥3,000 · 각 2회. 츠무기·에리·카노에·수영복 미야코·수영복 사키.",
      "en": "¥3,000 each · Limit 2 each. Tsumugi, Eri, Kanoe, Miyako (Swimsuit), Saki (Swimsuit).",
      "ja": "各3,000円・各2回。ツムギ・エリ・カノエ・ミヤコ(水着)・サキ(水着)。",
      "zh": "每款¥3,000、限购2次。ツムギ、エリ、カノエ、泳装宫子、泳装咲。"
    },
    "region": "jp",
    "server": "Japan / Yostar",
    "startAt": null,
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T10:45:00Z",
    "sourceUrl": "https://bluearchive.jp/news/newsJump/697",
    "sourceTitle": "10/7(水) アップデートのお知らせ",
    "image": "/assets/bluearchive-package-eleph.webp",
    "price": {
      "amount": 3000,
      "currency": "JPY",
      "platform": "Japan in-game shop; each pack"
    },
    "contents": [
      {
        "ko": "해당 학생 엘레프 120 + 엘리그마 50 + 선물 3",
        "en": "Student Eleph ×120 + Eligma ×50 + gifts ×3",
        "ja": "対象生徒の神名文字×120＋神名のカケラ×50＋贈り物×3",
        "zh": "对应学生神名文字×120＋神名精髓×50＋礼物×3"
      },
      {
        "ko": "해당 픽업에서 학생 획득 후 2주 내 조건부 구매",
        "en": "Conditional purchase within 2 weeks of obtaining the student from the matching pickup",
        "ja": "開催中の対象ピックアップで生徒を獲得してから2週間以内のみ購入可",
        "zh": "在对应精选招募中获得学生后2周内可购买"
      }
    ],
    "timingNote": {
      "ko": "개인별 조건부 상품. 일괄 종료 타이머를 표시하지 않음.",
      "en": "Individual conditional offer; no single countdown is available.",
      "ja": "個別条件付き販売のため、一律の終了時刻はありません。",
      "zh": "因个人触发条件不同，不显示统一倒计时。"
    },
    "imageSource": "https://webusstatic.yo-star.com/bluearchive_jp_web/mainsite/upload/news/2026/10/05/GHQU9Iyu.png",
    "officialLocales": [
      "ja"
    ],
    "translatedLocales": [
      "ko",
      "en",
      "zh"
    ],
    "sourceLocale": "ja",
    "localizationSources": {
      "ja": "https://bluearchive.jp/news/newsJump/697"
    }
  },
  {
    "id": "uma-global-20261014-brian",
    "gameId": "umamusume",
    "kind": "pickup",
    "title": {
      "ko": "나리타 브라이언 · 신규 의상",
      "en": "Narita Brian [Ravenous Wolf]",
      "ja": "ナリタブライアン · 新衣装",
      "zh": "成田白仁 · 新服装"
    },
    "summary": {
      "ko": "글로벌 서버 픽업. 육성 우마무스메.",
      "en": "Global-server spotlight. Trainee Umamusume.",
      "ja": "グローバル版ピックアップ。育成ウマ娘。",
      "zh": "国际服精选。育成赛马娘。"
    },
    "region": "global",
    "server": "Global / Cygames EN",
    "startAt": "2026-10-14T22:00:00Z",
    "endAt": "2026-10-23T21:59:00Z",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://umamusume.com/news/1103",
    "sourceTitle": "Narita Brian [Ravenous Wolf]",
    "image": "/assets/entities/uma-brian-global-pickup-full-466a7603.webp",
    "featured": true,
    "rarity": 3,
    "imageSource": "https://assets-webview-umamusume-en.akamaized.net/contents/assets/images/uploads/Header/gacha_banner_30136_new2_L1792015200.png?c=20260916092316",
    "officialLocales": [
      "en"
    ],
    "translatedLocales": [
      "ko",
      "ja",
      "zh"
    ],
    "sourceLocale": "en",
    "localizationSources": {
      "en": "https://umamusume.com/news/1103"
    },
    "pickupType": "new",
    "pickupGroup": "umamusume:global:20261014:character",
    "poolType": "character",
    "timingNote": {
      "ko": "글로벌판 신규 추가. 의상·카드 부제의 공식 현지화 확인 전에는 캐릭터명과 등급을 표시합니다. 원제는 출처에 보존했습니다.",
      "en": "New to Global. Unverified localized outfit/card subtitles are omitted; the original is retained in the source title.",
      "ja": "グローバル版で新登場。衣装・カード名の公式訳未確認箇所は名前とレアリティで表示し、原題を出典に保存。",
      "zh": "国际服新登场。未核实的服装及卡牌副标题暂不翻译，原名保留在来源标题。"
    },
    "pickupMembers": [
      {
        "name": {
          "ko": "나리타 브라이언 · 신규 의상",
          "en": "Narita Brian [Ravenous Wolf]",
          "ja": "ナリタブライアン · 新衣装",
          "zh": "成田白仁 · 新服装"
        },
        "type": "new",
        "rarity": 3,
        "image": "/assets/entities/uma-brian-global-pickup-full-466a7603.webp",
        "imageSource": "https://assets-webview-umamusume-en.akamaized.net/contents/assets/images/uploads/Header/gacha_banner_30136_new2_L1792015200.png?c=20260916092316",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "76% 50%",
        "imageVerified": true
      }
    ],
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "76% 50%",
    "imageVerified": true
  },
  {
    "id": "uma-global-20261014-zephyr",
    "gameId": "umamusume",
    "kind": "pickup",
    "title": {
      "ko": "야마닌 제퍼 · SSR",
      "en": "Yamanin Zephyr SSR [To Winds Untraveled]",
      "ja": "ヤマニンゼファー · SSR",
      "zh": "也文摄辉 · SSR"
    },
    "summary": {
      "ko": "글로벌 서버 픽업. 서포트 카드.",
      "en": "Global-server spotlight. Support card.",
      "ja": "グローバル版ピックアップ。サポートカード。",
      "zh": "国际服精选。支援卡。"
    },
    "region": "global",
    "server": "Global / Cygames EN",
    "startAt": "2026-10-14T22:00:00Z",
    "endAt": "2026-10-23T21:59:00Z",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://umamusume.com/news/1103",
    "sourceTitle": "Yamanin Zephyr SSR [To Winds Untraveled]",
    "image": "/assets/entities/uma-zephyr-ssr-9180aa37.webp",
    "featured": false,
    "imageSource": "https://media.gametora.com/umamusume/supports/full/30126.png",
    "officialLocales": [
      "en"
    ],
    "translatedLocales": [
      "ko",
      "ja",
      "zh"
    ],
    "sourceLocale": "en",
    "localizationSources": {
      "en": "https://umamusume.com/news/1103"
    },
    "pickupType": "new",
    "pickupGroup": "umamusume:global:20261014:support",
    "poolType": "support",
    "timingNote": {
      "ko": "글로벌판 신규 추가. 의상·카드 부제의 공식 현지화 확인 전에는 캐릭터명과 등급을 표시합니다. 원제는 출처에 보존했습니다.",
      "en": "New to Global. Unverified localized outfit/card subtitles are omitted; the original is retained in the source title.",
      "ja": "グローバル版で新登場。衣装・カード名の公式訳未確認箇所は名前とレアリティで表示し、原題を出典に保存。",
      "zh": "国际服新登场。未核实的服装及卡牌副标题暂不翻译，原名保留在来源标题。"
    },
    "pickupMembers": [
      {
        "name": {
          "ko": "야마닌 제퍼 · SSR",
          "en": "Yamanin Zephyr SSR [To Winds Untraveled]",
          "ja": "ヤマニンゼファー · SSR",
          "zh": "也文摄辉 · SSR"
        },
        "type": "new",
        "image": "/assets/entities/uma-zephyr-ssr-9180aa37.webp",
        "imageSource": "https://media.gametora.com/umamusume/supports/full/30126.png",
        "imageKind": "support",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true
      }
    ],
    "imageKind": "support",
    "imageFit": "contain",
    "imagePosition": "50% 45%",
    "imageVerified": true
  },
  {
    "id": "uma-global-20261014-opera",
    "gameId": "umamusume",
    "kind": "pickup",
    "title": {
      "ko": "티엠 오페라 오 · SR",
      "en": "T.M. Opera O SR [Mighty Fotografia]",
      "ja": "テイエムオペラオー · SR",
      "zh": "好歌剧 · SR"
    },
    "summary": {
      "ko": "글로벌 서버 픽업. 서포트 카드.",
      "en": "Global-server spotlight. Support card.",
      "ja": "グローバル版ピックアップ。サポートカード。",
      "zh": "国际服精选。支援卡。"
    },
    "region": "global",
    "server": "Global / Cygames EN",
    "startAt": "2026-10-14T22:00:00Z",
    "endAt": "2026-10-23T21:59:00Z",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://umamusume.com/news/1103",
    "sourceTitle": "T.M. Opera O SR [Mighty Fotografia]",
    "image": "/assets/entities/uma-opera-sr-3dd7dfff.webp",
    "featured": false,
    "imageSource": "https://media.gametora.com/umamusume/supports/full/20054.png",
    "officialLocales": [
      "en"
    ],
    "translatedLocales": [
      "ko",
      "ja",
      "zh"
    ],
    "sourceLocale": "en",
    "localizationSources": {
      "en": "https://umamusume.com/news/1103"
    },
    "pickupType": "new",
    "pickupGroup": "umamusume:global:20261014:support",
    "poolType": "support",
    "timingNote": {
      "ko": "글로벌판 신규 추가. 의상·카드 부제의 공식 현지화 확인 전에는 캐릭터명과 등급을 표시합니다. 원제는 출처에 보존했습니다.",
      "en": "New to Global. Unverified localized outfit/card subtitles are omitted; the original is retained in the source title.",
      "ja": "グローバル版で新登場。衣装・カード名の公式訳未確認箇所は名前とレアリティで表示し、原題を出典に保存。",
      "zh": "国际服新登场。未核实的服装及卡牌副标题暂不翻译，原名保留在来源标题。"
    },
    "pickupMembers": [
      {
        "name": {
          "ko": "티엠 오페라 오 · SR",
          "en": "T.M. Opera O SR [Mighty Fotografia]",
          "ja": "テイエムオペラオー · SR",
          "zh": "好歌剧 · SR"
        },
        "type": "new",
        "image": "/assets/entities/uma-opera-sr-3dd7dfff.webp",
        "imageSource": "https://media.gametora.com/umamusume/supports/full/20054.png",
        "imageKind": "support",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true
      }
    ],
    "imageKind": "support",
    "imageFit": "contain",
    "imagePosition": "50% 45%",
    "imageVerified": true
  },
  {
    "id": "uma-global-20261015-sparkly",
    "gameId": "umamusume",
    "kind": "event",
    "title": {
      "ko": "반짝이는 마법 쇼",
      "en": "Sparkly Magic Show",
      "ja": "きらめく魔法ショー",
      "zh": "闪耀魔法秀"
    },
    "summary": {
      "ko": "도쿄 메가 일루미네이션 컬래버. 장식을 모아 보상 획득.",
      "en": "Tokyo Mega Illumination collaboration. Collect ornaments to earn rewards.",
      "ja": "東京メガイルミとのコラボ。飾りを集めて報酬を獲得。",
      "zh": "东京大井赛马场灯光秀联动，收集装饰获得奖励。"
    },
    "region": "global",
    "server": "Global / Cygames EN",
    "startAt": "2026-10-15T22:00:00Z",
    "endAt": "2026-10-18T21:59:00Z",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T10:45:00Z",
    "sourceUrl": "https://umamusume.com/news/1109",
    "sourceTitle": "Sparkly Magic Show",
    "image": "/assets/umamusume-1109-1.webp",
    "featured": true,
    "imageSource": "https://assets-webview-umamusume-en.akamaized.net/contents/assets/images/uploads/Header/header_31100001_L1792101600.png?c=20261007060624",
    "officialLocales": [
      "en"
    ],
    "translatedLocales": [
      "ko",
      "ja",
      "zh"
    ],
    "sourceLocale": "en",
    "localizationSources": {
      "en": "https://umamusume.com/news/1109"
    }
  },
  {
    "id": "uma-global-20261010-sagittarius",
    "gameId": "umamusume",
    "kind": "event",
    "title": {
      "ko": "챔피언스 미팅 · 사지타리우스배",
      "en": "Champions Meeting: Sagittarius Cup",
      "ja": "チャンピオンズミーティング · サジタリウス杯",
      "zh": "冠军集会 · 射手座杯"
    },
    "summary": {
      "ko": "글로벌 서버 결승 레이스 기간.",
      "en": "Global-server final-round race period.",
      "ja": "グローバル版の決勝ラウンド出走期間。",
      "zh": "国际服决赛出赛阶段。"
    },
    "region": "global",
    "server": "Global / Cygames EN",
    "startAt": "2026-10-15T22:00:00Z",
    "endAt": "2026-10-16T21:59:00Z",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T10:45:00Z",
    "sourceUrl": "https://umamusume.com/news/1087",
    "sourceTitle": "Champions Meeting: Sagittarius Cup",
    "officialLocales": [
      "en"
    ],
    "translatedLocales": [
      "ko",
      "ja",
      "zh"
    ],
    "sourceLocale": "en",
    "localizationSources": {
      "en": "https://umamusume.com/news/1087"
    }
  },
  {
    "id": "uma-global-20261014-transfer",
    "gameId": "umamusume",
    "kind": "event",
    "title": {
      "ko": "특별 이적",
      "en": "Transfer Requests",
      "ja": "特別移籍",
      "zh": "特别转会"
    },
    "summary": {
      "ko": "조건에 맞는 전당 입성 우마무스메 이적으로 보상 획득.",
      "en": "Transfer qualifying Veteran Umamusume to earn rewards.",
      "ja": "条件を満たす殿堂入りウマ娘を移籍して報酬を獲得。",
      "zh": "让符合条件的殿堂赛马娘转会以获取奖励。"
    },
    "region": "global",
    "server": "Global / Cygames EN",
    "startAt": "2026-10-14T22:00:00Z",
    "endAt": "2026-10-18T21:59:00Z",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T10:45:00Z",
    "sourceUrl": "https://umamusume.com/news/1105",
    "sourceTitle": "Transfer Requests",
    "officialLocales": [
      "en"
    ],
    "translatedLocales": [
      "ko",
      "ja",
      "zh"
    ],
    "sourceLocale": "en",
    "localizationSources": {
      "en": "https://umamusume.com/news/1105"
    }
  },
  {
    "id": "nikke-global-20261008-belorta",
    "gameId": "nikke",
    "kind": "pickup",
    "title": {
      "ko": "벨로타 : 펌킨 위치",
      "en": "Belorta: Pumpkin Witch",
      "ja": "ベロータ：パンプキンウィッチ",
      "zh": "貝洛塔：南瓜女巫"
    },
    "summary": {
      "ko": "SSR 특별 모집. 공식 영어 업데이트 공지 기준.",
      "en": "SSR Special Recruit, confirmed from the official English update notice.",
      "ja": "公式英語更新告知に掲載されたSSR特殊募集。",
      "zh": "官方英文更新公告中的SSR特殊招募。"
    },
    "region": "global",
    "server": "Global / Level Infinite",
    "startAt": null,
    "endAt": "2026-10-28T23:59:59+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
    "sourceTitle": "October 8 Update Notice",
    "timingNote": {
      "ko": "10월 8일 점검 후 시작.",
      "en": "Started after Oct 8 maintenance.",
      "ja": "10月8日メンテナンス後に開始。",
      "zh": "10月8日维护后开始。"
    },
    "featured": true,
    "officialLocales": [
      "en",
      "ko",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "en",
    "localizationSources": {
      "en": "https://nikke-en.com/newsdetail.html?content_id=9ff3fe24abf0ca437fa9c7dabd8f369872a8",
      "ko": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
      "ja": "https://nikke-jp.com/newsdetail.html?content_id=b77c06cba64d1a4451aacccaded5ff6434bc",
      "zh": "https://nikke.hotcool.tw/m/News_detail-232"
    },
    "pickupType": "new",
    "pickupGroup": "nikke:global:20261008:character",
    "poolType": "character",
    "image": "/assets/entities/nikke-belorta-235e2435.webp",
    "imageSource": "https://www.gacha.gg/img/nikke/dm/chars/belorta-pumpkin-witch-c063-art.webp",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 45%",
    "imageVerified": true
  },
  {
    "id": "gfl2-haoplay-mityl-featured",
    "gameId": "gfl2",
    "kind": "pickup",
    "title": {
      "ko": "미틸",
      "en": "Mityl",
      "ja": "ミティール",
      "zh": "米蒂爾"
    },
    "summary": {
      "ko": "신규 정예 인형. 같은 기간 미틸·샤이엔·류시의 개별 모집을 선택할 수 있습니다.",
      "en": "New Elite Doll. Mityl, Cheyanne and Liushih have separate simultaneous pools.",
      "ja": "精鋭人形新登場。ミティール・シャイアン・劉蒔を同期間に個別募集。",
      "zh": "新登场精英人形；米蒂爾、夏安、劉蒔同期分别开放卡池。"
    },
    "region": "global",
    "server": "HAOPLAY EN distribution",
    "startAt": "2026-10-08T09:00:00+00:00",
    "endAt": "2026-10-28T18:59:00+00:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "10/8 Update Overview",
    "image": "/assets/entities/gf2-mityl-background-full-19c0c9ff.webp",
    "timingNote": {
      "ko": "Sunborn/Darkwinter 배포판과 별도 확인 필요.",
      "en": "Verify separately from the Sunborn/Darkwinter distribution.",
      "ja": "Sunborn/Darkwinter版とは分けて確認が必要。",
      "zh": "须与Sunborn/Darkwinter发行版本分开核实。"
    },
    "imageSource": "https://iopwiki.com/images/6/6c/GFL2_Mityl_Background.jpg",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "en",
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "new",
    "pickupGroup": "gfl2:global:20261008:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "미틸",
          "en": "Mityl",
          "ja": "ミティール",
          "zh": "米蒂爾"
        },
        "type": "new",
        "image": "/assets/entities/gf2-mityl-background-full-19c0c9ff.webp",
        "imageSource": "https://iopwiki.com/images/6/6c/GFL2_Mityl_Background.jpg",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "56% 44%",
        "imageVerified": true,
        "role": "featured"
      },
      {
        "name": {
          "ko": "캐롤릭",
          "en": "Krolik",
          "ja": "キャロリック",
          "zh": "克羅麗科"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-krolik-f88d7d36.webp",
        "imageSource": "https://res.17996cdn.net/gf2/tw/images/home/ilus-CHAROLIC_91dad23f72.webp?v03",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      },
      {
        "name": {
          "ko": "네메시스",
          "en": "Nemesis",
          "ja": "ネメシス",
          "zh": "納美西絲"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-nemesis-full-4c7d73a7.webp",
        "imageSource": "https://res.17996cdn.net/gf2/tw/images/home/ilus-NEMESIS_ab6a8b4491.webp?v03",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      }
    ],
    "sourceKind": "official",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      }
    ],
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "56% 44%",
    "imageVerified": true
  },
  {
    "id": "gfl2-haoplay-amber-featured",
    "gameId": "gfl2",
    "kind": "event",
    "title": {
      "ko": "호박색 달빛",
      "en": "Amber Reel of Moonlight",
      "ja": "琥珀月光",
      "zh": "琥珀月光"
    },
    "summary": {
      "ko": "이벤트 전역에서 붕괴결정 샤드·지정 액세스 권한 등 보상 획득. 교환 상점은 11월 4일 18:59까지.",
      "en": "Clear event stages for Collapse Pieces, Targeted Access Permissions and other rewards. Shop exchange closes Nov 4, 18:59 server time.",
      "ja": "イベントでコーラップスピース・特殊訪問許可などを獲得。交換はサーバー時間11/4 18:59まで。",
      "zh": "活动关卡可得坍塌晶条、定向采购许可等奖励；兑换截至服务器时间11月4日18:59。"
    },
    "region": "global",
    "server": "HAOPLAY EN distribution",
    "startAt": "2026-10-08T09:00:00+00:00",
    "endAt": "2026-10-28T18:59:00+00:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
    "sourceTitle": "10/8 · Amber Reel of Moonlight update overview",
    "image": "/assets/gf2-notice1.webp",
    "featured": true,
    "imageSource": "https://res.17996cdn.net/gf2/news/261008/en/1.png",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "en",
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
        "title": "10/8 공식 버전 미리보기",
        "publisher": "HAOPLAY · Steam",
        "publishedAt": "2026-10-07T10:00:48Z"
      }
    ],
    "detailSections": [],
    "sourceKind": "official",
    "timingNote": {
      "ko": "HAOPLAY 영문 글로벌 일정은 GMT+0입니다.",
      "en": "HAOPLAY English Global dates use GMT+0.",
      "ja": "HAOPLAY 英語グローバルはGMT+0。",
      "zh": "HAOPLAY 英文国际服使用GMT+0。"
    },
    "highlights": [
      {
        "ko": "교환은 이벤트 종료 7일 후까지",
        "en": "Exchange remains for 7 more days",
        "ja": "終了後7日間交換可能",
        "zh": "结束后仍可兑换7天"
      },
      {
        "ko": "현지 시간 11/4 18:59 교환 마감",
        "en": "Exchange: Nov 4, 18:59 server time",
        "ja": "交換11/4 18:59サーバー時間",
        "zh": "兑换11/4 18:59服务器时间"
      }
    ]
  },
  {
    "gameId": "hsr",
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": null,
    "publishedAt": "2026-09-27",
    "verifiedAt": "2026-10-16T11:56:57Z",
    "sourceUrl": "https://hsr.hoyoverse.com/ko-kr/character",
    "sourceTitle": "펄",
    "version": "4.6",
    "rarity": 5,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://www.hoyolab.com/article/46851682?lang=ko-kr",
      "en": "https://www.hoyolab.com/article/46851682?lang=en-us",
      "ja": "https://www.hoyolab.com/article/46851682?lang=ja-jp",
      "zh": "https://www.hoyolab.com/article/46851682?lang=zh-cn"
    },
    "image": "/assets/entities/pearl-splash-full-48839311.webp",
    "imageSource": "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/09/20/ed0ab5bc744b3e62a86ca4a3f64a2103_6374700249797635944.png",
    "timingNote": {
      "ko": "9월 28일 4.6 업데이트 후 시작. 점검 실제 완료 시각은 미확인.",
      "en": "Starts after the September 28 update; exact maintenance completion time unverified.",
      "ja": "9月28日のVer.4.6アップデート後開始。実際の完了時刻は未確認。",
      "zh": "9月28日4.6版本更新后开始；实际维护完成时刻未单独确认。"
    },
    "id": "hsr-46-pearl",
    "kind": "pickup",
    "pickupType": "new",
    "endAt": "2026-11-10T15:00:00+08:00",
    "title": {
      "ko": "펄",
      "en": "Pearl",
      "ja": "パール",
      "zh": "真珠"
    },
    "summary": {
      "ko": "신규 한정 5★ · 환락·얼음. 「창해에서 맺은 진주」.",
      "en": "New limited 5★ Elation / Ice. An Ocean in a Pearl.",
      "ja": "新限定★5・愉悦・氷。「海より出づる真珠」。",
      "zh": "全新限定5★・欢愉・冰。「沧海萃珠」。"
    },
    "poolType": "character",
    "featured": true,
    "pickupGroup": "hsr-global-asia-4.6-phase1-character",
    "pickupMembers": [
      {
        "name": {
          "ko": "펄",
          "en": "Pearl",
          "ja": "パール",
          "zh": "真珠"
        },
        "type": "new",
        "rarity": 5,
        "image": "/assets/entities/pearl-splash-full-48839311.webp",
        "imageSource": "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/09/20/ed0ab5bc744b3e62a86ca4a3f64a2103_6374700249797635944.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "51% 46%",
        "imageVerified": true
      }
    ],
    "contents": [
      {
        "ko": "4★ 확률 UP: 청작 · 설의 · 미샤",
        "en": "4★ rate-up: Qingque · Xueyi · Misha",
        "ja": "★4確率UP：青雀・雪衣・ミーシャ",
        "zh": "4星概率提升：青雀・雪衣・米沙"
      }
    ],
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "51% 46%",
    "imageVerified": true,
    "sourceLocale": "ko"
  },
  {
    "gameId": "hsr",
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": null,
    "publishedAt": "2026-09-27",
    "verifiedAt": "2026-10-16T11:56:57Z",
    "sourceUrl": "https://hsr.hoyoverse.com/ko-kr/character",
    "sourceTitle": "에바네시아",
    "version": "4.6",
    "rarity": 5,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://www.hoyolab.com/article/46851682?lang=ko-kr",
      "en": "https://www.hoyolab.com/article/46851682?lang=en-us",
      "ja": "https://www.hoyolab.com/article/46851682?lang=ja-jp",
      "zh": "https://www.hoyolab.com/article/46851682?lang=zh-cn"
    },
    "image": "/assets/entities/evanescia-splash-full-276434e1.webp",
    "imageSource": "https://fastcdn.hoyoverse.com/content-v2/hkrpg/163485/98111f6e9c9f74d7864ae25407fcb5a5_1287014810239226640.png",
    "timingNote": {
      "ko": "9월 28일 4.6 업데이트 후 시작. 점검 실제 완료 시각은 미확인.",
      "en": "Starts after the September 28 update; exact maintenance completion time unverified.",
      "ja": "9月28日のVer.4.6アップデート後開始。実際の完了時刻は未確認。",
      "zh": "9月28日4.6版本更新后开始；实际维护完成时刻未单独确认。"
    },
    "id": "hsr-46-evanescia",
    "kind": "pickup",
    "pickupType": "rerun",
    "endAt": "2026-10-21T11:59:00+08:00",
    "title": {
      "ko": "에바네시아",
      "en": "Evanescia",
      "ja": "緋英",
      "zh": "绯英"
    },
    "summary": {
      "ko": "복각 한정 5★ · 환락·물리. 「꽃피운 중재자」.",
      "en": "Rerun limited 5★ Elation / Physical. The Demoiselle in Charge.",
      "ja": "復刻限定★5・愉悦・物理。「花盛りの裁き手」。",
      "zh": "返场限定5★・欢愉・物理。「韶艾裁英」。"
    },
    "poolType": "character",
    "featured": false,
    "pickupGroup": "hsr-global-asia-4.6-phase1-character",
    "pickupMembers": [
      {
        "name": {
          "ko": "에바네시아",
          "en": "Evanescia",
          "ja": "緋英",
          "zh": "绯英"
        },
        "type": "rerun",
        "rarity": 5,
        "image": "/assets/entities/evanescia-splash-full-276434e1.webp",
        "imageSource": "https://fastcdn.hoyoverse.com/content-v2/hkrpg/163485/98111f6e9c9f74d7864ae25407fcb5a5_1287014810239226640.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "52% 39%",
        "imageVerified": true
      }
    ],
    "contents": [
      {
        "ko": "4★ 확률 UP: 청작 · 설의 · 미샤",
        "en": "4★ rate-up: Qingque · Xueyi · Misha",
        "ja": "★4確率UP：青雀・雪衣・ミーシャ",
        "zh": "4星概率提升：青雀・雪衣・米沙"
      }
    ],
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "52% 39%",
    "imageVerified": true,
    "sourceLocale": "ko"
  },
  {
    "gameId": "hsr",
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": null,
    "publishedAt": "2026-09-27",
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://www.hoyolab.com/article/46851682",
    "sourceTitle": "Version 4.6 Event Warp: Phase I",
    "version": "4.6",
    "rarity": 5,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://www.hoyolab.com/article/46851682?lang=ko-kr",
      "en": "https://www.hoyolab.com/article/46851682?lang=en-us",
      "ja": "https://www.hoyolab.com/article/46851682?lang=ja-jp",
      "zh": "https://www.hoyolab.com/article/46851682?lang=zh-cn"
    },
    "image": "/assets/entities/colors-5ad04db6.webp",
    "imageSource": "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/09/24/c36e3ad6df5f2ff6f05f97f0a84bb57f_2001189491613333381.png",
    "timingNote": {
      "ko": "9월 28일 4.6 업데이트 후 시작. 점검 실제 완료 시각은 미확인.",
      "en": "Starts after the September 28 update; exact maintenance completion time unverified.",
      "ja": "9月28日のVer.4.6アップデート後開始。実際の完了時刻は未確認。",
      "zh": "9月28日4.6版本更新后开始；实际维护完成时刻未单独确认。"
    },
    "id": "hsr-46-colors-for-tomorrow",
    "kind": "weapon",
    "pickupType": "new",
    "endAt": "2026-11-10T15:00:00+08:00",
    "title": {
      "ko": "내일에 바치는 색채",
      "en": "Colors for Tomorrow",
      "ja": "明日に捧げる色",
      "zh": "献给明日的色彩"
    },
    "summary": {
      "ko": "신규 한정 5★ 광추 · 환락. 「세월의 응고」.",
      "en": "New limited 5★ Elation Light Cone. Brilliant Fixation.",
      "ja": "新限定★5光円錐・愉悦。「光陰を定めし影」。",
      "zh": "全新限定5★光锥・欢愉。「流光定影」。"
    },
    "poolType": "weapon",
    "featured": false,
    "pickupGroup": "hsr-global-asia-4.6-phase1-weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "내일에 바치는 색채",
          "en": "Colors for Tomorrow",
          "ja": "明日に捧げる色",
          "zh": "献给明日的色彩"
        },
        "type": "new",
        "rarity": 5,
        "image": "/assets/entities/colors-5ad04db6.webp",
        "imageSource": "https://act-webstatic.hoyoverse.com/event-static-hoyowiki-admin/2026/09/24/c36e3ad6df5f2ff6f05f97f0a84bb57f_2001189491613333381.png",
        "imageKind": "weapon",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "contents": [
      {
        "ko": "4★ 확률 UP: 수술 후의 대화 · 행성과의 만남 · 끝없는 춤",
        "en": "4★ rate-up: Post-Op Conversation · Planetary Rendezvous · Boundless Choreo",
        "ja": "★4確率UP：手術後の会話・惑星との出会い・終わりなき舞踏",
        "zh": "4星概率提升：一场术后对话・与行星相会・无边曼舞"
      }
    ],
    "imageKind": "weapon",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true
  },
  {
    "gameId": "hsr",
    "region": "global",
    "server": "Asia (UTC+8)",
    "startAt": null,
    "publishedAt": "2026-09-27",
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://www.hoyolab.com/article/46851682",
    "sourceTitle": "Version 4.6 Event Warp: Phase I",
    "version": "4.6",
    "rarity": 5,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://www.hoyolab.com/article/46851682?lang=ko-kr",
      "en": "https://www.hoyolab.com/article/46851682?lang=en-us",
      "ja": "https://www.hoyolab.com/article/46851682?lang=ja-jp",
      "zh": "https://www.hoyolab.com/article/46851682?lang=zh-cn"
    },
    "image": "/assets/entities/flowers-preview-13-f1ec3316.webp",
    "imageSource": "https://upload-os-bbs.hoyolab.com/upload/2026/04/30/68d0bcbad9196f490e2f3a8c0977a594_140178379433168483.jpg",
    "timingNote": {
      "ko": "9월 28일 4.6 업데이트 후 시작. 점검 실제 완료 시각은 미확인.",
      "en": "Starts after the September 28 update; exact maintenance completion time unverified.",
      "ja": "9月28日のVer.4.6アップデート後開始。実際の完了時刻は未確認。",
      "zh": "9月28日4.6版本更新后开始；实际维护完成时刻未单独确认。"
    },
    "id": "hsr-46-flowers-bloom-again",
    "kind": "weapon",
    "pickupType": "rerun",
    "endAt": "2026-10-21T11:59:00+08:00",
    "title": {
      "ko": "다음 꽃피는 계절의 만남",
      "en": "Until the Flowers Bloom Again",
      "ja": "再び花が咲く季節に",
      "zh": "邂逅于下一个花季"
    },
    "summary": {
      "ko": "복각 한정 5★ 광추 · 환락. 「거슬러 올라가는 기억」.",
      "en": "Rerun limited 5★ Elation Light Cone. Bygone Reminiscence.",
      "ja": "復刻限定★5光円錐・愉悦。「遡る記憶」。",
      "zh": "返场限定5★光锥・欢愉。「溯回忆象」。"
    },
    "poolType": "weapon",
    "featured": false,
    "pickupGroup": "hsr-global-asia-4.6-phase1-weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "다음 꽃피는 계절의 만남",
          "en": "Until the Flowers Bloom Again",
          "ja": "再び花が咲く季節に",
          "zh": "邂逅于下一个花季"
        },
        "type": "rerun",
        "rarity": 5,
        "image": "/assets/entities/flowers-preview-13-f1ec3316.webp",
        "imageSource": "https://upload-os-bbs.hoyolab.com/upload/2026/04/30/68d0bcbad9196f490e2f3a8c0977a594_140178379433168483.jpg",
        "imageKind": "weapon",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "contents": [
      {
        "ko": "4★ 확률 UP: 수술 후의 대화 · 행성과의 만남 · 끝없는 춤",
        "en": "4★ rate-up: Post-Op Conversation · Planetary Rendezvous · Boundless Choreo",
        "ja": "★4確率UP：手術後の会話・惑星との出会い・終わりなき舞踏",
        "zh": "4星概率提升：一场术后对话・与行星相会・无边曼舞"
      }
    ],
    "imageKind": "weapon",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true
  },
  {
    "region": "global",
    "startAt": "2026-10-29T12:00:00+08:00",
    "endAt": "2026-11-19T11:59:00+08:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.140689+00:00",
    "gameId": "endfield",
    "server": "Asia · UTC+8",
    "version": "Sanctuary of Ink",
    "id": "endfield-tangtang",
    "kind": "pickup",
    "title": {
      "ko": "탕탕",
      "en": "Tangtang",
      "ja": "タンタン",
      "zh": "湯湯"
    },
    "summary": {
      "ko": "10월 29일부터 진행되는 복각 픽업.",
      "en": "Rerun begins October 29.",
      "ja": "10月29日から再登場。",
      "zh": "10月29日起復刻。"
    },
    "sourceUrl": "https://endfield.gryphline.com/ko-kr/news/9560",
    "sourceTitle": "「단청도」 버전 업데이트 설명",
    "rarity": 6,
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://endfield.gryphline.com/ko-kr/news/9560",
      "en": "https://endfield.gryphline.com/en-us/news/9560",
      "ja": "https://endfield.gryphline.com/ja-jp/news/9560",
      "zh": "https://endfield.gryphline.com/zh-tw/news/9560"
    },
    "pickupType": "rerun",
    "pickupGroup": "endfield-sanctuary-ink-rerun-1",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "탕탕",
          "en": "Tangtang",
          "ja": "タンタン",
          "zh": "湯湯"
        },
        "type": "rerun",
        "rarity": 6,
        "image": "/assets/entities/endfield-tangtang-splash-full-eaa02d02.webp",
        "imageSource": "https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/tangtang.2602b587.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 40%",
        "imageVerified": true
      }
    ],
    "versionTitle": {
      "ko": "단청도",
      "en": "Sanctuary of Ink",
      "ja": "丹青渡",
      "zh": "丹青渡"
    },
    "image": "/assets/entities/endfield-tangtang-splash-full-eaa02d02.webp",
    "imageSource": "https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/tangtang.2602b587.png",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 40%",
    "imageVerified": true,
    "sourceLocale": "ko"
  },
  {
    "region": "global",
    "startAt": "2026-10-29T12:00:00+08:00",
    "endAt": "2026-11-19T11:59:00+08:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.140689+00:00",
    "gameId": "endfield",
    "server": "Asia · UTC+8",
    "version": "Sanctuary of Ink",
    "id": "endfield-brigand",
    "kind": "weapon",
    "title": {
      "ko": "반항",
      "en": "Brigand's Calling",
      "ja": "落草",
      "zh": "落草"
    },
    "summary": {
      "ko": "10월 29일부터 진행되는 복각 픽업.",
      "en": "Rerun begins October 29.",
      "ja": "10月29日から再登場。",
      "zh": "10月29日起復刻。"
    },
    "sourceUrl": "https://endfield.gryphline.com/ko-kr/news/9560",
    "sourceTitle": "「단청도」 버전 업데이트 설명",
    "rarity": 6,
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://endfield.gryphline.com/ko-kr/news/9560",
      "en": "https://endfield.gryphline.com/en-us/news/9560",
      "ja": "https://endfield.gryphline.com/ja-jp/news/9560",
      "zh": "https://endfield.gryphline.com/zh-tw/news/9560"
    },
    "pickupType": "rerun",
    "pickupGroup": "endfield-sanctuary-ink-rerun-1",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "반항",
          "en": "Brigand's Calling",
          "ja": "落草",
          "zh": "落草"
        },
        "type": "rerun",
        "rarity": 6,
        "image": "/assets/entities/endfield-brigand-exact-9dd3dbde.webp",
        "imageSource": "https://pbs.twimg.com/media/HC88q7Aa8AAWelk.jpg",
        "imageKind": "weapon",
        "imageFit": "cover",
        "imagePosition": "50% 26%",
        "imageVerified": true
      }
    ],
    "versionTitle": {
      "ko": "단청도",
      "en": "Sanctuary of Ink",
      "ja": "丹青渡",
      "zh": "丹青渡"
    },
    "image": "/assets/entities/endfield-brigand-exact-9dd3dbde.webp",
    "imageSource": "https://pbs.twimg.com/media/HC88q7Aa8AAWelk.jpg",
    "imageKind": "weapon",
    "imageFit": "cover",
    "imagePosition": "50% 26%",
    "imageVerified": true,
    "sourceLocale": "ko"
  },
  {
    "id": "wuwa-hsin",
    "gameId": "wuwa",
    "kind": "pickup",
    "title": {
      "ko": "여우의 별자리",
      "en": "Hsin",
      "ja": "心",
      "zh": "心"
    },
    "summary": {
      "ko": "3.7 전반 신규 5성 픽업.",
      "en": "New 5-star featured in version 3.7 phase I.",
      "ja": "Ver.3.7前半の新星5ピックアップ。",
      "zh": "3.7上半全新五星概率提升。"
    },
    "region": "global",
    "server": "Asia · UTC+8",
    "startAt": null,
    "endAt": "2026-10-22T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:17:47.191454+00:00",
    "sourceUrl": "https://wutheringwaves.kurogames.com/kr/main/news/detail/5572",
    "sourceTitle": "「거울에 잠긴 허상, 마음이 비추는 인간 세상」 3.7 버전 업데이트 내용 안내",
    "image": "/assets/entities/wuwa-hsin-splash-full-3df11519.webp",
    "imageSource": "https://wutheringwaves.kurogames.com/static4.0/assets/xin-3df11519.webp",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 45%",
    "imageVerified": true,
    "version": "3.7",
    "rarity": 5,
    "featured": true,
    "timingNote": {
      "ko": "아시아 종료: 10월 22일 10:59 KST/JST. 일본 공식 공지에서 시간대를 명시했습니다.",
      "en": "Asia end: October 22, 10:59 JST (UTC+9), explicitly stated in the Japanese official notice.",
      "ja": "アジア終了：10月22日10:59（日本標準時）。",
      "zh": "亞洲結束：10月22日09:59（UTC+8），據日文官方公告換算。"
    },
    "pickupType": "new",
    "pickupGroup": "wuwa-37-phase-1",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "여우의 별자리",
          "en": "Hsin",
          "ja": "心",
          "zh": "心"
        },
        "type": "new",
        "rarity": 5,
        "image": "/assets/entities/wuwa-hsin-splash-full-3df11519.webp",
        "imageSource": "https://wutheringwaves.kurogames.com/static4.0/assets/xin-3df11519.webp",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true
      }
    ],
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://wutheringwaves.kurogames.com/kr/main/news/detail/5572",
      "en": "https://wutheringwaves.kurogames.com/en/main/news/detail/5571",
      "ja": "https://wutheringwaves.kurogames.com/jp/main/news/detail/5570",
      "zh": "https://media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/zh/article/5569.json"
    },
    "entityDetails": [
      {
        "id": "wuwa-hsin",
        "name": {
          "ko": "여우의 별자리",
          "en": "Hsin",
          "ja": "心",
          "zh": "心"
        },
        "category": {
          "ko": "5★ · 전도 · 증폭기 · 신규",
          "en": "5★ · Electro · Rectifier · New",
          "ja": "星5・電導・増幅器・新規",
          "zh": "5★ · 导电 · 音感仪 · 新角色"
        },
        "basis": {
          "ko": "Lv.90 · 최종 돌파 · 공명 체인 0 · 무기·에코·능력치 노드·전투 버프 제외. HP/공격력/방어력은 출처의 정수 표시값. 계수는 별도 표기된 스킬 레벨 기준.",
          "en": "Lv.90, final ascension, Sequence 0; excludes weapons, Echoes, stat nodes and combat buffs. HP/ATK/DEF follow the source’s integer display. Skill levels are specified separately.",
          "ja": "Lv.90・最終突破・共鳴チェーン0。武器・音骸・ステータスノード・戦闘バフなし。HP/攻撃力/防御力は出典の整数表示。倍率のスキルLv.は別記。",
          "zh": "90级、最终突破、共鸣链0；不含武器、声骸、属性节点及战斗增益。生命/攻击/防御采用来源的整数显示值，技能倍率另注等级。"
        },
        "stats": [
          {
            "label": {
              "ko": "HP",
              "en": "HP",
              "ja": "HP",
              "zh": "生命"
            },
            "value": "10,300"
          },
          {
            "label": {
              "ko": "공격력",
              "en": "ATK",
              "ja": "攻撃力",
              "zh": "攻击"
            },
            "value": "462"
          },
          {
            "label": {
              "ko": "방어력",
              "en": "DEF",
              "ja": "防御力",
              "zh": "防御"
            },
            "value": "1,112"
          },
          {
            "label": {
              "ko": "크리티컬",
              "en": "CRIT Rate",
              "ja": "クリティカル",
              "zh": "暴击率"
            },
            "value": "5%"
          },
          {
            "label": {
              "ko": "크리티컬 피해",
              "en": "CRIT DMG",
              "ja": "クリティカルダメージ",
              "zh": "暴击伤害"
            },
            "value": "150%"
          },
          {
            "label": {
              "ko": "공명 효율",
              "en": "Energy Regen",
              "ja": "共鳴効率",
              "zh": "共鸣效率"
            },
            "value": "100%"
          },
          {
            "label": {
              "ko": "능력치 노드 · 크리티컬",
              "en": "Stat nodes · CRIT Rate",
              "ja": "属性ノード・クリティカル",
              "zh": "属性节点 · 暴击率"
            },
            "value": "+8%",
            "note": {
              "ko": "기본값과 별도",
              "en": "Separate from base values",
              "ja": "基本値と別枠",
              "zh": "未计入基础值"
            }
          },
          {
            "label": {
              "ko": "능력치 노드 · 공격력",
              "en": "Stat nodes · ATK",
              "ja": "属性ノード・攻撃力",
              "zh": "属性节点 · 攻击力"
            },
            "value": "+12%",
            "note": {
              "ko": "기본값과 별도",
              "en": "Separate from base values",
              "ja": "基本値と別枠",
              "zh": "未计入基础值"
            }
          }
        ],
        "statSourceKind": "community",
        "groups": [
          {
            "title": {
              "ko": "기본 공격 · 만상에 피는 빛",
              "en": "Normal Attack · Manifold Bloom",
              "ja": "基本攻撃 · 万相、華を生ず",
              "zh": "常态攻击 · 万相生华"
            },
            "body": {
              "ko": "화응 형태는 일반 공격 4단, 비춤 형태는 기본 3단입니다. 기관 통솔 중에는 비춤 일반 공격이 4단으로 바뀝니다.",
              "en": "Answering Form has four basic-attack stages; Illumining Form normally has three, changing to four during Mechanism Dominion.",
              "ja": "化応形態は通常攻撃4段、照見形態は基本3段。機関を統べる強化状態では照見側も4段になります。",
              "zh": "化应形态普攻4段，照见形态通常3段，统御机关的强化状态中变为4段。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://wuwaguide.kurogames.com/ko/?role_id=1311"
            ]
          },
          {
            "title": {
              "ko": "공명 스킬 · 달밤을 거닐어 돌아온 마음",
              "en": "Resonance Skill · Heartward by Moon",
              "ja": "共鳴スキル · 踏月帰心",
              "zh": "共鸣技能 · 踏月归心"
            },
            "body": {
              "ko": "화응 스킬 후 일반 공격 4단으로 연결할 수 있습니다. 이후 지상 이동으로 여우 형태가 되며, 비전투 중 3초마다 최대 HP의 6%를 회복합니다.",
              "en": "The Answering skill links into basic stage 4. Moving on the ground afterward enables fox form, which heals 6% max HP every 3 seconds outside combat.",
              "ja": "化応側のスキル後は通常4段へ接続可能。続いて地上移動すると狐の姿になり、非戦闘時は3秒ごとに最大HPの6%を回復します。",
              "zh": "化应技能后可衔接普攻第4段，随后地面移动可化为狐形；非战斗时每3秒恢复6%生命上限。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://wuwaguide.kurogames.com/ko/?role_id=1311"
            ]
          },
          {
            "title": {
              "ko": "공명 회로 · 만상이 도니, 이 마음도 밝아지네",
              "en": "Forte Circuit · Forms Turn, Heart Abides",
              "ja": "共鳴回路 · 万相流転すれど、此の心自ずから明らかなり",
              "zh": "共鸣回路 · 万相流转，此心自明"
            },
            "body": {
              "ko": "마음의 화응 100pt에서 강화 강공격으로 형상 전환을 해제합니다. 마음의 비춤 300pt로 강화 스킬을 쓰면 기관 통솔 13초에 진입하며, 자원을 모두 소모한 뒤 강화 강공격→마무리 해방으로 이어집니다. 핵심 강화 공격은 공명 스킬 피해 판정입니다. 전자 모드는 천둥의 마음 최대 100스택을 소비해 전자 피해를 유발하고, 합일 모드는 교대와 강화 변주를 사용합니다.",
              "en": "100 Answering Heart enables the heavy attack that unlocks Formshift. At 300 Illumining Heart, the enhanced skill opens a 13-second Mechanism Dominion window. Spend its resource, then use the enhanced heavy and finishing Liberation. Key enhanced attacks count as Skill DMG. Electro Flare consumes up to 100 Heart of Thunder stacks; Unison uses swaps and enhanced Intros.",
              "ja": "化応側の資源100ptで強化重撃から形態転換を解放。照見側300ptの強化スキルで13秒の強化状態に入り、資源消費後に強化重撃→締めの解放へ。主要な強化攻撃は共鳴スキルダメージ扱い。電磁型は最大100スタックを消費し、同奏型は交代と強化変奏を使います。",
              "zh": "化应资源100点时以强化重击解锁形态切换；照见资源300点时强化技能开启13秒强化状态，耗尽后接强化重击与收尾解放。核心强化攻击视为共鸣技能伤害。电磁模式消耗最多100层资源，同奏模式围绕切换与强化变奏。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://wuwaguide.kurogames.com/ko/?role_id=1311"
            ]
          },
          {
            "title": {
              "ko": "공명 해방 · 중추로 이끈 맑은 빛",
              "en": "Resonance Liberation · Nexus Alight",
              "ja": "共鳴解放 · 枢を引きて清輝と作す",
              "zh": "共鸣解放 · 引枢作清辉"
            },
            "body": {
              "ko": "형상 전환은 비춤 형태와 45초 심상 상태를 열고, 칙령 21스택으로 협동 공격을 제공합니다. 마무리 「무수히 하늘을 뒤덮은 궁궐」은 공명 스킬 피해로 계산되고 화응 형태로 돌아갑니다.",
              "en": "Formshift grants Illumining Form, a 45-second state and 21 Edict stacks for coordinated attacks. The finishing Pillars Across Heaven counts as Skill DMG and returns Hsin to Answering Form.",
              "ja": "形態転換で照見形態、45秒の状態、協同攻撃用21スタックを獲得。締めの解放は共鳴スキルダメージ扱いで、化応形態に戻ります。",
              "zh": "形态切换开启照见形态及45秒状态，并获得21层协同攻击资源。收尾解放视为共鸣技能伤害，之后回到化应形态。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://wuwaguide.kurogames.com/ko/?role_id=1311"
            ]
          },
          {
            "title": {
              "ko": "변주 스킬 · 흥미로운 눈길",
              "en": "Intro Skill · Glance on a Whim",
              "ja": "変奏スキル · 興に乗じて一顧す",
              "zh": "变奏技能 · 乘兴一顾"
            },
            "body": {
              "ko": "화응 변주는 마음의 화응 60pt를 확보합니다. 합일 대응 변주는 강화되며, 비춤 상태에서 합일 변주로 등장하면 마음의 비춤 300pt와 기관 통솔을 바로 얻습니다.",
              "en": "Answering Intro grants 60 Answering Heart. Unison Response enhances the Intro; entering Illumining Form with a Unison Intro directly grants 300 Illumining Heart and Mechanism Dominion.",
              "ja": "化応変奏で資源60ptを獲得。同奏レスポンスで変奏が強化され、照見側の同奏変奏では資源300ptと強化状態を即時獲得します。",
              "zh": "化应变奏提供60点资源。同奏响应强化变奏；照见形态以同奏变奏入场时直接获得300点资源与强化状态。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://wuwaguide.kurogames.com/ko/?role_id=1311"
            ]
          },
          {
            "title": {
              "ko": "반주 스킬",
              "en": "Outro Skill",
              "ja": "終奏スキル",
              "zh": "延奏技能"
            },
            "body": {
              "ko": "밤을 밝히는 빛을 소비합니다. 합일에서는 조건을 충족한 다른 파티원의 전체 피해를 20%/30초 부스트하고, 전자에서는 다른 파티원의 전도 피해를 20%/20초 부스트합니다. 모드 전환 시 종료됩니다.",
              "en": "Consumes Nightglow. Unison grants eligible other allies 20% all-DMG amplification for 30 seconds; Electro Flare grants other allies 20% Electro amplification for 20 seconds. Changing modes ends these buffs.",
              "ja": "専用効果を消費。同奏では条件を満たす他の味方の全ダメージを20%・30秒増幅、電磁では他の味方の電導ダメージを20%・20秒増幅。モード変更で終了。",
              "zh": "消耗专属状态。同奏模式使符合条件的其他队友全伤害加深20%，持续30秒；电磁模式使其他队友导电伤害加深20%，持续20秒。切换模式后结束。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://guide-server.aki-game.net/introduction/info?roleGbId=1311&id=13151"
            ]
          },
          {
            "title": {
              "ko": "고유 스킬",
              "en": "Inherent skills",
              "ja": "固有スキル",
              "zh": "固有技能"
            },
            "body": {
              "ko": "합일 강화 변주 후 공격력 +50%/8초. 전자 부여는 캐릭터당 1회 전도 피해 +25%, 최대 2스택을 제공합니다. 전도 방랑자의 변주 시 두 캐릭터의 전도 피해 +20%/30초가 추가됩니다.",
              "en": "Enhanced Unison Intro gives 50% ATK for 8 seconds. Electro Flare application provides 25% Electro DMG per qualifying teammate, up to two stacks. Electro Rover’s Intro adds 20% Electro DMG to both for 30 seconds.",
              "ja": "同奏の強化変奏後は攻撃力+50%・8秒。電磁付与でキャラごとに1回、電導ダメージ+25%、最大2重。電導漂泊者の変奏で両者に電導+20%・30秒。",
              "zh": "同奏强化变奏后攻击+50%，持续8秒；队友施加电磁提供导电伤害+25%，每角色一次，最多2层。导电漂泊者变奏另使双方导电伤害+20%，持续30秒。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://guide-server.aki-game.net/introduction/info?roleGbId=1311&id=13151"
            ]
          },
          {
            "title": {
              "ko": "주요 계수 · 스킬 Lv.10",
              "en": "Key coefficients · Skill Lv.10",
              "ja": "主要倍率・スキルLv.10",
              "zh": "主要倍率 · 技能10级"
            },
            "body": {
              "ko": "Lv.10 · 체인 0의 표기 계수. 공격력 기준이며 버프·저항·방어 계산 전입니다. 다단 공격은 합산하지 않고 원래 구성을 유지했습니다. 치유·실드는 별도로 표시합니다.",
              "en": "Skill Lv.10, Sequence 0. ATK-based listed coefficients before buffs, resistance and defense. Multi-hit terms remain separate; healing and shields are labeled.",
              "ja": "スキルLv.10・チェーン0の表記倍率。攻撃力基準でバフ・耐性・防御計算前。多段攻撃は元の内訳を維持し、回復とシールドを区別。",
              "zh": "技能10级、共鸣链0的标示倍率，以攻击力为基准，未计算增益、抗性与防御。保留多段构成，治疗和护盾另行标注。"
            },
            "sourceKind": "community",
            "sourceUrls": [
              "https://www.prydwen.gg/wuthering-waves/characters/hsin"
            ],
            "rows": [
              {
                "label": {
                  "ko": "화응 일반 공격 4단",
                  "en": "Answering basic stage 4",
                  "ja": "化応・通常4段",
                  "zh": "化应普攻第4段"
                },
                "value": "39.72%+39.72%+119.15%"
              },
              {
                "label": {
                  "ko": "화응 공명 스킬",
                  "en": "Answering Skill",
                  "ja": "化応・共鳴スキル",
                  "zh": "化应共鸣技能"
                },
                "value": "23.30%+23.30%+23.30%+15.53%×2+54.36%"
              },
              {
                "label": {
                  "ko": "비춤 공명 스킬",
                  "en": "Illumining Skill",
                  "ja": "照見・共鳴スキル",
                  "zh": "照见共鸣技能"
                },
                "value": "10.36%×4+165.65%"
              },
              {
                "label": {
                  "ko": "강화 강공격 · 속세 평정",
                  "en": "Enhanced heavy · Realm Protector",
                  "ja": "強化重撃・化応",
                  "zh": "强化重击 · 化应"
                },
                "value": "99.32%+24.83%×6+993.15%"
              },
              {
                "label": {
                  "ko": "강화 스킬 · 무수히 이어진 궁궐",
                  "en": "Enhanced Skill · Pillars Aligned",
                  "ja": "強化スキル・照見",
                  "zh": "强化技能 · 照见"
                },
                "value": "179.43%×4+17.95%+35.89%×2+44.86%×2"
              },
              {
                "label": {
                  "ko": "강화 강공격 · 천하 평정",
                  "en": "Enhanced heavy · Stilling All Horizons",
                  "ja": "強化重撃・照見",
                  "zh": "强化重击 · 照见"
                },
                "value": "27.05%×4+973.49%"
              },
              {
                "label": {
                  "ko": "마무리 해방 · 공명 스킬 판정",
                  "en": "Finishing Liberation · Skill DMG",
                  "ja": "締めの解放・スキルダメージ扱い",
                  "zh": "收尾解放 · 视为技能伤害"
                },
                "value": "80.51%+90.57%+60.38%+100.64%+70.45%+1610.12%"
              },
              {
                "label": {
                  "ko": "형상 전환 쿨타임(초)",
                  "en": "Formshift cooldown (s)",
                  "ja": "形態転換CD（秒）",
                  "zh": "形态切换冷却（秒）"
                },
                "value": "25"
              },
              {
                "label": {
                  "ko": "마무리 해방 에너지 소모",
                  "en": "Finishing Liberation energy cost",
                  "ja": "締めの解放の消費エネルギー",
                  "zh": "收尾解放能量消耗"
                },
                "value": "125"
              }
            ]
          },
          {
            "title": {
              "ko": "공명 체인 · 1~6 요약",
              "en": "Resonance Chain · S1–S6",
              "ja": "共鳴チェーン・1〜6要約",
              "zh": "共鸣链 · 1～6摘要"
            },
            "body": {
              "ko": "각 체인의 주요 변화만 요약했습니다. 기본 스탯·계수 표에는 체인 효과를 포함하지 않습니다.",
              "en": "Selected changes per Sequence; the base stats and coefficient table exclude these effects.",
              "ja": "各チェーンの主な変化を要約。基本ステータスと倍率表には反映していません。",
              "zh": "仅摘要各阶主要变化，基础属性与倍率表均未计入这些效果。"
            },
            "sourceKind": "official",
            "sourceUrls": [
              "https://guide-server.aki-game.net/introduction/info?roleGbId=1311&id=13151"
            ],
            "rows": [
              {
                "label": {
                  "ko": "1체인",
                  "en": "S1",
                  "ja": "1チェーン",
                  "zh": "1链"
                },
                "value": "1",
                "note": {
                  "ko": "형상 전환 시 방어 장벽 2회. 전자 자원 최소50 보충(12초 간격), 전자 계수35%→42%.",
                  "en": "Two defensive wards on Formshift; Electro resource floor 50 every 12s; Flare factor 35% → 42%.",
                  "ja": "形態転換で防護2回。電磁資源を最低50へ（12秒間隔）、係数35%→42%。",
                  "zh": "切换形态获得2次防护；电磁资源最低补至50（12秒间隔），系数35%→42%。"
                }
              },
              {
                "label": {
                  "ko": "2체인",
                  "en": "S2",
                  "ja": "2チェーン",
                  "zh": "2链"
                },
                "value": "2",
                "note": {
                  "ko": "양 형태의 강화 강공격 배율 +60%; 전투 진입 자원/강화 쿨타임 보조.",
                  "en": "Enhanced-heavy multipliers +60% in both forms; combat-entry resource/cooldown support.",
                  "ja": "両形態の強化重撃倍率+60%。戦闘開始時の資源・強化CDを補助。",
                  "zh": "双形态强化重击倍率+60%，进入战斗时补资源并重置强化冷却。"
                }
              },
              {
                "label": {
                  "ko": "3체인",
                  "en": "S3",
                  "ja": "3チェーン",
                  "zh": "3链"
                },
                "value": "3",
                "note": {
                  "ko": "마무리 해방 배율 +70%. 합일은 해당 치명 피해 강화, 전자는 전자 피해계수×1500% 추가타.",
                  "en": "Finishing Liberation multiplier +70%; Unison adds its CRIT DMG, Flare adds a 1500%-factor proc.",
                  "ja": "締めの解放倍率+70%。同奏は会心ダメージ強化、電磁は1500%係数の追加発動。",
                  "zh": "收尾解放倍率+70%；同奏强化暴伤，电磁追加1500%系数触发。"
                }
              },
              {
                "label": {
                  "ko": "4체인",
                  "en": "S4",
                  "ja": "4チェーン",
                  "zh": "4链"
                },
                "value": "4",
                "note": {
                  "ko": "전자/자기 폭발 부여 또는 합일 조건 충족 시 파티 전체 속성 피해 +20%/30초.",
                  "en": "Qualifying Flare/Rage or Unison actions grant party All-Attribute DMG +20% for 30s.",
                  "ja": "電磁・関連効果や同奏条件で全員の全属性ダメージ+20%・30秒。",
                  "zh": "满足电磁、相关状态或同奏条件后全队全属性伤害+20%，持续30秒。"
                }
              },
              {
                "label": {
                  "ko": "5체인",
                  "en": "S5",
                  "ja": "5チェーン",
                  "zh": "5链"
                },
                "value": "5",
                "note": {
                  "ko": "비춤 중 받는 피해 -20%; 치명 피해 시 HP100% 회복·1초 면역(10분 간격).",
                  "en": "Illumining damage taken −20%; fatal-hit recovery to full HP plus 1s immunity, once per 10 minutes.",
                  "ja": "照見中の被ダメージ−20%。致死時全回復・1秒無敵、10分間隔。",
                  "zh": "照见状态受伤−20%；致命伤时满血恢复及1秒免疫，间隔10分钟。"
                }
              },
              {
                "label": {
                  "ko": "6체인",
                  "en": "S6",
                  "ja": "6チェーン",
                  "zh": "6链"
                },
                "value": "6",
                "note": {
                  "ko": "자신의 공명 스킬 피해에 적 방어20% 무시 및 받는 피해40% 증가. 전자 치명타80%/230% 고정.",
                  "en": "Skill DMG ignores 20% DEF and targets take 40% more; Flare crits fixed at 80%/230%.",
                  "ja": "自身のスキルで防御20%無視・対象の被ダメージ40%増。電磁の会心80%/230%固定。",
                  "zh": "自身技能无视20%防御且目标承伤+40%；电磁暴击率/暴伤固定80%/230%。"
                }
              }
            ]
          }
        ],
        "sources": [
          {
            "kind": "official",
            "url": "https://wuwaguide.kurogames.com/ko/?role_id=1311",
            "title": "명조 공식 공략 · 공명자 스킬 DB",
            "publisher": "KURO GAMES"
          },
          {
            "kind": "community",
            "url": "https://wuwaguide.kurogames.com/ko/?role_id=1311&strategy_id=13151",
            "title": "공식 공략 사이트 수록 WW Echoes 가이드",
            "publisher": "WW Echoes"
          },
          {
            "kind": "community",
            "url": "https://www.prydwen.gg/wuthering-waves/characters/hsin",
            "title": "Hsin · stats and skill Lv.10 multipliers",
            "publisher": "Prydwen"
          },
          {
            "kind": "community",
            "url": "https://wuthering.gg/characters/hsin",
            "title": "Hsin · Lv.90 base stats",
            "publisher": "Wuthering.gg"
          },
          {
            "kind": "community",
            "url": "https://gamevika.com/ko/wuwa/hsin",
            "title": "여우의 별자리 · Lv.1/Lv.90 기본 스탯",
            "publisher": "GameVika"
          },
          {
            "kind": "official",
            "url": "https://guide-server.aki-game.net/introduction/info?roleGbId=1311&id=13151",
            "title": "공식 스킬·공명 체인 원문 데이터",
            "publisher": "KURO GAMES"
          }
        ],
        "verifiedAt": "2026-10-16T14:17:47.191454+00:00",
        "notes": [
          {
            "ko": "캐릭터명과 기본 5종 스킬명은 공식 한·영·일·중 표기입니다. 설명·표 라벨은 PATCHWORK의 요약·번역이며, 공식 스킬 자료와 커뮤니티 수치를 구분했습니다.",
            "en": "Character names and the five main skill names use official KO/EN/JA/ZH localization. Explanations and table labels are PATCHWORK summaries/translations; official mechanics and community numbers are labeled separately.",
            "ja": "キャラクター名と主要5種のスキル名は公式の韓・英・日・中表記です。説明と表の項目名はPATCHWORKの要約・翻訳で、公式仕様とコミュニティ数値を区別しています。",
            "zh": "角色及五类主要技能名称采用官方韩、英、日、中本地化。说明与表格标签为PATCHWORK摘要/翻译，并区分官方机制与社区数值。"
          },
          {
            "ko": "최대 공명 에너지는 커뮤니티 표기 140과 해방 소모 125가 함께 존재하여 확정하지 않았습니다. 여기서는 검증된 해방 소모만 표시합니다.",
            "en": "Community pages show 140 maximum energy alongside a 125 Liberation cost. Maximum energy remains unconfirmed; only the verified cost is shown.",
            "ja": "最大エネルギー140と解放消費125の表記が併存するため、最大値は未確定。確認できた消費量のみ表示します。",
            "zh": "社区存在最大能量140与解放消耗125并列的情况；最大值未确认，仅显示核对过的消耗。"
          }
        ]
      }
    ]
  },
  {
    "id": "wuwa-blooming-jadehaven",
    "gameId": "wuwa",
    "kind": "weapon",
    "title": {
      "ko": "옥궐에 피는 꽃",
      "en": "Blooming Jadehaven",
      "ja": "玉殿に咲き満ちる玄華",
      "zh": "玉阙玄华"
    },
    "summary": {
      "ko": "3.7 전반 신규 5성 픽업.",
      "en": "New 5-star featured in version 3.7 phase I.",
      "ja": "Ver.3.7前半の新星5ピックアップ。",
      "zh": "3.7上半全新五星概率提升。"
    },
    "region": "global",
    "server": "Asia · UTC+8",
    "startAt": null,
    "endAt": "2026-10-22T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:09:38.816210Z",
    "sourceUrl": "https://wutheringwaves.kurogames.com/kr/main/news/detail/5572",
    "sourceTitle": "「거울에 잠긴 허상, 마음이 비추는 인간 세상」 3.7 버전 업데이트 내용 안내",
    "image": "/assets/entities/wuwa-blooming-jadehaven-exact-ec6c5a9c.webp",
    "imageSource": "https://pbs.twimg.com/media/HTH8k2easAAaQqL.jpg",
    "imageKind": "weapon",
    "imageFit": "cover",
    "imagePosition": "50% 24%",
    "imageVerified": true,
    "version": "3.7",
    "rarity": 5,
    "featured": true,
    "timingNote": {
      "ko": "아시아 종료: 10월 22일 10:59 KST/JST. 일본 공식 공지에서 시간대를 명시했습니다.",
      "en": "Asia end: October 22, 10:59 JST (UTC+9), explicitly stated in the Japanese official notice.",
      "ja": "アジア終了：10月22日10:59（日本標準時）。",
      "zh": "亞洲結束：10月22日09:59（UTC+8），據日文官方公告換算。"
    },
    "pickupType": "new",
    "pickupGroup": "wuwa-37-phase-1",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "옥궐에 피는 꽃",
          "en": "Blooming Jadehaven",
          "ja": "玉殿に咲き満ちる玄華",
          "zh": "玉阙玄华"
        },
        "type": "new",
        "rarity": 5,
        "image": "/assets/entities/wuwa-blooming-jadehaven-exact-ec6c5a9c.webp",
        "imageSource": "https://pbs.twimg.com/media/HTH8k2easAAaQqL.jpg",
        "imageKind": "weapon",
        "imageFit": "cover",
        "imagePosition": "50% 24%",
        "imageVerified": true
      }
    ],
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://wutheringwaves.kurogames.com/kr/main/news/detail/5572",
      "en": "https://wutheringwaves.kurogames.com/en/main/news/detail/5571",
      "ja": "https://wutheringwaves.kurogames.com/jp/main/news/detail/5570",
      "zh": "https://media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/zh/article/5569.json"
    },
    "entityDetails": [
      {
        "id": "weapon-21050116",
        "name": {
          "ko": "옥궐에 피는 꽃",
          "en": "Blooming Jadehaven",
          "ja": "玉殿に咲き満ちる玄華",
          "zh": "玉阙玄华"
        },
        "category": {
          "ko": "5★ 증폭기",
          "en": "5★ Rectifier",
          "ja": "★5 増幅器",
          "zh": "五星 音感仪"
        },
        "basis": {
          "ko": "무기 단독 기본 수치 · Lv.1 / 최종 돌파 Lv.90. 패시브·캐릭터·에코 보정 미포함. 효과 설명은 공명 1단계, 아래 비교표는 공명 1→5단계 순서.",
          "en": "Weapon-only base stats at Lv.1 / fully ascended Lv.90; passive, character and Echo bonuses excluded. Effect summary: rank 1. Comparison rows: ranks 1→5.",
          "ja": "武器単体の基礎値。Lv.1／最終突破後Lv.90。パッシブ・キャラ・音骸の補正を除外。効果説明はランク1、比較値はランク1→5の順。",
          "zh": "武器基础数值：1级／最终突破后90级，不含被动、角色或声骸加成。效果说明按谐振1阶，比较表依次为1→5阶。"
        },
        "stats": [
          {
            "label": {
              "ko": "기초 공격력 · Lv.1",
              "en": "Base ATK · Lv.1",
              "ja": "基礎攻撃力 · Lv.1",
              "zh": "基础攻击力 · 1级"
            },
            "value": "47"
          },
          {
            "label": {
              "ko": "기초 공격력 · Lv.90",
              "en": "Base ATK · Lv.90",
              "ja": "基礎攻撃力 · Lv.90",
              "zh": "基础攻击力 · 90级"
            },
            "value": "588"
          },
          {
            "label": {
              "ko": "크리티컬 · Lv.1",
              "en": "Crit. Rate · Lv.1",
              "ja": "クリティカル率 · Lv.1",
              "zh": "暴击率 · 1级"
            },
            "value": "5.4%"
          },
          {
            "label": {
              "ko": "크리티컬 · Lv.90",
              "en": "Crit. Rate · Lv.90",
              "ja": "クリティカル率 · Lv.90",
              "zh": "暴击率 · 90级"
            },
            "value": "24.3%"
          }
        ],
        "statSourceKind": "community",
        "groups": [
          {
            "title": {
              "ko": "무수한 기예의 날 · 공명 1단계",
              "en": "Hundredfold Artifice · Rank 1",
              "ja": "武器効果 · ランク1",
              "zh": "百巧琢锋 · 谐振1阶"
            },
            "body": {
              "ko": "전체 속성 피해 보너스 +12%. 전자 효과를 추가하거나 합일에 대응하면 공명 스킬 피해 부스트 +36%, 해당 피해의 전도 저항 무시 10%가 적용됩니다. 장착자가 필드에 있는 동안 주변 목표의 전자 효과 받는 피해를 30% 부스트합니다.",
              "en": "All-Attribute DMG Bonus +12%. Inflicting Electro Flare or triggering Unison Response grants 36% Resonance Skill DMG Amplification and 10% Electro RES ignore for that damage. While the wielder is active, nearby targets take 30% Amplified Electro Flare DMG.",
              "ja": "全属性ダメージボーナス+12%。電磁効果の付与または合一への応答で、共鳴スキルダメージを36%ブーストし、そのダメージは電導耐性を10%無視。装備者が出場中、周囲の敵が受ける電磁効果ダメージを30%ブースト。",
              "zh": "全属性伤害加成+12%。附加电磁效应或响应同奏后，共鸣技能伤害加深36%，该伤害无视10%导电抗性。装备者在场时，附近目标受到的电磁效应伤害加深30%。"
            },
            "sourceKind": "community",
            "sourceUrls": [
              "https://phro.love/db/weapon/21050116",
              "https://wuthering.gg/ko/weapons/blooming-jadehaven",
              "https://wutheringlab.com/weapon/blooming-jadehaven/"
            ]
          },
          {
            "title": {
              "ko": "발동 조건·지속·중첩",
              "en": "Triggers, duration and stacks",
              "ja": "発動・持続・重複条件",
              "zh": "触发、持续与叠加"
            },
            "body": {
              "ko": "발동 후 지속 30초, 0.1초마다 최대 1회 발생. 같은 이름의 효과가 겹치면 높은 수치만 적용됩니다. 전도 저항 무시는 공명 스킬 피해에만 적용됩니다.",
              "en": "Triggered effect lasts 30 seconds and can trigger once per 0.1 seconds. Only the strongest same-name effect applies. Electro RES ignore applies to Resonance Skill damage.",
              "ja": "発動後30秒間持続、0.1秒につき1回まで。同名効果は最も高い数値のみ適用。電導耐性無視の対象は共鳴スキルダメージ。",
              "zh": "触发后持续30秒，每0.1秒最多触发1次。同名效果取最高值；导电抗性无视只作用于共鸣技能伤害。"
            },
            "sourceKind": "community",
            "sourceUrls": [
              "https://phro.love/db/weapon/21050116",
              "https://wuthering.gg/ko/weapons/blooming-jadehaven",
              "https://wutheringlab.com/weapon/blooming-jadehaven/"
            ]
          },
          {
            "title": {
              "ko": "공명 단계별 수치",
              "en": "Values by rank",
              "ja": "ランク別の数値",
              "zh": "各谐振等阶数值"
            },
            "body": {
              "ko": "각 행은 공명 1 → 2 → 3 → 4 → 5단계 순서입니다.",
              "en": "Each row lists ranks 1 → 2 → 3 → 4 → 5.",
              "ja": "各行はランク1 → 2 → 3 → 4 → 5の順です。",
              "zh": "每行依次为谐振1 → 2 → 3 → 4 → 5阶。"
            },
            "sourceKind": "community",
            "sourceUrls": [
              "https://phro.love/db/weapon/21050116",
              "https://wuthering.gg/ko/weapons/blooming-jadehaven",
              "https://wutheringlab.com/weapon/blooming-jadehaven/"
            ],
            "rows": [
              {
                "label": {
                  "ko": "전체 속성 피해 보너스",
                  "en": "All-Attribute DMG Bonus",
                  "ja": "全属性ダメージボーナス",
                  "zh": "全属性伤害加成"
                },
                "value": "12 / 15 / 18 / 21 / 24%"
              },
              {
                "label": {
                  "ko": "공명 스킬 피해 부스트",
                  "en": "Resonance Skill DMG Amplification",
                  "ja": "共鳴スキルダメージブースト",
                  "zh": "共鸣技能伤害加深"
                },
                "value": "36 / 45 / 54 / 63 / 72%"
              },
              {
                "label": {
                  "ko": "전도 저항 무시 · 공명 스킬",
                  "en": "Electro RES ignore · Skill DMG",
                  "ja": "電導耐性無視 · 共鳴スキル",
                  "zh": "导电抗性无视 · 共鸣技能"
                },
                "value": "10 / 13.5 / 17 / 20.5 / 24%"
              },
              {
                "label": {
                  "ko": "목표의 전자 효과 받는 피해 부스트",
                  "en": "Electro Flare DMG taken amplification",
                  "ja": "敵が受ける電磁効果ダメージブースト",
                  "zh": "目标受到电磁效应伤害加深"
                },
                "value": "30 / 37.5 / 45 / 52.5 / 60%"
              }
            ]
          }
        ],
        "sources": [
          {
            "kind": "official",
            "url": "https://wutheringwaves.kurogames.com/kr/main/news/detail/5572",
            "title": "3.7 버전 업데이트 내용 안내 — 옥궐에 피는 꽃",
            "publisher": "KURO GAMES 한국 공식"
          },
          {
            "kind": "community",
            "url": "https://phro.love/db/weapon/21050116",
            "title": "옥궐에 피는 꽃 — 상세 도감",
            "publisher": "Phro.Love"
          },
          {
            "kind": "community",
            "url": "https://wuthering.gg/ko/weapons/blooming-jadehaven",
            "title": "옥궐에 피는 꽃 — 한국어 효과 확인",
            "publisher": "Wuthering.gg"
          },
          {
            "kind": "community",
            "url": "https://wutheringlab.com/weapon/blooming-jadehaven/",
            "title": "옥궐에 피는 꽃 — 스탯·공명 단계 교차 확인",
            "publisher": "Wutheringlab"
          }
        ],
        "verifiedAt": "2026-10-16T14:09:38.816210Z",
        "notes": [
          {
            "ko": "무기명은 한국 공식 공지에서 확인했습니다. 상세 능력치는 공개 커뮤니티 도감의 현재 데이터끼리 대조한 값이며, 설명은 편집 요약입니다.",
            "en": "The Korean weapon name is verified in official notices. Detailed stats are cross-checked between public community databases; descriptions are editorial summaries.",
            "ja": "韓国語の武器名は公式告知で確認。詳細値は公開コミュニティ図鑑同士で照合し、説明は編集要約です。",
            "zh": "韩文武器名称已核对官方公告；详细数值对照公开社区图鉴，说明为编辑摘要。"
          },
          {
            "ko": "공격력 588은 도감의 정수 표시값입니다(공개 원시값 587.5).",
            "en": "588 ATK is the database display value (raw value: 587.5).",
            "ja": "攻撃力588は図鑑の整数表示値（公開元データは587.5）。",
            "zh": "攻击力588为图鉴整数显示值，公开原始数值为587.5。"
          }
        ]
      }
    ]
  },
  {
    "id": "arknights-sealed-jp",
    "gameId": "arknights",
    "kind": "pickup",
    "title": {
      "ko": "켈시 에스페란타 / 클로저",
      "en": "Kal'tsit Esperanta / Closure",
      "ja": "ケルシー・エスペランタ / クロージャ",
      "zh": "凯尔希·思衡托 / 可露希尔"
    },
    "summary": {
      "ko": "서약 한정 헤드헌팅. 켈시 에스페란타·클로저·크랙본 신규 등장.",
      "en": "Sealed With Time features new operators Kal’tsit Esperanta, Closure and Crackborne.",
      "ja": "約諾：ケルシー・エスペランタ、クロージャ、クラックボーンが新登場。",
      "zh": "承諾：凯尔希·思衡托、可露希尔、裂响新登場。"
    },
    "region": "jp",
    "server": "Japan · UTC+9",
    "startAt": "2026-10-14T16:00:00+09:00",
    "endAt": "2026-10-28T03:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T13:39:48.836750+00:00",
    "sourceUrl": "https://arknights.jp/news/4805",
    "sourceTitle": "メインテーマ 第十七章「相変臨界」公開",
    "image": "/assets/entities/ark-kaltsit-e2-full-7f16f169.webp",
    "imageSource": "https://patchwiki.biligame.com/images/arknights/f/f1/gat3rpwcimqbetg26o6pe1kzs4bes1b.png",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "43% 50%",
    "imageVerified": true,
    "version": "Episode 17",
    "versionTitle": {
      "ko": "메인 스토리 제17장",
      "en": "Episode 17",
      "ja": "第17章",
      "zh": "第十七章"
    },
    "rarity": 6,
    "featured": true,
    "pickupType": "new",
    "pickupGroup": "arknights-jp-yakunaku",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "켈시 에스페란타",
          "en": "Kal'tsit Esperanta",
          "ja": "ケルシー・エスペランタ",
          "zh": "凯尔希·思衡托"
        },
        "type": "new",
        "role": "featured",
        "rarity": 6,
        "image": "/assets/entities/ark-kaltsit-e2-full-7f16f169.webp",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/f/f1/gat3rpwcimqbetg26o6pe1kzs4bes1b.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "43% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "클로저",
          "en": "Closure",
          "ja": "クロージャ",
          "zh": "可露希尔"
        },
        "type": "new",
        "role": "featured",
        "rarity": 6,
        "image": "/assets/entities/ark-closure-e2-full-c8409a3d.webp",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/0/0a/np6cjo1ea1t8vd7s96g9tc5j7rqfd5m.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "크랙본",
          "en": "Crackborne",
          "ja": "クラックボーン",
          "zh": "裂响"
        },
        "type": "new",
        "role": "rate-up",
        "rarity": 5,
        "image": "/assets/entities/ark-crackborne-e2-full-c9777867.webp",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/9/97/4ye63oksjsx23cbm09kz34pllj2e7be.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true
      }
    ],
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ja",
    "localizationSources": {
      "ko": "https://x.com/ArknightsKorea/status/2109910414112985274",
      "en": "https://www.arknights.global/news/4814",
      "ja": "https://arknights.jp/news/4805",
      "zh": "https://ak.hypergryph.com/news/3046"
    },
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/2109910414112985274",
        "title": "한국 공식 캐릭터·픽업 안내",
        "publisher": "한국 공식"
      }
    ],
    "highlights": [
      {
        "ko": "주 픽업 6★ 2명 · 추가 확률 상승 5★ 1명",
        "en": "2 featured 6★ operators · 1 additional 5★ rate-up",
        "ja": "主対象★6・2名／追加確率UP★5・1名",
        "zh": "主推6★两名，另有5★一名概率提升"
      }
    ],
    "bannerName": {
      "ko": "한정 헤드헌팅 · 서약",
      "en": "Limited · Sealed With Time",
      "ja": "限定スカウト・約諾",
      "zh": "限定寻访 · 约诺"
    }
  },
  {
    "region": "jp",
    "startAt": "2026-10-14T16:00:00+09:00",
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T10:45:48.444398Z",
    "gameId": "arknights",
    "server": "Japan · UTC+9",
    "sourceUrl": "https://arknights.jp/news/4805",
    "sourceTitle": "メインテーマ 第十七章「相変臨界」公開",
    "version": "Episode 17",
    "id": "arknights-ep17-jp",
    "kind": "update",
    "title": {
      "ko": "메인 스토리 제17장",
      "en": "Episode 17 · Critical Phase Transition",
      "ja": "第十七章 · 相変臨界",
      "zh": "第十七章 · 相变临界"
    },
    "summary": {
      "ko": "메인 스토리 17장 개방 및 기간 한정 보상.",
      "en": "Main story Episode 17 opens with limited-time rewards.",
      "ja": "メインストーリー第17章と期間限定報酬。",
      "zh": "主线第17章开放并附有限时奖励。"
    },
    "image": "/assets/arknights-hero.webp",
    "imageSource": "https://webusstatic.yo-star.com/web-cms-test/upload/content/2026/10/09/RPgofnTc.jpg",
    "featured": false,
    "officialLocales": [
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "en": "https://www.arknights.global/news/4814",
      "ja": "https://arknights.jp/news/4805",
      "zh": "https://ak.hypergryph.com/news/3046"
    },
    "translatedLocales": [
      "ko"
    ],
    "sourceLocale": "ja",
    "versionTitle": {
      "ko": "메인 스토리 제17장",
      "en": "Episode 17",
      "ja": "第17章",
      "zh": "第十七章"
    }
  },
  {
    "region": "jp",
    "startAt": "2026-10-14T16:00:00+09:00",
    "endAt": "2026-10-28T03:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T10:45:48.444398Z",
    "gameId": "arknights",
    "server": "Japan · UTC+9",
    "sourceUrl": "https://arknights.jp/news/4805",
    "sourceTitle": "メインテーマ 第十七章「相変臨界」公開",
    "version": "Episode 17",
    "id": "arknights-free-pull-jp",
    "kind": "event",
    "title": {
      "ko": "매일 무료 헤드헌팅",
      "en": "Daily free headhunting",
      "ja": "毎日無料スカウト",
      "zh": "每日免費尋訪"
    },
    "summary": {
      "ko": "서약 한정 헤드헌팅에서 하루 1회 무료. 미사용 횟수는 이월되지 않습니다.",
      "en": "One free pull per day in Sealed With Time. Unused pulls do not carry over.",
      "ja": "約諾で毎日1回無料。未使用回数は翌日に引き継がれません。",
      "zh": "承諾限定尋訪每日免費1次，未用次數不累積。"
    },
    "featured": false,
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://x.com/ArknightsKorea/status/2109910414112985274",
      "en": "https://www.arknights.global/news/4814",
      "ja": "https://arknights.jp/news/4805",
      "zh": "https://ak.hypergryph.com/news/3046"
    },
    "versionTitle": {
      "ko": "메인 스토리 제17장",
      "en": "Episode 17",
      "ja": "第17章",
      "zh": "第十七章"
    }
  },
  {
    "region": "jp",
    "startAt": "2026-10-14T16:00:00+09:00",
    "endAt": "2026-11-11T03:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T10:45:48.444398Z",
    "gameId": "arknights",
    "server": "Japan · UTC+9",
    "sourceUrl": "https://arknights.jp/news/4806",
    "sourceTitle": "「2026大感謝祭・秋」開催！",
    "version": "Episode 17",
    "id": "arknights-duck-purse-jp",
    "kind": "package",
    "title": {
      "ko": "덕로드의 잔돈 지갑",
      "en": "Duck Lord's Change Purse",
      "ja": "ダック卿の小銭入れ",
      "zh": "鸭爵的零钱包"
    },
    "summary": {
      "ko": "순오리지늄 13개 + 용문폐 300,000",
      "en": "13 Originite Prime + 300,000 LMD",
      "ja": "純正源石13個＋龍門幣300,000",
      "zh": "至纯源石13个＋龙门币300,000"
    },
    "contents": [
      {
        "ko": "순오리지늄 13개 + 용문폐 300,000",
        "en": "13 Originite Prime + 300,000 LMD",
        "ja": "純正源石13個＋龍門幣300,000",
        "zh": "至纯源石13个＋龙门币300,000"
      }
    ],
    "image": "/assets/arknights-packs-basic.webp",
    "imageSource": "https://webusstatic.yo-star.com/web-cms-test/upload/content/2026/10/09/sQB8HdvH.jpg",
    "featured": false,
    "officialLocales": [
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "en": "https://www.arknights.global/news/4814",
      "ja": "https://arknights.jp/news/4806",
      "zh": "https://ak.hypergryph.com/news/3046"
    },
    "translatedLocales": [
      "ko"
    ],
    "sourceLocale": "ja",
    "versionTitle": {
      "ko": "메인 스토리 제17장",
      "en": "Episode 17",
      "ja": "第17章",
      "zh": "第十七章"
    }
  },
  {
    "region": "jp",
    "startAt": "2026-10-14T16:00:00+09:00",
    "endAt": "2026-11-11T03:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T10:45:48.444398Z",
    "gameId": "arknights",
    "server": "Japan · UTC+9",
    "sourceUrl": "https://arknights.jp/news/4806",
    "sourceTitle": "「2026大感謝祭・秋」開催！",
    "version": "Episode 17",
    "id": "arknights-briefcase-jp",
    "kind": "package",
    "title": {
      "ko": "켈시의 서류 가방",
      "en": "Kal'tsit's Briefcase",
      "ja": "ケルシーの鞄",
      "zh": "凯尔希的手提箱"
    },
    "summary": {
      "ko": "순오리지늄 16개 + 용문폐 700,000",
      "en": "16 Originite Prime + 700,000 LMD",
      "ja": "純正源石16個＋龍門幣700,000",
      "zh": "至纯源石16个＋龙门币700,000"
    },
    "contents": [
      {
        "ko": "순오리지늄 16개 + 용문폐 700,000",
        "en": "16 Originite Prime + 700,000 LMD",
        "ja": "純正源石16個＋龍門幣700,000",
        "zh": "至纯源石16个＋龙门币700,000"
      }
    ],
    "image": "/assets/arknights-packs-basic.webp",
    "imageSource": "https://webusstatic.yo-star.com/web-cms-test/upload/content/2026/10/09/sQB8HdvH.jpg",
    "featured": false,
    "officialLocales": [
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "en": "https://www.arknights.global/news/4814",
      "ja": "https://arknights.jp/news/4806",
      "zh": "https://ak.hypergryph.com/news/3046"
    },
    "translatedLocales": [
      "ko"
    ],
    "sourceLocale": "ja",
    "versionTitle": {
      "ko": "메인 스토리 제17장",
      "en": "Episode 17",
      "ja": "第17章",
      "zh": "第十七章"
    }
  },
  {
    "id": "arknights-sealed-kr",
    "gameId": "arknights",
    "kind": "pickup",
    "title": {
      "ko": "켈시 에스페란타 / 클로저",
      "en": "Kal'tsit Esperanta / Closure",
      "ja": "ケルシー・エスペランタ / クロージャ",
      "zh": "凯尔希·思衡托 / 可露希尔"
    },
    "summary": {
      "ko": "서약 한정 헤드헌팅. 켈시 에스페란타·클로저·크랙본 신규 등장.",
      "en": "Sealed With Time features new operators Kal’tsit Esperanta, Closure and Crackborne.",
      "ja": "約諾：ケルシー・エスペランタ、クロージャ、クラックボーンが新登場。",
      "zh": "承諾：凯尔希·思衡托、可露希尔、裂响新登場。"
    },
    "region": "kr",
    "server": "Korea · UTC+9",
    "startAt": "2026-10-14T16:00:00+09:00",
    "endAt": "2026-10-28T03:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T13:39:48.836792+00:00",
    "sourceUrl": "https://x.com/ArknightsKorea/status/2109910414112985274",
    "sourceTitle": "한정 헤드헌팅 '서약' 안내",
    "image": "/assets/entities/ark-kaltsit-e2-full-7f16f169.webp",
    "imageSource": "https://patchwiki.biligame.com/images/arknights/f/f1/gat3rpwcimqbetg26o6pe1kzs4bes1b.png",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "43% 50%",
    "imageVerified": true,
    "version": "Episode 17",
    "versionTitle": {
      "ko": "메인 스토리 제17장",
      "en": "Episode 17",
      "ja": "第17章",
      "zh": "第十七章"
    },
    "rarity": 6,
    "featured": true,
    "pickupType": "new",
    "pickupGroup": "arknights-kr-seoyak",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "켈시 에스페란타",
          "en": "Kal'tsit Esperanta",
          "ja": "ケルシー・エスペランタ",
          "zh": "凯尔希·思衡托"
        },
        "type": "new",
        "role": "featured",
        "rarity": 6,
        "image": "/assets/entities/ark-kaltsit-e2-full-7f16f169.webp",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/f/f1/gat3rpwcimqbetg26o6pe1kzs4bes1b.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "43% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "클로저",
          "en": "Closure",
          "ja": "クロージャ",
          "zh": "可露希尔"
        },
        "type": "new",
        "role": "featured",
        "rarity": 6,
        "image": "/assets/entities/ark-closure-e2-full-c8409a3d.webp",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/0/0a/np6cjo1ea1t8vd7s96g9tc5j7rqfd5m.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "크랙본",
          "en": "Crackborne",
          "ja": "クラックボーン",
          "zh": "裂响"
        },
        "type": "new",
        "role": "rate-up",
        "rarity": 5,
        "image": "/assets/entities/ark-crackborne-e2-full-c9777867.webp",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/9/97/4ye63oksjsx23cbm09kz34pllj2e7be.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true
      }
    ],
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://x.com/ArknightsKorea/status/2109910414112985274",
      "en": "https://www.arknights.global/news/4814",
      "ja": "https://arknights.jp/news/4805",
      "zh": "https://ak.hypergryph.com/news/3046"
    },
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://arknights.jp/news/4805",
        "title": "約諾：★6・★5区分の確認",
        "publisher": "Yostar Japan"
      }
    ],
    "highlights": [
      {
        "ko": "주 픽업 6★ 2명 · 추가 확률 상승 5★ 1명",
        "en": "2 featured 6★ operators · 1 additional 5★ rate-up",
        "ja": "主対象★6・2名／追加確率UP★5・1名",
        "zh": "主推6★两名，另有5★一名概率提升"
      }
    ],
    "bannerName": {
      "ko": "한정 헤드헌팅 · 서약",
      "en": "Limited · Sealed With Time",
      "ja": "限定スカウト・約諾",
      "zh": "限定寻访 · 约诺"
    }
  },
  {
    "id": "uma-global-20261014-zephyr-r",
    "gameId": "umamusume",
    "kind": "pickup",
    "title": {
      "ko": "야마닌 제퍼 · R",
      "en": "Yamanin Zephyr R [Tracen Academy]",
      "ja": "ヤマニンゼファー · R",
      "zh": "也文摄辉 · R"
    },
    "summary": {
      "ko": "글로벌 서버 픽업. 서포트 카드.",
      "en": "Global-server spotlight. Support card.",
      "ja": "グローバル版ピックアップ。サポートカード。",
      "zh": "国际服精选。支援卡。"
    },
    "region": "global",
    "server": "Global / Cygames EN",
    "startAt": "2026-10-14T22:00:00Z",
    "endAt": "2026-10-23T21:59:00Z",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://umamusume.com/news/1103",
    "sourceTitle": "R [Tracen Academy] Yamanin Zephyr",
    "image": "/assets/entities/uma-zephyr-r-f1298f84.webp",
    "featured": false,
    "imageSource": "https://media.gametora.com/umamusume/supports/full/10086.png",
    "officialLocales": [
      "en"
    ],
    "translatedLocales": [
      "ko",
      "ja",
      "zh"
    ],
    "sourceLocale": "en",
    "localizationSources": {
      "en": "https://umamusume.com/news/1103"
    },
    "pickupType": "new",
    "pickupGroup": "umamusume:global:20261014:support",
    "poolType": "support",
    "timingNote": {
      "ko": "글로벌판 신규 추가. 의상·카드 부제의 공식 현지화 확인 전에는 캐릭터명과 등급을 표시합니다. 원제는 출처에 보존했습니다.",
      "en": "New to Global. Unverified localized outfit/card subtitles are omitted; the original is retained in the source title.",
      "ja": "グローバル版で新登場。衣装・カード名の公式訳未確認箇所は名前とレアリティで表示し、原題を出典に保存。",
      "zh": "国际服新登场。未核实的服装及卡牌副标题暂不翻译，原名保留在来源标题。"
    },
    "pickupMembers": [
      {
        "name": {
          "ko": "야마닌 제퍼 · R",
          "en": "Yamanin Zephyr R [Tracen Academy]",
          "ja": "ヤマニンゼファー · R",
          "zh": "也文摄辉 · R"
        },
        "type": "new",
        "image": "/assets/entities/uma-zephyr-r-f1298f84.webp",
        "imageSource": "https://media.gametora.com/umamusume/supports/full/10086.png",
        "imageKind": "support",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true
      }
    ],
    "imageKind": "support",
    "imageFit": "contain",
    "imagePosition": "50% 45%",
    "imageVerified": true
  },
  {
    "id": "ba-kr-20261013-kisaki",
    "gameId": "bluearchive",
    "kind": "pickup",
    "title": {
      "ko": "키사키(수영복)",
      "en": "Kisaki (Swimsuit)",
      "ja": "キサキ（水着）",
      "zh": "妃咲（泳装）"
    },
    "summary": {
      "ko": "신규 ★3 학생. 키사키(수영복)·슌(수영복) 모집이 같은 기간에 개최됩니다.",
      "en": "New 3★ student. Kisaki (Swimsuit) and Shun (Swimsuit) have simultaneous pickup pools.",
      "ja": "新登場の★3生徒。キサキ（水着）とシュン（水着）の募集を同時開催。",
      "zh": "新登场★3学生；妃咲（泳装）与旬（泳装）同期开放各自招募。"
    },
    "region": "kr",
    "server": "Korea · Nexon",
    "startAt": "2026-10-13T05:20:00Z",
    "endAt": "2026-10-27T01:59:00Z",
    "publishedAt": "2026-10-12T09:00:00+00:00",
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107",
    "sourceTitle": "(완료) 10/13(화) 업데이트 상세 안내 (10/12 추가)",
    "image": "/assets/entities/verified-ba-kr-kisaki-full-79097f06.webp",
    "officialLocales": [
      "ko",
      "en"
    ],
    "translatedLocales": [
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107",
      "en": "https://forum.nexon.com/bluearchive-en/board_view?board=3217&thread=3560143"
    },
    "rarity": 3,
    "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261012/6f4e1a3a-36ec-4b7a-a243-3e5aed396cb7/%ED%82%A4%EC%82%AC%ED%82%A4%EC%88%98%EC%98%81%EB%B3%B5%EB%AA%A8%EC%A7%91.png",
    "pickupType": "new",
    "pickupGroup": "bluearchive:kr:20261013:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "키사키(수영복)",
          "en": "Kisaki (Swimsuit)",
          "ja": "キサキ（水着）",
          "zh": "妃咲（泳装）"
        },
        "type": "new",
        "rarity": 3,
        "image": "/assets/entities/verified-ba-kr-kisaki-full-79097f06.webp",
        "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261012/6f4e1a3a-36ec-4b7a-a243-3e5aed396cb7/%ED%82%A4%EC%82%AC%ED%82%A4%EC%88%98%EC%98%81%EB%B3%B5%EB%AA%A8%EC%A7%91.png",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true
  },
  {
    "id": "ba-kr-20261013-shun",
    "gameId": "bluearchive",
    "kind": "pickup",
    "title": {
      "ko": "슌(수영복)",
      "en": "Shun (Swimsuit)",
      "ja": "シュン（水着）",
      "zh": "旬（泳装）"
    },
    "summary": {
      "ko": "신규 ★3 학생. 키사키(수영복)·슌(수영복) 모집이 같은 기간에 개최됩니다.",
      "en": "New 3★ student. Kisaki (Swimsuit) and Shun (Swimsuit) have simultaneous pickup pools.",
      "ja": "新登場の★3生徒。キサキ（水着）とシュン（水着）の募集を同時開催。",
      "zh": "新登场★3学生；妃咲（泳装）与旬（泳装）同期开放各自招募。"
    },
    "region": "kr",
    "server": "Korea · Nexon",
    "startAt": "2026-10-13T05:20:00Z",
    "endAt": "2026-10-27T01:59:00Z",
    "publishedAt": "2026-10-12T09:00:00+00:00",
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107",
    "sourceTitle": "(완료) 10/13(화) 업데이트 상세 안내 (10/12 추가)",
    "image": "/assets/entities/verified-ba-kr-shun-full-c8e56283.webp",
    "officialLocales": [
      "ko",
      "en"
    ],
    "translatedLocales": [
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107",
      "en": "https://forum.nexon.com/bluearchive-en/board_view?board=3217&thread=3560143"
    },
    "rarity": 3,
    "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261012/0c92ac61-19c5-48bb-a138-aa3a345eeee0/%EC%8A%8C%EC%88%98%EC%98%81%EB%B3%B5%EB%AA%A8%EC%A7%91.png",
    "pickupType": "new",
    "pickupGroup": "bluearchive:kr:20261013:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "슌(수영복)",
          "en": "Shun (Swimsuit)",
          "ja": "シュン（水着）",
          "zh": "旬（泳装）"
        },
        "type": "new",
        "rarity": 3,
        "image": "/assets/entities/verified-ba-kr-shun-full-c8e56283.webp",
        "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261012/0c92ac61-19c5-48bb-a138-aa3a345eeee0/%EC%8A%8C%EC%88%98%EC%98%81%EB%B3%B5%EB%AA%A8%EC%A7%91.png",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true
  },
  {
    "id": "ba-kr-20261013-calm",
    "gameId": "bluearchive",
    "kind": "event",
    "title": {
      "ko": "람과천청",
      "en": "The Calm After the Storm",
      "ja": "嵐の後の青空",
      "zh": "雨过天晴"
    },
    "summary": {
      "ko": "Normal 2-3 클리어 후 참여. 퀘스트 재화·카드 상점·챌린지 보상을 모으는 산해경 휴가 이벤트.",
      "en": "Clear Normal 2-3 to join the Shanhaijing holiday event, earn quest currency, draw reward cards and clear challenges.",
      "ja": "Normal 2-3クリアで参加。クエスト通貨・カードショップ・チャレンジ報酬を集める山海経の休暇イベント。",
      "zh": "通关普通2-3后参与山海经假期活动，收集关卡货币、抽取奖励卡并挑战关卡。"
    },
    "region": "kr",
    "server": "Korea · Nexon",
    "startAt": "2026-10-13T05:20:00Z",
    "endAt": "2026-10-27T01:59:00Z",
    "publishedAt": "2026-10-12T09:00:00+00:00",
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107",
    "sourceTitle": "(완료) 10/13(화) 업데이트 상세 안내 (10/12 추가)",
    "image": "/assets/ba-kr-event.webp",
    "officialLocales": [
      "ko",
      "en"
    ],
    "translatedLocales": [
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107",
      "en": "https://forum.nexon.com/bluearchive-en/board_view?board=3217&thread=3560143"
    },
    "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261012/cb410568-19a8-49ca-801b-1a8d67cac2ee/%EC%9D%B4%EB%B2%A4%ED%8A%B8%EC%8A%A4%ED%86%A0%EB%A6%AC%EB%9E%8C%EA%B3%BC%EC%B2%9C%EC%B2%AD.png",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107",
        "title": "10/13 업데이트 상세 안내",
        "publisher": "Nexon"
      },
      {
        "kind": "community",
        "url": "https://www.inven.co.kr/webzine/news/?news=322034",
        "title": "람과천청 업데이트",
        "publisher": "Inven · 김동휘",
        "publishedAt": "2026-10-13T16:20:00+09:00"
      },
      {
        "kind": "community",
        "url": "https://vortexgaming.io/postdetail/1301160",
        "title": "람과천청 챌린지 공략 요약",
        "publisher": "Vortex Gaming (Inven)",
        "publishedAt": "2026-10-15T00:38:05+09:00"
      },
      {
        "kind": "video",
        "url": "https://www.youtube.com/watch?v=2ZJgt46EnyA",
        "title": "람과천청 챌린지 공략 영상 · Vortex 연결 영상",
        "publisher": "YouTube · Vortex 링크"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "참여와 보상",
          "en": "Participation and rewards",
          "ja": "参加と報酬",
          "zh": "参与及奖励"
        },
        "body": {
          "ko": "퀘스트는 소탕 가능. 이벤트 재화 보너스는 특화 학생 편성 후 반복 보상에 적용됩니다. 포토 카드 200개로 카드 1장을 뽑을 수 있고, 4장 일괄 뽑기와 셔플도 가능합니다.",
          "en": "Quests support sweeping. Specialized students increase repeat currency rewards. Spend 200 photo cards per reward-card draw; four-card draws and shuffling are available.",
          "ja": "クエストは掃討可能。特化生徒で反復報酬の通貨量が増加。フォトカード200個で1枚引き、4枚同時引きやシャッフルも可能。",
          "zh": "关卡可扫荡；特化学生增加重复通关货币奖励。每次奖励卡抽取消耗200张照片卡，也可四连抽或重洗。"
        },
        "sourceKind": "official",
        "sourceUrls": [
          "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107"
        ]
      },
      {
        "title": {
          "ko": "커뮤니티 공략 참고",
          "en": "Community guide",
          "ja": "コミュニティ攻略",
          "zh": "社区攻略"
        },
        "body": {
          "ko": "Vortex의 영상 요약은 챌린지 3에서 1·2번에 범위 딜러, 3·4번에 단일 딜러를 배치하는 전략을 제안합니다. 영상 02:23 이후를 참고할 수 있습니다. 편성 예시이며 필수 조건은 아닙니다.",
          "en": "Vortex’s published video summary suggests area attackers in slots 1–2 and single-target attackers in slots 3–4 for Challenge 3 (from 02:23). This is a strategy example.",
          "ja": "Vortexの動画要約ではチャレンジ3で1・2枠に範囲、3・4枠に単体アタッカーを配置する例を紹介（02:23～）。必須編成ではありません。",
          "zh": "Vortex视频摘要建议挑战3的1–2号位用范围输出、3–4号位用单体输出（02:23起）；属于攻略示例。"
        },
        "sourceKind": "community",
        "sourceUrls": [
          "https://vortexgaming.io/postdetail/1301160",
          "https://www.youtube.com/watch?v=2ZJgt46EnyA"
        ]
      }
    ],
    "sourceKind": "official",
    "highlights": [
      {
        "ko": "참여 조건: Normal 2-3",
        "en": "Requires Normal 2-3",
        "ja": "参加条件：Normal 2-3",
        "zh": "条件：普通2-3"
      },
      {
        "ko": "챌린지 EX: 비의서 조각 5개",
        "en": "Challenge EX: 5 Secret Tech Sheet fragments",
        "ja": "EX：秘伝ノートの断片×5",
        "zh": "EX：秘传笔记碎片×5"
      },
      {
        "ko": "교환 종료 11/3 10:59 KST",
        "en": "Exchange ends Nov 3, 10:59 KST",
        "ja": "交換終了11/3 10:59 KST",
        "zh": "兑换截止11/3 10:59 KST"
      }
    ]
  },
  {
    "id": "ba-kr-20261014-tiphareth",
    "gameId": "bluearchive",
    "kind": "event",
    "title": {
      "ko": "제약해제결전 · 티페레트",
      "en": "Final Restriction Release · Tiphareth",
      "ja": "制約解除決戦 · ティファレト",
      "zh": "制约解除决战 · 蒂法雷特"
    },
    "summary": {
      "ko": "탄력장갑 시즌. 11월 10일 03:59 KST 종료.",
      "en": "Elastic Armor season. Ends Nov 9, 18:59 UTC.",
      "ja": "弾力装甲シーズン。11月10日03:59（JST）まで。",
      "zh": "弹力装甲赛季，11月9日18:59（UTC）结束。"
    },
    "region": "kr",
    "server": "Korea · Nexon",
    "startAt": "2026-10-14T02:00:00Z",
    "endAt": "2026-11-09T18:59:00Z",
    "publishedAt": "2026-10-12T09:00:00+00:00",
    "verifiedAt": "2026-10-16T10:45:00Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107",
    "sourceTitle": "(완료) 10/13(화) 업데이트 상세 안내 (10/12 추가)",
    "officialLocales": [
      "ko",
      "en"
    ],
    "translatedLocales": [
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107",
      "en": "https://forum.nexon.com/bluearchive-en/board_view?board=3217&thread=3560143"
    }
  },
  {
    "id": "ba-global-20261013-kisaki",
    "gameId": "bluearchive",
    "kind": "pickup",
    "title": {
      "ko": "키사키(수영복)",
      "en": "Kisaki (Swimsuit)",
      "ja": "キサキ（水着）",
      "zh": "妃咲（泳装）"
    },
    "summary": {
      "ko": "신규 ★3 학생. 키사키(수영복)·슌(수영복) 모집이 같은 기간에 개최됩니다.",
      "en": "New 3★ student. Kisaki (Swimsuit) and Shun (Swimsuit) have simultaneous pickup pools.",
      "ja": "新登場の★3生徒。キサキ（水着）とシュン（水着）の募集を同時開催。",
      "zh": "新登场★3学生；妃咲（泳装）与旬（泳装）同期开放各自招募。"
    },
    "region": "global",
    "server": "Global · Nexon",
    "startAt": "2026-10-13T05:20:00Z",
    "endAt": "2026-10-27T01:59:00Z",
    "publishedAt": "2026-10-12T09:00:00+00:00",
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107",
    "sourceTitle": "10/13 (Tue) Update Details",
    "image": "/assets/entities/verified-ba-kr-kisaki-full-79097f06.webp",
    "officialLocales": [
      "ko",
      "en"
    ],
    "translatedLocales": [
      "ja",
      "zh"
    ],
    "sourceLocale": "en",
    "localizationSources": {
      "ko": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107",
      "en": "https://forum.nexon.com/bluearchive-en/board_view?board=3217&thread=3560143"
    },
    "rarity": 3,
    "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261012/6f4e1a3a-36ec-4b7a-a243-3e5aed396cb7/%ED%82%A4%EC%82%AC%ED%82%A4%EC%88%98%EC%98%81%EB%B3%B5%EB%AA%A8%EC%A7%91.png",
    "pickupType": "new",
    "pickupGroup": "bluearchive:global:20261013:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "키사키(수영복)",
          "en": "Kisaki (Swimsuit)",
          "ja": "キサキ（水着）",
          "zh": "妃咲（泳装）"
        },
        "type": "new",
        "rarity": 3,
        "image": "/assets/entities/verified-ba-kr-kisaki-full-79097f06.webp",
        "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261012/6f4e1a3a-36ec-4b7a-a243-3e5aed396cb7/%ED%82%A4%EC%82%AC%ED%82%A4%EC%88%98%EC%98%81%EB%B3%B5%EB%AA%A8%EC%A7%91.png",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true
  },
  {
    "id": "ba-global-20261013-shun",
    "gameId": "bluearchive",
    "kind": "pickup",
    "title": {
      "ko": "슌(수영복)",
      "en": "Shun (Swimsuit)",
      "ja": "シュン（水着）",
      "zh": "旬（泳装）"
    },
    "summary": {
      "ko": "신규 ★3 학생. 키사키(수영복)·슌(수영복) 모집이 같은 기간에 개최됩니다.",
      "en": "New 3★ student. Kisaki (Swimsuit) and Shun (Swimsuit) have simultaneous pickup pools.",
      "ja": "新登場の★3生徒。キサキ（水着）とシュン（水着）の募集を同時開催。",
      "zh": "新登场★3学生；妃咲（泳装）与旬（泳装）同期开放各自招募。"
    },
    "region": "global",
    "server": "Global · Nexon",
    "startAt": "2026-10-13T05:20:00Z",
    "endAt": "2026-10-27T01:59:00Z",
    "publishedAt": "2026-10-12T09:00:00+00:00",
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107",
    "sourceTitle": "10/13 (Tue) Update Details",
    "image": "/assets/entities/verified-ba-kr-shun-full-c8e56283.webp",
    "officialLocales": [
      "ko",
      "en"
    ],
    "translatedLocales": [
      "ja",
      "zh"
    ],
    "sourceLocale": "en",
    "localizationSources": {
      "ko": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107",
      "en": "https://forum.nexon.com/bluearchive-en/board_view?board=3217&thread=3560143"
    },
    "rarity": 3,
    "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261012/0c92ac61-19c5-48bb-a138-aa3a345eeee0/%EC%8A%8C%EC%88%98%EC%98%81%EB%B3%B5%EB%AA%A8%EC%A7%91.png",
    "pickupType": "new",
    "pickupGroup": "bluearchive:global:20261013:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "슌(수영복)",
          "en": "Shun (Swimsuit)",
          "ja": "シュン（水着）",
          "zh": "旬（泳装）"
        },
        "type": "new",
        "rarity": 3,
        "image": "/assets/entities/verified-ba-kr-shun-full-c8e56283.webp",
        "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261012/0c92ac61-19c5-48bb-a138-aa3a345eeee0/%EC%8A%8C%EC%88%98%EC%98%81%EB%B3%B5%EB%AA%A8%EC%A7%91.png",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      }
    ],
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true
  },
  {
    "id": "ba-global-20261013-calm",
    "gameId": "bluearchive",
    "kind": "event",
    "title": {
      "ko": "람과천청",
      "en": "The Calm After the Storm",
      "ja": "嵐の後の青空",
      "zh": "雨过天晴"
    },
    "summary": {
      "ko": "스토리 이벤트. 보상 교환은 11월 3일 10:59 KST까지.",
      "en": "Story event. Rewards can be exchanged until Nov 3, 01:59 UTC.",
      "ja": "ストーリーイベント。報酬交換は11月3日10:59（JST）まで。",
      "zh": "剧情活动；奖励兑换至11月3日01:59（UTC）。"
    },
    "region": "global",
    "server": "Global · Nexon",
    "startAt": "2026-10-13T05:20:00Z",
    "endAt": "2026-10-27T01:59:00Z",
    "publishedAt": "2026-10-12T09:00:00+00:00",
    "verifiedAt": "2026-10-16T10:45:00Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive-en/board_view?board=3217&thread=3560143",
    "sourceTitle": "10/13 (Tue) Update Details",
    "image": "/assets/ba-kr-event.webp",
    "officialLocales": [
      "ko",
      "en"
    ],
    "translatedLocales": [
      "ja",
      "zh"
    ],
    "sourceLocale": "en",
    "localizationSources": {
      "ko": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107",
      "en": "https://forum.nexon.com/bluearchive-en/board_view?board=3217&thread=3560143"
    },
    "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261012/cb410568-19a8-49ca-801b-1a8d67cac2ee/%EC%9D%B4%EB%B2%A4%ED%8A%B8%EC%8A%A4%ED%86%A0%EB%A6%AC%EB%9E%8C%EA%B3%BC%EC%B2%9C%EC%B2%AD.png"
  },
  {
    "id": "ba-global-20261014-tiphareth",
    "gameId": "bluearchive",
    "kind": "event",
    "title": {
      "ko": "제약해제결전 · 티페레트",
      "en": "Final Restriction Release · Tiphareth",
      "ja": "制約解除決戦 · ティファレト",
      "zh": "制约解除决战 · 蒂法雷特"
    },
    "summary": {
      "ko": "탄력장갑 시즌. 11월 10일 03:59 KST 종료.",
      "en": "Elastic Armor season. Ends Nov 9, 18:59 UTC.",
      "ja": "弾力装甲シーズン。11月10日03:59（JST）まで。",
      "zh": "弹力装甲赛季，11月9日18:59（UTC）结束。"
    },
    "region": "global",
    "server": "Global · Nexon",
    "startAt": "2026-10-14T02:00:00Z",
    "endAt": "2026-11-09T18:59:00Z",
    "publishedAt": "2026-10-12T09:00:00+00:00",
    "verifiedAt": "2026-10-16T10:45:00Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive-en/board_view?board=3217&thread=3560143",
    "sourceTitle": "10/13 (Tue) Update Details",
    "officialLocales": [
      "ko",
      "en"
    ],
    "translatedLocales": [
      "ja",
      "zh"
    ],
    "sourceLocale": "en",
    "localizationSources": {
      "ko": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=3555107",
      "en": "https://forum.nexon.com/bluearchive-en/board_view?board=3217&thread=3560143"
    }
  },
  {
    "id": "uma-kr-20261016-goldcity",
    "gameId": "umamusume",
    "kind": "pickup",
    "title": {
      "ko": "[Boho Flare] 골드 시티",
      "en": "Gold City [Boho Flare]",
      "ja": "ゴールドシチー [Boho Flare]",
      "zh": "黄金城市 [Boho Flare]"
    },
    "summary": {
      "ko": "신규 ★3 육성 우마무스메. 한국 서버 독립 일정.",
      "en": "New 3★ trainee on the Korean server.",
      "ja": "韓国サーバーで新登場の★3育成ウマ娘。",
      "zh": "韩服新登场★3育成赛马娘。"
    },
    "region": "kr",
    "server": "Korea · Kakao Games",
    "startAt": null,
    "endAt": "2026-11-10T11:59:00+09:00",
    "publishedAt": "2026-10-14T03:00:15+00:00",
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://pf.kakao.com/_DzxjIb/114881998",
    "sourceTitle": "신규 육성 시나리오 개막 프리티 더비 뽑기 & 서포트 카드 뽑기 개최 예정🎉",
    "image": "/assets/entities/uma-goldcity-kakao-full-b5cf38b1.webp",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://pf.kakao.com/_DzxjIb/114881998"
    },
    "rarity": 3,
    "pickupType": "new",
    "pickupGroup": "umamusume:kr:20261016:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "[Boho Flare] 골드 시티",
          "en": "Gold City [Boho Flare]",
          "ja": "ゴールドシチー [Boho Flare]",
          "zh": "黄金城市 [Boho Flare]"
        },
        "type": "new",
        "rarity": 3,
        "image": "/assets/entities/uma-goldcity-kakao-full-b5cf38b1.webp",
        "imageSource": "https://k.kakaocdn.net/dn/2XbWX/dJMcaaAqMyE/cVySvaGgkORNKwHDRRAtgk/img_xl.jpg",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "30% 45%",
        "imageVerified": true
      }
    ],
    "timingNote": {
      "ko": "10월 16일 점검 완료 후 시작. 정확한 점검 종료 시각은 확인 중.",
      "en": "Starts after Oct 16 maintenance; exact completion time is unverified.",
      "ja": "10月16日メンテナンス終了後開始。終了時刻は未確認。",
      "zh": "10月16日维护后开始；准确开服时间尚未核实。"
    },
    "imageSource": "https://k.kakaocdn.net/dn/2XbWX/dJMcaaAqMyE/cVySvaGgkORNKwHDRRAtgk/img_xl.jpg",
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "30% 45%",
    "imageVerified": true
  },
  {
    "id": "uma-kr-20261016-support",
    "gameId": "umamusume",
    "kind": "pickup",
    "title": {
      "ko": "터커 브라인 · 타마모 크로스",
      "en": "Tucker Bryne · Tamamo Cross",
      "ja": "タッカーブライン · タマモクロス",
      "zh": "塔克布莱恩 · 玉藻十字"
    },
    "summary": {
      "ko": "신규 서포트 카드 3종을 같은 뽑기에서 픽업합니다.",
      "en": "Three new support cards share this pickup pool.",
      "ja": "新サポートカード3種を同じガチャでピックアップ。",
      "zh": "同一卡池精选3张新支援卡。"
    },
    "region": "kr",
    "server": "Korea · Kakao Games",
    "startAt": null,
    "endAt": "2026-11-10T11:59:00+09:00",
    "publishedAt": "2026-10-14T03:00:15+00:00",
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://pf.kakao.com/_DzxjIb/114881998",
    "sourceTitle": "신규 육성 시나리오 개막 프리티 더비 뽑기 & 서포트 카드 뽑기 개최 예정🎉",
    "image": "/assets/entities/uma-tucker-ssr-2b673ef8.webp",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://pf.kakao.com/_DzxjIb/114881998"
    },
    "pickupType": "new",
    "pickupGroup": "umamusume:kr:20261016:support",
    "poolType": "support",
    "pickupMembers": [
      {
        "name": {
          "ko": "SSR [본능은 울부짖고 있는가!?] 터커 브라인",
          "en": "Tucker Bryne · SSR",
          "ja": "タッカーブライン · SSR",
          "zh": "塔克布莱恩 · SSR"
        },
        "type": "new",
        "image": "/assets/entities/uma-tucker-ssr-2b673ef8.webp",
        "imageSource": "https://media.gametora.com/umamusume/supports/full/30257.png",
        "imageKind": "support",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "SSR [하얀 번개와 같이] 타마모 크로스",
          "en": "Tamamo Cross · SSR",
          "ja": "タマモクロス · SSR",
          "zh": "玉藻十字 · SSR"
        },
        "type": "new",
        "image": "/assets/entities/uma-tamamo-ssr-9ae67808.webp",
        "imageSource": "https://media.gametora.com/umamusume/supports/full/30256.png",
        "imageKind": "support",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "R [무인도 프로젝트 책임자] 터커 브라인",
          "en": "Tucker Bryne · R",
          "ja": "タッカーブライン · R",
          "zh": "塔克布莱恩 · R"
        },
        "type": "new",
        "image": "/assets/entities/uma-tucker-r-e21cca97.webp",
        "imageSource": "https://media.gametora.com/umamusume/supports/full/10128.png",
        "imageKind": "support",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true
      }
    ],
    "timingNote": {
      "ko": "10월 16일 점검 완료 후 시작. 타 언어 카드 부제는 공식 명칭 확인 전 생략했습니다.",
      "en": "Starts after Oct 16 maintenance. Unverified card subtitles in other languages are omitted.",
      "ja": "10月16日メンテナンス後開始。他言語の公式カード名が未確認のため副題を省略。",
      "zh": "10月16日维护后开始。其他语言官方卡名未核实，暂省略副标题。"
    },
    "imageSource": "https://media.gametora.com/umamusume/supports/full/30257.png",
    "imageKind": "support",
    "imageFit": "contain",
    "imagePosition": "50% 45%",
    "imageVerified": true
  },
  {
    "id": "uma-kr-20261016-trial",
    "gameId": "umamusume",
    "kind": "event",
    "title": {
      "ko": "트레이너 기능 시험",
      "en": "Trainer Skills Trial",
      "ja": "トレーナー技能試験",
      "zh": "训练员技能考试"
    },
    "summary": {
      "ko": "무인도 시나리오 시험. 교환·보상 수령은 10월 29일 11:59 KST까지.",
      "en": "Island-scenario trial. Reward exchange ends Oct 29, 11:59 KST.",
      "ja": "無人島シナリオの試験。報酬交換は10月29日11:59（KST）まで。",
      "zh": "无人岛剧本考试；奖励兑换至10月29日11:59（KST）。"
    },
    "region": "kr",
    "server": "Korea · Kakao Games",
    "startAt": null,
    "endAt": "2026-10-26T11:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://pf.kakao.com/_DzxjIb/114830316",
    "sourceTitle": "트레이너 기능 시험 이벤트 개최 예정🎊",
    "image": "/assets/uma-kr-114830316.webp",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://pf.kakao.com/_DzxjIb/114830316"
    },
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://pf.kakao.com/_DzxjIb/114830316",
        "title": "트레이너 기능 시험 개최 안내",
        "publisher": "Kakao Games"
      },
      {
        "kind": "official",
        "url": "https://pf.kakao.com/_DzxjIb/114830271",
        "title": "무인도 육성 시나리오 안내",
        "publisher": "Kakao Games"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "참여와 보상",
          "en": "Participation and rewards",
          "ja": "参加と報酬",
          "zh": "参与及奖励"
        },
        "body": {
          "ko": "지정 시나리오에서 시험과 미션으로 트라이얼 코인을 모아 상점에서 교환합니다. 이번에는 육성 우마무스메별 랭킹·각질별 시험·스코어 보너스가 추가되며 교환 라인업도 조정됩니다.",
          "en": "Earn Trial Coins from designated-scenario tests and missions, then spend them in the shop. This edition adds trainee rankings, running-style tests and score bonuses, with a revised exchange lineup.",
          "ja": "指定シナリオの試験・ミッションでコインを集めて交換。今回は育成ウマ娘別ランキング・脚質別試験・スコアボーナスを追加、交換内容も調整。",
          "zh": "指定剧本考试与任务产出试炼币，可在商店兑换。本次新增角色排行、跑法考试及分数奖励，并调整兑换列表。"
        },
        "sourceKind": "official",
        "sourceUrls": [
          "https://pf.kakao.com/_DzxjIb/114830316"
        ]
      }
    ],
    "sourceKind": "official",
    "highlights": [
      {
        "ko": "대상: 무인도 시나리오",
        "en": "Island scenario only",
        "ja": "無人島シナリオ対象",
        "zh": "仅无人岛剧本"
      },
      {
        "ko": "육성별·각질별 평가",
        "en": "Per-trainee and running-style scoring",
        "ja": "育成ウマ娘・脚質別評価",
        "zh": "按角色与跑法评分"
      },
      {
        "ko": "보상 교환 10/29 11:59 KST",
        "en": "Rewards until Oct 29, 11:59 KST",
        "ja": "交換10/29 11:59 KSTまで",
        "zh": "兑换至10/29 11:59 KST"
      }
    ]
  },
  {
    "id": "uma-kr-20261016-free80",
    "gameId": "umamusume",
    "kind": "event",
    "title": {
      "ko": "무인도 기념 · 최대 80회 무료",
      "en": "Island campaign · up to 80 free draws",
      "ja": "無人島記念 · 最大80回無料",
      "zh": "无人岛纪念 · 最多80次免费抽卡"
    },
    "summary": {
      "ko": "하루 1회 무료 10연. 대상은 신규 시나리오 개막 서포트 카드 뽑기입니다.",
      "en": "One free 10-draw per day on the new-scenario support banner.",
      "ja": "新シナリオ開幕サポートガチャで1日1回10連無料。",
      "zh": "新剧本支援卡池每天可免费十连一次。"
    },
    "region": "kr",
    "server": "Korea · Kakao Games",
    "startAt": null,
    "endAt": "2026-10-24T04:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://pf.kakao.com/_DzxjIb/114830299",
    "sourceTitle": "「무인도에 어서 오세요 -DESIGN YOUR ISLAND-」 공개 기념 캠페인 예정🎉",
    "image": "/assets/uma-kr-114830299.webp",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://pf.kakao.com/_DzxjIb/114830299"
    },
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://pf.kakao.com/_DzxjIb/114830299",
        "title": "무인도 공개 기념 캠페인",
        "publisher": "Kakao Games"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "참여와 보상",
          "en": "Participation and rewards",
          "ja": "参加と報酬",
          "zh": "参与及奖励"
        },
        "body": {
          "ko": "10월 16일 점검 후부터 10월 24일 04:59까지 하루 한 번 무료 10연을 사용할 수 있습니다. 대상은 신규 육성 시나리오 개막 서포트 카드 뽑기입니다.",
          "en": "One free 10-draw daily from Oct 16 maintenance through Oct 24, 04:59 KST, on the new-scenario support banner.",
          "ja": "10/16メンテ後～10/24 04:59 KST、1日1回10連無料。対象は新シナリオ開幕サポートガチャ。",
          "zh": "10月16日维护后至10月24日04:59 KST，新剧本支援卡池每天一次免费十连。"
        },
        "sourceKind": "official",
        "sourceUrls": [
          "https://pf.kakao.com/_DzxjIb/114830299"
        ]
      }
    ],
    "sourceKind": "official",
    "highlights": [
      {
        "ko": "서포트 카드 뽑기 대상",
        "en": "Support-card banner",
        "ja": "サポートカードガチャ対象",
        "zh": "支援卡池"
      },
      {
        "ko": "매일 10회 · 최대 80회",
        "en": "10 daily · up to 80",
        "ja": "毎日10回 · 最大80回",
        "zh": "每日10抽 · 最多80抽"
      }
    ]
  },
  {
    "id": "uma-kr-20261016-factorpack",
    "gameId": "umamusume",
    "kind": "package",
    "title": {
      "ko": "인자 강화 리포트 팩",
      "en": "Factor Research Report Pack",
      "ja": "因子強化レポートパック",
      "zh": "因子强化报告礼包"
    },
    "summary": {
      "ko": "신규 시나리오 기념 한정 판매. 가격·구성 수량은 이 공지에 없습니다.",
      "en": "Limited scenario-celebration pack. Price and item quantities are not stated in this notice.",
      "ja": "新シナリオ記念の期間限定販売。この告知では価格・数量未記載。",
      "zh": "新剧本纪念限时销售；公告未列价格与道具数量。"
    },
    "region": "kr",
    "server": "Korea · Kakao Games",
    "startAt": null,
    "endAt": "2026-11-19T04:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://pf.kakao.com/_DzxjIb/114830299",
    "sourceTitle": "「무인도에 어서 오세요 -DESIGN YOUR ISLAND-」 공개 기념 캠페인 예정🎉",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://pf.kakao.com/_DzxjIb/114830299"
    },
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://pf.kakao.com/_DzxjIb/114830299",
        "title": "무인도 공개 기념 캠페인 · 리포트 팩",
        "publisher": "Kakao Games"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "구성·구매 조건",
          "en": "Contents and purchase conditions",
          "ja": "内容・購入条件",
          "zh": "内容与购买条件"
        },
        "body": {
          "ko": "무인도 시나리오 공개 기념 횟수 한정 상품입니다. 공식 캠페인 안내는 판매 기간만 제시하며, 가격·리포트 수량·사용 기한은 상세 판매 화면에서 확인해야 합니다.",
          "en": "A purchase-limited island-scenario pack. The campaign notice confirms the sale window only; consult the sale screen for price, report quantity and item-use expiry.",
          "ja": "無人島公開記念の回数限定商品。キャンペーン告知は販売期間のみ。価格・レポート数・使用期限は販売画面で確認してください。",
          "zh": "无人岛纪念限购商品。活动公告仅列销售期，价格、报告数量与使用期限需在销售页面核对。"
        },
        "sourceKind": "official",
        "sourceUrls": [
          "https://pf.kakao.com/_DzxjIb/114830299"
        ]
      }
    ],
    "sourceKind": "official"
  },
  {
    "id": "gfl2-kr-mityl-featured",
    "gameId": "gfl2",
    "kind": "pickup",
    "title": {
      "ko": "미틸",
      "en": "Mityl",
      "ja": "ミティール",
      "zh": "米蒂爾"
    },
    "summary": {
      "ko": "신규 정예 인형. 같은 기간 미틸·샤이엔·류시의 개별 모집을 선택할 수 있습니다.",
      "en": "New Elite Doll. Mityl, Cheyanne and Liushih have separate simultaneous pools.",
      "ja": "精鋭人形新登場。ミティール・シャイアン・劉蒔を同期間に個別募集。",
      "zh": "新登场精英人形；米蒂爾、夏安、劉蒔同期分别开放卡池。"
    },
    "region": "kr",
    "server": "Korea · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+09:00",
    "endAt": "2026-10-28T18:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "10/8 Update Overview",
    "image": "/assets/entities/gf2-mityl-background-full-19c0c9ff.webp",
    "timingNote": {
      "ko": "Sunborn/Darkwinter 배포판과 별도 확인 필요.",
      "en": "Verify separately from the Sunborn/Darkwinter distribution.",
      "ja": "Sunborn/Darkwinter版とは分けて確認が必要。",
      "zh": "须与Sunborn/Darkwinter发行版本分开核实。"
    },
    "imageSource": "https://iopwiki.com/images/6/6c/GFL2_Mityl_Background.jpg",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "new",
    "pickupGroup": "gfl2:kr:20261008:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "미틸",
          "en": "Mityl",
          "ja": "ミティール",
          "zh": "米蒂爾"
        },
        "type": "new",
        "image": "/assets/entities/gf2-mityl-background-full-19c0c9ff.webp",
        "imageSource": "https://iopwiki.com/images/6/6c/GFL2_Mityl_Background.jpg",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "56% 44%",
        "imageVerified": true,
        "role": "featured"
      },
      {
        "name": {
          "ko": "캐롤릭",
          "en": "Krolik",
          "ja": "キャロリック",
          "zh": "克羅麗科"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-krolik-f88d7d36.webp",
        "imageSource": "https://res.17996cdn.net/gf2/tw/images/home/ilus-CHAROLIC_91dad23f72.webp?v03",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      },
      {
        "name": {
          "ko": "네메시스",
          "en": "Nemesis",
          "ja": "ネメシス",
          "zh": "納美西絲"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-nemesis-full-4c7d73a7.webp",
        "imageSource": "https://res.17996cdn.net/gf2/tw/images/home/ilus-NEMESIS_ab6a8b4491.webp?v03",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      }
    ],
    "sourceKind": "official",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      }
    ],
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "56% 44%",
    "imageVerified": true
  },
  {
    "id": "gfl2-kr-amber-featured",
    "gameId": "gfl2",
    "kind": "event",
    "title": {
      "ko": "호박색 달빛",
      "en": "Amber Reel of Moonlight",
      "ja": "琥珀月光",
      "zh": "琥珀月光"
    },
    "summary": {
      "ko": "이벤트 전역에서 붕괴결정 샤드·지정 액세스 권한 등 보상 획득. 교환 상점은 11월 4일 18:59까지.",
      "en": "Clear event stages for Collapse Pieces, Targeted Access Permissions and other rewards. Shop exchange closes Nov 4, 18:59 server time.",
      "ja": "イベントでコーラップスピース・特殊訪問許可などを獲得。交換はサーバー時間11/4 18:59まで。",
      "zh": "活动关卡可得坍塌晶条、定向采购许可等奖励；兑换截至服务器时间11月4日18:59。"
    },
    "region": "kr",
    "server": "Korea · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+09:00",
    "endAt": "2026-10-28T18:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "10/8 · Amber Reel of Moonlight update overview",
    "image": "/assets/gf2-kr-event.webp",
    "featured": true,
    "imageSource": "https://res.17996cdn.net/gf2/news/261008/kr/1.png",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ko",
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
        "title": "10/8 공식 버전 미리보기",
        "publisher": "HAOPLAY · Steam",
        "publishedAt": "2026-10-07T10:00:48Z"
      },
      {
        "kind": "community",
        "url": "https://gall.dcinside.com/mgallery/board/view/?id=gf2&no=1243880",
        "title": "호박색 달빛 이벤트 PV 안내 재게시",
        "publisher": "DCInside · 비어드드래곤",
        "publishedAt": "2026-10-06T18:18:42+09:00"
      },
      {
        "kind": "video",
        "url": "https://www.youtube.com/watch?v=CQHeGya9IIU",
        "title": "호박색 달빛 이벤트 PV · 게시글 연결 영상",
        "publisher": "YouTube · EXILIUMKR 링크"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "참여와 보상",
          "en": "Participation and rewards",
          "ja": "参加と報酬",
          "zh": "参与及奖励"
        },
        "body": {
          "ko": "기타 이벤트의 기본 참여 조건은 스토리 전역 Normal 1-8 클리어입니다. 버전 안내에 지정 액세스 권한과 사통장치 교정 칩 보상이 명시되어 있습니다.",
          "en": "The general event gate is Normal story SL 1-8. The KR version overview explicitly lists Targeted Access Permissions and Targeting Calibration Chips among the rewards.",
          "ja": "一般イベントの参加条件はストーリーNormal 1-8。韓国告知は特殊訪問許可と校正チップも報酬に記載。",
          "zh": "一般活动需通关普通主线1-8；韩服公告还列出定向采购许可及校准芯片奖励。"
        },
        "sourceKind": "official",
        "sourceUrls": [
          "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana"
        ]
      }
    ],
    "sourceKind": "official",
    "timingNote": {
      "ko": "HAOPLAY 한국·일본 공지의 현지 시각(UTC+9)입니다.",
      "en": "HAOPLAY KR/JP dates use local UTC+9.",
      "ja": "HAOPLAY 韓国・日本は現地UTC+9。",
      "zh": "HAOPLAY 韩日服使用当地UTC+9。"
    },
    "highlights": [
      {
        "ko": "교환은 이벤트 종료 7일 후까지",
        "en": "Exchange remains for 7 more days",
        "ja": "終了後7日間交換可能",
        "zh": "结束后仍可兑换7天"
      },
      {
        "ko": "현지 시간 11/4 18:59 교환 마감",
        "en": "Exchange: Nov 4, 18:59 server time",
        "ja": "交換11/4 18:59サーバー時間",
        "zh": "兑换11/4 18:59服务器时间"
      }
    ]
  },
  {
    "id": "gfl2-jp-mityl-featured",
    "gameId": "gfl2",
    "kind": "pickup",
    "title": {
      "ko": "미틸",
      "en": "Mityl",
      "ja": "ミティール",
      "zh": "米蒂爾"
    },
    "summary": {
      "ko": "신규 정예 인형. 같은 기간 미틸·샤이엔·류시의 개별 모집을 선택할 수 있습니다.",
      "en": "New Elite Doll. Mityl, Cheyanne and Liushih have separate simultaneous pools.",
      "ja": "精鋭人形新登場。ミティール・シャイアン・劉蒔を同期間に個別募集。",
      "zh": "新登场精英人形；米蒂爾、夏安、劉蒔同期分别开放卡池。"
    },
    "region": "jp",
    "server": "Japan · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+09:00",
    "endAt": "2026-10-28T18:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "10/8 Update Overview",
    "image": "/assets/entities/gf2-mityl-background-full-19c0c9ff.webp",
    "timingNote": {
      "ko": "Sunborn/Darkwinter 배포판과 별도 확인 필요.",
      "en": "Verify separately from the Sunborn/Darkwinter distribution.",
      "ja": "Sunborn/Darkwinter版とは分けて確認が必要。",
      "zh": "须与Sunborn/Darkwinter发行版本分开核实。"
    },
    "imageSource": "https://iopwiki.com/images/6/6c/GFL2_Mityl_Background.jpg",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ja",
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "new",
    "pickupGroup": "gfl2:jp:20261008:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "미틸",
          "en": "Mityl",
          "ja": "ミティール",
          "zh": "米蒂爾"
        },
        "type": "new",
        "image": "/assets/entities/gf2-mityl-background-full-19c0c9ff.webp",
        "imageSource": "https://iopwiki.com/images/6/6c/GFL2_Mityl_Background.jpg",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "56% 44%",
        "imageVerified": true,
        "role": "featured"
      },
      {
        "name": {
          "ko": "캐롤릭",
          "en": "Krolik",
          "ja": "キャロリック",
          "zh": "克羅麗科"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-krolik-f88d7d36.webp",
        "imageSource": "https://res.17996cdn.net/gf2/tw/images/home/ilus-CHAROLIC_91dad23f72.webp?v03",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      },
      {
        "name": {
          "ko": "네메시스",
          "en": "Nemesis",
          "ja": "ネメシス",
          "zh": "納美西絲"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-nemesis-full-4c7d73a7.webp",
        "imageSource": "https://res.17996cdn.net/gf2/tw/images/home/ilus-NEMESIS_ab6a8b4491.webp?v03",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      }
    ],
    "sourceKind": "official",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      }
    ],
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "56% 44%",
    "imageVerified": true
  },
  {
    "id": "gfl2-jp-amber-featured",
    "gameId": "gfl2",
    "kind": "event",
    "title": {
      "ko": "호박색 달빛",
      "en": "Amber Reel of Moonlight",
      "ja": "琥珀月光",
      "zh": "琥珀月光"
    },
    "summary": {
      "ko": "이벤트 전역에서 붕괴결정 샤드·지정 액세스 권한 등 보상 획득. 교환 상점은 11월 4일 18:59까지.",
      "en": "Clear event stages for Collapse Pieces, Targeted Access Permissions and other rewards. Shop exchange closes Nov 4, 18:59 server time.",
      "ja": "イベントでコーラップスピース・特殊訪問許可などを獲得。交換はサーバー時間11/4 18:59まで。",
      "zh": "活动关卡可得坍塌晶条、定向采购许可等奖励；兑换截至服务器时间11月4日18:59。"
    },
    "region": "jp",
    "server": "Japan · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+09:00",
    "endAt": "2026-10-28T18:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
    "sourceTitle": "10/8 · Amber Reel of Moonlight update overview",
    "image": "/assets/gf2-jp-event.webp",
    "featured": true,
    "imageSource": "https://res.17996cdn.net/gf2/news/261008/jp/1.png",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ja",
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
        "title": "10/8 공식 버전 미리보기",
        "publisher": "HAOPLAY · Steam",
        "publishedAt": "2026-10-07T10:00:48Z"
      }
    ],
    "detailSections": [],
    "sourceKind": "official",
    "timingNote": {
      "ko": "HAOPLAY 한국·일본 공지의 현지 시각(UTC+9)입니다.",
      "en": "HAOPLAY KR/JP dates use local UTC+9.",
      "ja": "HAOPLAY 韓国・日本は現地UTC+9。",
      "zh": "HAOPLAY 韩日服使用当地UTC+9。"
    },
    "highlights": [
      {
        "ko": "교환은 이벤트 종료 7일 후까지",
        "en": "Exchange remains for 7 more days",
        "ja": "終了後7日間交換可能",
        "zh": "结束后仍可兑换7天"
      },
      {
        "ko": "현지 시간 11/4 18:59 교환 마감",
        "en": "Exchange: Nov 4, 18:59 server time",
        "ja": "交換11/4 18:59サーバー時間",
        "zh": "兑换11/4 18:59服务器时间"
      }
    ]
  },
  {
    "id": "nikke-kr-20261008-belorta",
    "gameId": "nikke",
    "kind": "pickup",
    "title": {
      "ko": "벨로타 : 펌킨 위치",
      "en": "Belorta: Pumpkin Witch",
      "ja": "ベロータ：パンプキンウィッチ",
      "zh": "貝洛塔：南瓜女巫"
    },
    "summary": {
      "ko": "신규 SSR 특별 모집. 해당 지역 10월 8일 업데이트 공지에서 기간을 직접 확인했습니다.",
      "en": "New SSR Special Recruit. Dates independently verified in this region’s Oct 8 update notice.",
      "ja": "新SSR特殊募集。該当地域の10月8日更新告知で開催期間を確認。",
      "zh": "新SSR特殊招募。已直接核实对应地区10月8日更新公告中的日期。"
    },
    "region": "kr",
    "server": "Korea · Level Infinite",
    "startAt": null,
    "endAt": "2026-10-28T23:59:59+09:00",
    "publishedAt": "2026-10-05T08:00:00+00:00",
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
    "sourceTitle": "10월 8일 업데이트 공지(10/8 공지 수정)",
    "timingNote": {
      "ko": "10월 8일 점검 종료 후 시작. 이 공지의 특별 모집 대상은 벨로타 : 펌킨 위치 1명입니다.",
      "en": "Starts after Oct 8 maintenance. This notice lists Belorta: Pumpkin Witch as the only new Special Recruit.",
      "ja": "10月8日メンテナンス後開始。この告知で追加される特殊募集はベロータ：パンプキンウィッチのみ。",
      "zh": "10月8日维护后开始；此公告中新增特殊招募仅为貝洛塔：南瓜女巫。"
    },
    "featured": true,
    "officialLocales": [
      "en",
      "ko",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ko",
    "localizationSources": {
      "en": "https://nikke-en.com/newsdetail.html?content_id=9ff3fe24abf0ca437fa9c7dabd8f369872a8",
      "ko": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
      "ja": "https://nikke-jp.com/newsdetail.html?content_id=b77c06cba64d1a4451aacccaded5ff6434bc",
      "zh": "https://nikke.hotcool.tw/m/News_detail-232"
    },
    "pickupType": "new",
    "pickupGroup": "nikke:kr:20261008:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "벨로타 : 펌킨 위치",
          "en": "Belorta: Pumpkin Witch",
          "ja": "ベロータ：パンプキンウィッチ",
          "zh": "貝洛塔：南瓜女巫"
        },
        "type": "new",
        "image": "/assets/entities/nikke-belorta-235e2435.webp",
        "imageSource": "https://www.gacha.gg/img/nikke/dm/chars/belorta-pumpkin-witch-c063-art.webp",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true
      }
    ],
    "image": "/assets/entities/nikke-belorta-235e2435.webp",
    "imageSource": "https://www.gacha.gg/img/nikke/dm/chars/belorta-pumpkin-witch-c063-art.webp",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 45%",
    "imageVerified": true
  },
  {
    "id": "nikke-jp-20261008-belorta",
    "gameId": "nikke",
    "kind": "pickup",
    "title": {
      "ko": "벨로타 : 펌킨 위치",
      "en": "Belorta: Pumpkin Witch",
      "ja": "ベロータ：パンプキンウィッチ",
      "zh": "貝洛塔：南瓜女巫"
    },
    "summary": {
      "ko": "신규 SSR 특별 모집. 해당 지역 10월 8일 업데이트 공지에서 기간을 직접 확인했습니다.",
      "en": "New SSR Special Recruit. Dates independently verified in this region’s Oct 8 update notice.",
      "ja": "新SSR特殊募集。該当地域の10月8日更新告知で開催期間を確認。",
      "zh": "新SSR特殊招募。已直接核实对应地区10月8日更新公告中的日期。"
    },
    "region": "jp",
    "server": "Japan · Level Infinite",
    "startAt": null,
    "endAt": "2026-10-28T23:59:59+09:00",
    "publishedAt": "2026-10-05T08:00:00+00:00",
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
    "sourceTitle": "10月8日のアップデートについて（10月8日更新）",
    "timingNote": {
      "ko": "10월 8일 점검 종료 후 시작. 이 공지의 특별 모집 대상은 벨로타 : 펌킨 위치 1명입니다.",
      "en": "Starts after Oct 8 maintenance. This notice lists Belorta: Pumpkin Witch as the only new Special Recruit.",
      "ja": "10月8日メンテナンス後開始。この告知で追加される特殊募集はベロータ：パンプキンウィッチのみ。",
      "zh": "10月8日维护后开始；此公告中新增特殊招募仅为貝洛塔：南瓜女巫。"
    },
    "featured": true,
    "officialLocales": [
      "en",
      "ko",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ja",
    "localizationSources": {
      "en": "https://nikke-en.com/newsdetail.html?content_id=9ff3fe24abf0ca437fa9c7dabd8f369872a8",
      "ko": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
      "ja": "https://nikke-jp.com/newsdetail.html?content_id=b77c06cba64d1a4451aacccaded5ff6434bc",
      "zh": "https://nikke.hotcool.tw/m/News_detail-232"
    },
    "pickupType": "new",
    "pickupGroup": "nikke:jp:20261008:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "벨로타 : 펌킨 위치",
          "en": "Belorta: Pumpkin Witch",
          "ja": "ベロータ：パンプキンウィッチ",
          "zh": "貝洛塔：南瓜女巫"
        },
        "type": "new",
        "image": "/assets/entities/nikke-belorta-235e2435.webp",
        "imageSource": "https://www.gacha.gg/img/nikke/dm/chars/belorta-pumpkin-witch-c063-art.webp",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true
      }
    ],
    "image": "/assets/entities/nikke-belorta-235e2435.webp",
    "imageSource": "https://www.gacha.gg/img/nikke/dm/chars/belorta-pumpkin-witch-c063-art.webp",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 45%",
    "imageVerified": true
  },
  {
    "id": "zzz-32-orbie",
    "gameId": "zzz",
    "kind": "event",
    "title": {
      "ko": "짜잔! 동글이 성장 일기",
      "en": "Diary of an Orbie Parent",
      "ja": "じゃーん！コロるん成長日記",
      "zh": "锵锵！球仔成长日记"
    },
    "summary": {
      "ko": "매일 먹이를 모아 펫을 육성하고 폴리크롬·한정 칭호를 획득.",
      "en": "Collect food daily and raise pets for Polychrome and an event title.",
      "ja": "毎日エサを集めてペットを育て、ポリクロームと限定称号を獲得。",
      "zh": "每日收集食物培养球仔，领取菲林和活动称号。"
    },
    "region": "global",
    "server": "Global · Asia (UTC+8)",
    "startAt": "2026-09-30T11:00:00+09:00",
    "endAt": "2026-10-19T04:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://zenless.hoyoverse.com/ko-kr/news/166476",
    "sourceTitle": "「짜잔! 동글이 성장 일기」 이벤트 설명",
    "version": "3.2",
    "sourceLocale": "ko",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://zenless.hoyoverse.com/ko-kr/news/166476",
      "en": "https://zenless.hoyoverse.com/en-us/news/166476",
      "ja": "https://zenless.hoyoverse.com/ja-jp/news/166476",
      "zh": "https://zenless.hoyoverse.com/zh-cn/news/166476"
    },
    "sourceKind": "official",
    "highlights": [
      {
        "ko": "폴리크롬 300개",
        "en": "300 Polychrome",
        "ja": "ポリクローム300",
        "zh": "300菲林"
      },
      {
        "ko": "매일 먹이 최대 3개",
        "en": "Up to 3 food each day",
        "ja": "エサは1日最大3個",
        "zh": "每日最多3份食物"
      },
      {
        "ko": "로프넷 Lv.20 · 제1장 막간 완료",
        "en": "Inter-Knot Lv.20 · Chapter 1 Intermission",
        "ja": "インターノットLv.20・第一章幕間クリア",
        "zh": "绳网20级・完成第一章幕间"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "진행 방법",
          "en": "How to play",
          "ja": "進め方",
          "zh": "玩法"
        },
        "body": {
          "ko": "로그인으로 먹이 2개, 배터리 30개 소모로 1개를 추가 획득한다. 일일 최대 3개다.",
          "en": "Logging in grants 2 food; spending 30 Battery Charge grants 1 more. The daily total is 3.",
          "ja": "ログインでエサ2個、バッテリー30消費でさらに1個を獲得。1日合計3個。",
          "zh": "登录可得2份食物，消耗30点电量再得1份，每日合计3份。"
        }
      },
      {
        "title": {
          "ko": "보상",
          "en": "Rewards",
          "ja": "報酬",
          "zh": "奖励"
        },
        "body": {
          "ko": "기간 한정 임무로 폴리크롬·선택받은 사육사 칭호·육성 재료를 수령한다. 완전체 펫만 후속 이벤트에 유지되므로 종료 전에 육성을 마친다.",
          "en": "Limited missions award Polychrome, the event title and upgrade materials. Only fully evolved pets carry into later events.",
          "ja": "期間限定任務でポリクローム、称号、育成素材を獲得。次回に引き継がれるのは完全体のペットのみ。",
          "zh": "限时任务奖励包括菲林、称号及养成材料；仅完全体宠物可保留到后续活动。"
        }
      }
    ],
    "relatedSources": [
      {
        "kind": "community",
        "url": "https://www.inven.co.kr/webzine/news/?news=320217",
        "title": "젠레스 존 제로 3.2 버전 업데이트",
        "publisher": "인벤 · 강민우",
        "publishedAt": "2026-08-31T10:36:00+09:00"
      }
    ],
    "image": "/assets/community/zzz-166476.webp",
    "imageSource": "https://fastcdn.hoyoverse.com/content-v2/nap/166476/842e67beb4981da5d68d16253558f522_1714275544211002251.jpg"
  },
  {
    "id": "zzz-32-hobbling-crow",
    "gameId": "zzz",
    "kind": "event",
    "title": {
      "ko": "절름발이 까마귀 탐정록",
      "en": "Chronicles of the Hobbling Crow",
      "ja": "ホブリング・クロウ奇探録",
      "zh": "跛脚乌鸦奇探录"
    },
    "summary": {
      "ko": "5개 의뢰 사건을 순서대로 해결하고 폴리크롬·Bangboo 티켓 획득.",
      "en": "Complete five cases in order for Polychrome and Boopons.",
      "ja": "5件の依頼を順に解決し、ポリクロームとボンプチケットを獲得。",
      "zh": "依次完成5项委托，获得菲林和邦布券。"
    },
    "region": "global",
    "server": "Global · Asia (UTC+8)",
    "startAt": "2026-10-03T11:00:00+09:00",
    "endAt": "2026-10-19T04:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://zenless.hoyoverse.com/ko-kr/news/166498",
    "sourceTitle": "「절름발이 까마귀 탐정록」 이벤트 설명",
    "version": "3.2",
    "sourceLocale": "ko",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://zenless.hoyoverse.com/ko-kr/news/166498",
      "en": "https://zenless.hoyoverse.com/en-us/news/166498",
      "ja": "https://zenless.hoyoverse.com/ja-jp/news/166498",
      "zh": "https://zenless.hoyoverse.com/zh-cn/news/166498"
    },
    "sourceKind": "official",
    "highlights": [
      {
        "ko": "폴리크롬 360개",
        "en": "360 Polychrome",
        "ja": "ポリクローム360",
        "zh": "360菲林"
      },
      {
        "ko": "5개 의뢰 · 순차 해제",
        "en": "5 cases · Sequential unlock",
        "ja": "依頼5件・順次解放",
        "zh": "5项委托・依次解锁"
      },
      {
        "ko": "로프넷 Lv.20 · 제1장 막간 완료",
        "en": "Inter-Knot Lv.20 · Chapter 1 Intermission",
        "ja": "インターノットLv.20・第一章幕間クリア",
        "zh": "绳网20级・完成第一章幕间"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "진행 방법",
          "en": "How to play",
          "ja": "進め方",
          "zh": "玩法"
        },
        "body": {
          "ko": "앞선 의뢰를 완료하고 개방 시간이 지나면 다음 사건이 열린다. 크로우·호블과 캐럿 밀수 사건을 조사한다.",
          "en": "Each case requires the previous case and its scheduled unlock time. Investigate the Carrot smuggling case with Crow and Hobble.",
          "ja": "前の依頼をクリアし、指定の時刻を迎えると次の事件が解放。クロウとホブルとともに密輸事件を調査する。",
          "zh": "完成前置委托并达到开放时间后解锁下一案件，与乌鸦和跛脚一同调查走私事件。"
        }
      },
      {
        "title": {
          "ko": "보상",
          "en": "Rewards",
          "ja": "報酬",
          "zh": "奖励"
        },
        "body": {
          "ko": "의뢰 완료 보상은 폴리크롬, Bangboo 티켓과 육성 재료다.",
          "en": "Case rewards include Polychrome, Boopons and upgrade materials.",
          "ja": "依頼報酬はポリクローム、ボンプチケット、育成素材。",
          "zh": "委托奖励包括菲林、邦布券及养成材料。"
        }
      }
    ],
    "relatedSources": [
      {
        "kind": "community",
        "url": "https://www.inven.co.kr/webzine/news/?news=320217",
        "title": "젠레스 존 제로 3.2 버전 업데이트",
        "publisher": "인벤 · 강민우",
        "publishedAt": "2026-08-31T10:36:00+09:00"
      }
    ],
    "image": "/assets/community/zzz-166498.webp",
    "imageSource": "https://fastcdn.hoyoverse.com/content-v2/nap/166498/5e677af2b9c87085a333ee90ca9617a5_4863175648049570017.jpg"
  },
  {
    "id": "zzz-32-surprise-screening",
    "gameId": "zzz",
    "kind": "event",
    "title": {
      "ko": "깜짝 상영 기획",
      "en": "Surprise Screening Plan",
      "ja": "サプライズ上映企画",
      "zh": "惊喜放映企划"
    },
    "summary": {
      "ko": "누적 로그인으로 AOD 한정 코스튬 선택권과 폴리크롬 획득.",
      "en": "Cumulative login rewards include an AOD outfit selector and Polychrome.",
      "ja": "累計ログインでAOD限定コスチューム選択券とポリクロームを獲得。",
      "zh": "累计登录可获AOD限定时装自选及菲林。"
    },
    "region": "global",
    "server": "Global · Asia (UTC+8)",
    "startAt": "2026-09-23T11:00:00+09:00",
    "endAt": "2026-10-20T04:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://zenless.hoyoverse.com/ko-kr/news/166191",
    "sourceTitle": "「깜짝 상영 기획」 이벤트 설명",
    "version": "3.2",
    "sourceLocale": "ko",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://zenless.hoyoverse.com/ko-kr/news/166191",
      "en": "https://zenless.hoyoverse.com/en-us/news/166191",
      "ja": "https://zenless.hoyoverse.com/ja-jp/news/166191",
      "zh": "https://zenless.hoyoverse.com/zh-cn/news/166191"
    },
    "sourceKind": "official",
    "highlights": [
      {
        "ko": "폴리크롬 300개",
        "en": "300 Polychrome",
        "ja": "ポリクローム300",
        "zh": "300菲林"
      },
      {
        "ko": "코스튬 3종 중 1개 선택",
        "en": "Choose 1 of 3 outfits",
        "ja": "コスチューム3種から1つ",
        "zh": "3套时装中任选1套"
      },
      {
        "ko": "캐릭터 미보유 시에도 수령 가능",
        "en": "Can claim without owning the Agent",
        "ja": "未所持のエージェント衣装も受取可",
        "zh": "未拥有角色也可领取"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "참여 조건",
          "en": "Requirements",
          "ja": "参加条件",
          "zh": "参与条件"
        },
        "body": {
          "ko": "로프넷 Lv.5 이상, 프롤로그 「토끼와 로프」 완료 및 이벤트 기능 해제가 필요하다.",
          "en": "Requires Inter-Knot Lv.5, completion of the prologue and the Events feature.",
          "ja": "インターノットLv.5、プロローグクリア、「イベント」機能の解放が必要。",
          "zh": "需绳网等级5级、完成序章并解锁活动功能。"
        }
      },
      {
        "title": {
          "ko": "보상",
          "en": "Rewards",
          "ja": "報酬",
          "zh": "奖励"
        },
        "body": {
          "ko": "남궁우·아리아·수나 코스튬 중 하나를 선택한다. 조건 달성 후 이벤트 페이지에서 직접 수령해야 하며 같은 코스튬은 중복 수령할 수 없다.",
          "en": "Choose an outfit for Nangong Yu, Aria or Sunna. Claim it on the event page after meeting the login requirement; duplicate outfits cannot be claimed.",
          "ja": "南宮羽・アリア・スナの衣装から1つ選択。条件達成後、イベント画面で受け取る。同一衣装の重複受取は不可。",
          "zh": "可选择南宫羽、爱芮或千夏的时装。满足登录条件后须在活动页面领取，同一时装不能重复领取。"
        }
      }
    ],
    "relatedSources": [
      {
        "kind": "community",
        "url": "https://www.inven.co.kr/webzine/news/?news=320217",
        "title": "젠레스 존 제로 3.2 버전 업데이트",
        "publisher": "인벤 · 강민우",
        "publishedAt": "2026-08-31T10:36:00+09:00"
      }
    ],
    "image": "/assets/community/zzz-166191.webp",
    "imageSource": "https://fastcdn.hoyoverse.com/content-v2/nap/166191/432c20864e187cc1dddc0d1079b437c6_113474254085556831.jpg"
  },
  {
    "id": "zzz-32-data-bounty",
    "gameId": "zzz",
    "kind": "event",
    "title": {
      "ko": "데이터 현상금-실전 시뮬레이션",
      "en": "Data Bounty: Combat Simulation",
      "ja": "データ懸賞-模擬実戦",
      "zh": "数据悬赏-实战模拟"
    },
    "summary": {
      "ko": "실전 시뮬레이션 보상 2배. 매일 몬스터 카드 5장에 적용.",
      "en": "Double Combat Simulation rewards on up to 5 enemy cards daily.",
      "ja": "模擬実戦の報酬2倍。毎日モンスターカード5枚に適用。",
      "zh": "实战模拟奖励翻倍，每日最多适用于5张怪物卡。"
    },
    "region": "global",
    "server": "Global · Asia (UTC+8)",
    "startAt": "2026-10-14T05:00:00+09:00",
    "endAt": "2026-10-19T04:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://zenless.hoyoverse.com/ko-kr/news/166664",
    "sourceTitle": "「데이터 현상금-실전 시뮬레이션」 이벤트 설명",
    "version": "3.2",
    "sourceLocale": "ko",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://zenless.hoyoverse.com/ko-kr/news/166664",
      "en": "https://zenless.hoyoverse.com/en-us/news/166664",
      "ja": "https://zenless.hoyoverse.com/ja-jp/news/166664",
      "zh": "https://zenless.hoyoverse.com/zh-cn/news/166664"
    },
    "sourceKind": "official",
    "highlights": [
      {
        "ko": "재료 보상 2배 · 하루 5장",
        "en": "2× rewards · 5 cards daily",
        "ja": "報酬2倍・1日5枚",
        "zh": "双倍奖励・每日5张"
      },
      {
        "ko": "매일 05:00 KST/JST 초기화",
        "en": "Resets 05:00 KST/JST daily",
        "ja": "毎日05:00 KST/JST更新",
        "zh": "每日05:00 KST/JST刷新"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "참여 조건",
          "en": "Requirements",
          "ja": "参加条件",
          "zh": "参与条件"
        },
        "body": {
          "ko": "메인 스토리 제1장 「고양이의 분실물」에서 실전 시뮬레이션룸을 개방해야 한다.",
          "en": "Unlock Combat Simulation during Chapter 1: Cat’s Lost & Found.",
          "ja": "第一章「猫の落とし物」で模擬実戦を解放する。",
          "zh": "在第一章「猫的失物」中解锁实战模拟室。"
        }
      },
      {
        "title": {
          "ko": "진행 방법",
          "en": "How to play",
          "ja": "進め方",
          "zh": "玩法"
        },
        "body": {
          "ko": "몬스터 카드를 선택해 도전을 완료하면 2배 보상이 적용된다. 적용 가능 카드 수는 매일 초기화된다.",
          "en": "Select enemy cards and finish the challenge to receive double rewards. The eligible-card quota resets each day.",
          "ja": "モンスターカードを選んで挑戦をクリアすると報酬2倍。適用可能枚数は毎日更新。",
          "zh": "选择怪物卡并完成挑战即可获得双倍奖励，可用次数每日刷新。"
        }
      }
    ],
    "image": "/assets/community/zzz-166664.webp",
    "imageSource": "https://fastcdn.hoyoverse.com/content-v2/nap/166664/6123faf7e862b0a024706590daf87ad1_5023792981828407747.jpg"
  },
  {
    "id": "zzz-32-city-fund-growth",
    "gameId": "zzz",
    "kind": "package",
    "title": {
      "ko": "리두 펀드 · 성장 플랜",
      "en": "New Eridu City Fund · Growth Plan",
      "ja": "エリーファンド・成長プラン",
      "zh": "丽都城募・成长计划"
    },
    "summary": {
      "ko": "폴리크롬 680개 즉시 지급. 레벨 보상과 W-엔진 선택권 포함.",
      "en": "Instant 680 Polychrome, plus level rewards and a W-Engine choice.",
      "ja": "ポリクローム680個を即時獲得。レベル報酬と音動機選択を含む。",
      "zh": "立即获得680菲林，另有等级奖励和音擎自选。"
    },
    "region": "global",
    "server": "Global · Asia (UTC+8)",
    "startAt": null,
    "endAt": "2026-10-19T03:59:00+09:00",
    "publishedAt": "2026-09-08T12:00:00+09:00",
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://zenless.hoyoverse.com/ko-kr/news/165995",
    "sourceTitle": "3.2 버전 「리두 펀드」 설명",
    "version": "3.2",
    "sourceLocale": "ko",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://zenless.hoyoverse.com/ko-kr/news/165995",
      "en": "https://zenless.hoyoverse.com/en-us/news/165995",
      "ja": "https://zenless.hoyoverse.com/ja-jp/news/165995",
      "zh": "https://zenless.hoyoverse.com/zh-cn/news/165995"
    },
    "sourceKind": "official",
    "highlights": [
      {
        "ko": "판매 종료 10.19 03:59 KST/JST",
        "en": "Sales end Oct 19, 03:59 KST/JST",
        "ja": "販売終了10/19 03:59 KST/JST",
        "zh": "10月19日03:59 KST/JST停售"
      },
      {
        "ko": "Lv.30 · W-엔진 7종 중 선택",
        "en": "Lv.30 · Choose 1 of 7 W-Engines",
        "ja": "Lv.30・音動機7種から選択",
        "zh": "30级・7件音擎任选1件"
      }
    ],
    "contents": [
      {
        "ko": "성장: 폴리크롬 680개·풍랑의 출발점 아이콘 즉시 지급",
        "en": "Growth: 680 Polychrome and Where the Waves Begin avatar instantly",
        "ja": "成長：680ポリクロームと「嵐の始まり」アイコンを即時獲得",
        "zh": "成长：立即获得680菲林与「风浪的起点」头像"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "구성",
          "en": "Contents",
          "ja": "内容",
          "zh": "内容"
        },
        "body": {
          "ko": "유료 플랜 해제 후 펀드 Lv.30에서 진혈의 비갑을 포함한 W-엔진 7종 중 1개를 선택한다.",
          "en": "After unlocking a paid plan, reach Fund Lv.30 to choose 1 of 7 W-Engines, including Bloodmarrow Coffer.",
          "ja": "有料プラン開放後、ファンドLv.30でブラッドボックスを含む音動機7種から1つ選択。",
          "zh": "解锁付费计划后，城募30级可在含血髓秘匣的7件音擎中任选1件。"
        }
      },
      {
        "title": {
          "ko": "수령·판매 기한",
          "en": "Claim and sale deadlines",
          "ja": "受取・販売期限",
          "zh": "领取与销售期限"
        },
        "body": {
          "ko": "판매는 10월 19일 03:59, 임무·보상 수령은 같은 날 04:59(KST/JST)까지다. 선택 증표는 다음 시즌에 이월되지 않는다. 현금 가격은 공지에 없다.",
          "en": "Sales end Oct 19 at 03:59; tasks and reward claims end at 04:59 KST/JST. The selection certificate expires this season. The notice does not state cash prices.",
          "ja": "販売は10月19日03:59、任務・報酬受取は同日04:59(KST/JST)まで。選択用の証は次期へ持越し不可。告知に現金価格の記載はない。",
          "zh": "购买截止10月19日03:59，任务及领奖截止同日04:59(KST/JST)。凭证不延续至下期，公告未载明现金价格。"
        }
      }
    ],
    "image": "/assets/community/zzz-165995.webp",
    "imageSource": "https://fastcdn.hoyoverse.com/content-v2/nap/165995/eabbbb61a306d0b0f290dac968c8682e_1161630667215363159.jpg"
  },
  {
    "id": "zzz-32-city-fund-premium",
    "gameId": "zzz",
    "kind": "package",
    "title": {
      "ko": "리두 펀드 · 프리미엄 플랜",
      "en": "New Eridu City Fund · Premium Plan",
      "ja": "エリーファンド・プレミアムプラン",
      "zh": "丽都城募・典藏计划"
    },
    "summary": {
      "ko": "폴리크롬 208개 추가 즉시 지급. 레벨 보상과 W-엔진 선택권 포함.",
      "en": "Instant 208 additional Polychrome, plus level rewards and a W-Engine choice.",
      "ja": "ポリクローム追加208個を即時獲得。レベル報酬と音動機選択を含む。",
      "zh": "立即获得额外208菲林，另有等级奖励和音擎自选。"
    },
    "region": "global",
    "server": "Global · Asia (UTC+8)",
    "startAt": null,
    "endAt": "2026-10-19T03:59:00+09:00",
    "publishedAt": "2026-09-08T12:00:00+09:00",
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://zenless.hoyoverse.com/ko-kr/news/165995",
    "sourceTitle": "3.2 버전 「리두 펀드」 설명",
    "version": "3.2",
    "sourceLocale": "ko",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://zenless.hoyoverse.com/ko-kr/news/165995",
      "en": "https://zenless.hoyoverse.com/en-us/news/165995",
      "ja": "https://zenless.hoyoverse.com/ja-jp/news/165995",
      "zh": "https://zenless.hoyoverse.com/zh-cn/news/165995"
    },
    "sourceKind": "official",
    "highlights": [
      {
        "ko": "판매 종료 10.19 03:59 KST/JST",
        "en": "Sales end Oct 19, 03:59 KST/JST",
        "ja": "販売終了10/19 03:59 KST/JST",
        "zh": "10月19日03:59 KST/JST停售"
      },
      {
        "ko": "Lv.30 · W-엔진 7종 중 선택",
        "en": "Lv.30 · Choose 1 of 7 W-Engines",
        "ja": "Lv.30・音動機7種から選択",
        "zh": "30级・7件音擎任选1件"
      }
    ],
    "contents": [
      {
        "ko": "프리미엄: 폴리크롬 208개 추가·가이드 키트·W-엔진 메인 컨트롤 칩·공진 코어 장치·에테르 배터리",
        "en": "Premium: +208 Polychrome, menu decoration set, W-Engine Microcontroller Unit, Resonating Core and Ether Batteries",
        "ja": "プレミアム：追加208ポリクローム、着せ替えセット、音動機マスターチップ、共振ガジェット、エーテル電池",
        "zh": "典藏：额外208菲林、导览套件、音擎主控芯片、谐振核心仪和以太电池"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "구성",
          "en": "Contents",
          "ja": "内容",
          "zh": "内容"
        },
        "body": {
          "ko": "유료 플랜 해제 후 펀드 Lv.30에서 진혈의 비갑을 포함한 W-엔진 7종 중 1개를 선택한다.",
          "en": "After unlocking a paid plan, reach Fund Lv.30 to choose 1 of 7 W-Engines, including Bloodmarrow Coffer.",
          "ja": "有料プラン開放後、ファンドLv.30でブラッドボックスを含む音動機7種から1つ選択。",
          "zh": "解锁付费计划后，城募30级可在含血髓秘匣的7件音擎中任选1件。"
        }
      },
      {
        "title": {
          "ko": "수령·판매 기한",
          "en": "Claim and sale deadlines",
          "ja": "受取・販売期限",
          "zh": "领取与销售期限"
        },
        "body": {
          "ko": "판매는 10월 19일 03:59, 임무·보상 수령은 같은 날 04:59(KST/JST)까지다. 선택 증표는 다음 시즌에 이월되지 않는다. 현금 가격은 공지에 없다.",
          "en": "Sales end Oct 19 at 03:59; tasks and reward claims end at 04:59 KST/JST. The selection certificate expires this season. The notice does not state cash prices.",
          "ja": "販売は10月19日03:59、任務・報酬受取は同日04:59(KST/JST)まで。選択用の証は次期へ持越し不可。告知に現金価格の記載はない。",
          "zh": "购买截止10月19日03:59，任务及领奖截止同日04:59(KST/JST)。凭证不延续至下期，公告未载明现金价格。"
        }
      }
    ],
    "image": "/assets/community/zzz-165995.webp",
    "imageSource": "https://fastcdn.hoyoverse.com/content-v2/nap/165995/eabbbb61a306d0b0f290dac968c8682e_1161630667215363159.jpg"
  },
  {
    "id": "genshin-71-predictive-victory",
    "gameId": "genshin",
    "kind": "event",
    "title": {
      "ko": "승부 예측의 달인",
      "en": "Predictive Victory Dynamics",
      "ja": "勝者は誰だ！？",
      "zh": "判測勝券本徵"
    },
    "summary": {
      "ko": "16개 팀의 전투 결과를 예측해 원석 등 보상을 획득.",
      "en": "Predict battle results between 16 teams for Primogems and other rewards.",
      "ja": "16チームの勝敗を予想して原石などを獲得。",
      "zh": "预测16支队伍的战斗胜负，领取原石等奖励。"
    },
    "region": "global",
    "server": "Global · Asia (UTC+8)",
    "startAt": "2026-10-12T11:00:00+09:00",
    "endAt": "2026-10-20T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://genshin.hoyoverse.com/ko/news/detail/166650",
    "sourceTitle": "「승부 예측의 달인」 이벤트 오픈! 참여만 해도 원석 보상 획득 가능!",
    "version": "7.1",
    "sourceLocale": "ko",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://genshin.hoyoverse.com/ko/news/detail/166650",
      "en": "https://genshin.hoyoverse.com/en/news/detail/166650",
      "ja": "https://genshin.hoyoverse.com/ja/news/detail/166650",
      "zh": "https://genshin.hoyoverse.com/zh-tw/news/detail/166650"
    },
    "sourceKind": "official",
    "highlights": [
      {
        "ko": "예측 참여만으로 원석 획득",
        "en": "Primogems for participating",
        "ja": "予想への参加で原石獲得",
        "zh": "参与预测即可得原石"
      },
      {
        "ko": "결과 발표 10.20~10.23",
        "en": "Results Oct 20–23",
        "ja": "結果発表10/20〜10/23",
        "zh": "10月20日～23日公布结果"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "진행 방법",
          "en": "How to play",
          "ja": "進め方",
          "zh": "玩法"
        },
        "body": {
          "ko": "응원할 팀을 고르고 승리 인장을 투입한다. 예측 성공 시 더 많은 예측 점수를 얻으며, 지정 점수에 도달하면 추가 원석 보상을 받는다.",
          "en": "Choose a team and commit Victory Seals. Correct predictions give more prediction points; reaching point thresholds grants additional Primogems.",
          "ja": "応援するチームを選び勝利の印を投入。的中すると予想ポイントが増え、指定ポイントで追加の原石を獲得。",
          "zh": "选择支持的队伍并投入胜利印章。预测成功获得更多积分，达到指定积分可获额外原石。"
        }
      },
      {
        "title": {
          "ko": "수령·판매 기한",
          "en": "Claim and sale deadlines",
          "ja": "受取・販売期限",
          "zh": "领取与销售期限"
        },
        "body": {
          "ko": "예측은 10월 20일 10:59에 종료된다. 결과 발표 기간은 10월 20일 11:00~10월 23일 10:59(KST/JST)다.",
          "en": "Prediction closes Oct 20 at 10:59. Results are available Oct 20, 11:00 through Oct 23, 10:59 KST/JST.",
          "ja": "予想は10月20日10:59まで。結果発表は10月20日11:00〜10月23日10:59(KST/JST)。",
          "zh": "预测截止10月20日10:59；结果公布时间为10月20日11:00～10月23日10:59(KST/JST)。"
        }
      }
    ],
    "relatedSources": [
      {
        "kind": "community",
        "url": "https://gall.dcinside.com/mgallery/board/view/?id=paimon&no=200731",
        "title": "원신 7.1 공식방송 정리",
        "publisher": "디시인사이드 · Seolwha",
        "publishedAt": "2026-09-12T22:05:45+09:00"
      }
    ],
    "image": "/assets/community/genshin-166650.webp",
    "imageSource": "https://fastcdn.hoyoverse.com/content-v2/hk4e/166650/946f59403bc992c6caed04185f30a928_8714325323430025464.jpg"
  },
  {
    "id": "hsr-46-wishpower",
    "gameId": "hsr",
    "kind": "event",
    "title": {
      "ko": "「탐식」을 제압하고, 원력을 모아라",
      "en": "Wishpower UP! Down with Voracity!",
      "ja": "「貪慾」を鎮め、願力を集めよう",
      "zh": "镇伏「贪饕」，汇聚愿力"
    },
    "summary": {
      "ko": "침식된 적을 처치하고 원력을 모아 성옥 500개·트렌디 토이 티켓 18개 획득.",
      "en": "Defeat corroded enemies and gather Wishpower for 500 Stellar Jades and 18 Trendible Vouchers.",
      "ja": "侵蝕された敵を倒して願力を集め、星玉500とカプセルトイ引換券18枚を獲得。",
      "zh": "击败被侵蚀的敌人积攒愿力，获得500星琼与18张潮玩礼券。"
    },
    "region": "global",
    "server": "Global · Asia (UTC+8)",
    "startAt": null,
    "endAt": "2026-11-11T06:00:00+08:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:00:49.136495+00:00",
    "sourceUrl": "https://hsr.hoyoverse.com/ko-kr/news/166468",
    "sourceTitle": "4.6 버전 「달 뜨기 전, 괴수와 춤을」 버전 업데이트 안내",
    "version": "4.6",
    "sourceLocale": "ko",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "localizationSources": {
      "ko": "https://hsr.hoyoverse.com/ko-kr/news/166468",
      "en": "https://hsr.hoyoverse.com/en-us/news/166468",
      "ja": "https://hsr.hoyoverse.com/ja-jp/news/166468",
      "zh": "https://hsr.hoyoverse.com/zh-cn/news/166468"
    },
    "sourceKind": "official",
    "highlights": [
      {
        "ko": "성옥 500 · 트렌디 토이 티켓 18",
        "en": "500 Jade · 18 Trendible Vouchers",
        "ja": "星玉500・引換券18枚",
        "zh": "500星琼・18张潮玩礼券"
      },
      {
        "ko": "모조 꽃받침(금)·추억의 봉오리 완료",
        "en": "Complete Calyx (Golden): Bud of Memories",
        "ja": "疑似花萼（金）・回憶の蕾クリア",
        "zh": "完成拟造花萼（金）・回忆之蕾"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "진행 방법",
          "en": "How to play",
          "ja": "進め方",
          "zh": "玩法"
        },
        "body": {
          "ko": "차분화 우주 주기 연산과 화폐 전쟁의 침식된 적을 처치해 원력을 모은다. 누적 보상에 기념 훈장도 포함된다.",
          "en": "Gather Wishpower by defeating corroded enemies in Cyclical Extrapolation and Currency Wars. Cumulative rewards also include a commemorative medal.",
          "ja": "階差宇宙の周期演算やマネーウォーズの侵蝕された敵を倒して願力を集める。累計報酬には記念メダルも含まれる。",
          "zh": "击败差分宇宙周期演算及货币战争中的侵蚀敌人汇聚愿力，累计奖励还包括纪念奖章。"
        }
      }
    ]
  },
  {
    "id": "ba-kr-20261013-pack-shanhaijing",
    "gameId": "bluearchive",
    "kind": "package",
    "title": {
      "ko": "람과천청 · 산해경 스킬 성장 팩",
      "en": "The Calm After the Storm · Shanhaijing Skill Growth Pack",
      "ja": "イベント · 山海経スキル成長パック",
      "zh": "活动 · 山海经技能成长包"
    },
    "summary": {
      "ko": "학교별 스킬 재료와 오파츠 2종. 보너스 청휘석 400개, 계정당 3회.",
      "en": "School skill materials and two artifact lines; 400 bonus Pyroxenes. Limit 3.",
      "ja": "学校別スキル素材とオーパーツ2種。おまけ青輝石400、3回まで。",
      "zh": "学园技能材料与两类古物；附赠400青辉石，限购3次。"
    },
    "region": "kr",
    "server": "Korea · Nexon",
    "startAt": "2026-10-13T14:20:00+09:00",
    "endAt": "2026-11-10T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
    "sourceTitle": "10/13(화) 상점 안내",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
        "title": "10/13(화) 상점 안내",
        "publisher": "Nexon",
        "publishedAt": "2026-10-13T05:00:00+00:00"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "구성·구매 조건",
          "en": "Contents and purchase conditions",
          "ja": "内容・購入条件",
          "zh": "内容与购买条件"
        },
        "body": {
          "ko": "청휘석 구입 → 특별 판매에서 구매. 머리가 자라는 인형 · 에테르 계열이 포함됩니다.",
          "en": "Buy under Pyroxene → Special Sale. This pack contains the school materials and two artifact lines listed in the official shop table.",
          "ja": "青輝石購入→特別販売で購入。対象校のスキル素材と公式表に記載のオーパーツ2種を含みます。",
          "zh": "在青辉石购买→特别销售中购买，包含对应学园技能材料与官方表格列出的两类古物。"
        },
        "sourceKind": "official",
        "sourceUrls": [
          "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060"
        ]
      }
    ],
    "image": "/assets/ba-kr-pack-shanhaijing.webp",
    "price": {
      "amount": 29000,
      "currency": "KRW",
      "platform": "Android · Google Play Korea"
    },
    "marketRegion": "kr",
    "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261008/3841842e-00a2-4b28-bdf5-46df02d59042/image202610081540243.png",
    "contents": [
      {
        "ko": "보너스 청휘석 400개",
        "en": "Bonus Pyroxenes ×400",
        "ja": "おまけ青輝石×400",
        "zh": "附赠青辉石×400"
      },
      {
        "ko": "기술 노트: 기초·일반·상급 각 30, 최상급 20",
        "en": "Tech Notes: tiers 1–3 ×30 each; tier 4 ×20",
        "ja": "技術ノート：T1～T3各30、T4×20",
        "zh": "技术笔记：T1–T3各30，T4×20"
      },
      {
        "ko": "전술 교육 BD: 기초·일반·상급 각 12, 최상급 3",
        "en": "Tactical Training BDs: tiers 1–3 ×12 each; tier 4 ×3",
        "ja": "戦術教育BD：T1～T3各12、T4×3",
        "zh": "战术教育BD：T1–T3各12，T4×3"
      },
      {
        "ko": "오파츠 2종: 등급별 각각 55/45/40/15개",
        "en": "Two artifact lines: tiers 1–4 ×55/45/40/15 each",
        "ja": "オーパーツ2種：各T1～T4が55/45/40/15個",
        "zh": "两类古物：每类T1–T4为55/45/40/15个"
      }
    ],
    "highlights": [
      {
        "ko": "계정당 3회",
        "en": "Limit 3 per account",
        "ja": "1アカウント3回",
        "zh": "每账号限3次"
      },
      {
        "ko": "기술 노트 110 · BD 39",
        "en": "110 Tech Notes · 39 BDs",
        "ja": "ノート110 · BD39",
        "zh": "笔记110 · BD39"
      }
    ]
  },
  {
    "id": "ba-kr-20261013-pack-gehenna",
    "gameId": "bluearchive",
    "kind": "package",
    "title": {
      "ko": "람과천청 · 게헨나 스킬 성장 팩",
      "en": "The Calm After the Storm · Gehenna Skill Growth Pack",
      "ja": "イベント · ゲヘナスキル成長パック",
      "zh": "活动 · 格黑娜技能成长包"
    },
    "summary": {
      "ko": "학교별 스킬 재료와 오파츠 2종. 보너스 청휘석 400개, 계정당 3회.",
      "en": "School skill materials and two artifact lines; 400 bonus Pyroxenes. Limit 3.",
      "ja": "学校別スキル素材とオーパーツ2種。おまけ青輝石400、3回まで。",
      "zh": "学园技能材料与两类古物；附赠400青辉石，限购3次。"
    },
    "region": "kr",
    "server": "Korea · Nexon",
    "startAt": "2026-10-13T14:20:00+09:00",
    "endAt": "2026-11-10T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
    "sourceTitle": "10/13(화) 상점 안내",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
        "title": "10/13(화) 상점 안내",
        "publisher": "Nexon",
        "publishedAt": "2026-10-13T05:00:00+00:00"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "구성·구매 조건",
          "en": "Contents and purchase conditions",
          "ja": "内容・購入条件",
          "zh": "内容与购买条件"
        },
        "body": {
          "ko": "청휘석 구입 → 특별 판매에서 구매. 네브라 디스크 · 만드라고라 계열이 포함됩니다.",
          "en": "Buy under Pyroxene → Special Sale. This pack contains the school materials and two artifact lines listed in the official shop table.",
          "ja": "青輝石購入→特別販売で購入。対象校のスキル素材と公式表に記載のオーパーツ2種を含みます。",
          "zh": "在青辉石购买→特别销售中购买，包含对应学园技能材料与官方表格列出的两类古物。"
        },
        "sourceKind": "official",
        "sourceUrls": [
          "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060"
        ]
      }
    ],
    "image": "/assets/ba-kr-pack-gehenna.webp",
    "price": {
      "amount": 29000,
      "currency": "KRW",
      "platform": "Android · Google Play Korea"
    },
    "marketRegion": "kr",
    "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261008/b71e1c85-add2-4c29-8f87-4079cf6d4d1f/image202610081540244.png",
    "contents": [
      {
        "ko": "보너스 청휘석 400개",
        "en": "Bonus Pyroxenes ×400",
        "ja": "おまけ青輝石×400",
        "zh": "附赠青辉石×400"
      },
      {
        "ko": "기술 노트: 기초·일반·상급 각 30, 최상급 20",
        "en": "Tech Notes: tiers 1–3 ×30 each; tier 4 ×20",
        "ja": "技術ノート：T1～T3各30、T4×20",
        "zh": "技术笔记：T1–T3各30，T4×20"
      },
      {
        "ko": "전술 교육 BD: 기초·일반·상급 각 12, 최상급 3",
        "en": "Tactical Training BDs: tiers 1–3 ×12 each; tier 4 ×3",
        "ja": "戦術教育BD：T1～T3各12、T4×3",
        "zh": "战术教育BD：T1–T3各12，T4×3"
      },
      {
        "ko": "오파츠 2종: 등급별 각각 55/45/40/15개",
        "en": "Two artifact lines: tiers 1–4 ×55/45/40/15 each",
        "ja": "オーパーツ2種：各T1～T4が55/45/40/15個",
        "zh": "两类古物：每类T1–T4为55/45/40/15个"
      }
    ],
    "highlights": [
      {
        "ko": "계정당 3회",
        "en": "Limit 3 per account",
        "ja": "1アカウント3回",
        "zh": "每账号限3次"
      },
      {
        "ko": "기술 노트 110 · BD 39",
        "en": "110 Tech Notes · 39 BDs",
        "ja": "ノート110 · BD39",
        "zh": "笔记110 · BD39"
      }
    ]
  },
  {
    "id": "ba-kr-20261013-pack-millennium",
    "gameId": "bluearchive",
    "kind": "package",
    "title": {
      "ko": "람과천청 · 밀레니엄 스킬 성장 팩",
      "en": "The Calm After the Storm · Millennium Skill Growth Pack",
      "ja": "イベント · ミレニアムスキル成長パック",
      "zh": "活动 · 千年技能成长包"
    },
    "summary": {
      "ko": "학교별 스킬 재료와 오파츠 2종. 보너스 청휘석 400개, 계정당 3회.",
      "en": "School skill materials and two artifact lines; 400 bonus Pyroxenes. Limit 3.",
      "ja": "学校別スキル素材とオーパーツ2種。おまけ青輝石400、3回まで。",
      "zh": "学园技能材料与两类古物；附赠400青辉石，限购3次。"
    },
    "region": "kr",
    "server": "Korea · Nexon",
    "startAt": "2026-10-13T14:20:00+09:00",
    "endAt": "2026-11-10T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
    "sourceTitle": "10/13(화) 상점 안내",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
        "title": "10/13(화) 상점 안내",
        "publisher": "Nexon",
        "publishedAt": "2026-10-13T05:00:00+00:00"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "구성·구매 조건",
          "en": "Contents and purchase conditions",
          "ja": "内容・購入条件",
          "zh": "内容与购买条件"
        },
        "body": {
          "ko": "청휘석 구입 → 특별 판매에서 구매. 아틀란티스 메달 · 수정 하니와 계열이 포함됩니다.",
          "en": "Buy under Pyroxene → Special Sale. This pack contains the school materials and two artifact lines listed in the official shop table.",
          "ja": "青輝石購入→特別販売で購入。対象校のスキル素材と公式表に記載のオーパーツ2種を含みます。",
          "zh": "在青辉石购买→特别销售中购买，包含对应学园技能材料与官方表格列出的两类古物。"
        },
        "sourceKind": "official",
        "sourceUrls": [
          "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060"
        ]
      }
    ],
    "image": "/assets/ba-kr-pack-millennium.webp",
    "price": {
      "amount": 29000,
      "currency": "KRW",
      "platform": "Android · Google Play Korea"
    },
    "marketRegion": "kr",
    "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261008/aba4f302-1800-419f-8c5a-a3694df3edcc/image202610081540245.png",
    "contents": [
      {
        "ko": "보너스 청휘석 400개",
        "en": "Bonus Pyroxenes ×400",
        "ja": "おまけ青輝石×400",
        "zh": "附赠青辉石×400"
      },
      {
        "ko": "기술 노트: 기초·일반·상급 각 30, 최상급 20",
        "en": "Tech Notes: tiers 1–3 ×30 each; tier 4 ×20",
        "ja": "技術ノート：T1～T3各30、T4×20",
        "zh": "技术笔记：T1–T3各30，T4×20"
      },
      {
        "ko": "전술 교육 BD: 기초·일반·상급 각 12, 최상급 3",
        "en": "Tactical Training BDs: tiers 1–3 ×12 each; tier 4 ×3",
        "ja": "戦術教育BD：T1～T3各12、T4×3",
        "zh": "战术教育BD：T1–T3各12，T4×3"
      },
      {
        "ko": "오파츠 2종: 등급별 각각 55/45/40/15개",
        "en": "Two artifact lines: tiers 1–4 ×55/45/40/15 each",
        "ja": "オーパーツ2種：各T1～T4が55/45/40/15個",
        "zh": "两类古物：每类T1–T4为55/45/40/15个"
      }
    ],
    "highlights": [
      {
        "ko": "계정당 3회",
        "en": "Limit 3 per account",
        "ja": "1アカウント3回",
        "zh": "每账号限3次"
      },
      {
        "ko": "기술 노트 110 · BD 39",
        "en": "110 Tech Notes · 39 BDs",
        "ja": "ノート110 · BD39",
        "zh": "笔记110 · BD39"
      }
    ]
  },
  {
    "id": "ba-kr-20261013-pack-trinity",
    "gameId": "bluearchive",
    "kind": "package",
    "title": {
      "ko": "람과천청 · 트리니티 스킬 성장 팩",
      "en": "The Calm After the Storm · Trinity Skill Growth Pack",
      "ja": "イベント · トリニティスキル成長パック",
      "zh": "活动 · 圣三一技能成长包"
    },
    "summary": {
      "ko": "학교별 스킬 재료와 오파츠 2종. 보너스 청휘석 400개, 계정당 3회.",
      "en": "School skill materials and two artifact lines; 400 bonus Pyroxenes. Limit 3.",
      "ja": "学校別スキル素材とオーパーツ2種。おまけ青輝石400、3回まで。",
      "zh": "学园技能材料与两类古物；附赠400青辉石，限购3次。"
    },
    "region": "kr",
    "server": "Korea · Nexon",
    "startAt": "2026-10-13T14:20:00+09:00",
    "endAt": "2026-11-10T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
    "sourceTitle": "10/13(화) 상점 안내",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
        "title": "10/13(화) 상점 안내",
        "publisher": "Nexon",
        "publishedAt": "2026-10-13T05:00:00+00:00"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "구성·구매 조건",
          "en": "Contents and purchase conditions",
          "ja": "内容・購入条件",
          "zh": "内容与购买条件"
        },
        "body": {
          "ko": "청휘석 구입 → 특별 판매에서 구매. 님루드 렌즈 · 볼프세크 계열이 포함됩니다.",
          "en": "Buy under Pyroxene → Special Sale. This pack contains the school materials and two artifact lines listed in the official shop table.",
          "ja": "青輝石購入→特別販売で購入。対象校のスキル素材と公式表に記載のオーパーツ2種を含みます。",
          "zh": "在青辉石购买→特别销售中购买，包含对应学园技能材料与官方表格列出的两类古物。"
        },
        "sourceKind": "official",
        "sourceUrls": [
          "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060"
        ]
      }
    ],
    "image": "/assets/ba-kr-pack-trinity.webp",
    "price": {
      "amount": 29000,
      "currency": "KRW",
      "platform": "Android · Google Play Korea"
    },
    "marketRegion": "kr",
    "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261008/c7540eb9-76f8-4f26-a7bd-d19bd7b15f0e/image202610081540246.png",
    "contents": [
      {
        "ko": "보너스 청휘석 400개",
        "en": "Bonus Pyroxenes ×400",
        "ja": "おまけ青輝石×400",
        "zh": "附赠青辉石×400"
      },
      {
        "ko": "기술 노트: 기초·일반·상급 각 30, 최상급 20",
        "en": "Tech Notes: tiers 1–3 ×30 each; tier 4 ×20",
        "ja": "技術ノート：T1～T3各30、T4×20",
        "zh": "技术笔记：T1–T3各30，T4×20"
      },
      {
        "ko": "전술 교육 BD: 기초·일반·상급 각 12, 최상급 3",
        "en": "Tactical Training BDs: tiers 1–3 ×12 each; tier 4 ×3",
        "ja": "戦術教育BD：T1～T3各12、T4×3",
        "zh": "战术教育BD：T1–T3各12，T4×3"
      },
      {
        "ko": "오파츠 2종: 등급별 각각 55/45/40/15개",
        "en": "Two artifact lines: tiers 1–4 ×55/45/40/15 each",
        "ja": "オーパーツ2種：各T1～T4が55/45/40/15個",
        "zh": "两类古物：每类T1–T4为55/45/40/15个"
      }
    ],
    "highlights": [
      {
        "ko": "계정당 3회",
        "en": "Limit 3 per account",
        "ja": "1アカウント3回",
        "zh": "每账号限3次"
      },
      {
        "ko": "기술 노트 110 · BD 39",
        "en": "110 Tech Notes · 39 BDs",
        "ja": "ノート110 · BD39",
        "zh": "笔记110 · BD39"
      }
    ]
  },
  {
    "id": "ba-kr-20261013-pack-bond",
    "gameId": "bluearchive",
    "kind": "package",
    "title": {
      "ko": "람과천청 · 인연 성장 팩",
      "en": "The Calm After the Storm · Bond Growth Pack",
      "ja": "イベント · 絆成長パック",
      "zh": "活动 · 羁绊成长包"
    },
    "summary": {
      "ko": "청휘석 총 1,200개, 엘리그마 50개, 선물 선택 상자 15개.",
      "en": "1,200 total Pyroxenes, 50 Eligma and 15 gift-choice boxes.",
      "ja": "青輝石合計1,200、神名のカケラ50、贈り物選択ボックス15。",
      "zh": "共1,200青辉石、50神名精髓、15礼物自选箱。"
    },
    "region": "kr",
    "server": "Korea · Nexon",
    "startAt": "2026-10-13T14:20:00+09:00",
    "endAt": "2026-11-10T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
    "sourceTitle": "10/13(화) 상점 안내",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
        "title": "10/13(화) 상점 안내",
        "publisher": "Nexon",
        "publishedAt": "2026-10-13T05:00:00+00:00"
      }
    ],
    "detailSections": [],
    "image": "/assets/ba-kr-pack-bond.webp",
    "price": {
      "amount": 29000,
      "currency": "KRW",
      "platform": "Android · Google Play Korea"
    },
    "marketRegion": "kr",
    "contents": [
      {
        "ko": "청휘석 1,176 + 보너스 24",
        "en": "Pyroxenes 1,176 + bonus 24",
        "ja": "青輝石1,176＋おまけ24",
        "zh": "青辉石1,176＋附赠24"
      },
      {
        "ko": "엘리그마 50 · 선물 선택 상자 15",
        "en": "Eligma 50 · gift-choice boxes 15",
        "ja": "神名のカケラ50 · 贈り物選択ボックス15",
        "zh": "神名精髓50 · 礼物自选箱15"
      }
    ],
    "highlights": [
      {
        "ko": "계정당 3회",
        "en": "Limit 3",
        "ja": "3回まで",
        "zh": "限3次"
      }
    ],
    "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261008/62378aa7-6053-4183-ad95-2bccd0599cfb/image202610081540247.png"
  },
  {
    "id": "ba-kr-20261013-pack-shun-growth",
    "gameId": "bluearchive",
    "kind": "package",
    "title": {
      "ko": "슌(수영복) 성장 지원 팩",
      "en": "Shun (Swimsuit) Growth Support Pack",
      "ja": "シュン（水着）成長支援パック",
      "zh": "旬（泳装）成长支援包"
    },
    "summary": {
      "ko": "활동 보고서·강화석·장비 만능 설계도와 1,500만 크레딧. 계정당 2회.",
      "en": "Activity reports, enhancement stones, universal blueprints and 15 million credits. Limit 2.",
      "ja": "レポート・強化珠・装備万能設計図と1,500万クレジット。2回まで。",
      "zh": "报告、强化石、装备万能设计图及1,500万信用点，限2次。"
    },
    "region": "kr",
    "server": "Korea · Nexon",
    "startAt": "2026-10-13T14:20:00+09:00",
    "endAt": "2026-11-10T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
    "sourceTitle": "10/13(화) 상점 안내",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
        "title": "10/13(화) 상점 안내",
        "publisher": "Nexon",
        "publishedAt": "2026-10-13T05:00:00+00:00"
      }
    ],
    "detailSections": [],
    "image": "/assets/ba-kr-pack-shun-growth.webp",
    "price": {
      "amount": 49000,
      "currency": "KRW",
      "platform": "Android · Google Play Korea"
    },
    "marketRegion": "kr",
    "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261008/e67c7eb3-749e-4836-bf4a-fa788a547488/image202610081540248.png",
    "contents": [
      {
        "ko": "보너스 청휘석 1,200",
        "en": "Bonus Pyroxenes ×1,200",
        "ja": "おまけ青輝石×1,200",
        "zh": "附赠青辉石×1,200"
      },
      {
        "ko": "활동 보고서: 상급 225 · 최상급 80",
        "en": "Activity reports: advanced 225 · superior 80",
        "ja": "レポート：上級225 · 最上級80",
        "zh": "报告：高级225 · 最高级80"
      },
      {
        "ko": "강화석: 상급 215 · 최상급 75",
        "en": "Enhancement stones: advanced 215 · superior 75",
        "ja": "強化珠：上級215 · 最上級75",
        "zh": "强化石：高级215 · 最高级75"
      },
      {
        "ko": "모자 · 헤어핀 · 손목시계 만능 설계도 각 8,175",
        "en": "Hat · Hairpin · Watch universal blueprints: 8,175 each",
        "ja": "帽子 · ヘアピン · 腕時計の万能設計図各8,175",
        "zh": "帽子 · 发夹 · 手表万能设计图各8,175"
      },
      {
        "ko": "크레딧 15,000,000",
        "en": "Credits ×15,000,000",
        "ja": "クレジット×15,000,000",
        "zh": "信用点×15,000,000"
      }
    ],
    "highlights": [
      {
        "ko": "계정당 2회",
        "en": "Limit 2",
        "ja": "2回まで",
        "zh": "限2次"
      },
      {
        "ko": "청휘석 1,200은 보너스",
        "en": "1,200 bonus Pyroxenes",
        "ja": "おまけ青輝石1,200",
        "zh": "附赠1,200青辉石"
      }
    ]
  },
  {
    "id": "ba-kr-20261013-pack-kisaki-growth",
    "gameId": "bluearchive",
    "kind": "package",
    "title": {
      "ko": "키사키(수영복) 성장 지원 팩",
      "en": "Kisaki (Swimsuit) Growth Support Pack",
      "ja": "キサキ（水着）成長支援パック",
      "zh": "妃咲（泳装）成长支援包"
    },
    "summary": {
      "ko": "활동 보고서·강화석·장비 만능 설계도와 1,500만 크레딧. 계정당 2회.",
      "en": "Activity reports, enhancement stones, universal blueprints and 15 million credits. Limit 2.",
      "ja": "レポート・強化珠・装備万能設計図と1,500万クレジット。2回まで。",
      "zh": "报告、强化石、装备万能设计图及1,500万信用点，限2次。"
    },
    "region": "kr",
    "server": "Korea · Nexon",
    "startAt": "2026-10-13T14:20:00+09:00",
    "endAt": "2026-11-10T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
    "sourceTitle": "10/13(화) 상점 안내",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
        "title": "10/13(화) 상점 안내",
        "publisher": "Nexon",
        "publishedAt": "2026-10-13T05:00:00+00:00"
      }
    ],
    "detailSections": [],
    "image": "/assets/ba-kr-pack-kisaki-growth.webp",
    "price": {
      "amount": 49000,
      "currency": "KRW",
      "platform": "Android · Google Play Korea"
    },
    "marketRegion": "kr",
    "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261008/0fb07a34-2107-439e-a298-adb2eb12ab79/image202610081540249.png",
    "contents": [
      {
        "ko": "보너스 청휘석 1,200",
        "en": "Bonus Pyroxenes ×1,200",
        "ja": "おまけ青輝石×1,200",
        "zh": "附赠青辉石×1,200"
      },
      {
        "ko": "활동 보고서: 상급 225 · 최상급 80",
        "en": "Activity reports: advanced 225 · superior 80",
        "ja": "レポート：上級225 · 最上級80",
        "zh": "报告：高级225 · 最高级80"
      },
      {
        "ko": "강화석: 상급 215 · 최상급 75",
        "en": "Enhancement stones: advanced 215 · superior 75",
        "ja": "強化珠：上級215 · 最上級75",
        "zh": "强化石：高级215 · 最高级75"
      },
      {
        "ko": "장갑 · 헤어핀 · 목걸이 만능 설계도 각 8,175",
        "en": "Gloves · Hairpin · Necklace universal blueprints: 8,175 each",
        "ja": "グローブ · ヘアピン · ネックレスの万能設計図各8,175",
        "zh": "手套 · 发夹 · 项链万能设计图各8,175"
      },
      {
        "ko": "크레딧 15,000,000",
        "en": "Credits ×15,000,000",
        "ja": "クレジット×15,000,000",
        "zh": "信用点×15,000,000"
      }
    ],
    "highlights": [
      {
        "ko": "계정당 2회",
        "en": "Limit 2",
        "ja": "2回まで",
        "zh": "限2次"
      },
      {
        "ko": "청휘석 1,200은 보너스",
        "en": "1,200 bonus Pyroxenes",
        "ja": "おまけ青輝石1,200",
        "zh": "附赠1,200青辉石"
      }
    ]
  },
  {
    "id": "ba-kr-20261013-pack-archive-selector",
    "gameId": "bluearchive",
    "kind": "package",
    "title": {
      "ko": "람과천청 · 아카이브 ★3 선택권",
      "en": "The Calm After the Storm · Archive 3★ Selector",
      "ja": "イベント · アーカイブ★3選択券",
      "zh": "活动 · 档案馆★3自选券"
    },
    "summary": {
      "ko": "아카이브 모집 ★3 학생 선택권 1장. 계정당 1회, 사용 기한 11월 17일 10:59 KST.",
      "en": "One Archive 3★ student selector. Limit 1; use by Nov 17, 10:59 KST.",
      "ja": "アーカイブ★3生徒選択券1枚。1回まで、11/17 10:59 KST使用期限。",
      "zh": "档案馆★3学生自选券1张；限1次，11/17 10:59 KST到期。"
    },
    "region": "kr",
    "server": "Korea · Nexon",
    "startAt": "2026-10-13T14:20:00+09:00",
    "endAt": "2026-11-10T10:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
    "sourceTitle": "10/13(화) 상점 안내",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060",
        "title": "10/13(화) 상점 안내",
        "publisher": "Nexon",
        "publishedAt": "2026-10-13T05:00:00+00:00"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "구성·구매 조건",
          "en": "Contents and purchase conditions",
          "ja": "内容・購入条件",
          "zh": "内容与购买条件"
        },
        "body": {
          "ko": "선택 대상은 아카이브 모집 목록이며 인게임 선택 가능 학생에서 확인합니다. 이미 보유한 학생을 선택하면 엘리그마 50개와 해당 학생 엘레프 100개를 받습니다. 선택권 사용으로 아카이브 모집 포인트는 지급되지 않습니다.",
          "en": "Choose from the in-game Archive eligible-student list. Choosing an owned student grants 50 Eligma and 100 of that student’s Eleph. No Archive Recruitment Points are awarded.",
          "ja": "対象はゲーム内のアーカイブ選択可能生徒一覧。所持済みなら神名のカケラ50と対象の神名文字100を獲得。募集ポイントは付与されません。",
          "zh": "从游戏内档案馆可选学生列表选择；已持有者兑换为50神名精髓和100该学生神名文字，不获得档案馆招募点数。"
        },
        "sourceKind": "official",
        "sourceUrls": [
          "https://forum.nexon.com/bluearchive/board_view?board=1073&thread=3560060"
        ]
      }
    ],
    "image": "/assets/ba-kr-pack-archive-selector.webp",
    "price": {
      "amount": 19000,
      "currency": "KRW",
      "platform": "Android · Google Play Korea"
    },
    "marketRegion": "kr",
    "imageSource": "https://dszw1qtcnsa5e.cloudfront.net/community/20261008/a0f58476-7457-4f29-b34e-8e4910f78969/image2026100815402410.png",
    "contents": [
      {
        "ko": "아카이브 ★3 학생 선택권 ×1",
        "en": "Archive 3★ student selector ×1",
        "ja": "アーカイブ★3生徒選択券×1",
        "zh": "档案馆★3学生自选券×1"
      }
    ],
    "highlights": [
      {
        "ko": "계정당 1회",
        "en": "Limit 1",
        "ja": "1回まで",
        "zh": "限1次"
      },
      {
        "ko": "티켓 사용: 11/17 10:59 KST까지",
        "en": "Use ticket by Nov 17, 10:59 KST",
        "ja": "使用期限11/17 10:59 KST",
        "zh": "用券截止11/17 10:59 KST"
      }
    ]
  },
  {
    "id": "nikke-kr-20261008-little-witch",
    "gameId": "nikke",
    "kind": "event",
    "title": {
      "ko": "LITTLE WITCH TRICK · 스토리 이벤트",
      "en": "LITTLE WITCH TRICK",
      "ja": "LITTLE WITCH TRICK · ストーリーイベント",
      "zh": "LITTLE WITCH TRICK · 剧情活动"
    },
    "summary": {
      "ko": "이벤트 재화로 모집 티켓·스킬 재료 교환. 상점도 10월 28일 함께 종료됩니다.",
      "en": "Trade event currency for recruit tickets and skill materials. The shop also closes Oct 28.",
      "ja": "通貨を募集チケット・スキル素材に交換。ショップも10/28終了。",
      "zh": "活动货币可换招募券及技能材料；商店同于10月28日结束。"
    },
    "region": "global",
    "server": "Unified · Global / Korea / Japan",
    "startAt": null,
    "endAt": "2026-10-28T23:59:59+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
    "sourceTitle": "10월 8일 업데이트 공지",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
        "title": "10월 8일 업데이트 공지",
        "publisher": "Level Infinite"
      },
      {
        "kind": "community",
        "url": "https://www.inven.co.kr/webzine/news/?news=321911&site=nikke",
        "title": "할로윈 이벤트·신데렐라 코스튬 정리",
        "publisher": "Inven · 양예찬",
        "publishedAt": "2026-10-08T17:15:00+09:00"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "참여와 보상",
          "en": "Participation and rewards",
          "ja": "参加と報酬",
          "zh": "参与及奖励"
        },
        "body": {
          "ko": "일반 이벤트 스테이지에서 전용 아이템을 모으고, 챌린지 스테이지에서는 육성 재료를 얻습니다. 이벤트 미션으로 받은 메모리 필름은 아카이브 ABSOLUTE 해금에 사용할 수 있습니다.",
          "en": "Farm event stages for shop currency and challenge stages for growth materials. Use the event mission’s Memory Film to unlock ABSOLUTE in the archive.",
          "ja": "イベントステージで通貨、チャレンジで育成素材を入手。ミッション報酬のメモリーフィルムでアーカイブABSOLUTEを解放できます。",
          "zh": "活动关卡产出商店货币，挑战关卡产出养成材料。任务奖励的回忆胶卷可解锁档案馆ABSOLUTE。"
        },
        "sourceKind": "official",
        "sourceUrls": [
          "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb"
        ]
      },
      {
        "title": {
          "ko": "커뮤니티 공략 참고",
          "en": "Community guide",
          "ja": "コミュニティ攻略",
          "zh": "社区攻略"
        },
        "body": {
          "ko": "인벤은 별도 출석 이벤트 DAILY TRICK도 함께 챙길 것을 안내합니다. 누적 14일 접속 보상은 스토리 클리어와 별개입니다.",
          "en": "Inven recommends checking DAILY TRICK alongside the story event: its 14-day login rewards require separate attendance.",
          "ja": "InvenはDAILY TRICKの並行確認を案内。14日累計ログイン報酬はストーリークリアとは別です。",
          "zh": "Inven提醒同步查看DAILY TRICK，累计14日登录奖励需另外完成签到。"
        },
        "sourceKind": "community",
        "sourceUrls": [
          "https://www.inven.co.kr/webzine/news/?news=321911&site=nikke"
        ]
      }
    ],
    "image": "/assets/nikke-kr-belorta.webp",
    "timingNote": {
      "ko": "10월 8일 점검 종료 후 시작. 한국·일본·글로벌 동일 업데이트 일정.",
      "en": "Starts after Oct 8 maintenance. KR, JP and Global share this update schedule.",
      "ja": "10/8メンテナンス後開始。韓国・日本・グローバル共通更新日程。",
      "zh": "10月8日维护后开始；韩服、日服与国际服更新日程同步。"
    },
    "highlights": [
      {
        "ko": "상점 교환도 10/28 종료",
        "en": "Shop also closes Oct 28",
        "ja": "交換も10/28終了",
        "zh": "商店同于10/28结束"
      },
      {
        "ko": "메모리 필름 → ABSOLUTE 해금",
        "en": "Memory Film unlocks ABSOLUTE",
        "ja": "メモリーフィルムでABSOLUTE解放",
        "zh": "回忆胶卷解锁ABSOLUTE"
      }
    ]
  },
  {
    "id": "nikke-kr-20261008-daily-trick",
    "gameId": "nikke",
    "kind": "event",
    "title": {
      "ko": "DAILY TRICK · 14일 출석",
      "en": "DAILY TRICK · 14-day login",
      "ja": "DAILY TRICK · 14日ログイン",
      "zh": "DAILY TRICK · 14日签到"
    },
    "summary": {
      "ko": "기간 중 누적 14일 접속하면 고급 모집 티켓과 육성 재료를 모두 수령할 수 있습니다.",
      "en": "Log in on 14 days during the event to collect all Advanced Recruit Vouchers and growth materials.",
      "ja": "期間中累計14日ログインで高級募集チケットと育成素材を全回収。",
      "zh": "活动期间累计登录14天，可领齐高级招募券与养成材料。"
    },
    "region": "global",
    "server": "Unified · Global / Korea / Japan",
    "startAt": null,
    "endAt": "2026-10-28T23:59:59+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
    "sourceTitle": "10월 8일 업데이트 공지",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
        "title": "10월 8일 업데이트 공지",
        "publisher": "Level Infinite"
      },
      {
        "kind": "community",
        "url": "https://www.inven.co.kr/webzine/news/?news=321911&site=nikke",
        "title": "할로윈 이벤트·신데렐라 코스튬 정리",
        "publisher": "Inven · 양예찬",
        "publishedAt": "2026-10-08T17:15:00+09:00"
      }
    ],
    "detailSections": [],
    "image": "/assets/nikke-kr-belorta.webp",
    "timingNote": {
      "ko": "10월 8일 점검 종료 후 시작. 한국·일본·글로벌 동일 업데이트 일정.",
      "en": "Starts after Oct 8 maintenance. KR, JP and Global share this update schedule.",
      "ja": "10/8メンテナンス後開始。韓国・日本・グローバル共通更新日程。",
      "zh": "10月8日维护后开始；韩服、日服与国际服更新日程同步。"
    },
    "highlights": [
      {
        "ko": "누적 14일 로그인",
        "en": "14 cumulative login days",
        "ja": "累計14日ログイン",
        "zh": "累计登录14天"
      }
    ]
  },
  {
    "id": "nikke-kr-20261008-cinderella-special",
    "gameId": "nikke",
    "kind": "event",
    "title": {
      "ko": "Cinderella Special · 글라스 커트시",
      "en": "Cinderella Special · Glass Curtsy",
      "ja": "Cinderella Special · グラスカーテシー",
      "zh": "Cinderella Special · 水晶女僕"
    },
    "summary": {
      "ko": "접속으로 신데렐라 한정 코스튬·테마곡·인기투표 TOP5 프레임을 수령합니다.",
      "en": "Log in to claim Cinderella’s costume, theme song and popularity Top 5 frames.",
      "ja": "ログインでシンデレラ衣装・テーマ曲・人気投票TOP5フレームを獲得。",
      "zh": "登录领取灰姑娘时装、主题曲及人气投票前五名头像框。"
    },
    "region": "global",
    "server": "Unified · Global / Korea / Japan",
    "startAt": null,
    "endAt": "2026-12-03T04:59:59+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
    "sourceTitle": "10월 8일 업데이트 공지",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
        "title": "10월 8일 업데이트 공지",
        "publisher": "Level Infinite"
      },
      {
        "kind": "community",
        "url": "https://www.inven.co.kr/webzine/news/?news=321911&site=nikke",
        "title": "할로윈 이벤트·신데렐라 코스튬 정리",
        "publisher": "Inven · 양예찬",
        "publishedAt": "2026-10-08T17:15:00+09:00"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "커뮤니티 공략 참고",
          "en": "Community guide",
          "ja": "コミュニティ攻略",
          "zh": "社区攻略"
        },
        "body": {
          "ko": "인벤은 코스튬 수령 기간과 특별 시나리오 MOST BEAUTIFUL MAID 종료일이 다르다고 강조합니다. 시나리오는 10월 28일까지입니다.",
          "en": "Inven highlights that the costume claim lasts longer than MOST BEAUTIFUL MAID; that scenario ends Oct 28.",
          "ja": "Invenは衣装受取とMOST BEAUTIFUL MAIDの期限の違いを強調。シナリオは10/28終了です。",
          "zh": "Inven强调时装领取期长于MOST BEAUTIFUL MAID剧情，后者10月28日结束。"
        },
        "sourceKind": "community",
        "sourceUrls": [
          "https://www.inven.co.kr/webzine/news/?news=321911&site=nikke"
        ]
      }
    ],
    "timingNote": {
      "ko": "10월 8일 점검 종료 후 시작. 한국·일본·글로벌 동일 업데이트 일정.",
      "en": "Starts after Oct 8 maintenance. KR, JP and Global share this update schedule.",
      "ja": "10/8メンテナンス後開始。韓国・日本・グローバル共通更新日程。",
      "zh": "10月8日维护后开始；韩服、日服与国际服更新日程同步。"
    },
    "highlights": [
      {
        "ko": "무료 로그인 보상",
        "en": "Free login reward",
        "ja": "無料ログイン報酬",
        "zh": "免费登录奖励"
      },
      {
        "ko": "12/3 04:59:59 KST까지",
        "en": "Until Dec 3, 04:59:59 KST",
        "ja": "12/3 04:59:59 KSTまで",
        "zh": "截至12/3 04:59:59 KST"
      }
    ],
    "contents": [
      {
        "ko": "글라스 커트시 코스튬 · Beautiful Me 테마곡",
        "en": "Glass Curtsy costume · Beautiful Me theme song",
        "ja": "グラスカーテシー衣装 · Beautiful Me",
        "zh": "水晶女僕时装 · Beautiful Me主题曲"
      },
      {
        "ko": "신데렐라·리버렐리오·리틀 머메이드·아르카나: 포츈 메이트·스노우 화이트: 헤비암즈 프레임",
        "en": "Cinderella, Liberalio, Little Mermaid, Arcana: Fortune Mate and Snow White: Heavy Arms frames",
        "ja": "シンデレラ・リバーレリオ・リトルマーメイド・アルカナ：フォーチュンメイト・スノーホワイト：ヘビーアームズのフレーム",
        "zh": "灰姑娘、莉贝雷利奥、小美人鱼、阿尔卡娜：命运伴侣、白雪公主：重型武装头像框"
      }
    ]
  },
  {
    "id": "nikke-kr-20261008-most-beautiful-maid",
    "gameId": "nikke",
    "kind": "event",
    "title": {
      "ko": "MOST BEAUTIFUL MAID · 아카이브",
      "en": "MOST BEAUTIFUL MAID",
      "ja": "MOST BEAUTIFUL MAID · アーカイブ",
      "zh": "MOST BEAUTIFUL MAID · 往期档案"
    },
    "summary": {
      "ko": "신데렐라가 메이드 역할을 배우는 특별 시나리오. 코스튬 수령 이벤트보다 먼저 종료됩니다.",
      "en": "Special Cinderella maid scenario, ending before the costume claim campaign.",
      "ja": "シンデレラのメイド特別シナリオ。衣装受取キャンペーンより早く終了。",
      "zh": "灰姑娘学习女仆角色的特别剧情，比时装领取活动更早结束。"
    },
    "region": "global",
    "server": "Unified · Global / Korea / Japan",
    "startAt": null,
    "endAt": "2026-10-28T23:59:59+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
    "sourceTitle": "10월 8일 업데이트 공지",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
        "title": "10월 8일 업데이트 공지",
        "publisher": "Level Infinite"
      },
      {
        "kind": "community",
        "url": "https://www.inven.co.kr/webzine/news/?news=321911&site=nikke",
        "title": "할로윈 이벤트·신데렐라 코스튬 정리",
        "publisher": "Inven · 양예찬",
        "publishedAt": "2026-10-08T17:15:00+09:00"
      }
    ],
    "detailSections": [],
    "timingNote": {
      "ko": "10월 8일 점검 종료 후 시작. 한국·일본·글로벌 동일 업데이트 일정.",
      "en": "Starts after Oct 8 maintenance. KR, JP and Global share this update schedule.",
      "ja": "10/8メンテナンス後開始。韓国・日本・グローバル共通更新日程。",
      "zh": "10月8日维护后开始；韩服、日服与国际服更新日程同步。"
    }
  },
  {
    "id": "nikke-kr-20261008-occultist-pass",
    "gameId": "nikke",
    "kind": "package",
    "title": {
      "ko": "레이블 · 오컬티스트 패스",
      "en": "Label · OCCULTIST PASS",
      "ja": "レーベル · OCCULTIST PASS",
      "zh": "蕾貝兒 · OCCULTIST PASS"
    },
    "summary": {
      "ko": "프리미엄 패스 구매 후 일일 미션으로 성장. 최대 레벨에서 레이블 한정 코스튬을 획득합니다.",
      "en": "Buy the premium pass and level it through daily missions; the max-level reward is Label’s costume.",
      "ja": "プレミアム購入後デイリーミッションで育成。最大レベルでレーベル衣装を獲得。",
      "zh": "购买高级通行证后完成每日任务升级，满级可得蕾貝兒限定时装。"
    },
    "region": "global",
    "server": "Unified · Global / Korea / Japan",
    "startAt": null,
    "endAt": "2026-10-28T23:59:59+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
    "sourceTitle": "10월 8일 업데이트 공지",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
        "title": "10월 8일 업데이트 공지",
        "publisher": "Level Infinite"
      },
      {
        "kind": "community",
        "url": "https://www.inven.co.kr/webzine/news/?news=321911&site=nikke",
        "title": "할로윈 이벤트·신데렐라 코스튬 정리",
        "publisher": "Inven · 양예찬",
        "publishedAt": "2026-10-08T17:15:00+09:00"
      }
    ],
    "detailSections": [
      {
        "title": {
          "ko": "구성·구매 조건",
          "en": "Contents and purchase conditions",
          "ja": "内容・購入条件",
          "zh": "内容与购买条件"
        },
        "body": {
          "ko": "공식 업데이트 공지에는 판매 가격과 티켓 총수량이 없습니다. 인벤은 패스 구매가 이벤트 종료 2시간 전에 닫힌다고 안내하므로 구매 화면의 마감 시각을 확인하세요.",
          "en": "The official notice omits price and total ticket quantity. Inven reports that pass purchases close two hours before the event ends; check the in-game purchase deadline.",
          "ja": "公式告知に価格・チケット総数は未記載。Invenは購入が終了2時間前に締切と案内しているため、ゲーム内購入期限を確認。",
          "zh": "官方公告未列价格及招募券总数；Inven称购买在活动结束前两小时截止，请核对游戏内购买期限。"
        },
        "sourceKind": "community",
        "sourceUrls": [
          "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
          "https://www.inven.co.kr/webzine/news/?news=321911&site=nikke"
        ]
      }
    ],
    "timingNote": {
      "ko": "10월 8일 점검 종료 후 시작. 한국·일본·글로벌 동일 업데이트 일정.",
      "en": "Starts after Oct 8 maintenance. KR, JP and Global share this update schedule.",
      "ja": "10/8メンテナンス後開始。韓国・日本・グローバル共通更新日程。",
      "zh": "10月8日维护后开始；韩服、日服与国际服更新日程同步。"
    },
    "contents": [
      {
        "ko": "오컬티스트 코스튬(최대 레벨 보상) · 고급 모집 티켓 등",
        "en": "Occultist costume at max level · Advanced Recruit Vouchers and other rewards",
        "ja": "最大レベルでオカルティスト衣装 · 高級募集チケットなど",
        "zh": "满级神祕學者时装 · 高级招募券等奖励"
      }
    ],
    "highlights": [
      {
        "ko": "구매 후 일일 미션 필요",
        "en": "Daily missions required after purchase",
        "ja": "購入後デイリー進行が必要",
        "zh": "购买后需完成每日任务"
      }
    ]
  },
  {
    "id": "nikke-kr-20261008-novel-costume",
    "gameId": "nikke",
    "kind": "package",
    "title": {
      "ko": "노벨 · 디텍티브 너스 재판매",
      "en": "Novel · Detective Nurse rerun",
      "ja": "ノベル · ディテクティブナース再販",
      "zh": "諾薇兒 · 偵探護士返场"
    },
    "summary": {
      "ko": "캐시 상점에서 코스튬을 기간 한정 재판매합니다. 가격은 공식 공지에 공개되지 않았습니다.",
      "en": "Limited cash-shop costume rerun. Price is not specified in the official notice.",
      "ja": "キャッシュショップで期間限定再販。公式告知に価格記載なし。",
      "zh": "付费商店限时返场时装；官方公告未列售价。"
    },
    "region": "global",
    "server": "Unified · Global / Korea / Japan",
    "startAt": null,
    "endAt": "2026-10-28T23:59:59+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
    "sourceTitle": "10월 8일 업데이트 공지",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
        "title": "10월 8일 업데이트 공지",
        "publisher": "Level Infinite"
      },
      {
        "kind": "community",
        "url": "https://www.inven.co.kr/webzine/news/?news=321911&site=nikke",
        "title": "할로윈 이벤트·신데렐라 코스튬 정리",
        "publisher": "Inven · 양예찬",
        "publishedAt": "2026-10-08T17:15:00+09:00"
      }
    ],
    "detailSections": [],
    "timingNote": {
      "ko": "10월 8일 점검 종료 후 시작. 한국·일본·글로벌 동일 업데이트 일정.",
      "en": "Starts after Oct 8 maintenance. KR, JP and Global share this update schedule.",
      "ja": "10/8メンテナンス後開始。韓国・日本・グローバル共通更新日程。",
      "zh": "10月8日维护后开始；韩服、日服与国际服更新日程同步。"
    },
    "highlights": [
      {
        "ko": "캐시 상점 · 기간 한정",
        "en": "Cash shop · limited time",
        "ja": "キャッシュショップ · 期間限定",
        "zh": "付费商店 · 限时"
      }
    ]
  },
  {
    "id": "nikke-kr-20261008-tts-album",
    "gameId": "nikke",
    "kind": "package",
    "title": {
      "ko": "T.T.S. 테트라 엔터테인먼트 팩 V.1",
      "en": "T.T.S. TETRA ENTERTAINMENT PACK V.1",
      "ja": "T.T.S. テトラエンターテインメントパック V.1",
      "zh": "T.T.S. 泰特拉娱乐包 V.1"
    },
    "summary": {
      "ko": "리듬 게임 TRACING THE STARS의 유료 앨범 팩. 추가 9곡을 해금합니다.",
      "en": "Paid TRACING THE STARS album pack unlocking nine extra songs.",
      "ja": "TRACING THE STARS有料アルバム。追加9曲を解放。",
      "zh": "TRACING THE STARS付费专辑，解锁额外9首曲目。"
    },
    "region": "global",
    "server": "Unified · Global / Korea / Japan",
    "startAt": null,
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
    "sourceTitle": "10월 8일 업데이트 공지",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://nikke-kr.com/newsdetail.html?content_id=b67197d4ae491a4b47aa60ea65677b6cd8eb",
        "title": "10월 8일 업데이트 공지",
        "publisher": "Level Infinite"
      },
      {
        "kind": "community",
        "url": "https://www.inven.co.kr/webzine/news/?news=321911&site=nikke",
        "title": "할로윈 이벤트·신데렐라 코스튬 정리",
        "publisher": "Inven · 양예찬",
        "publishedAt": "2026-10-08T17:15:00+09:00"
      }
    ],
    "detailSections": [],
    "timingNote": {
      "ko": "10월 8일 점검 종료 후 시작. 한국·일본·글로벌 동일 업데이트 일정.",
      "en": "Starts after Oct 8 maintenance. KR, JP and Global share this update schedule.",
      "ja": "10/8メンテナンス後開始。韓国・日本・グローバル共通更新日程。",
      "zh": "10月8日维护后开始；韩服、日服与国际服更新日程同步。"
    },
    "contents": [
      {
        "ko": "Lucky Night / SHOW DOWN / Running, SODA! / Catch coin, SODA! / Mission Possible / Manners Maketh Maid / MEKAMI SHIFTY / FIGHT! ARK RANGER! / A.C.P.U.! FREEZE!",
        "en": "Lucky Night / SHOW DOWN / Running, SODA! / Catch coin, SODA! / Mission Possible / Manners Maketh Maid / MEKAMI SHIFTY / FIGHT! ARK RANGER! / A.C.P.U.! FREEZE!",
        "ja": "Lucky Night / SHOW DOWN / Running, SODA! / Catch coin, SODA! / Mission Possible / Manners Maketh Maid / MEKAMI SHIFTY / FIGHT! ARK RANGER! / A.C.P.U.! FREEZE!",
        "zh": "Lucky Night / SHOW DOWN / Running, SODA! / Catch coin, SODA! / Mission Possible / Manners Maketh Maid / MEKAMI SHIFTY / FIGHT! ARK RANGER! / A.C.P.U.! FREEZE!"
      }
    ],
    "highlights": [
      {
        "ko": "리듬 게임 9곡 해금",
        "en": "Unlock 9 rhythm-game songs",
        "ja": "リズムゲーム9曲解放",
        "zh": "解锁9首节奏游戏曲目"
      }
    ]
  },
  {
    "id": "uma-kr-20261016-login1500",
    "gameId": "umamusume",
    "kind": "event",
    "title": {
      "ko": "무인도 기념 · 쥬얼 1,500",
      "en": "Island celebration · 1,500 Jewels",
      "ja": "無人島記念 · ジュエル1,500",
      "zh": "无人岛纪念 · 1,500宝石"
    },
    "summary": {
      "ko": "기간 중 로그인하면 계정당 한 번 쥬얼 1,500개를 받습니다.",
      "en": "Log in once during the campaign to receive 1,500 Jewels per account.",
      "ja": "期間中ログインで1アカウント1回ジュエル1,500。",
      "zh": "期间登录可领取一次1,500宝石。"
    },
    "region": "kr",
    "server": "Korea · Kakao Games",
    "startAt": null,
    "endAt": "2026-11-19T04:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://pf.kakao.com/_DzxjIb/114830299",
    "sourceTitle": "무인도 공개 기념 캠페인",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://pf.kakao.com/_DzxjIb/114830299",
        "title": "무인도 공개 기념 캠페인",
        "publisher": "Kakao Games"
      }
    ],
    "detailSections": [],
    "image": "/assets/uma-kr-114830299.webp"
  },
  {
    "id": "uma-kr-20261016-trainingbonus",
    "gameId": "umamusume",
    "kind": "event",
    "title": {
      "ko": "무인도 기념 · 육성 보상 2배",
      "en": "Island campaign · double training rewards",
      "ja": "無人島記念 · 育成報酬2倍",
      "zh": "无人岛纪念 · 双倍育成奖励"
    },
    "summary": {
      "ko": "육성 레이스·육성 완료 보상 2배, 육성 시작 TP 소비 1/2 캠페인.",
      "en": "Double training-race/completion rewards and half TP to start training.",
      "ja": "育成レース・育成完了報酬2倍、育成開始TP半額。",
      "zh": "育成比赛与完成奖励翻倍，开始育成消耗TP减半。"
    },
    "region": "kr",
    "server": "Korea · Kakao Games",
    "startAt": null,
    "endAt": "2026-11-19T11:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://pf.kakao.com/_DzxjIb/114830299",
    "sourceTitle": "무인도 공개 기념 캠페인",
    "sourceKind": "official",
    "officialLocales": [
      "ko"
    ],
    "translatedLocales": [
      "en",
      "ja",
      "zh"
    ],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://pf.kakao.com/_DzxjIb/114830299",
        "title": "무인도 공개 기념 캠페인",
        "publisher": "Kakao Games"
      }
    ],
    "detailSections": [],
    "image": "/assets/uma-kr-114830299.webp"
  },
  {
    "id": "gfl2-kr-20261008-inverse-cipher",
    "gameId": "gfl2",
    "kind": "event",
    "title": {
      "ko": "패러독스 훈련",
      "en": "Inverse Cipher",
      "ja": "逆理循環",
      "zh": "悖論操演"
    },
    "summary": {
      "ko": "이벤트 스테이지를 클리어하고 붕괴결정 샤드·육성 재화를 획득합니다.",
      "en": "Clear event stages for Collapse Pieces and growth materials.",
      "ja": "イベントステージでコーラップスピース・育成素材獲得。",
      "zh": "通关活动关卡获得坍塌晶条及养成材料。"
    },
    "region": "kr",
    "server": "Korea · HAOPLAY",
    "startAt": "2026-10-14T05:00:00+09:00",
    "endAt": "2026-10-28T04:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "[호박색 달빛] 버전 미리보기",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
        "title": "[호박색 달빛] 버전 미리보기",
        "publisher": "HAOPLAY · Steam"
      }
    ],
    "detailSections": [],
    "image": "/assets/gf2-kr-event.webp",
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "highlights": [
      {
        "ko": "전투 클리어 보상",
        "en": "Stage-clear rewards",
        "ja": "ステージクリア報酬",
        "zh": "通关奖励"
      }
    ]
  },
  {
    "id": "gfl2-kr-20261008-intelligence",
    "gameId": "gfl2",
    "kind": "event",
    "title": {
      "ko": "메이링의 정보 보급",
      "en": "Intelligence Supplies",
      "ja": "追加探索情報",
      "zh": "情報補給"
    },
    "summary": {
      "ko": "매일 정해진 시각 이후 로그인하여 정보 조각을 받습니다.",
      "en": "Log in after the designated daily time to receive Intelligence Puzzles.",
      "ja": "毎日指定時刻以降にログインし探索情報を獲得。",
      "zh": "每日指定时间后登录领取情报拼图。"
    },
    "region": "kr",
    "server": "Korea · HAOPLAY",
    "startAt": "2026-10-16T05:00:00+09:00",
    "endAt": "2026-10-21T04:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "[호박색 달빛] 버전 미리보기",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
        "title": "[호박색 달빛] 버전 미리보기",
        "publisher": "HAOPLAY · Steam"
      }
    ],
    "detailSections": [],
    "image": "/assets/gf2-kr-event.webp",
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "highlights": [
      {
        "ko": "매일 로그인 수령",
        "en": "Daily login claim",
        "ja": "毎日ログイン受取",
        "zh": "每日登录领取"
      }
    ]
  },
  {
    "id": "gfl2-kr-20261008-wishing-well",
    "gameId": "gfl2",
    "kind": "event",
    "title": {
      "ko": "엘모호 소원 연못",
      "en": "Elmo’s Wishing Well",
      "ja": "エルモ号お願いリスト",
      "zh": "艾莫號許願池"
    },
    "summary": {
      "ko": "의뢰를 완료하고 인형들의 소원을 이루어 붕괴결정 샤드 등을 획득합니다.",
      "en": "Complete commissions and Dolls’ wishes for Collapse Pieces and other rewards.",
      "ja": "依頼と人形のお願いを達成しコーラップスピースなどを獲得。",
      "zh": "完成委托与人形愿望可得坍塌晶条等奖励。"
    },
    "region": "kr",
    "server": "Korea · HAOPLAY",
    "startAt": "2026-10-19T05:00:00+09:00",
    "endAt": "2026-11-02T04:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "[호박색 달빛] 버전 미리보기",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
        "title": "[호박색 달빛] 버전 미리보기",
        "publisher": "HAOPLAY · Steam"
      }
    ],
    "detailSections": [],
    "image": "/assets/gf2-kr-event.webp",
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "highlights": [
      {
        "ko": "의뢰 달성 보상",
        "en": "Commission rewards",
        "ja": "依頼達成報酬",
        "zh": "委托奖励"
      }
    ]
  },
  {
    "id": "gfl2-kr-20261008-parabellum",
    "gameId": "gfl2",
    "kind": "event",
    "title": {
      "ko": "사전 보급",
      "en": "Para Bellum",
      "ja": "戦前補給",
      "zh": "戰前補給"
    },
    "summary": {
      "ko": "누적 7일 로그인으로 붕괴결정 샤드·차세대 RAM·전사 컨덕터 등을 받습니다.",
      "en": "Log in on 7 days for Collapse Pieces, Next-Gen Memory and Transcription Conductors.",
      "ja": "累計7日ログインでコーラップスピース・次世代メモリ・接続媒体などを獲得。",
      "zh": "累计登录7天领取坍塌晶条、次世代记忆体与转录导体等。"
    },
    "region": "kr",
    "server": "Korea · HAOPLAY",
    "startAt": "2026-10-21T05:00:00+09:00",
    "endAt": "2026-11-04T04:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "[호박색 달빛] 버전 미리보기",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
        "title": "[호박색 달빛] 버전 미리보기",
        "publisher": "HAOPLAY · Steam"
      }
    ],
    "detailSections": [],
    "image": "/assets/gf2-kr-event.webp",
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "highlights": [
      {
        "ko": "누적 로그인 7일",
        "en": "7 cumulative login days",
        "ja": "累計7日ログイン",
        "zh": "累计登录7日"
      }
    ]
  },
  {
    "id": "gfl2-kr-20261008-voyage",
    "gameId": "gfl2",
    "kind": "package",
    "title": {
      "ko": "원정 일지 · 이번 시즌",
      "en": "Voyage Logs · current season",
      "ja": "走行計画 · 今期",
      "zh": "遠航巡錄 · 本期"
    },
    "summary": {
      "ko": "이번 버전 배틀패스. Normal 2-2 클리어 후 열리며, 가격·보상표는 구매 화면에서 확인합니다.",
      "en": "This version’s battle pass opens after Normal 2-2. Check its purchase screen for price and reward tiers.",
      "ja": "今期のパスはNormal 2-2クリアで開放。価格と報酬は購入画面で確認。",
      "zh": "本期通行证于普通2-2通关后开放，价格与奖励等级请查看购买页面。"
    },
    "region": "kr",
    "server": "Korea · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+09:00",
    "endAt": "2026-10-28T04:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "[호박색 달빛] 버전 미리보기",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
        "title": "[호박색 달빛] 버전 미리보기",
        "publisher": "HAOPLAY · Steam"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "highlights": [
      {
        "ko": "참여 조건: Normal 2-2",
        "en": "Requires Normal 2-2",
        "ja": "Normal 2-2クリア",
        "zh": "普通2-2通关"
      }
    ]
  },
  {
    "id": "gfl2-kr-20261008-cheyanne",
    "gameId": "gfl2",
    "kind": "pickup",
    "title": {
      "ko": "샤이엔",
      "en": "Cheyanne",
      "ja": "シャイアン",
      "zh": "夏安"
    },
    "summary": {
      "ko": "복각 정예 인형. 같은 기간 미틸·샤이엔·류시의 개별 모집을 선택할 수 있습니다.",
      "en": "Returning Elite Doll. Mityl, Cheyanne and Liushih have separate simultaneous pools.",
      "ja": "精鋭人形復刻。ミティール・シャイアン・劉蒔を同期間に個別募集。",
      "zh": "返场精英人形；米蒂爾、夏安、劉蒔同期分别开放卡池。"
    },
    "region": "kr",
    "server": "Korea · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+09:00",
    "endAt": "2026-10-28T18:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "10/8 Update Overview",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      },
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/697644549761138792?l=koreana",
        "title": "7/16 previous recruitment evidence",
        "publisher": "HAOPLAY · Steam",
        "publishedAt": "2026-07-15T10:00:29Z"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "rerun",
    "pickupGroup": "gfl2:kr:20261008:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "샤이엔",
          "en": "Cheyanne",
          "ja": "シャイアン",
          "zh": "夏安"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-cheyanne-promo2-full-c8b7a32f.webp",
        "imageSource": "https://iopwiki.com/images/8/84/GFL2_Cheyanne_Promo_2.jpg",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "39% 46%",
        "imageVerified": true,
        "role": "featured"
      },
      {
        "name": {
          "ko": "리타라",
          "en": "Littara",
          "ja": "リッタラ",
          "zh": "莉塔拉"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-littara-52e17d2f.webp",
        "imageSource": "https://res.17996cdn.net/gf2/kr/images/home/roles/ilus-LITTARA_d515cbf632.png",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      },
      {
        "name": {
          "ko": "크세니아",
          "en": "Ksenia",
          "ja": "クシーニヤ",
          "zh": "科謝尼婭"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-ksenia-full-5e3dc84a.webp",
        "imageSource": "https://res.17996cdn.net/gf2/tw/images/home/ilus-KSENIA_191e327e2d.webp",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      }
    ],
    "image": "/assets/entities/gf2-cheyanne-promo2-full-c8b7a32f.webp",
    "imageSource": "https://iopwiki.com/images/8/84/GFL2_Cheyanne_Promo_2.jpg",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "39% 46%",
    "imageVerified": true
  },
  {
    "id": "gfl2-kr-20261008-liushih",
    "gameId": "gfl2",
    "kind": "pickup",
    "title": {
      "ko": "류시",
      "en": "Liushih",
      "ja": "劉蒔",
      "zh": "劉蒔"
    },
    "summary": {
      "ko": "복각 정예 인형. 같은 기간 미틸·샤이엔·류시의 개별 모집을 선택할 수 있습니다.",
      "en": "Returning Elite Doll. Mityl, Cheyanne and Liushih have separate simultaneous pools.",
      "ja": "精鋭人形復刻。ミティール・シャイアン・劉蒔を同期間に個別募集。",
      "zh": "返场精英人形；米蒂爾、夏安、劉蒔同期分别开放卡池。"
    },
    "region": "kr",
    "server": "Korea · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+09:00",
    "endAt": "2026-10-28T18:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "10/8 Update Overview",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      },
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/697644549761138792?l=koreana",
        "title": "7/16 previous recruitment evidence",
        "publisher": "HAOPLAY · Steam",
        "publishedAt": "2026-07-15T10:00:29Z"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "rerun",
    "pickupGroup": "gfl2:kr:20261008:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "류시",
          "en": "Liushih",
          "ja": "劉蒔",
          "zh": "劉蒔"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-liushih-background-full-d27f66ae.webp",
        "imageSource": "https://iopwiki.com/images/f/f8/GFL2_Liushih_Background.png",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "featured"
      },
      {
        "name": {
          "ko": "리타라",
          "en": "Littara",
          "ja": "リッタラ",
          "zh": "莉塔拉"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-littara-52e17d2f.webp",
        "imageSource": "https://res.17996cdn.net/gf2/kr/images/home/roles/ilus-LITTARA_d515cbf632.png",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      },
      {
        "name": {
          "ko": "크세니아",
          "en": "Ksenia",
          "ja": "クシーニヤ",
          "zh": "科謝尼婭"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-ksenia-full-5e3dc84a.webp",
        "imageSource": "https://res.17996cdn.net/gf2/tw/images/home/ilus-KSENIA_191e327e2d.webp",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      }
    ],
    "image": "/assets/entities/gf2-liushih-background-full-d27f66ae.webp",
    "imageSource": "https://iopwiki.com/images/f/f8/GFL2_Liushih_Background.png",
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 45%",
    "imageVerified": true
  },
  {
    "id": "gfl2-kr-20261008-squirrel-nova",
    "gameId": "gfl2",
    "kind": "weapon",
    "title": {
      "ko": "스쿼럴 노바",
      "en": "Squirrel Nova",
      "ja": "ラットノヴァ",
      "zh": "絨鼠新星"
    },
    "summary": {
      "ko": "같은 기간에 열리는 정예 무기 군비 강화.",
      "en": "Elite weapon Military Upgrade during the same period.",
      "ja": "同期間の精鋭武器・軍備拡張。",
      "zh": "同期精英武器军备提升。"
    },
    "region": "kr",
    "server": "Korea · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+09:00",
    "endAt": "2026-10-28T18:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "10/8 Update Overview",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "new",
    "pickupGroup": "gfl2:kr:20261008:weapon",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "스쿼럴 노바",
          "en": "Squirrel Nova",
          "ja": "ラットノヴァ",
          "zh": "絨鼠新星"
        },
        "type": "new",
        "image": "/assets/entities/gf2-weapon-squirrel-9bdea67d.webp",
        "imageSource": "https://iopwiki.com/images/7/79/GFL2_Weapon_%28Mityl_Elite%29.png",
        "imageKind": "weapon",
        "imageFit": "contain",
        "imagePosition": "center center",
        "imageVerified": true
      }
    ],
    "image": "/assets/entities/gf2-weapon-squirrel-9bdea67d.webp",
    "imageSource": "https://iopwiki.com/images/7/79/GFL2_Weapon_%28Mityl_Elite%29.png",
    "imageKind": "weapon",
    "imageFit": "contain",
    "imagePosition": "center center",
    "imageVerified": true
  },
  {
    "id": "gfl2-kr-20261008-nightwalker-cardamom",
    "gameId": "gfl2",
    "kind": "weapon",
    "title": {
      "ko": "나이트 카다멈",
      "en": "Nightwalker Cardamom",
      "ja": "ナイトカルダモン",
      "zh": "夜行豆蔻"
    },
    "summary": {
      "ko": "같은 기간에 열리는 정예 무기 군비 강화.",
      "en": "Elite weapon Military Upgrade during the same period.",
      "ja": "同期間の精鋭武器・軍備拡張。",
      "zh": "同期精英武器军备提升。"
    },
    "region": "kr",
    "server": "Korea · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+09:00",
    "endAt": "2026-10-28T18:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "10/8 Update Overview",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      },
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/697644549761138792?l=koreana",
        "title": "7/16 previous weapon recruitment",
        "publisher": "HAOPLAY · Steam",
        "publishedAt": "2026-07-15T10:00:29Z"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "rerun",
    "pickupGroup": "gfl2:kr:20261008:weapon",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "나이트 카다멈",
          "en": "Nightwalker Cardamom",
          "ja": "ナイトカルダモン",
          "zh": "夜行豆蔻"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-weapon-nightwalker-8d6e3460.webp",
        "imageSource": "https://iopwiki.com/images/4/43/GFL2_Weapon_%28Cheyanne_Elite%29.png",
        "imageKind": "weapon",
        "imageFit": "contain",
        "imagePosition": "center center",
        "imageVerified": true
      }
    ],
    "image": "/assets/entities/gf2-weapon-nightwalker-8d6e3460.webp",
    "imageSource": "https://iopwiki.com/images/4/43/GFL2_Weapon_%28Cheyanne_Elite%29.png",
    "imageKind": "weapon",
    "imageFit": "contain",
    "imagePosition": "center center",
    "imageVerified": true
  },
  {
    "id": "gfl2-kr-20261008-transience",
    "gameId": "gfl2",
    "kind": "weapon",
    "title": {
      "ko": "절영",
      "en": "Transience",
      "ja": "絶影",
      "zh": "絕影"
    },
    "summary": {
      "ko": "같은 기간에 열리는 정예 무기 군비 강화.",
      "en": "Elite weapon Military Upgrade during the same period.",
      "ja": "同期間の精鋭武器・軍備拡張。",
      "zh": "同期精英武器军备提升。"
    },
    "region": "kr",
    "server": "Korea · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+09:00",
    "endAt": "2026-10-28T18:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "10/8 Update Overview",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ko",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      },
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/697644549761138792?l=koreana",
        "title": "7/16 previous weapon recruitment",
        "publisher": "HAOPLAY · Steam",
        "publishedAt": "2026-07-15T10:00:29Z"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "rerun",
    "pickupGroup": "gfl2:kr:20261008:weapon",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "절영",
          "en": "Transience",
          "ja": "絶影",
          "zh": "絕影"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-weapon-transience-d0a31c31.webp",
        "imageSource": "https://iopwiki.com/images/9/9c/GFL2_Weapon_%28Liushih_Elite%29.png",
        "imageKind": "weapon",
        "imageFit": "contain",
        "imagePosition": "center center",
        "imageVerified": true
      }
    ],
    "image": "/assets/entities/gf2-weapon-transience-d0a31c31.webp",
    "imageSource": "https://iopwiki.com/images/9/9c/GFL2_Weapon_%28Liushih_Elite%29.png",
    "imageKind": "weapon",
    "imageFit": "contain",
    "imagePosition": "center center",
    "imageVerified": true
  },
  {
    "id": "gfl2-jp-20261008-cheyanne",
    "gameId": "gfl2",
    "kind": "pickup",
    "title": {
      "ko": "샤이엔",
      "en": "Cheyanne",
      "ja": "シャイアン",
      "zh": "夏安"
    },
    "summary": {
      "ko": "복각 정예 인형. 같은 기간 미틸·샤이엔·류시의 개별 모집을 선택할 수 있습니다.",
      "en": "Returning Elite Doll. Mityl, Cheyanne and Liushih have separate simultaneous pools.",
      "ja": "精鋭人形復刻。ミティール・シャイアン・劉蒔を同期間に個別募集。",
      "zh": "返场精英人形；米蒂爾、夏安、劉蒔同期分别开放卡池。"
    },
    "region": "jp",
    "server": "Japan · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+09:00",
    "endAt": "2026-10-28T18:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "10/8 Update Overview",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ja",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      },
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/697644549761138792?l=japanese",
        "title": "7/16 previous recruitment evidence",
        "publisher": "HAOPLAY · Steam",
        "publishedAt": "2026-07-15T10:00:29Z"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "rerun",
    "pickupGroup": "gfl2:jp:20261008:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "샤이엔",
          "en": "Cheyanne",
          "ja": "シャイアン",
          "zh": "夏安"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-cheyanne-promo2-full-c8b7a32f.webp",
        "imageSource": "https://iopwiki.com/images/8/84/GFL2_Cheyanne_Promo_2.jpg",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "39% 46%",
        "imageVerified": true,
        "role": "featured"
      },
      {
        "name": {
          "ko": "리타라",
          "en": "Littara",
          "ja": "リッタラ",
          "zh": "莉塔拉"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-littara-52e17d2f.webp",
        "imageSource": "https://res.17996cdn.net/gf2/kr/images/home/roles/ilus-LITTARA_d515cbf632.png",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      },
      {
        "name": {
          "ko": "크세니아",
          "en": "Ksenia",
          "ja": "クシーニヤ",
          "zh": "科謝尼婭"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-ksenia-full-5e3dc84a.webp",
        "imageSource": "https://res.17996cdn.net/gf2/tw/images/home/ilus-KSENIA_191e327e2d.webp",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      }
    ],
    "image": "/assets/entities/gf2-cheyanne-promo2-full-c8b7a32f.webp",
    "imageSource": "https://iopwiki.com/images/8/84/GFL2_Cheyanne_Promo_2.jpg",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "39% 46%",
    "imageVerified": true
  },
  {
    "id": "gfl2-jp-20261008-liushih",
    "gameId": "gfl2",
    "kind": "pickup",
    "title": {
      "ko": "류시",
      "en": "Liushih",
      "ja": "劉蒔",
      "zh": "劉蒔"
    },
    "summary": {
      "ko": "복각 정예 인형. 같은 기간 미틸·샤이엔·류시의 개별 모집을 선택할 수 있습니다.",
      "en": "Returning Elite Doll. Mityl, Cheyanne and Liushih have separate simultaneous pools.",
      "ja": "精鋭人形復刻。ミティール・シャイアン・劉蒔を同期間に個別募集。",
      "zh": "返场精英人形；米蒂爾、夏安、劉蒔同期分别开放卡池。"
    },
    "region": "jp",
    "server": "Japan · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+09:00",
    "endAt": "2026-10-28T18:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "10/8 Update Overview",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ja",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      },
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/697644549761138792?l=japanese",
        "title": "7/16 previous recruitment evidence",
        "publisher": "HAOPLAY · Steam",
        "publishedAt": "2026-07-15T10:00:29Z"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "rerun",
    "pickupGroup": "gfl2:jp:20261008:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "류시",
          "en": "Liushih",
          "ja": "劉蒔",
          "zh": "劉蒔"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-liushih-background-full-d27f66ae.webp",
        "imageSource": "https://iopwiki.com/images/f/f8/GFL2_Liushih_Background.png",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "featured"
      },
      {
        "name": {
          "ko": "리타라",
          "en": "Littara",
          "ja": "リッタラ",
          "zh": "莉塔拉"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-littara-52e17d2f.webp",
        "imageSource": "https://res.17996cdn.net/gf2/kr/images/home/roles/ilus-LITTARA_d515cbf632.png",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      },
      {
        "name": {
          "ko": "크세니아",
          "en": "Ksenia",
          "ja": "クシーニヤ",
          "zh": "科謝尼婭"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-ksenia-full-5e3dc84a.webp",
        "imageSource": "https://res.17996cdn.net/gf2/tw/images/home/ilus-KSENIA_191e327e2d.webp",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      }
    ],
    "image": "/assets/entities/gf2-liushih-background-full-d27f66ae.webp",
    "imageSource": "https://iopwiki.com/images/f/f8/GFL2_Liushih_Background.png",
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 45%",
    "imageVerified": true
  },
  {
    "id": "gfl2-jp-20261008-squirrel-nova",
    "gameId": "gfl2",
    "kind": "weapon",
    "title": {
      "ko": "스쿼럴 노바",
      "en": "Squirrel Nova",
      "ja": "ラットノヴァ",
      "zh": "絨鼠新星"
    },
    "summary": {
      "ko": "같은 기간에 열리는 정예 무기 군비 강화.",
      "en": "Elite weapon Military Upgrade during the same period.",
      "ja": "同期間の精鋭武器・軍備拡張。",
      "zh": "同期精英武器军备提升。"
    },
    "region": "jp",
    "server": "Japan · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+09:00",
    "endAt": "2026-10-28T18:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
    "sourceTitle": "10/8 Update Overview",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ja",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "new",
    "pickupGroup": "gfl2:jp:20261008:weapon",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "스쿼럴 노바",
          "en": "Squirrel Nova",
          "ja": "ラットノヴァ",
          "zh": "絨鼠新星"
        },
        "type": "new",
        "image": "/assets/entities/gf2-weapon-squirrel-9bdea67d.webp",
        "imageSource": "https://iopwiki.com/images/7/79/GFL2_Weapon_%28Mityl_Elite%29.png",
        "imageKind": "weapon",
        "imageFit": "contain",
        "imagePosition": "center center",
        "imageVerified": true
      }
    ],
    "image": "/assets/entities/gf2-weapon-squirrel-9bdea67d.webp",
    "imageSource": "https://iopwiki.com/images/7/79/GFL2_Weapon_%28Mityl_Elite%29.png",
    "imageKind": "weapon",
    "imageFit": "contain",
    "imagePosition": "center center",
    "imageVerified": true
  },
  {
    "id": "gfl2-jp-20261008-nightwalker-cardamom",
    "gameId": "gfl2",
    "kind": "weapon",
    "title": {
      "ko": "나이트 카다멈",
      "en": "Nightwalker Cardamom",
      "ja": "ナイトカルダモン",
      "zh": "夜行豆蔻"
    },
    "summary": {
      "ko": "같은 기간에 열리는 정예 무기 군비 강화.",
      "en": "Elite weapon Military Upgrade during the same period.",
      "ja": "同期間の精鋭武器・軍備拡張。",
      "zh": "同期精英武器军备提升。"
    },
    "region": "jp",
    "server": "Japan · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+09:00",
    "endAt": "2026-10-28T18:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
    "sourceTitle": "10/8 Update Overview",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ja",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      },
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/697644549761138792?l=japanese",
        "title": "7/16 previous weapon recruitment",
        "publisher": "HAOPLAY · Steam",
        "publishedAt": "2026-07-15T10:00:29Z"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "rerun",
    "pickupGroup": "gfl2:jp:20261008:weapon",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "나이트 카다멈",
          "en": "Nightwalker Cardamom",
          "ja": "ナイトカルダモン",
          "zh": "夜行豆蔻"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-weapon-nightwalker-8d6e3460.webp",
        "imageSource": "https://iopwiki.com/images/4/43/GFL2_Weapon_%28Cheyanne_Elite%29.png",
        "imageKind": "weapon",
        "imageFit": "contain",
        "imagePosition": "center center",
        "imageVerified": true
      }
    ],
    "image": "/assets/entities/gf2-weapon-nightwalker-8d6e3460.webp",
    "imageSource": "https://iopwiki.com/images/4/43/GFL2_Weapon_%28Cheyanne_Elite%29.png",
    "imageKind": "weapon",
    "imageFit": "contain",
    "imagePosition": "center center",
    "imageVerified": true
  },
  {
    "id": "gfl2-jp-20261008-transience",
    "gameId": "gfl2",
    "kind": "weapon",
    "title": {
      "ko": "절영",
      "en": "Transience",
      "ja": "絶影",
      "zh": "絕影"
    },
    "summary": {
      "ko": "같은 기간에 열리는 정예 무기 군비 강화.",
      "en": "Elite weapon Military Upgrade during the same period.",
      "ja": "同期間の精鋭武器・軍備拡張。",
      "zh": "同期精英武器军备提升。"
    },
    "region": "jp",
    "server": "Japan · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+09:00",
    "endAt": "2026-10-28T18:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
    "sourceTitle": "10/8 Update Overview",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "ja",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      },
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/697644549761138792?l=japanese",
        "title": "7/16 previous weapon recruitment",
        "publisher": "HAOPLAY · Steam",
        "publishedAt": "2026-07-15T10:00:29Z"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "rerun",
    "pickupGroup": "gfl2:jp:20261008:weapon",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "절영",
          "en": "Transience",
          "ja": "絶影",
          "zh": "絕影"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-weapon-transience-d0a31c31.webp",
        "imageSource": "https://iopwiki.com/images/9/9c/GFL2_Weapon_%28Liushih_Elite%29.png",
        "imageKind": "weapon",
        "imageFit": "contain",
        "imagePosition": "center center",
        "imageVerified": true
      }
    ],
    "image": "/assets/entities/gf2-weapon-transience-d0a31c31.webp",
    "imageSource": "https://iopwiki.com/images/9/9c/GFL2_Weapon_%28Liushih_Elite%29.png",
    "imageKind": "weapon",
    "imageFit": "contain",
    "imagePosition": "center center",
    "imageVerified": true
  },
  {
    "id": "gfl2-global-20261008-cheyanne",
    "gameId": "gfl2",
    "kind": "pickup",
    "title": {
      "ko": "샤이엔",
      "en": "Cheyanne",
      "ja": "シャイアン",
      "zh": "夏安"
    },
    "summary": {
      "ko": "복각 정예 인형. 같은 기간 미틸·샤이엔·류시의 개별 모집을 선택할 수 있습니다.",
      "en": "Returning Elite Doll. Mityl, Cheyanne and Liushih have separate simultaneous pools.",
      "ja": "精鋭人形復刻。ミティール・シャイアン・劉蒔を同期間に個別募集。",
      "zh": "返场精英人形；米蒂爾、夏安、劉蒔同期分别开放卡池。"
    },
    "region": "global",
    "server": "Global · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+00:00",
    "endAt": "2026-10-28T18:59:00+00:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "10/8 Update Overview",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "en",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      },
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/697644549761138792?l=english",
        "title": "7/16 previous recruitment evidence",
        "publisher": "HAOPLAY · Steam",
        "publishedAt": "2026-07-15T10:00:29Z"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "rerun",
    "pickupGroup": "gfl2:global:20261008:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "샤이엔",
          "en": "Cheyanne",
          "ja": "シャイアン",
          "zh": "夏安"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-cheyanne-promo2-full-c8b7a32f.webp",
        "imageSource": "https://iopwiki.com/images/8/84/GFL2_Cheyanne_Promo_2.jpg",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "39% 46%",
        "imageVerified": true,
        "role": "featured"
      },
      {
        "name": {
          "ko": "리타라",
          "en": "Littara",
          "ja": "リッタラ",
          "zh": "莉塔拉"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-littara-52e17d2f.webp",
        "imageSource": "https://res.17996cdn.net/gf2/kr/images/home/roles/ilus-LITTARA_d515cbf632.png",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      },
      {
        "name": {
          "ko": "크세니아",
          "en": "Ksenia",
          "ja": "クシーニヤ",
          "zh": "科謝尼婭"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-ksenia-full-5e3dc84a.webp",
        "imageSource": "https://res.17996cdn.net/gf2/tw/images/home/ilus-KSENIA_191e327e2d.webp",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      }
    ],
    "image": "/assets/entities/gf2-cheyanne-promo2-full-c8b7a32f.webp",
    "imageSource": "https://iopwiki.com/images/8/84/GFL2_Cheyanne_Promo_2.jpg",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "39% 46%",
    "imageVerified": true
  },
  {
    "id": "gfl2-global-20261008-liushih",
    "gameId": "gfl2",
    "kind": "pickup",
    "title": {
      "ko": "류시",
      "en": "Liushih",
      "ja": "劉蒔",
      "zh": "劉蒔"
    },
    "summary": {
      "ko": "복각 정예 인형. 같은 기간 미틸·샤이엔·류시의 개별 모집을 선택할 수 있습니다.",
      "en": "Returning Elite Doll. Mityl, Cheyanne and Liushih have separate simultaneous pools.",
      "ja": "精鋭人形復刻。ミティール・シャイアン・劉蒔を同期間に個別募集。",
      "zh": "返场精英人形；米蒂爾、夏安、劉蒔同期分别开放卡池。"
    },
    "region": "global",
    "server": "Global · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+00:00",
    "endAt": "2026-10-28T18:59:00+00:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T12:01:13.769641Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
    "sourceTitle": "10/8 Update Overview",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "en",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      },
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/697644549761138792?l=english",
        "title": "7/16 previous recruitment evidence",
        "publisher": "HAOPLAY · Steam",
        "publishedAt": "2026-07-15T10:00:29Z"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "rerun",
    "pickupGroup": "gfl2:global:20261008:character",
    "poolType": "character",
    "pickupMembers": [
      {
        "name": {
          "ko": "류시",
          "en": "Liushih",
          "ja": "劉蒔",
          "zh": "劉蒔"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-liushih-background-full-d27f66ae.webp",
        "imageSource": "https://iopwiki.com/images/f/f8/GFL2_Liushih_Background.png",
        "imageKind": "banner",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "featured"
      },
      {
        "name": {
          "ko": "리타라",
          "en": "Littara",
          "ja": "リッタラ",
          "zh": "莉塔拉"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-littara-52e17d2f.webp",
        "imageSource": "https://res.17996cdn.net/gf2/kr/images/home/roles/ilus-LITTARA_d515cbf632.png",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      },
      {
        "name": {
          "ko": "크세니아",
          "en": "Ksenia",
          "ja": "クシーニヤ",
          "zh": "科謝尼婭"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-ksenia-full-5e3dc84a.webp",
        "imageSource": "https://res.17996cdn.net/gf2/tw/images/home/ilus-KSENIA_191e327e2d.webp",
        "imageKind": "character",
        "imageFit": "contain",
        "imagePosition": "50% 45%",
        "imageVerified": true,
        "role": "rate-up"
      }
    ],
    "image": "/assets/entities/gf2-liushih-background-full-d27f66ae.webp",
    "imageSource": "https://iopwiki.com/images/f/f8/GFL2_Liushih_Background.png",
    "imageKind": "banner",
    "imageFit": "contain",
    "imagePosition": "50% 45%",
    "imageVerified": true
  },
  {
    "id": "gfl2-global-20261008-squirrel-nova",
    "gameId": "gfl2",
    "kind": "weapon",
    "title": {
      "ko": "스쿼럴 노바",
      "en": "Squirrel Nova",
      "ja": "ラットノヴァ",
      "zh": "絨鼠新星"
    },
    "summary": {
      "ko": "같은 기간에 열리는 정예 무기 군비 강화.",
      "en": "Elite weapon Military Upgrade during the same period.",
      "ja": "同期間の精鋭武器・軍備拡張。",
      "zh": "同期精英武器军备提升。"
    },
    "region": "global",
    "server": "Global · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+00:00",
    "endAt": "2026-10-28T18:59:00+00:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
    "sourceTitle": "10/8 Update Overview",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "en",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "new",
    "pickupGroup": "gfl2:global:20261008:weapon",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "스쿼럴 노바",
          "en": "Squirrel Nova",
          "ja": "ラットノヴァ",
          "zh": "絨鼠新星"
        },
        "type": "new",
        "image": "/assets/entities/gf2-weapon-squirrel-9bdea67d.webp",
        "imageSource": "https://iopwiki.com/images/7/79/GFL2_Weapon_%28Mityl_Elite%29.png",
        "imageKind": "weapon",
        "imageFit": "contain",
        "imagePosition": "center center",
        "imageVerified": true
      }
    ],
    "image": "/assets/entities/gf2-weapon-squirrel-9bdea67d.webp",
    "imageSource": "https://iopwiki.com/images/7/79/GFL2_Weapon_%28Mityl_Elite%29.png",
    "imageKind": "weapon",
    "imageFit": "contain",
    "imagePosition": "center center",
    "imageVerified": true
  },
  {
    "id": "gfl2-global-20261008-nightwalker-cardamom",
    "gameId": "gfl2",
    "kind": "weapon",
    "title": {
      "ko": "나이트 카다멈",
      "en": "Nightwalker Cardamom",
      "ja": "ナイトカルダモン",
      "zh": "夜行豆蔻"
    },
    "summary": {
      "ko": "같은 기간에 열리는 정예 무기 군비 강화.",
      "en": "Elite weapon Military Upgrade during the same period.",
      "ja": "同期間の精鋭武器・軍備拡張。",
      "zh": "同期精英武器军备提升。"
    },
    "region": "global",
    "server": "Global · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+00:00",
    "endAt": "2026-10-28T18:59:00+00:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
    "sourceTitle": "10/8 Update Overview",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "en",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      },
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/697644549761138792?l=english",
        "title": "7/16 previous weapon recruitment",
        "publisher": "HAOPLAY · Steam",
        "publishedAt": "2026-07-15T10:00:29Z"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "rerun",
    "pickupGroup": "gfl2:global:20261008:weapon",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "나이트 카다멈",
          "en": "Nightwalker Cardamom",
          "ja": "ナイトカルダモン",
          "zh": "夜行豆蔻"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-weapon-nightwalker-8d6e3460.webp",
        "imageSource": "https://iopwiki.com/images/4/43/GFL2_Weapon_%28Cheyanne_Elite%29.png",
        "imageKind": "weapon",
        "imageFit": "contain",
        "imagePosition": "center center",
        "imageVerified": true
      }
    ],
    "image": "/assets/entities/gf2-weapon-nightwalker-8d6e3460.webp",
    "imageSource": "https://iopwiki.com/images/4/43/GFL2_Weapon_%28Cheyanne_Elite%29.png",
    "imageKind": "weapon",
    "imageFit": "contain",
    "imagePosition": "center center",
    "imageVerified": true
  },
  {
    "id": "gfl2-global-20261008-transience",
    "gameId": "gfl2",
    "kind": "weapon",
    "title": {
      "ko": "절영",
      "en": "Transience",
      "ja": "絶影",
      "zh": "絕影"
    },
    "summary": {
      "ko": "같은 기간에 열리는 정예 무기 군비 강화.",
      "en": "Elite weapon Military Upgrade during the same period.",
      "ja": "同期間の精鋭武器・軍備拡張。",
      "zh": "同期精英武器军备提升。"
    },
    "region": "global",
    "server": "Global · HAOPLAY",
    "startAt": "2026-10-08T09:00:00+00:00",
    "endAt": "2026-10-28T18:59:00+00:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T11:23:31.809501Z",
    "sourceUrl": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
    "sourceTitle": "10/8 Update Overview",
    "sourceKind": "official",
    "officialLocales": [
      "ko",
      "en",
      "ja",
      "zh"
    ],
    "translatedLocales": [],
    "sourceLocale": "en",
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
        "title": "10/8 Update Overview",
        "publisher": "HAOPLAY · Steam"
      },
      {
        "kind": "official",
        "url": "https://steamcommunity.com/games/3308670/announcements/detail/697644549761138792?l=english",
        "title": "7/16 previous weapon recruitment",
        "publisher": "HAOPLAY · Steam",
        "publishedAt": "2026-07-15T10:00:29Z"
      }
    ],
    "detailSections": [],
    "localizationSources": {
      "ko": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=koreana",
      "en": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=english",
      "ja": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=japanese",
      "zh": "https://steamcommunity.com/games/3308670/announcements/detail/702155125711437877?l=tchinese"
    },
    "pickupType": "rerun",
    "pickupGroup": "gfl2:global:20261008:weapon",
    "poolType": "weapon",
    "pickupMembers": [
      {
        "name": {
          "ko": "절영",
          "en": "Transience",
          "ja": "絶影",
          "zh": "絕影"
        },
        "type": "rerun",
        "image": "/assets/entities/gf2-weapon-transience-d0a31c31.webp",
        "imageSource": "https://iopwiki.com/images/9/9c/GFL2_Weapon_%28Liushih_Elite%29.png",
        "imageKind": "weapon",
        "imageFit": "contain",
        "imagePosition": "center center",
        "imageVerified": true
      }
    ],
    "image": "/assets/entities/gf2-weapon-transience-d0a31c31.webp",
    "imageSource": "https://iopwiki.com/images/9/9c/GFL2_Weapon_%28Liushih_Elite%29.png",
    "imageKind": "weapon",
    "imageFit": "contain",
    "imagePosition": "center center",
    "imageVerified": true
  },
  {
    "id": "arknights-jp-standard-20261009",
    "gameId": "arknights",
    "kind": "pickup",
    "region": "jp",
    "server": "Japan · UTC+9",
    "title": {
      "ko": "외드레르 / 오올헤약",
      "en": "Hoederer / Ho’olheyak",
      "ja": "ヘドリー / ホルハイヤ",
      "zh": "赫德雷 / 霍尔海雅"
    },
    "summary": {
      "ko": "일반 헤드헌팅의 6★ 복각 확률 상승 2명. 5★ 아몬드, 루실라, 테크노는 추가 확률 상승 대상입니다.",
      "en": "Standard Headhunting: two returning 6★ rate-ups. The three additional 5★ rate-ups are Almond, Lucilla, Tecno.",
      "ja": "常設スカウト：既存★6オペレーター2名が主対象。★5のアーモンド・ルシーラ・テクノは追加確率UP対象です。",
      "zh": "标准寻访：两位既有6★干员概率提升，另有杏仁、海霓、特克诺三位5★干员概率提升。"
    },
    "startAt": "2026-10-09T04:00:00+09:00",
    "endAt": "2026-10-23T03:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:13:11.635381+00:00",
    "sourceUrl": "https://x.com/ArknightsStaff/status/2108105299618091467",
    "sourceTitle": "常設スカウト · 2026-10-09",
    "sourceKind": "official",
    "sourceLocale": "ja",
    "officialLocales": [
      "ko",
      "en",
      "ja"
    ],
    "translatedLocales": [
      "zh"
    ],
    "localizationSources": {
      "ko": "https://x.com/ArknightsKorea/status/1778997254336245927",
      "en": "https://www.facebook.com/ArknightsGlobal/posts/dear-doctor-the-following-operators-will-appear-at-a-higher-rate-between-october/1550842270412140/",
      "ja": "https://x.com/ArknightsStaff/status/2108105299618091467"
    },
    "rarity": 6,
    "featured": false,
    "pickupType": "rerun",
    "pickupGroup": "arknights-jp-standard-20261009",
    "poolType": "standard",
    "pickupMembers": [
      {
        "name": {
          "ko": "외드레르",
          "en": "Hoederer",
          "ja": "ヘドリー",
          "zh": "赫德雷"
        },
        "type": "rerun",
        "rarity": 6,
        "role": "featured",
        "image": "/assets/entities/ark-hoederer-e2-full-501cb999.png",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/2/29/mvpq4dyvj5ujxv7a3nxqbi14bj3y7gk.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "오올헤약",
          "en": "Ho’olheyak",
          "ja": "ホルハイヤ",
          "zh": "霍尔海雅"
        },
        "type": "rerun",
        "rarity": 6,
        "role": "featured",
        "image": "/assets/entities/ark-hoolheyak-e2-full-7886484b.png",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/c/c7/5buerojog7a5ttownrqpx6d6slyox9y.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "아몬드",
          "en": "Almond",
          "ja": "アーモンド",
          "zh": "杏仁"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      },
      {
        "name": {
          "ko": "루실라",
          "en": "Lucilla",
          "ja": "ルシーラ",
          "zh": "海霓"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      },
      {
        "name": {
          "ko": "테크노",
          "en": "Tecno",
          "ja": "テクノ",
          "zh": "特克诺"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      }
    ],
    "highlights": [
      {
        "ko": "주 픽업 6★ 2명 · 추가 확률 상승 5★ 3명",
        "en": "2 featured 6★ · 3 additional 5★ rate-ups",
        "ja": "主対象★6・2名／追加確率UP★5・3名",
        "zh": "主推6★两名，另有5★三名概率提升"
      },
      {
        "ko": "일반 헤드헌팅",
        "en": "Standard Headhunting",
        "ja": "常設スカウト",
        "zh": "标准寻访"
      }
    ],
    "image": "/assets/entities/ark-hoederer-e2-full-501cb999.png",
    "imageSource": "https://patchwiki.biligame.com/images/arknights/2/29/mvpq4dyvj5ujxv7a3nxqbi14bj3y7gk.png",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true,
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://www.facebook.com/ArknightsGlobal/posts/dear-doctor-the-following-operators-will-appear-at-a-higher-rate-between-october/1550842270412140/",
        "title": "Global official rotation notice",
        "publisher": "Arknights EN / Yostar"
      },
      {
        "kind": "community",
        "url": "https://gameludens.com/arknights/259/",
        "title": "開催中ガチャ：2026年10月9日・10月6日更新",
        "publisher": "GameLudens"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1778997254336245927",
        "title": "외드레르 한국 공식 이름",
        "publisher": "Yostar Korea"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1721025064114831665",
        "title": "오올헤약 한국 공식 이름",
        "publisher": "Yostar Korea"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1862710258260746498",
        "title": "루실라 한국 공식 이름",
        "publisher": "Yostar Korea"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1928663388009410942",
        "title": "테크노 한국 공식 이름",
        "publisher": "Yostar Korea"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1768851576419168449",
        "title": "아몬드 한국 공식 이름",
        "publisher": "Yostar Korea"
      }
    ],
    "timingNote": {
      "ko": "표시 일정은 선택한 서버 공지 기준입니다. 글로벌 서버는 UTC−7, 한국·일본 서버는 UTC+9입니다.",
      "en": "The schedule follows the selected regional notice. Global uses UTC−7; Korea and Japan use UTC+9.",
      "ja": "選択したサーバーの告知日時です。グローバルはUTC−7、日本・韓国はUTC+9です。",
      "zh": "时间以所选服务器公告为准。全球服为UTC−7，韩服与日服为UTC+9。"
    },
    "detailSections": [
      {
        "title": {
          "ko": "검수 범위",
          "en": "Verification scope",
          "ja": "確認範囲",
          "zh": "核实范围"
        },
        "body": {
          "ko": "일본 공식 게시물의 검색 색인에서 기간과 6★ 주 픽업 2명을 확인했습니다. 5★ 구성은 일본 서버 기록과 글로벌 공식 안내를 교차 확인했습니다. 공식 게시물 본문을 열람했다고 표시하지 않습니다.",
          "en": "The period and two featured 6★ operators were checked in the indexed Japanese official notice. The 5★ roster was cross-checked against a Japanese-server record and the Global official notice. This is not a claim that the original post body was viewed.",
          "ja": "期間と主対象★6の2名は日本公式告知の検索結果で確認。★5の構成は日本サーバー記録とグローバル公式告知を照合。元投稿本文を閲覧済みとは扱っていません。",
          "zh": "期间与两位6★主推干员通过日本官方公告搜索索引确认；5★阵容与日服记录及全球服官方公告交叉核对。不声称已阅览原帖正文。"
        },
        "sourceKind": "community",
        "sourceUrls": [
          "https://gameludens.com/arknights/259/"
        ]
      }
    ],
    "bannerName": {
      "ko": "일반 헤드헌팅",
      "en": "Standard Headhunting",
      "ja": "常設スカウト",
      "zh": "标准寻访"
    }
  },
  {
    "id": "arknights-jp-kernel-20261006",
    "gameId": "arknights",
    "kind": "pickup",
    "region": "jp",
    "server": "Japan · UTC+9",
    "title": {
      "ko": "호시구마 / 플레임테일",
      "en": "Hoshiguma / Flametail",
      "ja": "ホシグマ / フレイムテイル",
      "zh": "星熊 / 焰尾"
    },
    "summary": {
      "ko": "커널 헤드헌팅의 6★ 복각 확률 상승 2명. 5★ 토디폰스, 메이어, 에프이터는 추가 확률 상승 대상입니다.",
      "en": "Kernel Headhunting: two returning 6★ rate-ups. The three additional 5★ rate-ups are Toddifons, Mayer, FEater.",
      "ja": "中堅スカウト：既存★6オペレーター2名が主対象。★5のトギフォンス・メイヤー・エフイーターは追加確率UP対象です。",
      "zh": "中坚寻访：两位既有6★干员概率提升，另有熔泉、梅尔、食铁兽三位5★干员概率提升。"
    },
    "startAt": "2026-10-06T04:00:00+09:00",
    "endAt": "2026-10-20T03:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:13:11.635381+00:00",
    "sourceUrl": "https://x.com/ArknightsStaff/status/2106987893743091911",
    "sourceTitle": "中堅スカウト · 2026-10-06",
    "sourceKind": "official",
    "sourceLocale": "ja",
    "officialLocales": [
      "ko",
      "en",
      "ja"
    ],
    "translatedLocales": [
      "zh"
    ],
    "localizationSources": {
      "ko": "https://x.com/ArknightsKorea/status/1518109623676727296",
      "en": "https://x.com/ArknightsEN/status/2106987750037569624",
      "ja": "https://x.com/ArknightsStaff/status/2106987893743091911"
    },
    "rarity": 6,
    "featured": false,
    "pickupType": "rerun",
    "pickupGroup": "arknights-jp-kernel-20261006",
    "poolType": "standard",
    "pickupMembers": [
      {
        "name": {
          "ko": "호시구마",
          "en": "Hoshiguma",
          "ja": "ホシグマ",
          "zh": "星熊"
        },
        "type": "rerun",
        "rarity": 6,
        "role": "featured",
        "image": "/assets/entities/ark-hoshiguma-e2-full-535ae294.png",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/0/02/qm0ltsvcxrxgffdvqoizspb5iljw5st.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "플레임테일",
          "en": "Flametail",
          "ja": "フレイムテイル",
          "zh": "焰尾"
        },
        "type": "rerun",
        "rarity": 6,
        "role": "featured",
        "image": "/assets/entities/ark-flametail-e2-full-4600b917.png",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/e/e3/4hdifjnxqcjuybd2lma5mqque0b6k3i.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "토디폰스",
          "en": "Toddifons",
          "ja": "トギフォンス",
          "zh": "熔泉"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      },
      {
        "name": {
          "ko": "메이어",
          "en": "Mayer",
          "ja": "メイヤー",
          "zh": "梅尔"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      },
      {
        "name": {
          "ko": "에프이터",
          "en": "FEater",
          "ja": "エフイーター",
          "zh": "食铁兽"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      }
    ],
    "highlights": [
      {
        "ko": "주 픽업 6★ 2명 · 추가 확률 상승 5★ 3명",
        "en": "2 featured 6★ · 3 additional 5★ rate-ups",
        "ja": "主対象★6・2名／追加確率UP★5・3名",
        "zh": "主推6★两名，另有5★三名概率提升"
      },
      {
        "ko": "커널 헤드헌팅",
        "en": "Kernel Headhunting",
        "ja": "中堅スカウト",
        "zh": "中坚寻访"
      }
    ],
    "image": "/assets/entities/ark-hoshiguma-e2-full-535ae294.png",
    "imageSource": "https://patchwiki.biligame.com/images/arknights/0/02/qm0ltsvcxrxgffdvqoizspb5iljw5st.png",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true,
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://x.com/ArknightsEN/status/2106987750037569624",
        "title": "Global official rotation notice",
        "publisher": "Arknights EN / Yostar"
      },
      {
        "kind": "community",
        "url": "https://gameludens.com/arknights/259/",
        "title": "開催中ガチャ：2026年10月9日・10月6日更新",
        "publisher": "GameLudens"
      },
      {
        "kind": "official",
        "url": "https://x.com/arknightskorea/status/1238051588947603458",
        "title": "호시구마 한국 공식 이름",
        "publisher": "Yostar Korea"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1518109623676727296",
        "title": "플레임테일 한국 공식 이름",
        "publisher": "Yostar Korea"
      }
    ],
    "timingNote": {
      "ko": "표시 일정은 선택한 서버 공지 기준입니다. 글로벌 서버는 UTC−7, 한국·일본 서버는 UTC+9입니다.",
      "en": "The schedule follows the selected regional notice. Global uses UTC−7; Korea and Japan use UTC+9.",
      "ja": "選択したサーバーの告知日時です。グローバルはUTC−7、日本・韓国はUTC+9です。",
      "zh": "时间以所选服务器公告为准。全球服为UTC−7，韩服与日服为UTC+9。"
    },
    "detailSections": [
      {
        "title": {
          "ko": "검수 범위",
          "en": "Verification scope",
          "ja": "確認範囲",
          "zh": "核实范围"
        },
        "body": {
          "ko": "일본 공식 게시물의 검색 색인에서 기간과 6★ 주 픽업 2명을 확인했습니다. 5★ 구성은 일본 서버 기록과 글로벌 공식 안내를 교차 확인했습니다. 공식 게시물 본문을 열람했다고 표시하지 않습니다.",
          "en": "The period and two featured 6★ operators were checked in the indexed Japanese official notice. The 5★ roster was cross-checked against a Japanese-server record and the Global official notice. This is not a claim that the original post body was viewed.",
          "ja": "期間と主対象★6の2名は日本公式告知の検索結果で確認。★5の構成は日本サーバー記録とグローバル公式告知を照合。元投稿本文を閲覧済みとは扱っていません。",
          "zh": "期间与两位6★主推干员通过日本官方公告搜索索引确认；5★阵容与日服记录及全球服官方公告交叉核对。不声称已阅览原帖正文。"
        },
        "sourceKind": "community",
        "sourceUrls": [
          "https://gameludens.com/arknights/259/"
        ]
      }
    ],
    "bannerName": {
      "ko": "커널 헤드헌팅",
      "en": "Kernel Headhunting",
      "ja": "中堅スカウト",
      "zh": "中坚寻访"
    }
  },
  {
    "id": "arknights-global-standard-20261009",
    "gameId": "arknights",
    "kind": "pickup",
    "region": "global",
    "server": "Global · UTC−7",
    "title": {
      "ko": "외드레르 / 오올헤약",
      "en": "Hoederer / Ho’olheyak",
      "ja": "ヘドリー / ホルハイヤ",
      "zh": "赫德雷 / 霍尔海雅"
    },
    "summary": {
      "ko": "일반 헤드헌팅의 6★ 복각 확률 상승 2명. 5★ 아몬드, 루실라, 테크노는 추가 확률 상승 대상입니다.",
      "en": "Standard Headhunting: two returning 6★ rate-ups. The three additional 5★ rate-ups are Almond, Lucilla, Tecno.",
      "ja": "常設スカウト：既存★6オペレーター2名が主対象。★5のアーモンド・ルシーラ・テクノは追加確率UP対象です。",
      "zh": "标准寻访：两位既有6★干员概率提升，另有杏仁、海霓、特克诺三位5★干员概率提升。"
    },
    "startAt": "2026-10-09T04:00:00-07:00",
    "endAt": "2026-10-23T03:59:00-07:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:13:11.635381+00:00",
    "sourceUrl": "https://www.facebook.com/ArknightsGlobal/posts/dear-doctor-the-following-operators-will-appear-at-a-higher-rate-between-october/1550842270412140/",
    "sourceTitle": "Standard Headhunting · 2026-10-09",
    "sourceKind": "official",
    "sourceLocale": "en",
    "officialLocales": [
      "ko",
      "en",
      "ja"
    ],
    "translatedLocales": [
      "zh"
    ],
    "localizationSources": {
      "ko": "https://x.com/ArknightsKorea/status/1778997254336245927",
      "en": "https://www.facebook.com/ArknightsGlobal/posts/dear-doctor-the-following-operators-will-appear-at-a-higher-rate-between-october/1550842270412140/",
      "ja": "https://x.com/ArknightsStaff/status/2108105299618091467"
    },
    "rarity": 6,
    "featured": false,
    "pickupType": "rerun",
    "pickupGroup": "arknights-global-standard-20261009",
    "poolType": "standard",
    "pickupMembers": [
      {
        "name": {
          "ko": "외드레르",
          "en": "Hoederer",
          "ja": "ヘドリー",
          "zh": "赫德雷"
        },
        "type": "rerun",
        "rarity": 6,
        "role": "featured",
        "image": "/assets/entities/ark-hoederer-e2-full-501cb999.png",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/2/29/mvpq4dyvj5ujxv7a3nxqbi14bj3y7gk.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "오올헤약",
          "en": "Ho’olheyak",
          "ja": "ホルハイヤ",
          "zh": "霍尔海雅"
        },
        "type": "rerun",
        "rarity": 6,
        "role": "featured",
        "image": "/assets/entities/ark-hoolheyak-e2-full-7886484b.png",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/c/c7/5buerojog7a5ttownrqpx6d6slyox9y.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "아몬드",
          "en": "Almond",
          "ja": "アーモンド",
          "zh": "杏仁"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      },
      {
        "name": {
          "ko": "루실라",
          "en": "Lucilla",
          "ja": "ルシーラ",
          "zh": "海霓"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      },
      {
        "name": {
          "ko": "테크노",
          "en": "Tecno",
          "ja": "テクノ",
          "zh": "特克诺"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      }
    ],
    "highlights": [
      {
        "ko": "주 픽업 6★ 2명 · 추가 확률 상승 5★ 3명",
        "en": "2 featured 6★ · 3 additional 5★ rate-ups",
        "ja": "主対象★6・2名／追加確率UP★5・3名",
        "zh": "主推6★两名，另有5★三名概率提升"
      },
      {
        "ko": "일반 헤드헌팅",
        "en": "Standard Headhunting",
        "ja": "常設スカウト",
        "zh": "标准寻访"
      }
    ],
    "image": "/assets/entities/ark-hoederer-e2-full-501cb999.png",
    "imageSource": "https://patchwiki.biligame.com/images/arknights/2/29/mvpq4dyvj5ujxv7a3nxqbi14bj3y7gk.png",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true,
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1778997254336245927",
        "title": "외드레르 한국 공식 이름",
        "publisher": "Yostar Korea"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1721025064114831665",
        "title": "오올헤약 한국 공식 이름",
        "publisher": "Yostar Korea"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1862710258260746498",
        "title": "루실라 한국 공식 이름",
        "publisher": "Yostar Korea"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1928663388009410942",
        "title": "테크노 한국 공식 이름",
        "publisher": "Yostar Korea"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1768851576419168449",
        "title": "아몬드 한국 공식 이름",
        "publisher": "Yostar Korea"
      }
    ],
    "timingNote": {
      "ko": "표시 일정은 선택한 서버 공지 기준입니다. 글로벌 서버는 UTC−7, 한국·일본 서버는 UTC+9입니다.",
      "en": "The schedule follows the selected regional notice. Global uses UTC−7; Korea and Japan use UTC+9.",
      "ja": "選択したサーバーの告知日時です。グローバルはUTC−7、日本・韓国はUTC+9です。",
      "zh": "时间以所选服务器公告为准。全球服为UTC−7，韩服与日服为UTC+9。"
    },
    "bannerName": {
      "ko": "일반 헤드헌팅",
      "en": "Standard Headhunting",
      "ja": "常設スカウト",
      "zh": "标准寻访"
    }
  },
  {
    "id": "arknights-global-kernel-20261006",
    "gameId": "arknights",
    "kind": "pickup",
    "region": "global",
    "server": "Global · UTC−7",
    "title": {
      "ko": "호시구마 / 플레임테일",
      "en": "Hoshiguma / Flametail",
      "ja": "ホシグマ / フレイムテイル",
      "zh": "星熊 / 焰尾"
    },
    "summary": {
      "ko": "커널 헤드헌팅의 6★ 복각 확률 상승 2명. 5★ 토디폰스, 메이어, 에프이터는 추가 확률 상승 대상입니다.",
      "en": "Kernel Headhunting: two returning 6★ rate-ups. The three additional 5★ rate-ups are Toddifons, Mayer, FEater.",
      "ja": "中堅スカウト：既存★6オペレーター2名が主対象。★5のトギフォンス・メイヤー・エフイーターは追加確率UP対象です。",
      "zh": "中坚寻访：两位既有6★干员概率提升，另有熔泉、梅尔、食铁兽三位5★干员概率提升。"
    },
    "startAt": "2026-10-06T04:00:00-07:00",
    "endAt": "2026-10-20T03:59:00-07:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:13:11.635381+00:00",
    "sourceUrl": "https://x.com/ArknightsEN/status/2106987750037569624",
    "sourceTitle": "Kernel Headhunting · 2026-10-06",
    "sourceKind": "official",
    "sourceLocale": "en",
    "officialLocales": [
      "ko",
      "en",
      "ja"
    ],
    "translatedLocales": [
      "zh"
    ],
    "localizationSources": {
      "ko": "https://x.com/ArknightsKorea/status/1518109623676727296",
      "en": "https://x.com/ArknightsEN/status/2106987750037569624",
      "ja": "https://x.com/ArknightsStaff/status/2106987893743091911"
    },
    "rarity": 6,
    "featured": false,
    "pickupType": "rerun",
    "pickupGroup": "arknights-global-kernel-20261006",
    "poolType": "standard",
    "pickupMembers": [
      {
        "name": {
          "ko": "호시구마",
          "en": "Hoshiguma",
          "ja": "ホシグマ",
          "zh": "星熊"
        },
        "type": "rerun",
        "rarity": 6,
        "role": "featured",
        "image": "/assets/entities/ark-hoshiguma-e2-full-535ae294.png",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/0/02/qm0ltsvcxrxgffdvqoizspb5iljw5st.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "플레임테일",
          "en": "Flametail",
          "ja": "フレイムテイル",
          "zh": "焰尾"
        },
        "type": "rerun",
        "rarity": 6,
        "role": "featured",
        "image": "/assets/entities/ark-flametail-e2-full-4600b917.png",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/e/e3/4hdifjnxqcjuybd2lma5mqque0b6k3i.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "토디폰스",
          "en": "Toddifons",
          "ja": "トギフォンス",
          "zh": "熔泉"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      },
      {
        "name": {
          "ko": "메이어",
          "en": "Mayer",
          "ja": "メイヤー",
          "zh": "梅尔"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      },
      {
        "name": {
          "ko": "에프이터",
          "en": "FEater",
          "ja": "エフイーター",
          "zh": "食铁兽"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      }
    ],
    "highlights": [
      {
        "ko": "주 픽업 6★ 2명 · 추가 확률 상승 5★ 3명",
        "en": "2 featured 6★ · 3 additional 5★ rate-ups",
        "ja": "主対象★6・2名／追加確率UP★5・3名",
        "zh": "主推6★两名，另有5★三名概率提升"
      },
      {
        "ko": "커널 헤드헌팅",
        "en": "Kernel Headhunting",
        "ja": "中堅スカウト",
        "zh": "中坚寻访"
      }
    ],
    "image": "/assets/entities/ark-hoshiguma-e2-full-535ae294.png",
    "imageSource": "https://patchwiki.biligame.com/images/arknights/0/02/qm0ltsvcxrxgffdvqoizspb5iljw5st.png",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true,
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://x.com/arknightskorea/status/1238051588947603458",
        "title": "호시구마 한국 공식 이름",
        "publisher": "Yostar Korea"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1518109623676727296",
        "title": "플레임테일 한국 공식 이름",
        "publisher": "Yostar Korea"
      }
    ],
    "timingNote": {
      "ko": "표시 일정은 선택한 서버 공지 기준입니다. 글로벌 서버는 UTC−7, 한국·일본 서버는 UTC+9입니다.",
      "en": "The schedule follows the selected regional notice. Global uses UTC−7; Korea and Japan use UTC+9.",
      "ja": "選択したサーバーの告知日時です。グローバルはUTC−7、日本・韓国はUTC+9です。",
      "zh": "时间以所选服务器公告为准。全球服为UTC−7，韩服与日服为UTC+9。"
    },
    "bannerName": {
      "ko": "커널 헤드헌팅",
      "en": "Kernel Headhunting",
      "ja": "中堅スカウト",
      "zh": "中坚寻访"
    }
  },
  {
    "id": "arknights-kr-standard-20261009",
    "gameId": "arknights",
    "kind": "pickup",
    "region": "kr",
    "server": "Korea · UTC+9",
    "title": {
      "ko": "외드레르 / 오올헤약",
      "en": "Hoederer / Ho’olheyak",
      "ja": "ヘドリー / ホルハイヤ",
      "zh": "赫德雷 / 霍尔海雅"
    },
    "summary": {
      "ko": "일반 헤드헌팅의 6★ 복각 확률 상승 2명. 5★ 아몬드, 루실라, 테크노는 추가 확률 상승 대상입니다.",
      "en": "Standard Headhunting: two returning 6★ rate-ups. The three additional 5★ rate-ups are Almond, Lucilla, Tecno.",
      "ja": "常設スカウト：既存★6オペレーター2名が主対象。★5のアーモンド・ルシーラ・テクノは追加確率UP対象です。",
      "zh": "标准寻访：两位既有6★干员概率提升，另有杏仁、海霓、特克诺三位5★干员概率提升。"
    },
    "startAt": "2026-10-09T04:00:00+09:00",
    "endAt": null,
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:13:11.635381+00:00",
    "sourceUrl": "https://x.com/ArknightsKorea/status/2108111986169196643",
    "sourceTitle": "일반 헤드헌팅 · 2026-10-09",
    "sourceKind": "official",
    "sourceLocale": "ko",
    "officialLocales": [
      "ko",
      "en",
      "ja"
    ],
    "translatedLocales": [
      "zh"
    ],
    "localizationSources": {
      "ko": "https://x.com/ArknightsKorea/status/1778997254336245927",
      "en": "https://www.facebook.com/ArknightsGlobal/posts/dear-doctor-the-following-operators-will-appear-at-a-higher-rate-between-october/1550842270412140/",
      "ja": "https://x.com/ArknightsStaff/status/2108105299618091467"
    },
    "rarity": 6,
    "featured": false,
    "pickupType": "rerun",
    "pickupGroup": "arknights-kr-standard-20261009",
    "poolType": "standard",
    "pickupMembers": [
      {
        "name": {
          "ko": "외드레르",
          "en": "Hoederer",
          "ja": "ヘドリー",
          "zh": "赫德雷"
        },
        "type": "rerun",
        "rarity": 6,
        "role": "featured",
        "image": "/assets/entities/ark-hoederer-e2-full-501cb999.png",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/2/29/mvpq4dyvj5ujxv7a3nxqbi14bj3y7gk.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "오올헤약",
          "en": "Ho’olheyak",
          "ja": "ホルハイヤ",
          "zh": "霍尔海雅"
        },
        "type": "rerun",
        "rarity": 6,
        "role": "featured",
        "image": "/assets/entities/ark-hoolheyak-e2-full-7886484b.png",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/c/c7/5buerojog7a5ttownrqpx6d6slyox9y.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "아몬드",
          "en": "Almond",
          "ja": "アーモンド",
          "zh": "杏仁"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      },
      {
        "name": {
          "ko": "루실라",
          "en": "Lucilla",
          "ja": "ルシーラ",
          "zh": "海霓"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      },
      {
        "name": {
          "ko": "테크노",
          "en": "Tecno",
          "ja": "テクノ",
          "zh": "特克诺"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      }
    ],
    "highlights": [
      {
        "ko": "주 픽업 6★ 2명 · 추가 확률 상승 5★ 3명",
        "en": "2 featured 6★ · 3 additional 5★ rate-ups",
        "ja": "主対象★6・2名／追加確率UP★5・3名",
        "zh": "主推6★两名，另有5★三名概率提升"
      },
      {
        "ko": "일반 헤드헌팅",
        "en": "Standard Headhunting",
        "ja": "常設スカウト",
        "zh": "标准寻访"
      }
    ],
    "image": "/assets/entities/ark-hoederer-e2-full-501cb999.png",
    "imageSource": "https://patchwiki.biligame.com/images/arknights/2/29/mvpq4dyvj5ujxv7a3nxqbi14bj3y7gk.png",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true,
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://www.facebook.com/ArknightsGlobal/posts/dear-doctor-the-following-operators-will-appear-at-a-higher-rate-between-october/1550842270412140/",
        "title": "Global official rotation notice",
        "publisher": "Arknights EN / Yostar"
      },
      {
        "kind": "community",
        "url": "https://m.namu.moe/w/%EB%AA%85%EC%9D%BC%EB%B0%A9%EC%A3%BC/%ED%97%A4%EB%93%9C%ED%97%8C%ED%8C%85",
        "title": "한국 서버 일반·커널 헤드헌팅 기록",
        "publisher": "커뮤니티 편집 기록"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1778997254336245927",
        "title": "외드레르 한국 공식 이름",
        "publisher": "Yostar Korea"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1721025064114831665",
        "title": "오올헤약 한국 공식 이름",
        "publisher": "Yostar Korea"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1862710258260746498",
        "title": "루실라 한국 공식 이름",
        "publisher": "Yostar Korea"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1928663388009410942",
        "title": "테크노 한국 공식 이름",
        "publisher": "Yostar Korea"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1768851576419168449",
        "title": "아몬드 한국 공식 이름",
        "publisher": "Yostar Korea"
      }
    ],
    "timingNote": {
      "ko": "10/9 04:00 (UTC+9) 시작은 한국 공식 검색 색인으로 확인. 종료일 10/23은 한국 서버 기록에 있으나 공식 종료 시각은 재검수하지 못해 미확인으로 남겼습니다.",
      "en": "The Korean official index confirms Oct 9, 04:00 (UTC+9). A Korean-server record gives Oct 23, but the official end time could not be rechecked and remains unconfirmed.",
      "ja": "韓国公式検索結果で10/9 04:00（UTC+9）開始を確認。韓国サーバー記録には10/23終了とありますが、公式終了時刻を再確認できず未確認としています。",
      "zh": "韩国官方索引确认10/9 04:00（UTC+9）开始。韩服记录列出10/23截止，但官方截止时刻未能复核，保留为未确认。"
    },
    "detailSections": [
      {
        "title": {
          "ko": "검수 범위",
          "en": "Verification scope",
          "ja": "確認範囲",
          "zh": "核实范围"
        },
        "body": {
          "ko": "한국 공식 게시물의 검색 색인으로 시작 시각을 확인했습니다. 구성원은 한국 서버 기록 및 해외 공식 안내와 교차 확인했습니다. 한국 공식 게시물 이미지 본문은 접근 제한으로 재검수하지 못했습니다.",
          "en": "The start time was checked in the indexed Korean official notice. The roster was cross-checked against the Korean-server community record and overseas official notices; the Korean notice artwork could not be reopened because access was restricted.",
          "ja": "韓国公式告知の検索インデックスで開始日時を確認。構成は韓国サーバーの記録と海外公式告知を照合。韓国告知の画像本文はアクセス制限により再確認できませんでした。",
          "zh": "开始时间通过韩国官方公告的搜索索引确认；阵容与韩服记录及海外官方公告交叉核对。韩国公告图片正文因访问受限未能重新查看。"
        },
        "sourceKind": "community",
        "sourceUrls": [
          "https://m.namu.moe/w/%EB%AA%85%EC%9D%BC%EB%B0%A9%EC%A3%BC/%ED%97%A4%EB%93%9C%ED%97%8C%ED%8C%85"
        ]
      }
    ],
    "bannerName": {
      "ko": "일반 헤드헌팅",
      "en": "Standard Headhunting",
      "ja": "常設スカウト",
      "zh": "标准寻访"
    }
  },
  {
    "id": "arknights-kr-kernel-20261006",
    "gameId": "arknights",
    "kind": "pickup",
    "region": "kr",
    "server": "Korea · UTC+9",
    "title": {
      "ko": "호시구마 / 플레임테일",
      "en": "Hoshiguma / Flametail",
      "ja": "ホシグマ / フレイムテイル",
      "zh": "星熊 / 焰尾"
    },
    "summary": {
      "ko": "커널 헤드헌팅의 6★ 복각 확률 상승 2명. 5★ 토디폰스, 메이어, 에프이터는 추가 확률 상승 대상입니다.",
      "en": "Kernel Headhunting: two returning 6★ rate-ups. The three additional 5★ rate-ups are Toddifons, Mayer, FEater.",
      "ja": "中堅スカウト：既存★6オペレーター2名が主対象。★5のトギフォンス・メイヤー・エフイーターは追加確率UP対象です。",
      "zh": "中坚寻访：两位既有6★干员概率提升，另有熔泉、梅尔、食铁兽三位5★干员概率提升。"
    },
    "startAt": "2026-10-06T04:00:00+09:00",
    "endAt": "2026-10-20T03:59:00+09:00",
    "publishedAt": null,
    "verifiedAt": "2026-10-16T14:13:11.635381+00:00",
    "sourceUrl": "https://x.com/ArknightsKorea/status/2106988212212355440",
    "sourceTitle": "커널 헤드헌팅 · 2026-10-06",
    "sourceKind": "official",
    "sourceLocale": "ko",
    "officialLocales": [
      "ko",
      "en",
      "ja"
    ],
    "translatedLocales": [
      "zh"
    ],
    "localizationSources": {
      "ko": "https://x.com/ArknightsKorea/status/1518109623676727296",
      "en": "https://x.com/ArknightsEN/status/2106987750037569624",
      "ja": "https://x.com/ArknightsStaff/status/2106987893743091911"
    },
    "rarity": 6,
    "featured": false,
    "pickupType": "rerun",
    "pickupGroup": "arknights-kr-kernel-20261006",
    "poolType": "standard",
    "pickupMembers": [
      {
        "name": {
          "ko": "호시구마",
          "en": "Hoshiguma",
          "ja": "ホシグマ",
          "zh": "星熊"
        },
        "type": "rerun",
        "rarity": 6,
        "role": "featured",
        "image": "/assets/entities/ark-hoshiguma-e2-full-535ae294.png",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/0/02/qm0ltsvcxrxgffdvqoizspb5iljw5st.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "플레임테일",
          "en": "Flametail",
          "ja": "フレイムテイル",
          "zh": "焰尾"
        },
        "type": "rerun",
        "rarity": 6,
        "role": "featured",
        "image": "/assets/entities/ark-flametail-e2-full-4600b917.png",
        "imageSource": "https://patchwiki.biligame.com/images/arknights/e/e3/4hdifjnxqcjuybd2lma5mqque0b6k3i.png",
        "imageKind": "splash",
        "imageFit": "contain",
        "imagePosition": "50% 50%",
        "imageVerified": true
      },
      {
        "name": {
          "ko": "토디폰스",
          "en": "Toddifons",
          "ja": "トギフォンス",
          "zh": "熔泉"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      },
      {
        "name": {
          "ko": "메이어",
          "en": "Mayer",
          "ja": "メイヤー",
          "zh": "梅尔"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      },
      {
        "name": {
          "ko": "에프이터",
          "en": "FEater",
          "ja": "エフイーター",
          "zh": "食铁兽"
        },
        "type": "rerun",
        "rarity": 5,
        "role": "rate-up",
        "imageVerified": false
      }
    ],
    "highlights": [
      {
        "ko": "주 픽업 6★ 2명 · 추가 확률 상승 5★ 3명",
        "en": "2 featured 6★ · 3 additional 5★ rate-ups",
        "ja": "主対象★6・2名／追加確率UP★5・3名",
        "zh": "主推6★两名，另有5★三名概率提升"
      },
      {
        "ko": "커널 헤드헌팅",
        "en": "Kernel Headhunting",
        "ja": "中堅スカウト",
        "zh": "中坚寻访"
      }
    ],
    "image": "/assets/entities/ark-hoshiguma-e2-full-535ae294.png",
    "imageSource": "https://patchwiki.biligame.com/images/arknights/0/02/qm0ltsvcxrxgffdvqoizspb5iljw5st.png",
    "imageKind": "splash",
    "imageFit": "contain",
    "imagePosition": "50% 50%",
    "imageVerified": true,
    "relatedSources": [
      {
        "kind": "official",
        "url": "https://x.com/ArknightsEN/status/2106987750037569624",
        "title": "Global official rotation notice",
        "publisher": "Arknights EN / Yostar"
      },
      {
        "kind": "community",
        "url": "https://m.namu.moe/w/%EB%AA%85%EC%9D%BC%EB%B0%A9%EC%A3%BC/%ED%97%A4%EB%93%9C%ED%97%8C%ED%8C%85",
        "title": "한국 서버 일반·커널 헤드헌팅 기록",
        "publisher": "커뮤니티 편집 기록"
      },
      {
        "kind": "official",
        "url": "https://x.com/arknightskorea/status/1238051588947603458",
        "title": "호시구마 한국 공식 이름",
        "publisher": "Yostar Korea"
      },
      {
        "kind": "official",
        "url": "https://x.com/ArknightsKorea/status/1518109623676727296",
        "title": "플레임테일 한국 공식 이름",
        "publisher": "Yostar Korea"
      }
    ],
    "timingNote": {
      "ko": "표시 일정은 선택한 서버 공지 기준입니다. 글로벌 서버는 UTC−7, 한국·일본 서버는 UTC+9입니다.",
      "en": "The schedule follows the selected regional notice. Global uses UTC−7; Korea and Japan use UTC+9.",
      "ja": "選択したサーバーの告知日時です。グローバルはUTC−7、日本・韓国はUTC+9です。",
      "zh": "时间以所选服务器公告为准。全球服为UTC−7，韩服与日服为UTC+9。"
    },
    "detailSections": [
      {
        "title": {
          "ko": "검수 범위",
          "en": "Verification scope",
          "ja": "確認範囲",
          "zh": "核实范围"
        },
        "body": {
          "ko": "한국 공식 게시물의 검색 색인으로 시작 시각을 확인했습니다. 구성원은 한국 서버 기록 및 해외 공식 안내와 교차 확인했습니다. 한국 공식 게시물 이미지 본문은 접근 제한으로 재검수하지 못했습니다.",
          "en": "The start time was checked in the indexed Korean official notice. The roster was cross-checked against the Korean-server community record and overseas official notices; the Korean notice artwork could not be reopened because access was restricted.",
          "ja": "韓国公式告知の検索インデックスで開始日時を確認。構成は韓国サーバーの記録と海外公式告知を照合。韓国告知の画像本文はアクセス制限により再確認できませんでした。",
          "zh": "开始时间通过韩国官方公告的搜索索引确认；阵容与韩服记录及海外官方公告交叉核对。韩国公告图片正文因访问受限未能重新查看。"
        },
        "sourceKind": "community",
        "sourceUrls": [
          "https://m.namu.moe/w/%EB%AA%85%EC%9D%BC%EB%B0%A9%EC%A3%BC/%ED%97%A4%EB%93%9C%ED%97%8C%ED%8C%85"
        ]
      }
    ],
    "bannerName": {
      "ko": "커널 헤드헌팅",
      "en": "Kernel Headhunting",
      "ja": "中堅スカウト",
      "zh": "中坚寻访"
    }
  }
];
export const seedEntries: Entry[] = [...rawSeedEntries,...additionalGameEntries as Entry[],...releaseAdditions as Entry[],...maintainedVideoNotices as Entry[]].map(separateEntityRewards);
import additionalGameEntries from '../content/additional-game-entries.json' with {type:'json'};

import releaseAdditions from '../content/release-additions-20261025.json' with {type:'json'};

import maintainedVideoNotices from '../content/maintained-video-notices.json' with {type:'json'};
