import type {Game,Region} from "./types";
export const games:Game[]=[
  {
    "id": "wuwa",
    "icon": "/assets/app-icons/wuwa-app-icon-kr.jpg",
    "iconSource": "https://apps.apple.com/kr/app/%EB%AA%85%EC%A1%B0-%EC%9B%8C%EB%8D%94%EB%A7%81-%EC%9B%A8%EC%9D%B4%EB%B8%8C/id6475033368?uo=4",
    "name": {
      "ko": "명조: 워더링 웨이브",
      "en": "Wuthering Waves",
      "ja": "鳴潮",
      "zh": "鸣潮"
    },
    "short": "WUWA",
    "genre": {
      "ko": "오픈월드 액션 RPG",
      "en": "OPEN-WORLD ACTION RPG",
      "ja": "オープンワールドARPG",
      "zh": "开放世界动作RPG"
    },
    "color": "#d7e9b0",
    "logo": "/assets/wuwa-logo.png",
    "art": "/assets/wuwa-art.webp",
    "official": "https://wutheringwaves.kurogames.com/kr/main",
    "publisher": "KURO GAMES",
    "regions": [
      "global"
    ],
    "sources": [
      {
        "label": "명조: 워더링 웨이브 · 한국 공식",
        "url": "https://wutheringwaves.kurogames.com/kr/main/news",
        "region": "global"
      },
      {
        "label": "WUWA · Official",
        "url": "https://wutheringwaves.kurogames.com/en/main/news",
        "region": "global"
      }
    ],
    "serviceMode": "shared-global",
    "regionLabels": {
      "global": {
        "ko": "글로벌 · 아시아",
        "en": "Global · Asia",
        "ja": "グローバル · アジア",
        "zh": "国际服 · 亚洲"
      }
    }
  },
  {
    "id": "bluearchive",
    "icon": "/assets/app-icons/bluearchive-app-icon-kr.jpg",
    "iconSource": "https://apps.apple.com/kr/app/%EB%B8%94%EB%A3%A8-%EC%95%84%EC%B9%B4%EC%9D%B4%EB%B8%8C/id1571873795?uo=4",
    "name": {
      "ko": "블루 아카이브",
      "en": "Blue Archive",
      "ja": "ブルーアーカイブ",
      "zh": "蔚蓝档案"
    },
    "short": "BLUE ARCHIVE",
    "genre": {
      "ko": "청춘 학원 RPG",
      "en": "ACADEMY RPG",
      "ja": "青春学園RPG",
      "zh": "青春校园RPG"
    },
    "color": "#80d7ff",
    "logo": "/assets/bluearchive-logo.png",
    "art": "/assets/bluearchive-art.webp",
    "official": "https://bluearchive.nexon.com/home",
    "publisher": "NEXON GAMES",
    "regions": [
      "global",
      "kr",
      "jp"
    ],
    "sources": [
      {
        "label": "블루 아카이브 · 한국 공식",
        "url": "https://forum.nexon.com/bluearchive/board_list?board=1076",
        "region": "kr"
      },
      {
        "label": "BLUE ARCHIVE · Official",
        "url": "https://bluearchive.nexon.com/events",
        "region": "global"
      },
      {
        "label": "ブルーアーカイブ · 日本",
        "url": "https://bluearchive.jp/news",
        "region": "jp"
      }
    ],
    "serviceMode": "regional",
    "scheduleRegions": [
      "kr",
      "jp"
    ],
    "regionAliases": {
      "global": "kr"
    },
    "regionLabels": {
      "kr": {
        "ko": "한국 · 글로벌",
        "en": "Korea · Global",
        "ja": "韓国 · グローバル",
        "zh": "韩国 · 国际服"
      }
    }
  },
  {
    "id": "nikke",
    "icon": "/assets/app-icons/nikke-app-icon-kr.jpg",
    "iconSource": "https://apps.apple.com/kr/app/%EC%8A%B9%EB%A6%AC%EC%9D%98-%EC%97%AC%EC%8B%A0-%EB%8B%88%EC%BC%80/id1585915174?uo=4",
    "name": {
      "ko": "승리의 여신: 니케",
      "en": "GODDESS OF VICTORY: NIKKE",
      "ja": "勝利の女神：NIKKE",
      "zh": "胜利女神：妮姬"
    },
    "short": "NIKKE",
    "genre": {
      "ko": "스쿼드 슈팅 RPG",
      "en": "SQUAD SHOOTER RPG",
      "ja": "ガンガールRPG",
      "zh": "美少女射击RPG"
    },
    "color": "#f4bc8b",
    "logo": "/assets/nikke-logo.png",
    "art": "/assets/nikke-art.webp",
    "official": "https://nikke-kr.com/",
    "publisher": "SHIFT UP / LEVEL INFINITE",
    "regions": [
      "global",
      "kr",
      "jp"
    ],
    "sources": [
      {
        "label": "승리의 여신: 니케 · 한국 공식",
        "url": "https://nikke-kr.com/news.html",
        "region": "global"
      },
      {
        "label": "NIKKE · Official",
        "url": "https://nikke-en.com/news.html",
        "region": "global"
      }
    ],
    "serviceMode": "shared-global"
  },
  {
    "id": "endfield",
    "icon": "/assets/app-icons/endfield-app-icon-kr.jpg",
    "iconSource": "https://apps.apple.com/kr/app/%EB%AA%85%EC%9D%BC%EB%B0%A9%EC%A3%BC-%EC%97%94%EB%93%9C%ED%95%84%EB%93%9C/id6752642477?uo=4",
    "name": {
      "ko": "명일방주: 엔드필드",
      "en": "Arknights: Endfield",
      "ja": "アークナイツ：エンドフィールド",
      "zh": "明日方舟：终末地"
    },
    "short": "ENDFIELD",
    "genre": {
      "ko": "산업 개척 RPG",
      "en": "INDUSTRIAL EXPLORATION RPG",
      "ja": "工業開拓RPG",
      "zh": "工业探索RPG"
    },
    "color": "#dfef6b",
    "logo": "/assets/endfield-logo.svg",
    "art": "/assets/endfield-art.webp",
    "official": "https://endfield.gryphline.com/ko-kr",
    "publisher": "HYPERGRYPH / GRYPHLINE",
    "regions": [
      "global"
    ],
    "sources": [
      {
        "label": "명일방주: 엔드필드 · 한국 공식",
        "url": "https://endfield.gryphline.com/ko-kr/news",
        "region": "global"
      },
      {
        "label": "ENDFIELD · Official",
        "url": "https://endfield.gryphline.com/en-us/news",
        "region": "global"
      }
    ],
    "serviceMode": "shared-global",
    "regionLabels": {
      "global": {
        "ko": "글로벌 · 아시아",
        "en": "Global · Asia",
        "ja": "グローバル · アジア",
        "zh": "国际服 · 亚洲"
      }
    }
  },
  {
    "id": "umamusume",
    "icon": "/assets/app-icons/uma-app-icon-kr.jpg",
    "iconSource": "https://apps.apple.com/kr/app/%EC%9A%B0%EB%A7%88%EB%AC%B4%EC%8A%A4%EB%A9%94-%ED%94%84%EB%A6%AC%ED%8B%B0-%EB%8D%94%EB%B9%84/id1616108452?uo=4",
    "name": {
      "ko": "우마무스메 프리티 더비",
      "en": "Umamusume: Pretty Derby",
      "ja": "ウマ娘 プリティーダービー",
      "zh": "赛马娘 Pretty Derby"
    },
    "short": "UMAMUSUME",
    "genre": {
      "ko": "육성 시뮬레이션",
      "en": "TRAINING SIMULATION",
      "ja": "育成シミュレーション",
      "zh": "养成模拟"
    },
    "color": "#c9a6f7",
    "logo": "/assets/umamusume-logo.png",
    "art": "/assets/umamusume-art.webp",
    "official": "https://umamusume.kakaogames.com/",
    "publisher": "CYGAMES",
    "regions": [
      "global",
      "kr",
      "jp"
    ],
    "sources": [
      {
        "label": "우마무스메 프리티 더비 · 한국 공식",
        "url": "https://umamusume.kakaogames.com/",
        "region": "kr"
      },
      {
        "label": "UMAMUSUME · Official",
        "url": "https://umamusume.com/news/",
        "region": "global"
      },
      {
        "label": "ウマ娘 · 日本",
        "url": "https://umamusume.jp/news/",
        "region": "jp"
      }
    ],
    "serviceMode": "regional"
  },
  {
    "id": "nte",
    "icon": "/assets/app-icons/nte-app-icon-kr.jpg",
    "iconSource": "https://apps.apple.com/kr/app/%EC%9D%B4%ED%99%98/id6754593077?uo=4",
    "name": {
      "ko": "이환",
      "en": "Neverness to Everness",
      "ja": "異環",
      "zh": "异环"
    },
    "short": "NTE",
    "genre": {
      "ko": "도시 오픈월드 RPG",
      "en": "URBAN OPEN-WORLD RPG",
      "ja": "超現実都市RPG",
      "zh": "都市开放世界RPG"
    },
    "color": "#ee9cc9",
    "logo": "/assets/nte-logo.png",
    "art": "/assets/nte-art.webp",
    "official": "https://nte.perfectworld.com/kr/",
    "publisher": "HOTTA STUDIO / PERFECT WORLD",
    "regions": [
      "global"
    ],
    "sources": [
      {
        "label": "이환 · 한국 공식",
        "url": "https://nte.perfectworld.com/kr/article/news/index.html",
        "region": "global"
      },
      {
        "label": "NTE · Official",
        "url": "https://nte.perfectworld.com/en/news/index.html",
        "region": "global"
      }
    ],
    "serviceMode": "shared-global",
    "regionLabels": {
      "global": {
        "ko": "글로벌 · 아시아",
        "en": "Global · Asia",
        "ja": "グローバル · アジア",
        "zh": "国际服 · 亚洲"
      }
    }
  },
  {
    "id": "gfl2",
    "icon": "/assets/app-icons/gfl2-app-icon-kr.jpg",
    "iconSource": "https://apps.apple.com/kr/app/%EC%86%8C%EB%85%80%EC%A0%84%EC%84%A02-%EB%A7%9D%EB%AA%85/id6499011827?uo=4",
    "name": {
      "ko": "소녀전선2: 망명",
      "en": "GIRLS’ FRONTLINE 2: EXILIUM",
      "ja": "ドールズフロントライン2：エクシリウム",
      "zh": "少女前线2：追放"
    },
    "short": "GFL2",
    "genre": {
      "ko": "전술 전략 RPG",
      "en": "TACTICAL STRATEGY RPG",
      "ja": "戦術シミュレーションRPG",
      "zh": "战术策略RPG"
    },
    "color": "#ec9d76",
    "logo": "/assets/gfl2-logo.png",
    "art": "/assets/gfl2-art.webp",
    "official": "https://gf2.haoplay.com/kr/",
    "publisher": "SUNBORN / HAOPLAY",
    "regions": [
      "global",
      "kr",
      "jp",
      "cn"
    ],
    "sources": [
      {
        "label": "소녀전선2: 망명 · 한국 공식",
        "url": "https://gf2.haoplay.com/kr/",
        "region": "kr"
      },
      {
        "label": "GFL2 · Official",
        "url": "https://gf2.haoplay.com/en/",
        "region": "global"
      },
      {
        "label": "少女前线2：追放 · 中国大陆",
        "url": "https://gf2.sunborngame.com/",
        "region": "cn"
      }
    ],
    "serviceMode": "regional",
    "scheduleRegions": [
      "kr",
      "global",
      "cn"
    ],
    "regionAliases": {
      "jp": "kr"
    },
    "regionLabels": {
      "kr": {
        "ko": "한국 · 일본",
        "en": "Korea · Japan",
        "ja": "韓国 · 日本",
        "zh": "韩国 · 日本"
      }
    }
  },
  {
    "id": "arknights",
    "icon": "/assets/app-icons/arknights-app-icon-kr.jpg",
    "iconSource": "https://apps.apple.com/kr/app/%EB%AA%85%EC%9D%BC%EB%B0%A9%EC%A3%BC/id1473903308?uo=4",
    "name": {
      "ko": "명일방주",
      "en": "Arknights",
      "ja": "アークナイツ",
      "zh": "明日方舟"
    },
    "short": "ARKNIGHTS",
    "genre": {
      "ko": "전략 디펜스 RPG",
      "en": "TACTICAL TOWER DEFENSE",
      "ja": "タワーディフェンスRPG",
      "zh": "策略塔防RPG"
    },
    "color": "#8ecbd9",
    "logo": "/assets/arknights-logo.png",
    "art": "/assets/arknights-art.webp",
    "official": "https://arknights.kr/",
    "publisher": "HYPERGRYPH / YOSTAR",
    "regions": [
      "global",
      "kr",
      "jp",
      "cn"
    ],
    "sources": [
      {
        "label": "명일방주 · 한국 공식",
        "url": "https://arknights.kr/",
        "region": "kr"
      },
      {
        "label": "ARKNIGHTS · Official",
        "url": "https://www.arknights.global/news",
        "region": "global"
      },
      {
        "label": "明日方舟 · 中国大陆",
        "url": "https://ak.hypergryph.com/",
        "region": "cn"
      }
    ],
    "serviceMode": "regional"
  },
  {
    "id": "genshin",
    "icon": "/assets/app-icons/genshin-app-icon-kr.jpg",
    "iconSource": "https://apps.apple.com/kr/app/%EC%9B%90%EC%8B%A0-6%EC%A3%BC%EB%85%84/id1517783697?uo=4",
    "name": {
      "ko": "원신",
      "en": "Genshin Impact",
      "ja": "原神",
      "zh": "原神"
    },
    "short": "GENSHIN",
    "genre": {
      "ko": "오픈월드 어드벤처 RPG",
      "en": "OPEN-WORLD ADVENTURE RPG",
      "ja": "オープンワールドRPG",
      "zh": "开放世界冒险RPG"
    },
    "color": "#91c9ed",
    "logo": "/assets/genshin-logo.png",
    "art": "/assets/genshin-art.webp",
    "official": "https://genshin.hoyoverse.com/ko/",
    "publisher": "HOYOVERSE",
    "regions": [
      "global"
    ],
    "sources": [
      {
        "label": "원신 · 한국 공식",
        "url": "https://genshin.hoyoverse.com/ko/news",
        "region": "global"
      },
      {
        "label": "GENSHIN · Official",
        "url": "https://genshin.hoyoverse.com/en/news",
        "region": "global"
      }
    ],
    "serviceMode": "shared-global",
    "regionLabels": {
      "global": {
        "ko": "글로벌 · 아시아",
        "en": "Global · Asia",
        "ja": "グローバル · アジア",
        "zh": "国际服 · 亚洲"
      }
    }
  },
  {
    "id": "hsr",
    "icon": "/assets/app-icons/hsr-app-icon-kr.jpg",
    "iconSource": "https://apps.apple.com/kr/app/%EB%B6%95%EA%B4%B4-%EC%8A%A4%ED%83%80%EB%A0%88%EC%9D%BC/id1599719154?uo=4",
    "name": {
      "ko": "붕괴: 스타레일",
      "en": "Honkai: Star Rail",
      "ja": "崩壊：スターレイル",
      "zh": "崩坏：星穹铁道"
    },
    "short": "STAR RAIL",
    "genre": {
      "ko": "은하 판타지 턴제 RPG",
      "en": "SPACE FANTASY RPG",
      "ja": "スペースファンタジーRPG",
      "zh": "银河冒险策略RPG"
    },
    "color": "#b6b1ef",
    "logo": "/assets/hsr-logo.png",
    "art": "/assets/hsr-art.webp",
    "official": "https://hsr.hoyoverse.com/ko-kr/",
    "publisher": "HOYOVERSE",
    "regions": [
      "global"
    ],
    "sources": [
      {
        "label": "붕괴: 스타레일 · 한국 공식",
        "url": "https://hsr.hoyoverse.com/ko-kr/news",
        "region": "global"
      },
      {
        "label": "STAR RAIL · Official",
        "url": "https://hsr.hoyoverse.com/en-us/news",
        "region": "global"
      }
    ],
    "serviceMode": "shared-global",
    "regionLabels": {
      "global": {
        "ko": "글로벌 · 아시아",
        "en": "Global · Asia",
        "ja": "グローバル · アジア",
        "zh": "国际服 · 亚洲"
      }
    }
  },
  {
    "id": "zzz",
    "icon": "/assets/app-icons/zzz-app-icon-kr.jpg",
    "iconSource": "https://apps.apple.com/kr/app/%EC%A0%A0%EB%A0%88%EC%8A%A4-%EC%A1%B4-%EC%A0%9C%EB%A1%9C/id1606356401?uo=4",
    "name": {
      "ko": "젠레스 존 제로",
      "en": "Zenless Zone Zero",
      "ja": "ゼンレスゾーンゼロ",
      "zh": "绝区零"
    },
    "short": "ZENLESS",
    "genre": {
      "ko": "도시 판타지 액션 RPG",
      "en": "URBAN FANTASY ACTION RPG",
      "ja": "都市ファンタジーARPG",
      "zh": "都市幻想动作RPG"
    },
    "color": "#f6cf65",
    "logo": "/assets/zzz-logo.png",
    "art": "/assets/zzz-art.webp",
    "official": "https://zenless.hoyoverse.com/ko-kr/",
    "publisher": "HOYOVERSE",
    "regions": [
      "global"
    ],
    "sources": [
      {
        "label": "젠레스 존 제로 · 한국 공식",
        "url": "https://zenless.hoyoverse.com/ko-kr/news",
        "region": "global"
      },
      {
        "label": "ZENLESS · Official",
        "url": "https://zenless.hoyoverse.com/en-us/news",
        "region": "global"
      }
    ],
    "serviceMode": "shared-global",
    "regionLabels": {
      "global": {
        "ko": "글로벌 · 아시아",
        "en": "Global · Asia",
        "ja": "グローバル · アジア",
        "zh": "国际服 · 亚洲"
      }
    }
  },
  {
    "id": "trickcal",
    "name": {
      "ko": "트릭컬 리바이브",
      "en": "Trickcal:Chibi Go",
      "ja": "トリッカル・もちもちほっぺ大作戦",
      "zh": "嘟嘟臉惡作劇"
    },
    "short": "TRICKCAL",
    "genre": {
      "ko": "수집형 RPG",
      "en": "Collection RPG",
      "ja": "収集型RPG",
      "zh": "角色收集RPG"
    },
    "color": "#72bc4c",
    "logo": "https://www.trickcal.com/assets/logo-BHL9MqGO.svg",
    "icon": "https://nng-phinf.pstatic.net/MjAyNjA5MjRfMTgg/MDAxNzkwMjE1NzY1ODE2.O2rd2qmk4aeCWJ1LfPAIpv4nFo0uy2a3CdrsXDSCb6cg.lyY1bk6eKfKMcSHwzTL8tNLwGpdG3TFZdVTngTKorD4g.PNG/%EB%9D%BC%EC%9A%B4%EC%A7%80%28300_300%29.png",
    "iconSource": "https://game.naver.com/lounge/Trickcal/home",
    "art": "https://www.trickcal.com/assets/event/3rdAnniversary/img/main_bg_web-nYFJlJlQ.png",
    "artPosition": "50% 54%",
    "official": "https://www.trickcal.com/",
    "publisher": "EPIDGames / bilibili",
    "regions": [
      "kr",
      "jp",
      "global"
    ],
    "serviceMode": "regional",
    "scheduleRegions": [
      "kr",
      "global"
    ],
    "regionAliases": {
      "jp": "global"
    },
    "regionLabels": {
      "kr": {
        "ko": "한국",
        "en": "Korea",
        "ja": "韓国",
        "zh": "韓國"
      },
      "global": {
        "ko": "글로벌·일본",
        "en": "Global / Japan",
        "ja": "グローバル・日本",
        "zh": "國際・日本"
      }
    },
    "sources": [
      {
        "label": "트릭컬 리바이브 공식 라운지",
        "url": "https://game.naver.com/lounge/Trickcal/home",
        "region": "kr"
      },
      {
        "label": "Trickcal:Chibi Go Official News",
        "url": "https://trickcal.biligames.com/news/en/",
        "region": "global"
      }
    ]
  },
  {
    "id": "hi3",
    "name": {
      "ko": "붕괴3rd",
      "en": "Honkai Impact 3rd",
      "ja": "崩壊3rd",
      "zh": "崩坏3"
    },
    "short": "HI3",
    "genre": {
      "ko": "액션 RPG",
      "en": "Action RPG",
      "ja": "アクションRPG",
      "zh": "动作RPG"
    },
    "color": "#b5a1ff",
    "logo": "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/b9/2f/9e/b92f9ea0-d35b-64a7-d184-95813768407f/AppIcon-1x_U007emarketing-0-10-0-85-220-0.png/512x512bb.jpg",
    "icon": "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/b9/2f/9e/b92f9ea0-d35b-64a7-d184-95813768407f/AppIcon-1x_U007emarketing-0-10-0-85-220-0.png/512x512bb.jpg",
    "iconSource": "https://apps.apple.com/kr/app/id1286705196",
    "art": "https://upload-os-bbs.hoyolab.com/upload/community/2026/08/13/ea619406f1616de92d62b13ad4240c64_5698590394152952864.jpg",
    "artPosition": "42% 45%",
    "official": "https://honkaiimpact3.hoyoverse.com/kr/ko-kr/home",
    "publisher": "HoYoverse / COGNOSPHERE",
    "regions": [
      "kr",
      "jp",
      "global"
    ],
    "serviceMode": "regional",
    "scheduleRegions": [
      "kr",
      "global"
    ],
    "regionAliases": {
      "jp": "kr"
    },
    "regionLabels": {
      "kr": {
        "ko": "한국 · 일본",
        "en": "Korea · Japan",
        "ja": "韓国 · 日本",
        "zh": "韩国 · 日本"
      },
      "global": {
        "ko": "글로벌 · 유럽/미주",
        "en": "Global · Europe/Americas",
        "ja": "グローバル · 欧米",
        "zh": "国际服 · 欧洲/美洲"
      }
    },
    "sources": [
      {
        "label": "붕괴3rd · 한국 공식 공지",
        "url": "https://www.hoyolab.com/accountCenter/postList?id=147839994",
        "region": "kr"
      },
      {
        "label": "붕괴3rd · 한국 공식 카페",
        "url": "https://cafe.naver.com/honkai3rd",
        "region": "kr"
      },
      {
        "label": "崩壊3rd · 日本公式",
        "url": "https://www.houkai3rd.com/news",
        "region": "jp"
      },
      {
        "label": "Honkai Impact 3rd · Global official",
        "url": "https://honkaiimpact3.hoyoverse.com/global/en-us/news",
        "region": "global"
      }
    ]
  },
  {
    "id": "stellasora",
    "name": {
      "ko": "스텔라 소라",
      "en": "Stella Sora",
      "ja": "ステラソラ",
      "zh": "星塔旅人"
    },
    "short": "STELLA",
    "genre": {
      "ko": "판타지 액션 RPG",
      "en": "Fantasy Action RPG",
      "ja": "ファンタジーアクションRPG",
      "zh": "奇幻動作RPG"
    },
    "color": "#80d3dc",
    "logo": "https://novaweb-krstatic.yo-star.com/h5/assets/logo-fcd5582b.png",
    "icon": "https://novaweb-krstatic.yo-star.com/h5/favicon-b5900513.png",
    "iconSource": "https://stellasora.kr/",
    "art": "https://nng-phinf.pstatic.net/MjAyNjEwMTVfODYg/MDAxNzkyMDM0OTExODE3.sAn9ave46kUBTN2TJSrqzCCtj8u8CP4sRKjiRx_4y5wg.kjWmyaPXmFygQ_cesCu4HoV9IPMKErMsOEpZhGK6zaMg.JPEG/%E7%89%88%E6%9C%ACKV%EF%BC%88%E5%8A%A0%E6%97%B6%E9%97%B4%E3%80%81%E9%81%93%E5%85%B7%E7%89%88%EF%BC%89.jpg",
    "artPosition": "50% 45%",
    "official": "https://stellasora.kr/",
    "publisher": "YOSTAR",
    "regions": [
      "global"
    ],
    "serviceMode": "shared-global",
    "scheduleRegions": [
      "global"
    ],
    "regionAliases": {
      "kr": "global",
      "jp": "global"
    },
    "regionLabels": {
      "global": {
        "ko": "글로벌 공통",
        "en": "Shared global schedule",
        "ja": "グローバル共通",
        "zh": "全球共通日程"
      }
    },
    "sources": [
      {
        "label": "스텔라 소라 · 한국 공식 공지",
        "url": "https://game.naver.com/lounge/stellasora/board",
        "region": "global"
      },
      {
        "label": "Stella Sora · Official News",
        "url": "https://stellasora.global/news",
        "region": "global"
      },
      {
        "label": "ステラソラ · 公式ニュース",
        "url": "https://stellasora.jp/news",
        "region": "global"
      }
    ]
  },
  {
    "id": "reverse1999",
    "name": {
      "ko": "리버스: 1999",
      "en": "Reverse: 1999",
      "ja": "リバース：1999",
      "zh": "重返未来：1999"
    },
    "short": "RE:1999",
    "genre": {
      "ko": "레트로 전략 턴제 RPG",
      "en": "RETRO STRATEGY RPG",
      "ja": "レトロ戦略ターン制RPG",
      "zh": "复古策略回合制RPG"
    },
    "color": "#c9bd8c",
    "logo": "https://res.17996cdn.net/re1999/img/logo.png",
    "icon": "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/58/9d/b7/589db748-6584-4d3e-c3b8-c43ecada092e/AppIcon-1x_U007emarketing-0-8-0-85-220-0.png/96x96Icon.ApSiOS01-75.webp",
    "iconSource": "https://apps.apple.com/kr/app/%EB%A6%AC%EB%B2%84%EC%8A%A4-1999/id6449023119?eventid=6812584704",
    "art": "https://pn.17996cdn.com/pn/file/p2072_api819_1790132268.jpg",
    "artPosition": "60% 45%",
    "official": "https://reverse1999.haoplay.com/",
    "publisher": "BLUEPOCH / HAOPLAY",
    "regions": [
      "global",
      "kr",
      "jp",
      "cn"
    ],
    "serviceMode": "regional",
    "scheduleRegions": [
      "global",
      "cn"
    ],
    "regionAliases": {
      "kr": "global",
      "jp": "global"
    },
    "regionLabels": {
      "global": {
        "ko": "한국·일본·글로벌",
        "en": "Korea · Japan · Global",
        "ja": "韓国・日本・グローバル",
        "zh": "韩国・日本・国际服"
      },
      "cn": {
        "ko": "중국 본토",
        "en": "China mainland",
        "ja": "中国大陸",
        "zh": "中国大陆"
      }
    },
    "sources": [
      {
        "label": "리버스: 1999 · 한국 공식",
        "url": "https://reverse1999.haoplay.com/",
        "region": "global"
      },
      {
        "label": "Reverse: 1999 · Official",
        "url": "https://re1999.bluepoch.com/en/home/",
        "region": "global"
      },
      {
        "label": "リバース：1999 · 公式",
        "url": "https://re1999.bluepoch.com/jp/home/",
        "region": "global"
      },
      {
        "label": "重返未来：1999 · 中国大陆官方",
        "url": "https://re.bluepoch.com/home/",
        "region": "cn"
      }
    ]
  }
];
export const byId=Object.fromEntries(games.map(g=>[g.id,g])) as Record<string,Game>;

export const isSupportedSchedule=(gameId:string,region:Region)=>games.some(g=>g.id===gameId&&g.regions.includes(region));
