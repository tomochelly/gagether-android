#!/usr/bin/env python3
"""Exact four-client Arknights reference data; no account APIs or server writes.

Client mirrors are community sources, not official-web publication receipts.
Regional membership, localized names and mechanics are joined by exact operator
IDs. Native keyframes are shown as checkpoints, never invented intermediate
levels. Rank-specific prose is retained in full in bounded parameter chunks.
"""
from __future__ import annotations
import argparse, concurrent.futures, copy, datetime as dt, hashlib, html, json
from pathlib import Path
import re, sys, urllib.request
from decimal import Decimal, ROUND_HALF_UP

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from enrich_c import PROFESSIONS, POSITIONS, TRAIT_LABELS, LABELS

LOCALES = ('ko', 'en', 'ja', 'zh')
SERVICES = {'ko': 'kr', 'en': 'global', 'ja': 'jp', 'zh': 'cn'}
CLIENTS = {'ko': 'kr', 'en': 'en', 'ja': 'jp', 'zh': 'cn'}
FILES = ('character_table', 'skill_table', 'skin_table', 'handbook_info_table', 'uniequip_table', 'char_patch_table')
SOURCE = 'https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/'
ICON_COMMIT = '184aa662f210100150716d4f58cadc0b4e3642fc'
ICON_SOURCE = 'https://raw.githubusercontent.com/fexli/ArknightsResource/' + ICON_COMMIT + '/skills/'

def C(ko='', en='', ja='', zh=''):
    return dict(zip(LOCALES, (ko, en, ja, zh)))

def native(locale, value):
    return {l: value if l == locale else '' for l in LOCALES}

def now():
    return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00', 'Z')

def packed(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()

def sha(data):
    return hashlib.sha256(data).hexdigest()

def atomic(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_bytes(packed(value) + b'\n')
    temporary.replace(path)

def source_url(locale, filename):
    if locale not in CLIENTS or filename not in FILES:
        raise ValueError('Unknown fixed native source')
    return SOURCE + CLIENTS[locale] + '/gamedata/excel/' + filename + '.json'

def download_native(directory, refresh=False):
    """Download only the six fixed client tables, refreshing after six hours."""
    directory = Path(directory)
    receipts_path = directory / 'source-receipts.json'
    receipts = json.loads(receipts_path.read_text()) if receipts_path.exists() else []
    indexed = {(r['locale'], r['file']): r for r in receipts}

    def read(task):
        locale, filename = task
        url = source_url(locale, filename)
        path = directory / locale / (filename + '.json')
        old = indexed.get(task)
        if old and path.exists() and not refresh:
            body = path.read_bytes()
            age = (dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(old['checkedAt'].replace('Z', '+00:00'))).total_seconds()
            if old.get('url') == url and sha(body) == old.get('sha256') and 0 <= age < 21600:
                return old
        request = urllib.request.Request(url, headers={'User-Agent': 'GAGETHER-ArknightsReference/1.0', 'Accept': 'application/json'})
        with urllib.request.urlopen(request, timeout=60) as response:
            body = response.read(40_000_001)
            if response.status != 200 or len(body) > 40_000_000:
                raise ValueError('Native source exceeded fixed response bound')
        data = json.loads(body)
        if not isinstance(data, dict):
            raise ValueError('Native table must be an object')
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(body)
        return dict(locale=locale, file=filename, url=url, checkedAt=now(), sha256=sha(body), bytes=len(body), status=200, entries=len(data))

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        result = list(pool.map(read, [(l, f) for l in LOCALES for f in FILES]))
    atomic(receipts_path, result)
    return result

def load_native(directory):
    directory = Path(directory)
    receipts = json.loads((directory / 'source-receipts.json').read_text())
    indexed = {(r['locale'], r['file']): r for r in receipts}
    tables = {}
    for locale in LOCALES:
        tables[locale] = {}
        for filename in FILES:
            receipt = indexed.get((locale, filename))
            body = (directory / locale / (filename + '.json')).read_bytes()
            if not receipt or receipt.get('url') != source_url(locale, filename) or sha(body) != receipt.get('sha256'):
                raise ValueError('Native source identity/hash mismatch: ' + locale + '/' + filename)
            tables[locale][filename] = json.loads(body)
    return tables, receipts

def playable(table):
    return {k: v for k, v in table.items() if k.startswith('char_') and not v.get('isNotObtainable') and v.get('profession') not in ('TOKEN', 'TRAP')}

def playable_inventory(table, patches=None):
    """Class-change templates are playable only through an obtainable base.

    patchChars alone also contains implementation templates. The explicit
    infos/base/tmplIds join proves which separate exact class forms belong to
    an actual operator; orphan or NPC templates never become invented releases.
    """
    result = playable(table)
    patches = patches or {}
    owners = {}
    for base, info in patches.get('infos', {}).items():
        if base not in result:
            continue
        if info.get('default') not in info.get('tmplIds', []) or base not in info.get('tmplIds', []):
            raise ValueError('Invalid native class-change base identity')
        for identity in info['tmplIds']:
            if identity == base:
                continue
            raw = patches.get('patchChars', {}).get(identity)
            if not raw:
                raise ValueError('Declared native class-change template missing')
            if identity in owners and owners[identity] != base:
                raise ValueError('Ambiguous native class-change template owner')
            owners[identity] = base
            if playable({identity: raw}):
                if identity in result and result[identity] != raw:
                    raise ValueError('Conflicting class-change character identity')
                result[identity] = raw
    return result

def number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float, Decimal)):
        raise ValueError('Native numeric field is not a number')
    n = Decimal(str(value))
    if not n.is_finite():
        raise ValueError('Non-finite native number')
    return format(n.normalize(), 'f')

