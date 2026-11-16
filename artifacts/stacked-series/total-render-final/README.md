<!-- current-integration:start -->
# Current PR source and complete verification

**For the PR, use only [`kirill/perf-stacked-series`](https://github.com/popkir/ag-charts/tree/kirill/perf-stacked-series)**, fork default, head `64f85dea3b32382b6ef4169c0f684ee4a21e4e87`. It includes upstream `latest` snapshot `d78787368dc6b5ff88d6dbe144df639d8dd012cf`. The [PR diff](https://github.com/popkir/ag-charts/compare/d78787368dc6b5ff88d6dbe144df639d8dd012cf...64f85dea3b32382b6ef4169c0f684ee4a21e4e87) remains thirteen code/test files, with no evidence or workflow helpers. `kirill/evidence-stacked-series` holds verification and archives; the third fork `latest` was retained by owner decision. Seventeen technical/duplicate branches were removed, with recoverable history preserved.

**Exact final-head result:** official format/types/lint and **14548 unit tests passed**, 68 skipped. Complete Chromium: 5192 passed, 8 skipped, 9 failed, 0 flaky. Standard Firefox/WebKit: 220 passed, 24 skipped, 2 failed. **Browser jobs remain red:** all eleven stable failures reproduce on unmodified target `d7878736` with **99 byte-identical PNG comparisons**; no references/tolerances/exclusions/retry policy changed.

**Direct current-target full render:** 7293×12, legend on: **110.8734→21.8631s, 5.071×, 80.28% less time**, three pairs on one VM. All inputs, full scenes, PNGs and public states matched, all 87516 datum rectangles retained. Earlier results below are historical, not timings relabelled for this new head.

[Current handoff, raw reports, all 119 retained original ZIPs, Git backup and activity audit](../consolidation/README.md) · [complete workflow](https://github.com/popkir/ag-charts/actions/runs/43859617103). Upstream review/required merge-state CI and a normal PR submission route remain necessary.
**Upstream policy:** [David confirmed that external PRs and cherry-picks are not accepted](https://github.com/ag-grid/ag-charts/issues/9096#issuecomment-6915125807). A technical assessment and Enterprise escalation route are being requested; no upstream acceptance is implied.

<!-- current-integration:end -->

<details>
<summary>Historical pre-sync documentation (preserved)</summary>

# Total full-browser speedup from unpatched AG Charts

**125.0086 s → 24.8994 s: 5.021×, 80.08% less render time.** This is a direct paired measurement from original upstream `fd652e876a2b059924848a2177c82e67d6752327` to the actual final contribution `52f45beae1fd50b3a23b678219f5d1b81ffea509`, not a product of ratios from earlier machines. Both official source builds are checked by commit, complete tree and bundle SHA-256.

[Successful workflow](https://github.com/popkir/ag-charts/actions/runs/43848323068) · [exact harness commit](https://github.com/popkir/ag-charts/commit/c83ab6ebdb18ffcd44d13c5550cf7bd7f1d782f2) · [parent raw-data audit](./parent-independent-verification.json) · [all-six-scene independent audit](./audit.json) · [structured measurements](./summary.json) · [complete contribution and E2E results](../optimization-validation/README.md).

## Direct result

Three pairs ran sequentially on one comparison VM with a fresh Chromium process per render. Pair 2 reversed the order. Primary boundary: chart creation through public `waitForUpdate()` plus two animation frames. Library loading, fixture generation, a separate 32-series warmup/destruction/GC and evidence capture are outside the interval. No CPU profiling or tracing was enabled for these timing measurements.

| Pair | Execution order | Unpatched upstream | Final contribution | Paired speedup |
| --- | --- | ---: | ---: | ---: |
| 1 | upstream → final | 126.1093 s | 24.6676 s | 5.112× |
| 2 | final → upstream | 123.4887 s | 24.8994 s | 4.960× |
| 3 | upstream → final | 125.0086 s | 25.3725 s | 4.927× |
| **Median per side** | — | **125.0086 s** | **24.8994 s** | **5.021×** |

The median create→`waitForUpdate()` boundary was 124.7231 → 24.6603 s. The primary coefficient is the ratio of the two per-side medians; individual paired ratios are retained above and in the audit.

## Complete output and input verification

Each of all six renders retained **7293 actual stacked bar series × 12 categories = 87516 finite, positive-sized datum rectangles**. All 87516 synthetic input values and all 7293 series options were independently checked in every raw input file. The legend retained 7293 **enabled records**, with ordinary pagination; this does not imply 7293 legend items were simultaneously drawn on one page. Legend enabled, animations disabled, chart 1200×800, DPR 1; viewport 1280×960.

For every pair, complete input/options, full scene JSON, complete bar geometry, public chart/legend state and raw PNG bytes matched. All three pixel comparisons had zero differing pixels. The independent audit recomputed all six scene/PNG/input hashes, parsed the full representative scene and checked all 87516 rectangles; matching full-scene hashes cover the other scenes. Official UMD bytes were independently hashed from both original build archives, whose GitHub digests and ZIP CRCs were verified.

Comparison host: `AMD EPYC 7763 64-Core Processor`, 4 logical CPUs, 15984 MiB memory. Chromium `148.0.7778.96`, headless software rendering. These are observations for this synthetic initial-render workload on one VM, three runs per side. Remaining rendering time is still substantial; this is **not an application-page loading measurement or a prediction of CLIMATISE load time**.

## Exact source builds

| Role | Source tree | Official UMD SHA-256 |
| --- | --- | --- |
| base | `2d0c9d919d49d37a524e423244063d34fbf8e347` | `0144e3db7fada5ede027281de91a2e2ded33922d41222cfe72e7758308129f40` |
| head | `c72fed50b4964896611eed6a69fb820e0efdf15e` | `0e631024e548ad74392c815f8bb090cb8eeb1a87a0ed65b2a3f3ac382cfbd08b` |

Both builds used `yarn nx build:umd ag-charts-enterprise --skip-nx-cache` directly on the pinned original sources, with empty tracked runtime diffs. The final build tree equals the committed and format/types/lint/unit/E2E-tested contribution tree. Verified archived HTML/CSS/capture helpers served as scaffolding; each runtime was replaced by its freshly pinned official UMD and the installed hash checked before every render. The UMDs were not instrumented or modified.

The earlier additional rendering experiment (initial preparation patch→three follow-ups) measured 39.7877→17.4754 s, 2.277×, on another VM. The earlier initial preparation fix had a separate 123.806→51.014 s experiment. Those measurements remain historical evidence; their factors are not combined to derive this direct total result.

## Permanent archives

Open a ZIP and use **Download raw file**, then extract it with directories intact. These commit-pinned files survive Actions artifact expiry. Complete raw inputs/scenes are gzip-compressed JSON. [Run metadata](./run.json) · [all jobs](./jobs.json) · [GitHub artifact metadata](./artifacts.json) · [SHA-256 checksums](./SHA256SUMS) · [exact workflow snapshot](./harness/.github/workflows/stacked-total-render.yml) · [reproducible independent audit](./audit_results.py).

| Original archive | Bytes | Content |
| --- | ---: | --- |
| [stacked-total-build-base.zip](./stacked-total-build-base.zip) | 3742480 | official UMD, source map, build log and exact source receipt |
| [stacked-total-build-head.zip](./stacked-total-build-head.zip) | 3745683 | official UMD, source map, build log and exact source receipt |
| [stacked-total-render-results.zip](./stacked-total-render-results.zip) | 8854397 | six timings, full input/scene/PNG files, parity comparisons and source receipts |
| [logs.zip](./logs.zip) | 111114 | full job logs |

Together with the [previous retained archives](../optimization-validation/ARCHIVES.md), the evidence now contains **87 original ZIPs across 29 runs**, 439545804 bytes. All archives remain outside the four-commit/thirteen-file source contribution.

## Review gates

Format, Community/Enterprise types/lint and 14481 unit tests passed (68 skipped). Complete Chromium E2E has 5191 passed, 8 skipped, 9 failed, 1 flaky; standard Firefox/WebKit has 220 passed, 24 skipped, 2 failed. Browser jobs remain red: all eleven stable failures reproduce on original upstream with 99 byte-identical actual/expected/diff PNG comparisons; the one flake is disclosed without baseline attribution. [Complete verification and comparisons](../optimization-validation/README.md#browser-jobs-remain-red-baseline-attribution).

Upstream required CI on the intended merge state and maintainer review/acceptance remain. PR creation remains collaborators-only; no upstream PR, merge or release has occurred.


</details>
