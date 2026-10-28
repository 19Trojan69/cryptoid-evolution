import argparse
import unittest
from android_capture import package_name


class PackageValidation(unittest.TestCase):
    def test_only_verified_package_identifiers_can_reach_adb_shell(self):
        self.assertEqual(package_name("example.pi_browser"), "example.pi_browser")
        for value in ["example;reboot", "x.y $(id)", "x.y\nreboot", "-a", "", "x.y/z", "x"]:
            with self.assertRaises(argparse.ArgumentTypeError):
                package_name(value)


if __name__ == "__main__":
    unittest.main()