def clean(value):
    return html.unescape(re.sub(r'<[^>]*>', '', str(value or ''))).replace('\\n', '\n').strip()

def expand_description(description, blackboard=(), duration=None):
    """Expand the client's blackboard format, including explicit unary minus."""
    values = {b['key'].casefold(): b for b in blackboard}
    if duration is not None and 'duration' not in values:
        values['duration'] = {'value': duration}

    def replace(match):
        token = match[1]
        key, separator, fmt = token.partition(':')
        key = key.casefold()
        negative = False
        if key not in values and key.startswith('-'):
            key = key[1:]
            negative = True
        if key not in values:
            raise ValueError('Unbound native description parameter: ' + token)
        item = values[key]
        if item.get('valueStr') is not None:
            if negative or separator:
                raise ValueError('Formatted string blackboard value')
            return str(item['valueStr'])
        value = Decimal(str(item['value'])) * (-1 if negative else 1)
        percent = fmt.endswith('%')
        if percent:
            value *= 100
            fmt = fmt[:-1]
        if separator:
            if not re.fullmatch(r'0(?:\.0+)?', fmt):
                raise ValueError('Unknown native numerical format: ' + fmt)
            digits = len(fmt.partition('.')[2])
            rendered = format(value.quantize(Decimal(1).scaleb(-digits), rounding=ROUND_HALF_UP), '.' + str(digits) + 'f')
        else:
            rendered = number(value)
        return rendered + ('%' if percent else '')

    result = re.sub(r'\{([^{}]+)\}', replace, str(description or ''))
    if '{' in result or '}' in result:
        raise ValueError('Unresolved native description markup')
    return clean(result)

BASIS = C('선택한 실제 서비스의 클라이언트 원본 체크포인트. 신뢰도·잠재능력·모듈·편성 효과 제외. 중간 레벨은 추정하지 않음.',
          'Native checkpoints from the selected service client. Excludes Trust, Potential, Modules and squad effects. Intermediate levels are not estimated.',
          '選択サーバーのクライアントに収録された実値。信頼度・潜在・モジュール・編成効果を除外。中間レベルは推定しない。',
          '所选区服客户端的原始关键帧；不含信赖、潜能、模组或编队效果，不推算中间等级。')
