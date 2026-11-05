import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("native_probe", Path(__file__).with_name("run.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class AcceptanceBoundaries(unittest.TestCase):
    def setUp(self):
        self.data = dict(version=1, loaded=True, controlComplete=True, trustedClick=True,
                         completionRejectedBeforeClick=True, gameLoaded=False, physicalDeviceTest=False,
                         automaticReload=False, nativeTerminationCallbackObserved=False, clickCount=1,
                         nativeContentTerminations=0, navigationErrors=0, systemName="iOS", systemVersion="18.5",
                         readback=dict(title="Native WebView-Kontrolle", count=1, visibilityState="visible",
                                       readyState="complete", userAgent="iPhone", timeOrigin=1,
                                       width=430, height=640, devicePixelRatio=3))

    def test_valid_synthetic_receipt(self):
        module.validate_control(self.data)

    def test_rejects_missing_or_untrusted_touch(self):
        for change in ({"trustedClick": False}, {"clickCount": 0}, {"clickCount": 2}):
            with self.subTest(change=change), self.assertRaises(AssertionError):
                module.validate_control(self.data | change)

    def test_rejects_native_failure_and_unfinished_or_game_receipts(self):
        for key, value in (("nativeContentTerminations", 1), ("navigationErrors", 1),
                           ("controlComplete", False), ("gameLoaded", True), ("automaticReload", True)):
            with self.subTest(key=key), self.assertRaises(AssertionError):
                module.validate_control(self.data | {key: value})

    def test_rejects_wrong_native_runtime_or_desktop(self):
        for change in ({"systemVersion": "26.2"}, {"systemName": "Linux"}):
            with self.subTest(change=change), self.assertRaises(AssertionError):
                module.validate_control(self.data | change)
        self.data["readback"]["userAgent"] = "Desktop WebKit"
        with self.assertRaises(AssertionError):
            module.validate_control(self.data)

    def test_rejects_wrong_or_hidden_dom_without_loosening_touch_gate(self):
        for key, value in (("title", "other"), ("count", 0), ("visibilityState", "hidden"),
                           ("readyState", "loading"), ("timeOrigin", 0), ("height", 0)):
            data = copy.deepcopy(self.data)
            data["readback"][key] = value
            with self.subTest(key=key), self.assertRaises(AssertionError):
                module.validate_control(data)


if __name__ == "__main__":
    unittest.main()
