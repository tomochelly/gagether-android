"""Structural check of GitHub Actions workflow files (public repository CI).

Parses every *.yml/*.yaml file given (directories are searched) and checks what a typo or a
bad merge most often breaks: valid YAML, a name, triggers, explicit top-level permissions,
jobs that either run steps or call a reusable workflow, steps with exactly one of run/uses,
action references pinned with @, and local reusable workflows that exist and declare
workflow_call. This is not actionlint; it does not check expressions or action inputs.

  python3 -I web/ops/check_workflows.py .github/workflows
"""
import json
import pathlib
import sys

import yaml

LOCAL_PREFIX = 'tomochelly/gagether-android/.github/workflows/'


def triggers(doc):
    # PyYAML (YAML 1.1) reads the bare key `on` as True.
    return doc.get('on', doc.get(True))


def check_file(path, available):
    errors = []
    try:
        doc = yaml.safe_load(path.read_text(encoding='utf-8'))
    except yaml.YAMLError as error:
        return ['%s: invalid YAML: %s' % (path.name, str(error).splitlines()[0])]
    if not isinstance(doc, dict):
        return ['%s: not a mapping' % path.name]
    for key in ('name', 'jobs', 'permissions'):
        if key not in doc: errors.append('%s: missing top-level %s' % (path.name, key))
    if triggers(doc) is None: errors.append('%s: missing on' % path.name)
    for job_id, job in (doc.get('jobs') or {}).items():
        where = '%s: job %s' % (path.name, job_id)
        if not isinstance(job, dict): errors.append(where + ': not a mapping'); continue
        if 'uses' in job:
            ref = job['uses']
            if not isinstance(ref, str) or '@' not in ref: errors.append(where + ': uses must name a ref'); continue
            if ref.startswith(LOCAL_PREFIX) or ref.startswith('./.github/workflows/'):
                target = ref.split('/')[-1].split('@')[0]
                called = available.get(target)
                if called is None: errors.append(where + ': calls missing workflow ' + target)
                elif not isinstance(triggers(called) or {}, dict) or 'workflow_call' not in (triggers(called) or {}):
                    errors.append(where + ': %s does not declare workflow_call' % target)
            continue
        if 'runs-on' not in job: errors.append(where + ': needs runs-on or uses')
        steps = job.get('steps')
        if not isinstance(steps, list) or not steps: errors.append(where + ': needs steps'); continue
        for index, step in enumerate(steps, 1):
            if not isinstance(step, dict) or ('run' in step) == ('uses' in step):
                errors.append('%s step %d: needs exactly one of run or uses' % (where, index)); continue
            if 'uses' in step and (not isinstance(step['uses'], str) or '@' not in step['uses']):
                errors.append('%s step %d: action must be pinned with @' % (where, index))
    return errors


def main(argv):
    files = []
    for arg in argv or ['.github/workflows']:
        p = pathlib.Path(arg)
        files += sorted(p.glob('*.y*ml')) if p.is_dir() else [p]
    docs = {}
    for f in files:
        try: docs[f.name] = yaml.safe_load(f.read_text(encoding='utf-8'))
        except yaml.YAMLError: pass
    errors = [e for f in files for e in check_file(f, docs)]
    print(json.dumps({'workflows': len(files), 'errors': errors}, ensure_ascii=False, indent=1))
    return 1 if errors or not files else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