SKILL_BASIS = C('선택한 실제 서비스의 기본 스킬 원문·수치. 신뢰도·잠재능력·모듈 강화 제외. 8~10은 실제 특화 1~3단계.',
                'Native base skill text and values for the selected service. Excludes Trust, Potential and Module upgrades. Entries 8–10 are Mastery I–III.',
                '選択サーバーの基本スキル原文・数値。信頼度・潜在・モジュール強化を除外。8～10は特化I～III。',
                '所选区服基础技能原文与数值；不含信赖、潜能或模组强化。8～10分别为专精一～三。')
TALENT_BASIS = C('원본에 선언된 정예화·레벨·잠재능력 조건별 재능. 각 조건은 별개이며 기본 능력치에 합산하지 않음.',
                 'Native Talent variants, each with its declared promotion, level and Potential condition. These are alternatives and are not added to the base stat panel.',
                 '昇進・レベル・潜在条件ごとの原文の素質。各条件は別仕様で、基本ステータスに加算しない。',
                 '原文按精英化、等级及潜能条件分别记录的天赋；各项为不同条件，不叠加到基础属性。')
STAT_FIELDS = [('hp', 'maxHp'), ('atk', 'atk'), ('def', 'def'), ('res', 'magicResistance'), ('cost', 'cost'), ('block', 'blockCnt'), ('interval', 'baseAttackTime'), ('redeploy', 'respawnTime')]
LABELS = {**LABELS, 'redeploy': C('재배치 시간', 'Redeploy time', '再配置時間', '再部署时间')}
SKILL_VALUES = {'spCost': C('필요 SP', 'SP cost', '必要SP', '所需技力'), 'initSp': C('초기 SP', 'Initial SP', '初期SP', '初始技力'), 'duration': C('지속 시간', 'Duration', '効果時間', '持续时间'), 'maxChargeTime': C('최대 충전 횟수', 'Maximum charges', '最大チャージ数', '最大充能次数')}
TYPE = C('스킬', 'Skill', 'スキル', '技能')
TALENT = C('재능', 'Talent', '素質', '天赋')
TRAIT = C('특성', 'Trait', '特性', '特性')
ACTIVATION = {'AUTO': C('자동 발동', 'Automatic activation', '自動発動', '自动触发'), 'MANUAL': C('수동 발동', 'Manual activation', '手動発動', '手动触发'), 'PASSIVE': C('패시브', 'Passive', 'パッシブ', '被动')}
SP = {'INCREASE_WITH_TIME': C('자동 회복', 'Automatic recovery', '自動回復', '自动回复'), 'INCREASE_WHEN_ATTACK': C('공격 회복', 'Offensive recovery', '攻撃回復', '攻击回复'), 'INCREASE_WHEN_TAKEN_DAMAGE': C('피격 회복', 'Defensive recovery', '被撃回復', '受击回复'), 'PASSIVE': C('패시브', 'Passive', 'パッシブ', '被动')}

def phase_number(phase):
    if not re.fullmatch(r'PHASE_[0-2]', str(phase)):
        raise ValueError('Unknown native promotion phase')
    return int(phase[-1])

def phase_label(stage):
    return C('정예화 ' + str(stage), 'Elite ' + str(stage), '昇進' + str(stage), '精英化' + str(stage))

