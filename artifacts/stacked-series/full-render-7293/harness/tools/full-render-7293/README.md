# Full-render benchmark for 7293 stacked series

This helper branch is not the upstream contribution. The source-only branches remain at `bec53b4495a6866beeeb1dcd727de6162b2dd3bd`; all benchmark code and results stay outside that six-file patch.

The benchmark uses the exact archived runtime UMD files built from baseline `fd652e876a2b059924848a2177c82e67d6752327` and candidate `bec53b4495a6866beeeb1dcd727de6162b2dd3bd`. Archive and runtime SHA-256 values are verified. Runtime bundles are not edited.

A custom example fixture reuses the unchanged upstream `performInitialLoad`, `initBenchmark` harness, static server, CPU-contention readers and generated read-only E2E scene-capture helper. The fixture has 7293 ordinary vertical stacked bar series, the same 12-category positive data formula as the preparation benchmark, all series visible, legend enabled, animations disabled and a 1200 × 800 chart.

The timer starts immediately before creating a new chart. It records the upstream create-through-`waitForUpdate` duration and a wider duration through two subsequent animation-frame callbacks. Data/option generation, library loading, font readiness, a separate 32-series warmup, GC, screenshot capture and scene audits are outside the measured interval.

Three interleaved baseline/candidate pairs run sequentially on one GitHub-hosted VM, using a fresh Chromium process for each measurement and identical software-rendering flags. Pair 2 reverses the order. The 32-series pilot is excluded from timing summaries and alone enables tracing.

After timing, the runner verifies every configured yKey, all actual series/legend entries, all 12 bar datum nodes per series, finite geometry and the unchanged input formula. It saves the complete scene graph compressed, raw benchmark exports, CPU/host metadata, screenshots, console output and input/geometry hashes. Matched pairs require zero pixel differences at the upstream 0.05 colour threshold and identical complete bar geometry.

This measures a synthetic, warm-library initial chart render in headless Chromium. It does not measure application network loading, animation, every browser/device or production data. Any timeout, browser exception, missing series or visual difference fails verification rather than being counted as a completed render.

Run the workflow on this helper branch, or reproduce on a disposable Linux machine:

```sh
npm install --prefix tmp/render-tools --no-save --no-audit --no-fund playwright@1.60.0 pngjs@7.0.0 pixelmatch@5.3.0 tsx@4.23.15
tmp/render-tools/node_modules/.bin/playwright install --with-deps chromium
python3 tools/full-render-7293/prepare.py
tmp/render-tools/node_modules/.bin/tsx tools/full-render-7293/run.mjs --pilot
tmp/render-tools/node_modules/.bin/tsx tools/full-render-7293/run.mjs --pair 1
tmp/render-tools/node_modules/.bin/tsx tools/full-render-7293/run.mjs --pair 2
tmp/render-tools/node_modules/.bin/tsx tools/full-render-7293/run.mjs --pair 3
tmp/render-tools/node_modules/.bin/tsx tools/full-render-7293/run.mjs --summarise
```
