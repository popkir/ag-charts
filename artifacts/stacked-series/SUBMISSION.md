# Maintainer handoff: many stacked series

Issue: [ag-grid/ag-charts#9096](https://github.com/ag-grid/ag-charts/issues/9096).

Full browser initial rendering of 7293 stacked series × 12 categories, with legend enabled, improved from **123.806 s to 51.014 s** (three runs per side, **2.427×**, 58.8% less time), with byte-identical screenshots and complete scene graphs. [full 7293-series browser results](./full-render-7293/README.md).

The narrower source preparation benchmark improved from 95612.930 to 262.565 ms (about 364×); its different boundary and machine are documented in [the original report](./README.md). The candidate's full render still takes about 51 seconds for this extreme case.

## Source to review or cherry-pick

- [Verified six-file source/test commit](https://github.com/popkir/ag-charts/commit/bec53b4495a6866beeeb1dcd727de6162b2dd3bd): `bec53b4495a6866beeeb1dcd727de6162b2dd3bd`.
- [Source-only diff](https://github.com/popkir/ag-charts/compare/fd652e876a2b059924848a2177c82e67d6752327...bec53b4495a6866beeeb1dcd727de6162b2dd3bd) against upstream `fd652e876a2b059924848a2177c82e67d6752327`.
- [Source-only branch](https://github.com/popkir/ag-charts/tree/kirill/perf-stacked-series-checked).
- [Download the source patch](https://github.com/popkir/ag-charts/commit/bec53b4495a6866beeeb1dcd727de6162b2dd3bd.patch).

Submit from `kirill/perf-stacked-series-checked`: it is the single source-only commit above. `kirill/perf-stacked-series` is also kept free of evidence files. This handoff, benchmarks and report archives live on the separate `kirill/evidence-stacked-series` branch. Fork verification workflows also remain on separate branches.

To bring the candidate into a maintainer's chosen review branch:

```sh
git fetch https://github.com/popkir/ag-charts.git kirill/perf-stacked-series-checked
git cherry-pick bec53b4495a6866beeeb1dcd727de6162b2dd3bd
```

The earlier `b2a56531f4b48e94f4533a0b94f8c96017248587` fix is retained as measurement provenance. Use the verified commit above for submission; it includes the test typing/assertion corrections and formatting.

## Change and preserved behaviour

Property and invalidity-reference indexes narrow candidates before the original final compatibility predicates run. A scope-to-column index avoids repeated full-column scans. Sharing the stateless range function avoids equivalent aggregate work, and merged aggregate `idsMap` entries retain every scoped ID.

The existing dataset/transform boundaries, full definition equality, directed batch comparison, encounter order, signed-stack/visibility semantics, bigint endpoints and caller-owned output tuple contract are retained.

## What the speedup numbers mean

The optimisation targets repeated preparation work across **many series**. A large row count with only two series exercises a different workload.

| Workload and measured boundary | Before | After | Observed change |
| --- | ---: | ---: | ---: |
| 100 series × 12 categories, `DataController.execute` | 27.577 ms | 7.041 ms | about 3.9× |
| 1000 series × 12 categories, `DataController.execute` | 1553.544 ms | 53.434 ms | about 29× |
| 7293 series × 12 categories, `DataController.execute` | 95612.930 ms | 262.565 ms | about 364× |
| Full browser render, 7293 series × 12 categories, legend enabled | 123806.0 ms | 51013.7 ms | about 2.427× |
| Official browser example: 2 series × 100000 rows, chart create | 164.8 ms | 152.7 ms | 7.3% less time |
| Same official browser example, zoom × 20 | 378.6 ms | 374.2 ms | 1.1% less time |

All rows summarise three runs per side. The preparation and browser results were collected on different machines and cover different boundaries; they are not directly interchangeable. Raw results and source provenance are retained.

The large speedup is established for the synthetic many-series **data-preparation phase**. The matched full-browser render is now measured at about 2.43×; 364× applies only to source preparation. These are separate experiments on different machines and their absolute times cannot be subtracted. The approximately 51-second remaining render latency is not considered solved. The small stock-browser differences are observations, not a statistical-significance claim.

## Verification

| Check | Candidate result |
| --- | --- |
| Official format, Community/Enterprise types and lint | Passed |
| Complete Community unit suite | 7214 passed, 16 skipped |
| Complete Enterprise unit suite | 7258 passed, 52 skipped |
| Targeted Chromium visual/interaction suite | 398 passed, 3 skipped, 1 baseline-reproduced failure |
| Full 7293-series browser render and data/visual audit | 3 pairs passed; all 87516 bar datums and byte-identical PNG/scenes |
| Stock PNG/browser probes, Chromium + Firefox + WebKit | 18 passed; also passed on the baseline |
| Official `high-perf-bar-stacked` browser benchmark | Passed, 3 interleaved runs per side |

[Exact commands, pinned workflows, CI jobs and remaining scope](./CI.md) · [machine-readable results and image hashes](./ci-summary.json) · [permanent full Actions archives](./actions/README.md).

### The tooltip failure predates the patch

The sole targeted Chromium failure is `interactive-tooltip.spec.ts:49`, `interactive-tooltip > hover 4 steps`, screenshot `interactive-tooltip-visible.png`.

Both the unpatched upstream base and candidate fail with **1614 differing pixels** against the existing reference. Their actual, expected and diff PNGs are **byte-identical between revisions and across all three attempts**. [Retained images](./ci/interactive-tooltip) and [SHA-256 values](./ci-summary.json) support this comparison.

Those jobs remain failed. No screenshot baseline, tolerance or test exclusion was changed. This establishes that the observed failure is not introduced by this patch; it does not diagnose the original snapshot discrepancy.

## Intake and remaining review

The source is ready for maintainer review with fork verification attached. The complete upstream CI matrix and normal merge gates still need to run in the upstream repository.

The stock two-series browser benchmark, the source preparation benchmark and the new full 7293-series browser render have distinct scopes. See [full 7293-series browser results](./full-render-7293/README.md) for raw timings, exact boundaries and the 2.43× browser result. Remaining extreme-workload latency is about 51 seconds.

PR creation is currently restricted to collaborators. A maintainer can review/cherry-pick the single source commit, or advise how personal GitHub account `popkir` should submit it through the normal contribution process. No upstream PR, acceptance, merge or release is implied.
