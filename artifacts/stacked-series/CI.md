<!-- current-integration:start -->
# Current source branch and evidence

**Submit only [`kirill/perf-stacked-series`](https://github.com/popkir/ag-charts/tree/kirill/perf-stacked-series) as a PR against upstream `latest`.** It is the fork default. Current head `ae4e8907037ca9aec35f19d6898d3cfb8da84721` includes upstream `9ee57509a4141b2477b6c3220efac87e1010982a`; the PR diff remains thirteen code/test files, identical to the original contribution patch.

`kirill/evidence-stacked-series` holds reports, recoverable Git history and verification workflows. The third fork branch `latest` is retained by explicit owner decision and is not the PR source. All seventeen obsolete helper/duplicate branches have been removed.

**Current exact-head checks:** format/check, both types and lint passed; full native/E2E and three-pair latest→merged-source full-render verification are running in [run 43854079208](https://github.com/popkir/ag-charts/actions/runs/43854079208). [Current branch map, integration and recoverable backup](consolidation/README.md). Earlier results below are historical measurements of pre-sync `52f45bea`, not results relabelled for the merged head. A targeted maintainer follow-up will link the completed verification.
<!-- current-integration:end -->

<details>
<summary>Historical pre-sync documentation (preserved)</summary>

# Stacked-series verification

**Direct total improvement from unpatched upstream:** 7293 series × 12, legend enabled: **125.0086→24.8994 s (5.021×, 80.08% less time)**, three paired renders per side on one VM. The actual final committed source was built directly; all six renders retained every series/datum and matched complete scenes, input, public state and PNGs. [Direct measurement and original archives](./total-render-final/README.md).

**Current source:** [`52f45bea`](https://github.com/popkir/ag-charts/commit/52f45beae1fd50b3a23b678219f5d1b81ffea509), four commits and thirteen code/test files. Both source branches are updated; all reports and workflow helpers remain separate.

**Additional complete-render improvement:** 7293 × 12, legend enabled: **39.7877 → 17.4754 s (2.277×, −56.08%)** on one VM, three repeats each. All 27 full renders retained complete output. **14481 unit tests passed**, 68 skipped; format/types/lint passed. Full Chromium and standard Firefox/WebKit E2E completed with eleven screenshot failures that exactly match unpatched upstream (99 PNG comparisons); one Chromium test was flaky. Browser jobs therefore remain red.

[Current implementation, complete verification, baseline comparisons and permanent archives](./optimization-validation/README.md). Upstream CI/review remain required; no upstream PR or merge has occurred.

<details>
<summary>Historical initial data-preparation record at bec53b44</summary>

# Repository and browser verification

[Maintainer handoff and source-only submission](./SUBMISSION.md) · [preserved full HTML, trace, JUnit and job-log archives](./actions/README.md).

Evidence lives on `kirill/evidence-stacked-series`; neither submission branch includes these files.

Verified source: [`bec53b4495a6866beeeb1dcd727de6162b2dd3bd`](https://github.com/popkir/ag-charts/commit/bec53b4495a6866beeeb1dcd727de6162b2dd3bd), based on upstream [`fd652e876a2b059924848a2177c82e67d6752327`](https://github.com/ag-grid/ag-charts/commit/fd652e876a2b059924848a2177c82e67d6752327).

The source-only commit contains six files. It supersedes the original `b2a56531f4b48e94f4533a0b94f8c96017248587` fix with test type/assertion API corrections and Prettier formatting. Runtime calculations are unchanged. The preparation measurements in the original report were collected on that original fix; they have not been relabelled as measurements of this revision.

These are the repository's real Nx/Vitest/Playwright commands, run in the personal fork on disposable GitHub-hosted Ubuntu 24.04 runners. No upstream workflow was dispatched. Verification workflows live on separate fork branches and are not part of the six-file source change. No source snapshots, dependency locks or production options were changed to make checks pass.

## Native checks

[Run](https://github.com/popkir/ag-charts/actions/runs/43726542138) · [successful native job](https://github.com/popkir/ag-charts/actions/runs/43726542138/job/132849597291) · [workflow](https://github.com/popkir/ag-charts/blob/1b970b0bb38d54f237822c53d8712fafef1e7720/.github/workflows/stacked-series-checks.yml).

Node `24.22.3`, Yarn `4.10.3`, with the upstream `setup-nx` composite action.

| Check | Result |
| --- | --- |
| `yarn nx format:check --base=fd652e876a2b059924848a2177c82e67d6752327 --head=bec53b4495a6866beeeb1dcd727de6162b2dd3bd` | Passed |
| `yarn nx build:types ag-charts-community` | Passed |
| `yarn nx build:types ag-charts-enterprise` | Passed |
| `yarn nx lint ag-charts-community` | Passed |
| `yarn nx lint ag-charts-enterprise` | Passed |
| `yarn nx test ag-charts-community -- --maxWorkers=2 --minWorkers=1` | 159 files passed; 7214 tests passed, 16 skipped |
| `yarn nx test ag-charts-enterprise -- --maxWorkers=2 --minWorkers=1` | 151 files passed; 7258 tests passed, 52 skipped |

The regression-bearing files ran successfully: `dataController.test.ts` (24 tests), `dataGrouper.test.ts` (86) and `aggregateFunctions.test.ts` (15). These are whole-file counts, including their pre-existing tests.

## Targeted Chromium visual and interaction checks

The same official Nx invocation was run independently on both pinned revisions:

```sh
yarn nx test:e2e ag-charts-website -- \
  bar-series.spec.ts legend.spec.ts tooltip.spec.ts \
  api-events.spec.ts state.spec.ts context-menu.spec.ts \
  --project=chromium
```

The official wrapper generated and selected related example tests. Both revisions produced **398 passed, 3 skipped, 1 failed** across the same 402 selected cases. Coverage includes stacked/bar examples, legends, tooltip variants, state/API events and context menus.

The single failure on both sides is `interactive-tooltip.spec.ts:49`, `interactive-tooltip > hover 4 steps`, screenshot `interactive-tooltip-visible.png`, with 1614 differing pixels against the existing snapshot. Both browser jobs therefore remain **failed**. Nothing was excluded or rebaselined.

The actual, expected and difference PNGs are byte-identical between baseline and candidate, including both retries. Their SHA-256 values are retained in [ci-summary.json](./ci-summary.json); copies are in [ci/interactive-tooltip](./ci/interactive-tooltip). This verifies that this particular failure also occurs without the patch. It does not establish the underlying cause of the upstream snapshot discrepancy.

[Candidate job](https://github.com/popkir/ag-charts/actions/runs/43726542138/job/132849597483) · [baseline job](https://github.com/popkir/ag-charts/actions/runs/43726542138/job/132849597429).

## PNG export and three-browser checks

[Successful run](https://github.com/popkir/ag-charts/actions/runs/43729070987) · [workflow](https://github.com/popkir/ag-charts/blob/5de9112d57d177b134325e51ad0fb7fc62addba5/.github/workflows/stacked-export-checks.yml).

The stock `cross-browser.spec.ts` ran on both pinned revisions using the configurations supplied by upstream:

```sh
yarn nx test:e2e ag-charts-website -- cross-browser.spec.ts --project=chromium
yarn nx test:e2e ag-charts-website -- --config playwright.cross-browser.config.ts cross-browser.spec.ts
```

Each revision passed **18 tests, with no failures or skips**: 6 Chromium, 6 Firefox and 6 WebKit. The `AG-18059 chart downloads a PNG` test passed on every engine. The same spec also covers text measurement, offscreen font rendering, device pixel ratio, keyboard focus and zoom state. These are the existing upstream probes, not an export of the 7293-series workload.

## Official stacked-bar browser benchmark

[Successful run](https://github.com/popkir/ag-charts/actions/runs/43726854766) · [workflow](https://github.com/popkir/ag-charts/blob/7dc5ff7277b22c4f4efe3328c623f0ec24c61544/.github/workflows/stacked-browser-benchmark.yml).

Each pinned revision was built through `yarn nx build:benchmarks ag-charts-website`. The upstream `tools/benchmark/serve-and-run.sh` and `browser-benchmark.ts` ran `high-perf-bar-stacked` three times per side, interleaved head/base on one runner. The upstream comparison script passed with its default regression thresholds.

| Operation | Baseline (ms) | Candidate (ms) | Reported change |
| --- | ---: | ---: | ---: |
| Initial load / chart create | 164.8 | 152.7 | -7.3% |
| Zoom / 20 repetitions | 378.6 | 374.2 | -1.1% |

These are medians of the three run medians, as reported by the stock comparison script. The stock example has **100000 rows and 2 stacked series**. It is a different workload from the **7293-series × 12-category preparation benchmark**. These modest differences are not a claim of statistical significance or of a comparable browser speedup for thousands of series.

The six raw timing reports and comparison output are retained under [browser-benchmark](./browser-benchmark). No heap-sampling memory pass was performed for this browser comparison.

## Full browser rendering with 7293 series

[Successful paired run](https://github.com/popkir/ag-charts/actions/runs/43774538081) · [full 7293-series browser results](./full-render-7293/README.md).

Three complete renders per revision, with 7293 visible series, 12 categories, legend on and animation off, passed the complete bar-node audit and byte-identical scene/PNG comparisons. Median create-through-update-plus-two-frames time improved **123.806 s → 51.014 s (2.427×, 58.8% less time)**. The create-through-`waitForUpdate` medians were 123.577 → 50.734 s (2.436×).

All 87516 bar datum nodes were retained in every render. All six completed. The initial 32-series pilot layout assertion and its corrected rerun are preserved in the [permanent archive](./actions/README.md). Canonical timing data, scene snapshots, screenshots, source snapshots and receipts are retained separately from the source contribution.

## Interpreting the performance results

The approximately 364× result covers only `DataController.execute` in the source benchmark. The new full browser initial-render result is about **2.43×**, and still takes about **51 seconds** after the patch. The earlier stock browser example has only two series and showed 7.3% less chart-create time and 1.1% less zoom time.

Different machines, workloads and boundaries are involved. These results must not be combined or their absolute milliseconds subtracted. Remaining latency in the extreme full-render workload requires separate profiling; this patch is not presented as making that workload interactive-speed.

## Remaining scope

This is fork-based verification, not an upstream CI approval or acceptance. The full repository CI matrix, all website specs/frameworks and the entire cross-browser visual suite were not run. The targeted browser jobs retain the reproduced baseline failure. Maintainers still need to review the patch and apply their required merge gates. No upstream PR, merge or release has occurred.

</details>


</details>
