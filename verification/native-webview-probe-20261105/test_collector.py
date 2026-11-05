import json
from pathlib import Path
import sys
import tempfile
import unittest
from collector import Collector, CommandFailed


class FailureEvidence(unittest.TestCase):
    def test_nonzero_and_timeout_keep_outputs_and_partial_native_data(self):
        for timeout in (False, True):
            with self.subTest(timeout=timeout), tempfile.TemporaryDirectory() as temporary:
                folder = Path(temporary)
                documents = folder / "container/Documents"
                documents.mkdir(parents=True)
                native = b'{"complete":false,"lastStage":"playing"}'
                (documents / "probe-result.json").write_bytes(native)
                state = {"complete": False}
                collector = Collector(folder, state, folder)
                code = "import time,sys;print('last native stage',flush=True);" + ("time.sleep(20)" if timeout else "sys.exit(3)")
                with self.assertRaises(CommandFailed):
                    collector.run([sys.executable, "-c", code], timeout=.2 if timeout else 5, log="test.log")
                state["error"] = {"kind": "original failure"}
                saved = collector.collect_native(lambda: str(documents.parent), [("probe-result.json", "native.json")])
                self.assertEqual((folder / "native.json").read_bytes(), native)
                self.assertIn("last native stage", (folder / "test.log").read_text())
                result = json.loads((folder / "result.json").read_text())
                self.assertFalse(result["complete"])
                self.assertEqual(result["error"]["kind"], "original failure")
                self.assertEqual(result["commands"][0]["timedOut"], timeout)
                self.assertEqual(len(saved["copied"]), 1)

    def test_unavailable_or_invalid_native_report_preserves_original_failure(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            state = {"complete": False, "error": {"kind": "XCTest timeout"}}
            collector = Collector(folder, state, folder)
            result = collector.collect_native(lambda: str(folder), [("missing.json", "copy.json")])
            self.assertEqual(len(result["errors"]), 1)
            self.assertFalse((folder / "copy.json").exists())
            self.assertEqual(state["error"]["kind"], "XCTest timeout")

    def test_checkpoint_survives_while_command_is_still_running(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            collector = Collector(folder, {"complete": False}, folder)
            collector.checkpoint("native-pilot")
            collector.run([sys.executable, "-c", "import json; v=json.load(open('result.json')); assert v['stage']=='native-pilot' and v['commands'][0]['finished'] is False"], log="check.log")
            self.assertTrue(json.loads((folder / "result.json").read_text())["commands"][0]["finished"])