def checkpoint_progression(raw, locale, filename='character_table'):
    rows = []
    stages = []
    for index, phase in enumerate(raw['phases']):
        stages.append({'id': index, 'label': phase_label(index)})
        anchors = phase['attributesKeyFrames']
        if not anchors or anchors[0]['level'] != 1 or anchors[-1]['level'] != phase['maxLevel']:
            raise ValueError('Native phase endpoints are incomplete')
        for frame in anchors:
            vals = {}
            for key, field in STAT_FIELDS:
                vals[key] = number(frame['data'][field]) + ('s' if key in ('interval', 'redeploy') else '')
            rows.append({'stage': index, 'level': frame['level'], 'values': vals})
    return dict(sourceUrl=source_url(locale, filename), sourceKind='community', basis=BASIS,
                stageLabel=C('정예화', 'Promotion', '昇進', '精英化'),
                levelLabel=C('원본 레벨 체크포인트', 'Native level checkpoint', '原文のレベル', '原始等级关键帧'),
                defaultLevel=rows[-1]['level'], stats=[dict(id=key, label=LABELS[key], group='primary' if key in ('hp', 'atk', 'def') else 'detail') for key, _ in STAT_FIELDS],
                stages=stages, rows=rows)

def condition_label(condition=None, potential=0):
    condition = condition or {'phase': 'PHASE_0', 'level': 1}
    stage, level, p = phase_number(condition['phase']), condition['level'], potential + 1
    return C(f'정예화 {stage} · Lv.{level} · 잠재능력 {p}', f'Elite {stage} · Lv.{level} · Potential {p}', f'昇進{stage}・Lv.{level}・潜在{p}', f'精英化{stage}·{level}级·潜能{p}')

