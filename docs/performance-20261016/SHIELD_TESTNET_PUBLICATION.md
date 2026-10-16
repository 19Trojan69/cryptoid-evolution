# Testnet shield release — 16 October 2026

This publication record supersedes the candidate-only status in
SHIELD_FIT_AND_DEVICE_FOLLOWUP.md. The user authorized the assistant to complete
the Testnet release without further manual deployment steps.

## Confirmed public release

- Fixed URL: https://cryptoid-evolution-testnet.vercel.app
- Project: cryptoid-evolution-testnet, prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF.
- Account: team_KzJmtl0QyoYZAOu5RQKsAR2i.
- Released commit: 27d174788327c3423f04ace32be61af67a2004cc.
- Production deployment within this Testnet project:
  dpl_BX7ZeCr9Qr6anBa3AZnzLERubpQM.
- Deployment URL: https://cryptoid-evolution-testnet-h7h2tz76v-19-trojan69.vercel.app
- Vercel READY at 2026-10-16T19:20:31.402Z (21:20:31 Europe/Vienna).
- Source: redeploy; target: production; aliasError: null.
- Independent get_alias confirmed the fixed Testnet hostname points to that ID.
- Rollback reference: audio commit aab7267960fb9b92a40d318dd59b4a89251a4957,
  deployment dpl_GcYgxExuTiT8XUDqkdWdcQx1A5pr.

The separate main app remains on dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe.
Its Git main ref remains 907d2a7363345d00f0f90c54402bf04e887b64d9.
The Testnet release branch remains exactly 27d1747; this audit is stored only
on the existing diagnosis branch.

## Working release path and earlier failure

A READY preview for the exact shield commit already existed:
dpl_9QJ3uirk8EA7L4StMn6XCazy6gWr, source git. Its exact trigger was not
established. Therefore the false deploymentEnabled entries alone cannot be
claimed to explain every missed release.

The authenticated MCP create_deployment call succeeded with an explicit
existing Testnet project ID and an exact existing preview deployment ID:

```json
{
  "requestBody": {
    "name": "cryptoid-evolution-testnet",
    "project": "prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF",
    "deploymentId": "dpl_9QJ3uirk8EA7L4StMn6XCazy6gWr",
    "target": "production",
    "withLatestCommit": false
  }
}
```

This rebuilt the exact candidate with the Testnet project's production settings.
The same existing deployment could be read without an extra team query but
returned 404 with the correct explicit teamId. Rebuilding with that extra team
query likewise returned 404; using the exact project/deployment identifiers
without the extra query succeeded. The cause inside Vercel/the connector was
not established. Do not claim all account permissions are repaired.

No new Vercel project, main merge, shared Git integration change, credential
request, access-control weakening, or manual user deployment was needed.
For future releases first verify project/account/commit, use the exact existing
candidate, rebuild within that project, then independently verify READY,
hostname assignment and delivered assets. Do not blindly repeat failed calls
or ask the user to deploy before checking this verified route.

## Public HTTP and asset verification

| Check | Observed result |
| --- | --- |
| / and /game | HTTP 200, HTML, 1465 bytes each |
| /api/hangar/catalog | HTTP 200, JSON, 12772 bytes |
| /api/progress/me without an account | Expected HTTP 401, JSON |
| Entry JS and all four referenced JS chunks | HTTP 200, JavaScript |
| Published CSS | HTTP 200, text/css, 356840 bytes |
| Outer shield pseudo-element | inset: 0 |
| Inner shield pseudo-element | inset: 4px |
| Published GamePage module | Audio unlock call retained |

Published CSS: /assets/index-CLY2nAhm.css,
SHA-256 4d01d528d5eed0ada0ff4f5af17a2f0052457b5e5525e5e4e64fc8fb996fd25f.
Published GamePage: /assets/GamePage-DtePybhl.js,
SHA-256 a541eee221ea7192bbaf55b1efd0b6067bbaff3ff6bb90411f1f71ead18c557c.

These checks supplement the successful release build, 21 existing tests and
all-60-hull geometry checks recorded in SHIELD_FIT_AND_DEVICE_FOLLOWUP.md.
A runtime error/fatal log query returned 403; it yielded no usable log results.
Do not describe that as zero server errors.

## Outstanding device finding

The shield is published; the reported slowdown remains unresolved. No fire
cadence, simulation time cap, hitbox, shield protection, audio parameters or
gameplay rules were changed by this CSS release.

Next: reload the fixed Testnet URL in Pi Browser, confirm the closer shield,
then capture 15–20 seconds of an actual slow section with the HUD visible.
Compare the same ship, weapon and section in Safari on the same iPhone.
Distinguish volley gaps from projectile/enemy motion and note recovery after a
short pause. An iPhone/Pi Browser performance result cannot be inferred from
HTTP checks or the prior synthetic 34-ms-cap experiment.
