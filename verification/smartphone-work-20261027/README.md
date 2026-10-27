# Reproducible work comparison

See docs/smartphone-work-20261027 for scope, limitations and results.

With installed frontend/backend dependencies, generated original painted hulls,
local WebKit2336/WPE libraries/fonts and compiled backend handlers:

```
BASELINE=1 node verification/smartphone-work-20261027/verify-native.mjs
node verification/smartphone-work-20261027/verify-native.mjs
node verification/smartphone-work-20261027/verify-flow.mjs
```

The first command pins only the three reviewed runtime modules to f7197d6.
The second compares actual DOM/poses and callback/layout/angle preparation.
Native clock control makes work counts reproducible; they are not energy or
thermal measurements. The third uses the real GamePage and API handlers with
isolated data, controlled SDK/transport/native time and test-only combat setup.
It extends the prior reviewed end-to-end fixture with five pauses, a paused
explosion and dormant completion checks. No fixture/global/route is included
in production. Generated PNGs, browser binaries, caches and private reports
must not be uploaded. Only sanitized text sources and result JSON belong here.
