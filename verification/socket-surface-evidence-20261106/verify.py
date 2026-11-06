"""Recompute the accepted original artifact; no browser/runtime execution."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent
archive = root / "accepted-original.zip"
raw = archive.read_bytes()
assert len(raw) == 3167
assert hashlib.sha256(raw).hexdigest() == "47da28ef41c8443467cbbecb7ec4c4bfa82b7788bbae4e1713c776ca56c1549b"
computed = {}
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert len(z.namelist()) == 3
    for name in z.namelist():
        data = json.loads(z.read(name))
        assert data["complete"] and data["cases"] == 700
        identity = data["identity"]
        assert identity["sourceCommit"] == "9d044e0231d40b7df60d1090e47c7148f9be80f7"
        assert identity["sourceTree"] == "500024af7dd63a04610eebfa6b1ae98951978c86"
        rows = data.get("rows") or data["comparison"]["rows"]
        assert len(rows) == 50
        assert [row["boss"] for row in rows] == list(range(1, 51))
        assert all(row["cases"] == 14 for row in rows)
        before = sum(row["sourceBeforeBytes"] for row in rows)
        after = sum(row["sourceAfterBytes"] for row in rows)
        assert before == 31719256
        if data["engine"] == "webkit":
            assert before == after
            assert all(row["sourceBeforeBytes"] == row["sourceAfterBytes"] for row in rows)
        else:
            assert after == 16152520
            assert all(0 < row["sourceAfterBytes"] < row["sourceBeforeBytes"] for row in rows)
        computed[data["engine"]] = {
            "cases": data["cases"], "catalogueBeforeBytes": before,
            "catalogueAfterBytes": after, "catalogueReductionPercent": (1 - after / before) * 100,
            "candidateSha256": identity["candidateSha256"],
            "originalSha256": identity["originalSha256"],
        }
assert computed == json.loads((root / "independent-summary.json").read_text())
print(json.dumps({"verified": True, "cases": 2100, "engines": list(computed)}))