def prose_parameters(texts, locale):
    """A single description may change structurally between ranks/conditions.

    Split exact rendered native prose into<=300-character columns. Joining the
    indexed columns at any rank reproduces its complete source text, including
    newlines, instead of pretending every rank shares one numeric template.
    """
    count = max(1, max((len(s) + 299) // 300 for s in texts))
    if count > 30:
        raise ValueError('Native skill prose exceeds exact chunk bound')
    params = [[text[i * 300:(i + 1) * 300] for text in texts] for i in range(count)]
    return native(locale, ''.join('{' + str(i + 1) + '}' for i in range(count))), {locale: params}

def skill_icon(skill, declared):
    key = skill.get('iconId') or skill['skillId']
    name = 'skill_icon_' + key + '.png'
    return ICON_SOURCE + name if name in declared else None

def make_skill(skill, locale, declared=(), unlock=None):
    levels = skill['levels']
    if not 1 <= len(levels) <= 30:
        raise ValueError('Native skill level range invalid')
    texts = [expand_description(row.get('description'), row.get('blackboard') or (), row.get('duration')) for row in levels]
    # Some true passive skills publish their mechanics via Talent instead.
    if not any(texts):
        texts = [clean(row.get('name')) for row in levels]
    template, parameters = prose_parameters(texts, locale)
    activation = levels[0].get('skillType')
    recovery = (levels[0].get('spData') or {}).get('spType')
    # The client serializes SPType.NONE as numeric8 for passive/on-deploy
    # skills. Only that observed paired enum is accepted; other unknown enums
    # still fail rather than acquire a fabricated recovery mechanism.
    if recovery == 8 and activation == 'PASSIVE':
        recovery = 'PASSIVE'
    if activation not in ACTIVATION or recovery not in SP:
        raise ValueError('Unknown skill activation/recovery enum')
    kind = {l: ' · '.join(dict.fromkeys([TYPE[l], ACTIVATION[activation][l], SP[recovery][l]])) for l in LOCALES}
    if unlock:
        label = condition_label(unlock)
        kind = {l: kind[l] + ' · ' + label[l] for l in LOCALES}
    values = []
    for field, label in SKILL_VALUES.items():
        data = [row.get('duration') if field == 'duration' else (row.get('spData') or {}).get(field) for row in levels]
        if all(v is not None for v in data) and not (field == 'duration' and any(v < 0 for v in data)):
            values.append(dict(id=field, label=label, levels=[number(v) + ('s' if field == 'duration' and v >= 0 else '') for v in data]))
    result = dict(id='skill:' + skill['skillId'], name=native(locale, clean(levels[0]['name'])), nameLocale=locale, type=kind,
                  sourceUrl=source_url(locale, 'skill_table'), sourceKind='community', basis=SKILL_BASIS,
                  regions=[SERVICES[locale]], maxLevel=len(levels), descriptionTemplate=template, parameters=parameters,
                  levelLabels=[C('Lv.' + str(i + 1), 'Lv.' + str(i + 1), 'Lv.' + str(i + 1), str(i + 1) + '级') if i < 7 else C('특화 ' + str(i - 6), 'Mastery ' + str(i - 6), '特化' + str(i - 6), '专精' + str(i - 6)) for i in range(len(levels))], values=values)
    icon = skill_icon(skill, declared)
    if icon:
        result['icon'] = icon
    return result

def condition_table(id, candidates, locale, kind, basis=TALENT_BASIS, filename='character_table'):
    candidates = [c for c in candidates if c and c.get('description')]
    if not candidates:
        return None
    # The first shown variant is the highest promotion without duplicate
    # Potential upgrades. Every other explicit native condition stays selectable.
    candidates.sort(key=lambda c: (c.get('requiredPotentialRank', 0) != 0, -phase_number(c.get('unlockCondition', {}).get('phase', 'PHASE_0')), -c.get('unlockCondition', {}).get('level', 1), c.get('requiredPotentialRank', 0)))
    if len(candidates) > 30:
        raise ValueError('Too many native Talent conditions')
    texts = [expand_description(c['description'], c.get('blackboard') or ()) for c in candidates]
    template, parameters = prose_parameters(texts, locale)
    return dict(id=id, name=native(locale, clean(candidates[0].get('name')) or kind[locale]), nameLocale=locale, type=kind,
                sourceUrl=source_url(locale, filename), sourceKind='community', basis=basis, regions=[SERVICES[locale]],
                maxLevel=len(candidates), levelLabels=[condition_label(c.get('unlockCondition'), c.get('requiredPotentialRank', 0)) for c in candidates],
                descriptionTemplate=template, parameters=parameters, values=[])

def native_tables(raw, locale, skills, declared, filename='character_table'):
    result = []
    for ref in raw.get('skills') or []:
        skill_id = ref.get('skillId')
        if not skill_id:
            continue
        skill = skills.get(skill_id)
        if not skill or skill.get('skillId') != skill_id:
            raise ValueError('Missing exact native skill identity: ' + str(skill_id))
        result.append(make_skill(skill, locale, declared, ref.get('unlockCond')))
    for index, talent in enumerate(raw.get('talents') or []):
        table = condition_table('talent:' + str(index), talent.get('candidates') or [], locale, TALENT, filename=filename)
        if table:
            result.append(table)
    trait = raw.get('trait') or {}
    candidates = trait.get('candidates') or []
    if not candidates and raw.get('description'):
        candidates = [{'name': TRAIT[locale], 'description': raw['description'], 'blackboard': []}]
    table = condition_table('trait', candidates, locale, TRAIT, BASIS, filename)
    if table:
        result.append(table)
    if len(result) > 40:
        raise ValueError('Native detail table bound exceeded')
    return result

def enrich_character(original, available, tables, declared):
    row = copy.deepcopy(original)
    row.setdefault('sourceId', row['id'])
    row.setdefault('name', C())
    row.setdefault('nameSources', {})
    regions, stats, progression, skills, sections = [], {}, {}, {}, []
    for locale in LOCALES:
        raw = available.get(locale)
        if not raw:
            continue
        service = SERVICES[locale]
        filename = 'char_patch_table' if row['id'] in tables[locale].get('char_patch_table', {}).get('patchChars', {}) else 'character_table'
        regions.append(service)
        row['name'][locale] = raw['name']
        row['nameSources'][locale] = dict(url=source_url(locale, filename), kind='community')
        p = checkpoint_progression(raw, locale, filename)
        progression[service] = p
        stats[service] = [dict(id=s['id'], label=s['label'], value=p['rows'][0]['values'][s['id']], basis=BASIS, group=s['group']) for s in p['stats']]
        skills[service] = native_tables(raw, locale, tables[locale]['skill_table'], declared, filename)
        body = '\n\n'.join(clean(raw.get(k)) for k in ('itemUsage', 'itemDesc') if clean(raw.get(k)))
        if body:
            if len(body) > 3000:
                raise ValueError('Native operator introduction exceeds field bound')
            sections.append(dict(id='arknights-introduction-' + service, title=C('오퍼레이터 소개', 'Operator introduction', 'オペレーター紹介', '干员介绍'), body=native(locale, body), regions=[service]))
    primary = available.get('ko') or available.get('en') or available.get('ja') or available['zh']
    primary_locale = next(l for l in LOCALES if l in available)
    row['sourceUrl'] = source_url(primary_locale, 'char_patch_table' if row['id'] in tables[primary_locale].get('char_patch_table', {}).get('patchChars', {}) else 'character_table')
    row['sourceKind'] = 'community'
    primary_service = next(s for s in ('kr', 'global', 'jp', 'cn') if s in stats)
    row['regions'] = regions
    row['rarity'] = int(primary['rarity'].split('_')[-1])
    row['stats'] = stats[primary_service]
    row['regionalStats'] = stats
    row['statProgression'] = progression[primary_service]
    row['regionalStatProgression'] = progression
    row['skillTables'] = skills[primary_service]
    row['regionalSkillTables'] = skills
    row['sections'] = [s for s in row.get('sections', []) if not s['id'].startswith('arknights-introduction-')] + sections
    traits = {t['id']: t for t in row.get('traits') or []}
    for id, value in [('profession', PROFESSIONS.get(primary['profession'])), ('position', POSITIONS.get(primary['position']))]:
        if value:
            traits[id] = {**traits.get(id, {}), 'id': id, 'label': TRAIT_LABELS[id], 'value': value}
    row['traits'] = list(traits.values())
    sources = [dict(url=source_url(l, f), kind='community') for l in available for f in ('char_patch_table' if row['id'] in tables[l].get('char_patch_table', {}).get('patchChars', {}) else 'character_table', 'skill_table')]
    row['detailSources'] = list({x['url']: x for x in [*row.get('detailSources', []), *sources]}.values())
    if len(row['detailSources']) > 40:
        raise ValueError('Source reference bound exceeded')
    return row

def enrich(document, native_dir, icon_tree=None):
    if document.get('gameId') != 'arknights':
        raise ValueError('Only exact Arknights roster is supported')
    tables, receipts = load_native(native_dir)
    inventories = {l: playable_inventory(tables[l]['character_table'], tables[l]['char_patch_table']) for l in LOCALES}
    if any(len(v) < 300 for v in inventories.values()):
        raise ValueError('Incomplete native playable inventory')
    declared = set()
    icon_tree = Path(icon_tree) if icon_tree else Path(__file__).with_name('skill-icons.json')
    if icon_tree.exists():
        tree = json.loads(icon_tree.read_text())
        if tree.get('version') == 1:
            if tree.get('repository') != 'fexli/ArknightsResource' or tree.get('commit') != ICON_COMMIT:
                raise ValueError('Declared skill icon source identity mismatch')
            paths = tree.get('paths')
            if not isinstance(paths, list) or len(paths) != len(set(paths)) or any(not re.fullmatch(r'skill_icon_[^/\\]+\.png', p) for p in paths):
                raise ValueError('Invalid fixed skill icon inventory')
            declared = set(paths)
        else:
            if tree.get('truncated'):
                raise ValueError('Incomplete declared skill icon inventory')
            declared = {r['path'] for r in tree['tree'] if r['type'] == 'blob'}
    doc = copy.deepcopy(document)
    old = {c['id']: c for c in doc['characters']}
    ids = list(dict.fromkeys([*old, *(k for l in LOCALES for k in inventories[l])]))
    output, failures, unknown = [], [], []
    for id in ids:
        available = {l: inventory[id] for l, inventory in inventories.items() if id in inventory}
        previous = old.get(id)
        if not available:
            if previous:
                output.append(copy.deepcopy(previous))
                unknown.append(id)
            continue
        previous = previous or dict(id=id, name=C(), traits=[], stats=[], images=[], sourceUrl=source_url(next(iter(available)), 'character_table'), sourceKind='community')
        try:
            output.append(enrich_character(previous, available, tables, declared))
        except Exception as error:
            failures.append(dict(id=id, error=type(error).__name__ + ': ' + str(error)))
            # A source failure does not erase already published exact facts.
            output.append(copy.deepcopy(previous))
    version = 'arknights-native-sha256:' + sha(packed(sorted((r['locale'], r['file'], r['sha256']) for r in receipts)))
    changed = packed(doc['characters']) != packed(output)
    doc['characters'] = output
    doc['sourceName'] = 'Arknights four-service native client tables (community mirror)'
    doc['sourceUrls'] = list(dict.fromkeys([*doc['sourceUrls'], *(r['url'] for r in receipts)]))
    if len(doc['sourceUrls']) > 40:
        raise ValueError('Roster source URL bound exceeded')
    if doc.get('sourceVersion') != version or changed:
        doc['checkedAt'] = max(r['checkedAt'] for r in receipts)
    doc['sourceVersion'] = version
    doc['coverage'] = {**doc.get('coverage', {}), 'sourceCount': len(set(k for l in LOCALES for t in ('character_table', 'char_patch_table') for k in (tables[l][t]['patchChars'] if t == 'char_patch_table' else tables[l][t]))), 'includedCount': len(output), 'nativeNameCounts': {l: len(v) for l, v in inventories.items()},
                       'note': 'Exact playable membership from each native client. TOKEN/TRAP/unobtainable rows excluded; CN-only operators are not copied into KR/JP/Global. Native Elite phase endpoints, base skill ranks and individually conditioned Talent variants; no inferred intermediate levels, Trust/Potential/Module panel bonuses or unreleased-announcement stats.'}
    report = dict(gameId='arknights', status='partial' if failures or unknown else 'ok', checkedAt=now(), sourceVersion=version, characters=len(output), serviceCounts={SERVICES[l]: len(v) for l, v in inventories.items()},
                  classChangeIds={SERVICES[l]: [id for id in inventories[l] if id in tables[l]['char_patch_table']['patchChars']] for l in LOCALES},
                  addedIds=[c['id'] for c in output if c['id'] not in old], addedServiceIds={SERVICES[l]: [id for id in inventories[l] if id in old and SERVICES[l] not in old[id].get('regions', [])] for l in LOCALES},
                  preservedMissingSourceIds=unknown, detailFailures=failures, sources=receipts,
                  skillTables=sum(len(v) for c in output for v in c.get('regionalSkillTables', {}).values()),
                  skillRankDescriptions=sum(s.get('maxLevel', 1) for c in output for v in c.get('regionalSkillTables', {}).values() for s in v),
                  declaredIconUrls=sorted({s['icon'] for c in output for v in c.get('regionalSkillTables', {}).values() for s in v if s.get('icon')}),
                  nativeCheckpointRows=sum(len(p['rows']) for c in output for p in c.get('regionalStatProgression', {}).values()))
    return doc, report

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--report', required=True, type=Path)
    parser.add_argument('--native-dir', required=True, type=Path)
    parser.add_argument('--icon-tree', type=Path)
    parser.add_argument('--fetch', action='store_true')
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    if args.fetch or args.refresh:
        download_native(args.native_dir, args.refresh)
    out, report = enrich(json.loads(args.input.read_text()), args.native_dir, args.icon_tree)
    atomic(args.output, out)
    atomic(args.report, report)
    print(json.dumps({k: v for k, v in report.items() if k not in ('sources', 'declaredIconUrls', 'addedServiceIds')}, ensure_ascii=False))
    if report['detailFailures']:
        raise SystemExit(1)

if __name__ == '__main__':
    main()
