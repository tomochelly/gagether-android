"""Offline private-backup verification. No network access or production writes.

python ops/verify-migration-backup.py d1 BACKUP.tar --out PRIVATE_DIRECTORY
python ops/verify-migration-backup.py r2 INVENTORY.json BUNDLE_DIRECTORY --out PRIVATE_DIRECTORY
The output directory must be NEW. Never commit this directory or input backups.
"""
import argparse
import hashlib
import json
import pathlib
import sqlite3
import tarfile


def digest(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def members(archive):
    result = {}
    for m in archive.getmembers():
        p = pathlib.PurePosixPath(m.name)
        if (not m.isfile() or p.is_absolute() or ".." in p.parts
                or "\\" in m.name or ":" in m.name or m.name in result):
            raise ValueError("Unsafe or duplicate archive member")
        result[m.name] = m
    return result


def read_json(archive, member):
    with archive.extractfile(member) as f:
        return json.load(f)


def quote(name):
    return '"' + name.replace('"', '""') + '"'


def d1(args, out):
    source = pathlib.Path(args.archive)
    with tarfile.open(source, "r:") as archive:
        entries = members(archive)
        manifest = read_json(archive, entries["manifest.json"])
        expected_files = {f["file"] for f in manifest["files"]}
        if len(expected_files) != len(manifest["files"]):
            raise ValueError("Duplicate SQL manifest entry")
        if set(entries) != expected_files | {"manifest.json", "README.txt"}:
            raise ValueError("Missing or unexpected backup members")
        connection = sqlite3.connect(out / "restored.sqlite")
        connection.execute("PRAGMA foreign_keys=ON")
        try:
            for row in sorted(manifest["files"], key=lambda r: r["file"]):
                with archive.extractfile(entries[row["file"]]) as f:
                    sql = f.read()
                if len(sql) != row["bytes"] or hashlib.sha256(sql).hexdigest() != row["sha256"]:
                    raise ValueError("SQL size/hash mismatch")
                connection.executescript(sql.decode("utf-8"))
            rows = {}
            for table in manifest["start"]["tables"]:
                name = table["name"]
                n = connection.execute("SELECT COUNT(*) FROM " + quote(name)).fetchone()[0]
                end = next((t for t in manifest["end"]["tables"] if t["name"] == name), {})
                rows[name] = {"restored": n, "exported": manifest["exportedRows"][name],
                              "start": table["rows"], "end": end.get("rows"),
                              "matches": str(n) == str(manifest["exportedRows"][name]) == table["rows"] == end.get("rows")}
            expected_schema = {(r["type"], r["name"], r["sql"]) for r in manifest["start"]["schema"]
                               if r["sql"] and not r["name"].startswith(("sqlite_", "_cf_"))
                               and not r["tbl_name"].startswith("_cf_")}
            actual_schema = {(r[0], r[1], r[2]) for r in connection.execute("SELECT type,name,sql FROM sqlite_schema")
                             if r[2] and not r[1].startswith("sqlite_")}
            integrity = connection.execute("PRAGMA integrity_check").fetchall() == [("ok",)]
            foreign_keys = connection.execute("PRAGMA foreign_key_check").fetchall() == []
            sequence_matches = all(connection.execute("SELECT CAST(seq AS TEXT) FROM sqlite_sequence WHERE name=?", (t["name"],)).fetchone() == (t["sequence"],)
                                   for t in manifest["start"]["tables"] if t.get("sequence") is not None)
            report = {"kind": "d1", "archiveBytes": source.stat().st_size, "archiveSha256": digest(source),
                      "startedAt": manifest["startedAt"], "finishedAt": manifest["finishedAt"],
                      "atomicSnapshot": False, "changedTables": manifest["changedTables"], "tables": rows,
                      "schemaMatches": expected_schema == actual_schema, "integrityCheck": integrity,
                      "foreignKeyCheck": foreign_keys, "sequenceMatches": sequence_matches,
                      "rowsMatchStartAndEnd": all(r["matches"] for r in rows.values())}
            report["verified"] = all(report[k] for k in ["schemaMatches", "integrityCheck", "foreignKeyCheck", "sequenceMatches", "rowsMatchStartAndEnd"]) and not report["changedTables"]
        finally:
            connection.close()
    return report


def r2(args, out):
    inventory = json.loads(pathlib.Path(args.inventory).read_text(encoding="utf-8"))
    expected = {r["key"]: r for r in inventory["objects"]}
    if len(expected) != inventory["objectCount"] or sum(r["size"] for r in expected.values()) != inventory["totalBytes"]:
        raise ValueError("Invalid inventory totals")
    received, receipts = {}, []
    for path in sorted(pathlib.Path(args.bundles).glob("*.tar")):
        with tarfile.open(path, "r:") as archive:
            entries = members(archive)
            manifest = read_json(archive, entries["manifest.json"])
            if set(entries) != {r["file"] for r in manifest["files"]} | {"manifest.json"}:
                raise ValueError("Missing or unexpected R2 archive members")
            for row in manifest["files"]:
                key = row["key"]
                if key in received or key not in expected:
                    raise ValueError("Duplicate or unlisted R2 object")
                if any(row.get(k) != expected[key].get(k) for k in ["size", "etag", "version", "contentType", "httpMetadata", "customMetadata", "uploaded", "file"]):
                    raise ValueError("Object metadata changed since inventory")
                h, size = hashlib.sha256(), 0
                with archive.extractfile(entries[row["file"]]) as f:
                    for block in iter(lambda: f.read(1024 * 1024), b""):
                        h.update(block)
                        size += len(block)
                if size != row["size"] or h.hexdigest() != row["sha256"]:
                    raise ValueError("R2 object size/hash mismatch")
                received[key] = row
            if sum(r["size"] for r in manifest["files"]) != manifest["totalBytes"]:
                raise ValueError("Bundle size mismatch")
        receipts.append({"file": path.name, "bytes": path.stat().st_size, "sha256": digest(path)})
    report = {"kind": "r2", "objectCount": len(received), "totalBytes": sum(r["size"] for r in received.values()),
              "expectedCount": inventory["objectCount"], "expectedBytes": inventory["totalBytes"],
              "missingCount": len(set(expected) - set(received)), "bundles": receipts,
              "verified": set(expected) == set(received)}
    (out / "r2-complete-manifest.private.json").write_text(json.dumps({**inventory, "objects": list(received.values()), "verification": report}, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="kind", required=True)
    p = commands.add_parser("d1")
    p.add_argument("archive")
    p.add_argument("--out", required=True)
    p = commands.add_parser("r2")
    p.add_argument("inventory")
    p.add_argument("bundles")
    p.add_argument("--out", required=True)
    args = parser.parse_args()
    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=False)
    report = d1(args, out) if args.kind == "d1" else r2(args, out)
    (out / "verification.private.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"kind": args.kind, "verified": report["verified"]}))
    raise SystemExit(0 if report["verified"] else 2)


if __name__ == "__main__":
    main()
