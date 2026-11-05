"""Short, external simulator-service/RSS qualification; no game code or JS calls."""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import re
import time
from collector import Collector, atomic_json

FRESH_MS = 10_000  # Nearest native UI snapshot, not an exact simultaneous frame.
MAX_SECONDS = 300


def services(text):
    rows = []
    for line in text.splitlines():
        match = re.fullmatch(r"\s*(\d+)\s+(-?\d+)\s+(.+?)\s*", line)
        if match and int(match[1]) > 0 and re.search(r"webkit|nativeprobe", match[3], re.I):
            rows.append({"pid": int(match[1]), "label": match[3]})
    assert len({row["pid"] for row in rows}) == len(rows), "Ambiguous service PIDs"
    return rows


def rss(text, selected):
    labels = {row["pid"]: row["label"] for row in selected}
    rows = []
    for line in text.splitlines():
        match = re.fullmatch(r"\s*(\d+)\s+(\d+)\s+(\d+)\s+([A-Za-z]{3}\s+[A-Za-z]{3}\s+\d+\s+\d\d:\d\d:\d\d\s+\d{4})\s+(.+?)\s*", line)
        if match and int(match[1]) in labels:
            rows.append({"pid": int(match[1]), "parentPid": int(match[2]), "rssKiB": int(match[3]),
                         "started": " ".join(match[4].split()), "executable": match[5], "label": labels[int(match[1])]})
    return rows


def renderers(rows):
    return [row for row in rows if re.search("webcontent", row["label"], re.I)
            and re.search("webcontent", row["executable"], re.I) and row["rssKiB"] > 0]


def active_anchor(native, source, now_ms):
    point = native["readback"]
    assert native["gameLoaded"] is True and native["nativeContentTerminations"] == native["navigationErrors"] == 0
    assert point["mounted"] is True and point["hidden"] is False
    assert point["scene"]["status"] == "playing" and point["scene"]["technicalPause"] is False
    clock = point["clock"]["latest"]
    assert clock["source"] == source and clock["mode"] == "running" and clock["unobservedGaps"] == 0
    assert 0 <= now_ms - point["observedAt"] <= FRESH_MS, "Native anchor too old"
    return {"sequence": point["sequence"], "runId": clock["id"], "source": source,
            "documentToken": point["documentToken"], "clockElapsedMs": clock["elapsedMs"],
            "nativeObservedAt": point["observedAt"], "nativeFrameAt": point["scene"]["frameAt"],
            "anchorAgeMs": now_ms - point["observedAt"]}


def read_active_native(native_file, source, now_ms):
    # XCTest can reinstall the already built app into a different data UUID.
    # Read only this probe's bounded file in sibling simulator app containers;
    # source, freshness and active-document gates still select exactly one.
    assert native_file.name == "probe-result.json" and native_file.parent.name == "Documents"
    candidates = set(native_file.parents[2].glob("*/Documents/probe-result.json")) | {native_file}
    assert len(candidates) <= 32, "Too many native probe records"
    active = []
    for path in candidates:
        try:
            if path.stat().st_size > 262_144:
                continue
            native = json.loads(path.read_bytes())
            active.append((path, active_anchor(native, source, now_ms)))
        except (OSError, ValueError, KeyError, TypeError, AssertionError):
            continue
    assert len(active) == 1, "Require exactly one fresh active native probe record"
    return active[0]


