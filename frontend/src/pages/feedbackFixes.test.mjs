import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
test("actual engine verifies kill-origin drops, wreck safety and post-boss steering", () => {
  execFileSync(process.execPath, ["checks/build.mjs"], { cwd: root, stdio: "pipe" });
  const report = JSON.parse(
    execFileSync(process.execPath, ["--experimental-strip-types", "checks/verifyFeedbackFixes.cjs"], {
      cwd: root,
      encoding: "utf8",
    })
  );
  assert.equal(report.passed, true);
  assert.equal(report.checks.length, 7);
});
