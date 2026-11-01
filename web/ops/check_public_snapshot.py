"""Check that files bound for the public snapshot contain no developer-machine paths.

The snapshot scope is every tracked file minus the exclusions in web/ops/public-snapshot-policy.json.
Text files are scanned after removing URLs; a Windows/macOS/Linux user-profile path fails the check.
Generic runner homes (/home/user, /home/runner) and the placeholders written by
ops/source_import/sanitize_local_paths.py are allowed. The checker, the sanitizer and their test are skipped
because they must spell out sample personal paths (TOOL_FILES).

  python3 -I web/ops/check_public_snapshot.py          # from the repository root
"""
import json
import pathlib
import re
import subprocess
import sys

URL = re.compile(rb"(?i)\b(?:https?|file)://[^\s\"'<>)\]]+")
PERSONAL = [
    re.compile(rb"(?i)\b[a-z]:(?:\\\\|\\|/)+users(?:\\\\|\\|/)+[^\\/\"'\s,\]\)<>]+"),
    re.compile(rb"(?<![\w.<-])/Users/[A-Za-z0-9._-]+/"),
    re.compile(rb"(?<![\w.<-])/home/(?!(?:user|runner)/)[A-Za-z0-9._-]+/"),
]
TOOL_FILES = {
    "web/ops/check_public_snapshot.py",
    "web/ops/test_public_snapshot.py",
    "web/ops/source_import/sanitize_local_paths.py",
}


def personal_paths(data):
    """Return the personal paths found in text bytes (URLs ignored)."""
    text = URL.sub(b"", data)
    found = []
    for pattern in PERSONAL:
        found.extend(m.group(0).decode("utf-8", "replace") for m in pattern.finditer(text))
    return found


def snapshot_files(repo):
    policy = json.loads((repo / "web/ops/public-snapshot-policy.json").read_text(encoding="utf-8"))
    extensions = tuple(e.lower() for e in policy["excludeExtensions"])
    prefixes = [p for p in policy["excludePaths"] if p.endswith("/")]
    exact = {p for p in policy["excludePaths"] if not p.endswith("/")}
    for listing in policy.get("excludeListedIn", []):
        manifest = json.loads((repo / listing).read_text(encoding="utf-8"))
        exact.update("web/" + f["path"] for f in manifest["files"])
    tracked = subprocess.run(["git", "-C", str(repo), "ls-files", "-z"], check=True, capture_output=True).stdout
    for raw in tracked.split(b"\0"):
        path = raw.decode("utf-8")
        if not path or path in TOOL_FILES or path in exact or path.lower().endswith(extensions) or any(path.startswith(p) for p in prefixes):
            continue
        yield path


def check(repo):
    problems = {}
    scanned = 0
    for path in snapshot_files(repo):
        data = (repo / path).read_bytes()
        if b"\0" in data[:8192]:
            continue
        scanned += 1
        found = personal_paths(data)
        if found:
            problems[path] = sorted(set(found))[:3]
    return scanned, problems


def main():
    repo = pathlib.Path(__file__).resolve().parents[2]
    scanned, problems = check(repo)
    print(json.dumps({"scannedTextFiles": scanned, "filesWithPersonalPaths": len(problems)}))
    for path, found in sorted(problems.items())[:50]:
        print("  %s: %s" % (path, ", ".join(found)))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
