"""Exact-operator source blocks keep the directory light and all native facts intact."""
import base64, copy, hashlib, json
from zopfli.gzip import compress as source_gzip

FIELDS = ('sourceUrl', 'image', 'images', 'nameSources', 'stats', 'regionalStats', 'statProgression', 'regionalStatProgression',
          'statDetailLabel', 'traits', 'skillTables', 'regionalSkillTables',
          'sections', 'detailSources')

def packed(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()

def encode(roster):
    if roster.get('gameId') != 'arknights':
        raise ValueError('Wrong packed game')
    out = copy.deepcopy(roster)
    forms = {}
    for character in out['characters']:
        ident = character['id']
        character.setdefault('sourceId', ident)
        if ident in forms or character['sourceId'] != ident:
            raise ValueError('Duplicate or changed native operator identity')
        details = {key: character[key] for key in FIELDS if key in character}
        if not details.get('regionalStatProgression'):
            previous = (roster.get('detailCatalog') or {}).get('forms', {}).get(ident)
            if (roster.get('detailCatalog') or {}).get('version') == 3 and previous and previous.get('sourceId') == ident:
                forms[ident] = copy.deepcopy(previous)
                continue
            raise ValueError('Native progression is missing: ' + ident)
        # Identical default copies are recoverable from their exact regional
        # source. Store each factual table once within the operator block.
        for default, regional in [('stats', 'regionalStats'), ('statProgression', 'regionalStatProgression'), ('skillTables', 'regionalSkillTables')]:
            if details.get(regional) and any(details.get(default) == value for value in details[regional].values()):
                details.pop(default, None)
        body = packed(dict(id=ident, sourceId=ident, details=details))
        if len(body) > 1_000_000:
            raise ValueError('Decoded operator block exceeds bound: ' + ident)
        forms[ident] = dict(sourceId=ident, sha256=hashlib.sha256(body).hexdigest(),
                            bytes=len(body), payload=base64.b64encode(source_gzip(body, numiterations=5)).decode())
    out['detailCatalog'] = dict(version=3, sourceUrl=roster['sourceUrls'][0], checkedAt=roster['checkedAt'], forms=forms)
    wire = copy.deepcopy(out)
    for character in wire['characters']:
        for key in FIELDS:
            if key not in ('traits', 'image'):
                character.pop(key, None)
        # List identity and its full original/declared preview remain immediate;
        # variant captions and alternate complete originals arrive with details.
        if character.get('image'):
            character['image'] = {key: value for key, value in character['image'].items() if key in ('url', 'sourceUrl', 'kind', 'locale', 'preview', 'regions')}
            character['image']['sourceUrl'] = 'https://github.com/fexli/ArknightsResource'
            if character['image'].get('locale') == 'neutral':
                character['image'].pop('locale')
            if set(character['image'].get('regions', [])) == set(character.get('regions', [])):
                character['image'].pop('regions', None)
            if character['image'].get('preview'):
                character['image']['preview'] = {key: value for key, value in character['image']['preview'].items() if key == 'url'}
        character['sourceUrl'] = 'https://github.com/ArknightsAssets/ArknightsGamedata'
        translations = {locale: source for locale, source in next(c for c in out['characters'] if c['id'] == character['id']).get('nameSources', {}).items() if source['kind'] == 'translation'}
        if translations:
            character['nameSources'] = translations
    if len(packed(wire)) > 4_400_000:
        raise ValueError('Complete Arknights wire roster exceeds 4.4MB: ' + str(len(packed(wire))))
    return out, wire