def validate_memory(state):
    assert state["baselineWebContentPids"] == [], "A pre-existing renderer prevents cold attribution"
    points = [row for row in state["samples"] if row.get("qualified") is True]
    assert len(points) >= 2, "Two distinct active native anchors with readable renderer RSS required"
    assert len({row["before"]["sequence"] for row in points}) >= 2
    assert len({(row["renderer"]["pid"], row["renderer"]["started"]) for row in points}) == 1, "Renderer identity changed"
    assert len({row["before"]["runId"] for row in points}) == 1
    assert len({row["before"]["documentToken"] for row in points}) == 1
    assert all(row["before"]["source"] == state["source"] for row in points)
    assert max(row["before"]["nativeFrameAt"] for row in points) > min(row["before"]["nativeFrameAt"] for row in points)
    for row in points:
        assert row["renderer"]["rssKiB"] > 0 and row["renderer"]["pid"] not in state["baselineWebContentPids"]
        for key in ("source", "runId", "documentToken"):
            assert row["before"][key] == row["after"][key]
        assert 0 <= row["before"]["anchorAgeMs"] <= FRESH_MS
        assert 0 <= row["after"]["anchorAgeMs"] <= FRESH_MS


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("phase", choices=("baseline", "observe"))
    parser.add_argument("--simulator", required=True)
    parser.add_argument("--source", required=True)
    parser.add_argument("--native-file", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    args.out.mkdir(exist_ok=True, parents=True)
    status = {"version": 1, "complete": False, "phase": args.phase, "source": args.source,
              "simulator": args.simulator, "samples": [], "physicalDeviceTest": False,
              "fullBrowserMemoryMeasured": False, "gpuMemoryMeasured": False,
              "nativeTerminationCauseMeasured": False, "whiteScreenFixed": False,
              "sampleScope": "selected services in this simulator bootstrap; host RSS, no unique/PSS total",
              "anchorScope": "nearest native UI snapshot before and after CLI calls; not exact frame time",
              "maxAnchorAgeMs": FRESH_MS, "startedAt": time.time(), "stage": args.phase}
    collector = Collector(args.out, status, args.out)
    os.environ["LC_ALL"] = "C"
    def sample():
        index = len(status.get("commands", []))
        began = time.time() * 1000
        text = collector.run(["xcrun", "simctl", "spawn", args.simulator, "launchctl", "list"], timeout=15, log=f"{args.phase}-services-{index}.log")
        selected = services(text)
        rows = []
        if selected:
            output = collector.run(["ps", "-p", ",".join(str(row["pid"]) for row in selected),
                                    "-o", "pid=,ppid=,rss=,lstart=,comm="], timeout=5, log=f"{args.phase}-rss-{index}.log")
            rows = rss(output, selected)
        return {"startedAtMs": began, "endedAtMs": time.time()*1000, "services": selected, "rows": rows}
    try:
        if args.phase == "baseline":
            status["baseline"] = sample()
            status["baselineWebContentPids"] = [row["pid"] for row in renderers(status["baseline"]["rows"])]
            # A bare simulator must have no active renderer for this qualification.
            assert status["baselineWebContentPids"] == []
            status["complete"] = True
            atomic_json(args.out / "baseline.json", status)
        else:
            baseline = json.loads((args.out / "baseline.json").read_text())
            assert baseline["complete"] is True and baseline["source"] == args.source and baseline["simulator"] == args.simulator
            status["baselineWebContentPids"] = baseline["baselineWebContentPids"]
            seen = set()
            deadline = time.monotonic() + MAX_SECONDS
            while time.monotonic() < deadline and not (args.out / "stop").exists():
                try:
                    before_file, before = read_active_native(args.native_file, args.source, time.time()*1000)
                except (OSError, ValueError, KeyError, TypeError, AssertionError):
                    time.sleep(.5)
                    continue
                if before["sequence"] in seen:
                    time.sleep(.5)
                    continue
                seen.add(before["sequence"])
                row = {"before": before, "qualified": False,
                       "nativeContainerRelocated": before_file != args.native_file}
                status["samples"].append(row)
                collector.checkpoint()
                try:
                    row["measurement"] = sample()
                    after_file, after = read_active_native(args.native_file, args.source, time.time()*1000)
                    assert before_file == after_file, "Native readback container changed during CLI measurement"
                    row["after"] = after
                    actual = renderers(row["measurement"]["rows"])
                    assert len(actual) == 1, "Require exactly one selected WebContent renderer"
                    for key in ("runId", "source", "documentToken"):
                        assert before[key] == after[key]
                    row["renderer"] = actual[0]
                    row["qualified"] = True
                except Exception as error:
                    row["error"] = {"kind": type(error).__name__, "detail": str(error)[:500]}
                collector.checkpoint()
            status["stopObserved"] = (args.out / "stop").exists()
            assert status["stopObserved"], "The outer test did not finish within the sampler budget"
            validate_memory(status)
            status["complete"] = True
    except Exception as error:
        status["error"] = {"kind": type(error).__name__, "detail": str(error)[:1000]}
    finally:
        status["endedAt"] = time.time()
        collector.checkpoint()
        print("CRYPTOID_NATIVE_MEMORY_PREFLIGHT " + json.dumps({key: value for key,value in status.items() if key not in ("commands", "samples", "baseline")}), flush=True)
    return 0 if status["complete"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
