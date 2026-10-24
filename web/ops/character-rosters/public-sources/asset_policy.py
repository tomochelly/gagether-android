"""Sample-based asset-class language policy. Never a claim of full-library visual review.
Exact per-file overrides take precedence. Unrecognized and mixed-language classes stay unknown.
"""
import json,re
from pathlib import Path
POLICY=json.loads((Path(__file__).parent/'asset-classification.json').read_text())
def classify_image(value):
    if not value:return value
    result=dict(value);url=result.get('url','')
    for item in POLICY['fileExceptions']:
        if url==item['url']:
            if item.get('locale'):result['locale']=item['locale']
            else:result.pop('locale',None)
            if item.get('kind'):result['kind']=item['kind']
            return result
    for rule in POLICY['assetClasses']:
        if re.search(rule['urlPattern'],url):
            if rule.get('locale'):result['locale']=rule['locale']
            else:result.pop('locale',None)
            if rule.get('kind'):result['kind']=rule['kind']
            return result
    # A new provider/class cannot silently inherit an old neutral label.
    result.pop('locale',None)
    return result
