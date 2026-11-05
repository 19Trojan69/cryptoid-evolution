"""Retain partial native evidence before teardown, including command timeouts."""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import time


def atomic_json(path: Path, value):
    temporary = path.with_suffix(path.suffix + ".partial")
    with temporary.open("w") as handle:
        json.dump(value, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    temporary.replace(path)


class CommandFailed(RuntimeError):
    pass


class Collector:
    def __init__(self, out, status, cwd):
        self.out, self.status, self.cwd = Path(out), status, cwd

    def checkpoint(self, stage=None):
        if stage is not None:
            self.status["stage"] = stage
        self.status["checkpointAt"] = time.time()
        atomic_json(self.out / "result.json", self.status)

    def run(self, args, *, timeout=120, log=None, cwd=None):
        row = {"command": args[:2], "startedAt": time.time(), "finished": False,
               "timedOut": False, "log": log or f"command-{len(self.status.get('commands', []))}.log"}
        self.status.setdefault("commands", []).append(row)
        self.checkpoint()
        started = time.monotonic()
        path = self.out / row["log"]
        # Direct file output cannot be lost in TimeoutExpired or held open by
        # inherited pipes. Stop only this command's own process group.
        with path.open("wb") as handle:
            child = subprocess.Popen(args, cwd=cwd or self.cwd, stdin=subprocess.DEVNULL,
                                     stdout=handle, stderr=subprocess.STDOUT, start_new_session=True)
            try:
                child.wait(timeout=timeout)
            except subprocess.TimeoutExpired:
                row["timedOut"] = True
                for sig in (signal.SIGTERM, signal.SIGKILL):
                    try:
                        os.killpg(child.pid, sig)
                    except ProcessLookupError:
                        pass
                    try:
                        child.wait(timeout=5)
                        if sig == signal.SIGKILL:
                            break
                    except subprocess.TimeoutExpired:
                        continue
            finally:
                handle.flush()
                os.fsync(handle.fileno())
                row.update(finished=True, exitCode=child.poll(),
                           elapsedMs=round((time.monotonic()-started)*1000))
        raw = path.read_bytes()
        row.update(logBytes=len(raw), logSha256=hashlib.sha256(raw).hexdigest())
        self.checkpoint()
        if row["timedOut"] or row["exitCode"] != 0:
            raise CommandFailed(f"{args[0]} failed: timeout={row['timedOut']}, exit={row['exitCode']}; log={row['log']}")
        return raw.decode("utf-8", errors="replace")

    def collect_native(self, lookup, names):
        """Independent of XCTest success. Never repairs or approves a receipt."""
        receipt = {"attempted": True, "copied": [], "errors": []}
        self.status["nativeCollection"] = receipt
        self.checkpoint()
        try:
            container = Path(lookup().strip())
            for source, target in names:
                path = container / "Documents" / source
                try:
                    size = path.stat().st_size
                    if not 0 < size <= 262_144:
                        raise ValueError(f"native record size outside bound: {size}")
                    raw = path.read_bytes()
                    if len(raw) != size:
                        raise ValueError("native record changed during collection")
                    json.loads(raw)
                    (self.out / target).write_bytes(raw)
                    receipt["copied"].append({"file": target, "bytes": len(raw),
                                              "sha256": hashlib.sha256(raw).hexdigest()})
                except Exception as error:
                    receipt["errors"].append({"file": target, "kind": type(error).__name__,
                                               "detail": str(error)[:500]})
        except Exception as error:
            receipt["errors"].append({"kind": type(error).__name__, "detail": str(error)[:500]})
        self.checkpoint()
        return receipt
