# Security Advisory: `ai-sdk-ollama` supply-chain compromise (June 2026)

## Summary

A compromised build of the npm package **`ai-sdk-ollama@2.2.1`** was published
as part of a supply-chain worm dated **2026-06-04**. This project formerly
declared the dependency with the range `"ai-sdk-ollama": "^2.2.0"`, which a
caret range could resolve to the poisoned `2.2.1`.

The dependency is now **pinned to the last known-good version, `2.2.0`**, in
both `package.json` (`dependencies`) and an npm `overrides` entry, so fresh
installs can no longer pull `2.2.1`.

## Are you affected?

This kind of worm executes at **dependency-install time on a developer's
machine**, not in the browser of someone visiting a running instance of the app.
End users of a deployed site were never exposed through this package.

You may be affected **only if** you ran a fresh `npm install` / `yarn` / `pnpm`
of this project (without an existing pinned lockfile) **on or after 2026-06-04**
and your package manager resolved `^2.2.0` to `2.2.1`.

You are **not** affected if any of the following are true:

- You last installed dependencies before 2026-06-04.
- Your lockfile pins `ai-sdk-ollama@2.2.0` (or earlier).
- You installed with Deno (`deno install`, used up to v0.6.x), which does
  **not** run npm lifecycle/install scripts by default.
- You installed v0.7.0 or later with npm: the repository's `.npmrc` sets
  `ignore-scripts=true`, so dependency install scripts never run, and the
  committed `package-lock.json` pins `ai-sdk-ollama@2.2.0`.

## How to check

```bash
# npm
grep -A2 '"node_modules/ai-sdk-ollama"' package-lock.json | grep version

# pnpm
grep "ai-sdk-ollama" pnpm-lock.yaml

# Deno (only installs from v0.6.x)
grep "ai-sdk-ollama@" deno.lock
```

If you see `2.2.1`, treat the machine that installed it as potentially exposed.

## Remediation

1. Delete `node_modules` and any lockfile that references `2.2.1`.
2. Reinstall — the pin + override now force `2.2.0`:
   ```bash
   npm ci
   ```
3. Confirm `2.2.1` no longer appears in your lockfile (commands above).
4. If `2.2.1` had been installed on a machine using npm/yarn/pnpm (which run
   install scripts), rotate any credentials that were accessible from that
   environment as a precaution.

## Status of this repository

- `ai-sdk-ollama@2.2.1` never appeared in this repository's committed history.
- No lockfile pinning the poisoned version was ever distributed with the repo.
- The dependency is pinned to `2.2.0` going forward, and since v0.7.0 the
  committed `package-lock.json` plus `ignore-scripts=true` in `.npmrc` keep
  installs reproducible and free of install-time code execution.
