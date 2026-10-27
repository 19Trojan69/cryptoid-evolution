# Standard graphics verification

This directory is developer-only and is not an application route, bundle input,
export, diagnostic API or player setting. No live player/account is used.

Run the existing prepare:hulls script first. The normal frontend build runs 390
release cases. Run verify-native.mjs with local Playwright WebKit2336 and its
official dependencies available; CRYPTOID_WEBKIT_LIBS may select their local path.
Do not restore the generated painted-hull manifest until verification completes.

verify-native.mjs loads the exact released 7433e56 component sources through local
Vite virtual modules. One reference changes only the cap to one; a second retains
the previous 1.5 cap. Compare candidate/reference RGBA at identical native ages,
and candidate/previous CSS dimensions plus backing counts. The three real React
component families exercise their original asynchronous resource readiness,
pause, resume, heat/scars, idle release, resize, fallback and unmount lifetimes.
Results/native.json contains 48 checks and 156 exact same-density image pairs.

verify-scope.py confirms the two reviewed runtime edits and unchanged sources.
verify-public-release.py before COMMIT TREE captures both preceding public apps;
the after mode checks the released source/tree, new cap, prior protections,
byte-equal app bundles/CSS and separate public network/catalogue responses.
It never signs in, starts a real game, reads private reports or buys anything.

Historical/excluded fixture setup attempts are summarized separately. The normal
first setup failures are not acceptance passes and must not be attributed to the
player's historical White Screen. All source/pixel evidence is local or read-only;
it does not measure a physical phone's energy, temperature or native memory.
