#!/usr/bin/env python3
"""Read-only, local Android evidence. Does not launch/stop apps or change data.
Outputs can contain private device logs: never commit or automatically upload.
"""
import argparse
import datetime
import json
import pathlib
import re
import shutil
import subprocess
import threading
import time


def package_name(value):
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+", value):
        raise argparse.ArgumentTypeError("Use the verified installed Android package name")
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--preflight", action="store_true")
    parser.add_argument("--serial")
    parser.add_argument("--package", type=package_name)
    parser.add_argument("--renderer-pid", type=int, action="append", default=[])
    parser.add_argument("--seconds", type=int, default=120)
    parser.add_argument("--interval", type=int, default=2)
    parser.add_argument("--output", type=pathlib.Path)
    args = parser.parse_args()
    adb = shutil.which("adb")
    if not adb:
        print(json.dumps({"status": "blocked", "reason": "adb-not-installed", "physicalTestExecuted": False}))
        return 2
    devices = subprocess.run([adb, "devices"], capture_output=True, text=True, timeout=15)
    authorized = [line.split()[0] for line in devices.stdout.splitlines()[1:] if line.endswith("\tdevice")]
    if args.preflight:
        print(json.dumps({"status": "ready" if authorized else "blocked", "authorizedDeviceCount": len(authorized),
                          "physicalTestExecuted": False, "causeKnown": False}))
        return 0 if authorized else 2
    if not args.serial or args.serial not in authorized:
        parser.error("Select one already authorized device with --serial; no connection is authorized automatically")
    if not args.package or args.output is None:
        parser.error("--package and a private --output directory are required")
    if not 10 <= args.seconds <= 1800 or not 1 <= args.interval <= 30:
        parser.error("seconds must be 10..1800 and interval 1..30")
    if any(pid <= 0 for pid in args.renderer_pid):
        parser.error("Renderer PID must be positive and independently attributed to this WebView")
    args.output.mkdir(parents=True, exist_ok=True)
    prefix = [adb, "-s", args.serial]

    def command(*parts):
        result = subprocess.run(prefix + list(parts), capture_output=True, text=True, timeout=15)
        return {"exitCode": result.returncode, "stdout": result.stdout, "stderr": result.stderr}

    def at():
        return datetime.datetime.now(datetime.timezone.utc).isoformat()

    metadata = {"status": "collecting", "startedAt": at(), "package": args.package,
                "physicalTestExecuted": False, "collectorExecutedOnDevice": True, "causeKnown": False,
                "rendererAttribution": "operator-provided-only", "rendererPids": args.renderer_pid,
                "model": command("shell", "getprop", "ro.product.model"),
                "androidVersion": command("shell", "getprop", "ro.build.version.release"),
                "webViewVersion": command("shell", "dumpsys", "webviewupdate"),
                "limits": "Host and provided renderer measurements are separate. Logs may contain private data. No automatic transmission."}
    (args.output / "device.local.json").write_text(json.dumps(metadata, indent=2) + "\n")
    # Retain only package-associated live lines. An absent message is not proof
    # that no native failure occurred. Renderer attribution stays explicit.
    log = subprocess.Popen(prefix + ["logcat", "-v", "epoch", "-b", "main", "-b", "system", "-b", "crash", "-T", "1"],
                           stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
    stop = threading.Event()
    pid_set = set(args.renderer_pid)

    def read_logs():
        with (args.output / "matched-logcat.local.txt").open("w") as stream:
            for line in log.stdout:
                if stop.is_set():
                    break
                pids = tuple(pid_set)
                if args.package in line or any(re.search(r"(?<!\d)" + str(pid) + r"(?!\d)", line) for pid in pids):
                    stream.write(line)
                    stream.flush()

    thread = threading.Thread(target=read_logs, daemon=True)
    thread.start()
    deadline = time.monotonic() + args.seconds
    try:
        with (args.output / "memory.local.jsonl").open("w") as stream:
            while time.monotonic() < deadline:
                started = time.monotonic()
                pid_result = command("shell", "pidof", args.package)
                host_pids = [int(value) for value in pid_result["stdout"].split() if value.isdecimal()]
                pid_set.update(host_pids)
                row = {"at": at(), "deviceEpoch": command("shell", "date", "+%s"), "hostPids": host_pids,
                       "host": command("shell", "dumpsys", "meminfo", "--all", args.package),
                       "operatorSelectedRenderers": {str(pid): command("shell", "dumpsys", "meminfo", "--all", str(pid))
                                                     for pid in args.renderer_pid},
                       "processList": command("shell", "ps", "-A", "-o", "PID,PPID,NAME")}
                row["sampleDurationMs"] = round((time.monotonic() - started) * 1000)
                stream.write(json.dumps(row) + "\n")
                stream.flush()
                stop.wait(max(0, min(args.interval - (time.monotonic() - started), deadline - time.monotonic())))
    finally:
        stop.set()
        log.terminate()
        try:
            log.wait(timeout=3)
        except subprocess.TimeoutExpired:
            log.kill()
        thread.join(timeout=3)
        metadata.update(status="capture-finished", finishedAt=at())
        (args.output / "device.local.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(json.dumps({"status": "capture-finished", "causeKnown": False, "automaticUpload": False}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
