# Maintainer handoff: many stacked series

Issue: [ag-grid/ag-charts#9096](https://github.com/ag-grid/ag-charts/issues/9096).

Preparing 7293 stacked series across 12 synthetic categories took a median **95612.930 ms before and 262.565 ms after** at the same `DataController.execute` boundary, with three runs per side. This measures data preparation before rendering. [Reproducer, raw timings and measurement limits](./README.md).

## Source to review or cherry-pick

- [Verified six-file source/test commit](https://github.com/popkir/ag-charts/commit/bec53b4495a6866beeeb1dcd727de6162b2dd3bd): `bec53b4495a6866beeeb1dcd727de6162b2dd3bd`.
- [Source-only diff](https://github.com/popkir/ag-charts/compare/fd652e876a2b059924848a2177c82e67d6752327...bec53b4495a6866beeeb1dcd727de6162b2dd3bd) against upstream `fd652e876a2b059924848a2177c82e67d6752327`.
- [Source-only branch](https://github.com/popkir/ag-charts/tree/kirill/perf-stacked-series-checked).
- [Download the source patch](https://github.com/popkir/ag-charts/commit/bec53b4495a6866beeeb1dcd727de6162b2dd3bd.patch).

The source-only commit is the contribution candidate. The `kirill/perf-stacked-series` branch also contains the reproducible evidence and this handoff. Fork verification workflows live on separate branches.

To bring the candidate into a maintainer's chosen review branch:

```sh
git fetch https://github.com/popkir/ag-charts.git kirill/perf-stacked-series-checked
git cherry-pick bec53b4495a6866beeeb1dcd727de6162b2dd3bd
```

The earlier `b2a56531f4b48e94f4533a0b94f8c96017248587` fix is retained as measurement provenance. Use the verified commit above for submission; it includes the test typing/assertion corrections and formatting.

## Change and preserved behaviour

Property and invalidity-reference indexes narrow candidates before the original final compatibility predicates run. A scope-to-column index avoids repeated full-column scans. Sharing the stateless range function avoids equivalent aggregate work, and merged aggregate `idsMap` entries retain every scoped ID.

The existing dataset/transform boundaries, full definition equality, directed batch comparison, encounter order, signed-stack/visibility semantics, bigint endpoints and caller-owned output tuple contract are retained.

## Verification

| Check | Candidate result |
| --- | --- |
| Official format, Community/Enterprise types and lint | Passed |
| Complete Community unit suite | 7214 passed, 16 skipped |
| Complete Enterprise unit suite | 7258 passed, 52 skipped |
| Targeted Chromium visual/interaction suite | 398 passed, 3 skipped, 1 baseline-reproduced failure |
| Stock PNG/browser probes, Chromium + Firefox + WebKit | 18 passed; also passed on the baseline |
| Official `high-perf-bar-stacked` browser benchmark | Passed, 3 interleaved runs per side |

[Exact commands, pinned workflows, CI jobs and remaining scope](./CI.md) · [machine-readable results and image hashes](./ci-summary.json).

### The tooltip failure predates the patch

The sole targeted Chromium failure is `interactive-tooltip.spec.ts:49`, `interactive-tooltip > hover 4 steps`, screenshot `interactive-tooltip-visible.png`.

Both the unpatched upstream base and candidate fail with **1614 differing pixels** against the existing reference. Their actual, expected and diff PNGs are **byte-identical between revisions and across all three attempts**. [Retained images](./ci/interactive-tooltip) and [SHA-256 values](./ci-summary.json) support this comparison.

Those jobs remain failed. No screenshot baseline, tolerance or test exclusion was changed. This establishes that the observed failure is not introduced by this patch; it does not diagnose the original snapshot discrepancy.

## Intake and remaining review

The source is ready for maintainer review with fork verification attached. The complete upstream CI matrix and normal merge gates still need to run in the upstream repository.

The stock browser benchmark covers 100000 rows and 2 series, separately from the 7293-series preparation case. No browser-render speedup for the many-series workload is claimed.

PR creation is currently restricted to collaborators. A maintainer can review/cherry-pick the single source commit, or advise how personal GitHub account `popkir` should submit it through the normal contribution process. No upstream PR, acceptance, merge or release is implied.
